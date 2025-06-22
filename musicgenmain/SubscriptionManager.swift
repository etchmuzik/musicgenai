import Foundation
import StoreKit
import SwiftUI

// MARK: - Subscription Manager
@MainActor
class SubscriptionManager: NSObject, ObservableObject {
    static let shared = SubscriptionManager()
    
    // MARK: - Published Properties
    @Published var availableProducts: [Product] = []
    @Published var purchasedProducts: Set<String> = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var transactionHistory: [StoreKit.Transaction] = []
    
    // MARK: - Product Identifiers
    // These must match your App Store Connect subscription IDs
    private let productIdentifiers: Set<String> = [
        "com.beyond.musicgenmain.starter",      // Starter Plan: $9.99/month
        "com.beyond.musicgenmain.pro",          // Pro Plan: $24.99/month  
        "com.beyond.musicgenmain.unlimited"     // Unlimited Plan: $79.99/month
    ]
    
    // MARK: - Transaction Listener
    private var transactionListener: Task<Void, Error>?
    
    override init() {
        super.init()
        
        // Start listening for transactions
        transactionListener = listenForTransactions()
        
        Task {
            await loadProducts()
            await updatePurchasedProducts()
        }
    }
    
    deinit {
        transactionListener?.cancel()
    }
    
    // MARK: - Product Loading
    
    /// Load available subscription products from App Store
    func loadProducts() async {
        isLoading = true
        errorMessage = nil
        
        do {
            let products = try await Product.products(for: productIdentifiers)
            
            // Sort products by price (ascending)
            availableProducts = products.sorted { product1, product2 in
                product1.price < product2.price
            }
            
            print("✅ Loaded \(availableProducts.count) subscription products")
            for product in availableProducts {
                print("   - \(product.id): \(product.displayPrice)")
            }
            
        } catch {
            errorMessage = "Failed to load subscription plans: \(error.localizedDescription)"
            print("❌ Error loading products: \(error)")
        }
        
        isLoading = false
    }
    
    // MARK: - Purchase Handling
    
    /// Purchase a subscription product
    func purchase(_ product: Product) async throws -> StoreKit.Transaction? {
        isLoading = true
        errorMessage = nil
        
        do {
            let result = try await product.purchase()
            
            switch result {
            case .success(let verification):
                let transaction = try checkVerified(verification)
                
                // Update purchased products
                await updatePurchasedProducts()
                
                // Finalize the transaction
                await transaction.finish()
                
                print("✅ Purchase successful: \(product.id)")
                return transaction
                
            case .userCancelled:
                print("ℹ️ User cancelled purchase")
                return nil
                
            case .pending:
                print("⏳ Purchase pending approval")
                return nil
                
            @unknown default:
                print("⚠️ Unknown purchase result")
                return nil
            }
            
        } catch {
            isLoading = false
            errorMessage = "Purchase failed: \(error.localizedDescription)"
            print("❌ Purchase error: \(error)")
            throw error
        }
    }
    
    /// Restore previous purchases
    func restorePurchases() async {
        isLoading = true
        errorMessage = nil
        
        do {
            try await AppStore.sync()
            await updatePurchasedProducts()
            print("✅ Purchases restored successfully")
        } catch {
            errorMessage = "Failed to restore purchases: \(error.localizedDescription)"
            print("❌ Restore error: \(error)")
        }
        
        isLoading = false
    }
    
    // MARK: - Subscription Status
    
    /// Update the list of purchased products
    private func updatePurchasedProducts() async {
        var purchased: Set<String> = []
        
        for await result in StoreKit.Transaction.currentEntitlements {
            do {
                let transaction = try checkVerified(result)
                
                // Check if subscription is still active
                if transaction.productType == .autoRenewable {
                    purchased.insert(transaction.productID)
                }
                
            } catch {
                print("❌ Error checking transaction: \(error)")
            }
        }
        
        purchasedProducts = purchased
        print("📊 Active subscriptions: \(purchased)")
    }
    
    /// Check if user has an active subscription
    var hasActiveSubscription: Bool {
        !purchasedProducts.isEmpty
    }
    
    /// Get the current subscription plan
    var currentSubscriptionPlan: UserPackage {
        if purchasedProducts.contains("com.beyond.musicgenmain.unlimited") {
            return .unlimited
        } else if purchasedProducts.contains("com.beyond.musicgenmain.pro") {
            return .pro
        } else if purchasedProducts.contains("com.beyond.musicgenmain.starter") {
            return .starter
        } else {
            return .free
        }
    }
    
    // MARK: - Transaction Verification
    
    private func checkVerified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .unverified:
            throw SubscriptionError.unverifiedTransaction
        case .verified(let safe):
            return safe
        }
    }
    
    // MARK: - Transaction Listener
    
    private func listenForTransactions() -> Task<Void, Error> {
        return Task.detached {
            for await result in StoreKit.Transaction.updates {
                do {
                    let transaction = try await MainActor.run {
                        return try self.checkVerified(result)
                    }
                    
                    await MainActor.run {
                        // Update UI and sync with Firebase
                        Task {
                            await self.updatePurchasedProducts()
                            await self.syncWithFirebase(transaction)
                        }
                    }
                    
                    await transaction.finish()
                    
                } catch {
                    print("❌ Transaction update error: \(error)")
                }
            }
        }
    }
    
    // MARK: - Firebase Integration
    
    /// Sync subscription status with Firebase
    private func syncWithFirebase(_ transaction: StoreKit.Transaction) async {
        do {
            let firebaseManager = FirebaseManager.shared
            
            guard var userProfile = firebaseManager.userProfile else {
                print("⚠️ No user profile found for subscription sync")
                return
            }
            
            // Update user plan based on transaction
            let newPlan = mapProductIdToPlan(transaction.productID)
            userProfile.currentPlan = newPlan
            userProfile.subscriptionStatus = .active
            userProfile.totalPoints = newPlan.pointsIncluded
            userProfile.usedPointsToday = 0
            userProfile.usedPointsThisWeek = 0
            userProfile.lastPointRefresh = Date()
            
            try await firebaseManager.updateUserProfile(userProfile)
            
            print("✅ Synced subscription with Firebase: \(newPlan.displayName)")
            
        } catch {
            print("❌ Failed to sync subscription with Firebase: \(error)")
        }
    }
    
    private func mapProductIdToPlan(_ productId: String) -> UserPackage {
        switch productId {
        case "com.beyond.musicgenmain.starter":
            return .starter
        case "com.beyond.musicgenmain.pro":
            return .pro
        case "com.beyond.musicgenmain.unlimited":
            return .unlimited
        default:
            return .free
        }
    }
    
    // MARK: - Helper Methods
    
    /// Get product by identifier
    func product(for identifier: String) -> Product? {
        availableProducts.first { $0.id == identifier }
    }
    
    /// Check if a specific product is purchased
    func isPurchased(_ productIdentifier: String) -> Bool {
        purchasedProducts.contains(productIdentifier)
    }
    
    /// Get formatted price for a product
    func formattedPrice(for product: Product) -> String {
        product.displayPrice
    }
}

// MARK: - Subscription Errors

enum SubscriptionError: Error, LocalizedError {
    case unverifiedTransaction
    case productNotFound
    case purchaseFailed
    
    var errorDescription: String? {
        switch self {
        case .unverifiedTransaction:
            return "Transaction could not be verified"
        case .productNotFound:
            return "Subscription plan not found"
        case .purchaseFailed:
            return "Purchase failed. Please try again."
        }
    }
}

// MARK: - Product Extensions

extension Product {
    /// Get the corresponding UserPackage for this product
    var userPackage: UserPackage {
        switch id {
        case "com.beyond.musicgenmain.starter":
            return .starter
        case "com.beyond.musicgenmain.pro":
            return .pro
        case "com.beyond.musicgenmain.unlimited":
            return .unlimited
        default:
            return .free
        }
    }
    
    /// Check if this is the most popular plan
    var isPopular: Bool {
        return userPackage.isPopular
    }
}