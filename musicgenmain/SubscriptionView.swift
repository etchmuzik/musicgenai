import SwiftUI
import StoreKit

struct SubscriptionView: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @StateObject private var subscriptionManager = SubscriptionManager.shared
    @Environment(\.presentationMode) var presentationMode
    @State private var selectedProduct: Product?
    @State private var showingPurchaseConfirmation = false
    @State private var showingRestoreAlert = false
    
    var body: some View {
        NavigationView {
            ZStack {
                // Background
                LinearGradient(
                    colors: [Color.purple.opacity(0.1), Color.blue.opacity(0.1)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 30) {
                        // Header
                        headerSection
                        
                        // Current plan status
                        if let userProfile = firebaseManager.userProfile {
                            currentPlanSection(userProfile)
                        }
                        
                        // Pricing packages
                        if subscriptionManager.isLoading {
                            ProgressView("Loading plans...")
                                .frame(height: 200)
                        } else {
                            pricingPackagesSection
                        }
                        
                        // Features comparison
                        featuresComparisonSection
                        
                        // Purchase button
                        purchaseButtonSection
                        
                        // Profit margin disclaimer (for transparency)
                        disclaimerSection
                    }
                    .padding()
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle("Choose Your Plan")
            .navigationBarTitleDisplayMode(.large)
            .navigationBarItems(
                leading: Button("Cancel") {
                    presentationMode.wrappedValue.dismiss()
                }
            )
        }
        .alert("Upgrade Successful!", isPresented: $showingPurchaseConfirmation) {
            Button("Start Creating") {
                presentationMode.wrappedValue.dismiss()
            }
        } message: {
            Text("Welcome to \(selectedProduct?.userPackage.displayName ?? "your plan")! You now have access to premium features.")
        }
    }
    
    @ViewBuilder
    private var headerSection: some View {
        VStack(spacing: 15) {
            Image(systemName: "crown.fill")
                .font(.system(size: 60))
                .foregroundColor(.orange)
            
            Text("Unlock AI Music Generation")
                .font(.system(size: 28, weight: .bold))
                .multilineTextAlignment(.center)
            
            Text("Choose a plan that fits your creative needs")
                .font(.subheadline)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
    }
    
    @ViewBuilder
    private func currentPlanSection(_ userProfile: MusicGenUserProfile) -> some View {
        VStack(spacing: 12) {
            Text("Current Plan")
                .font(.headline)
                .foregroundColor(.secondary)
            
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text(userProfile.currentPlan.displayName)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Text("\(userProfile.remainingPoints) generations left")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 4) {
                    Text("Daily Usage")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    
                    Text("\(userProfile.usedPointsToday)/\(userProfile.currentPlan.dailyLimit)")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(userProfile.usedPointsToday >= userProfile.currentPlan.dailyLimit ? .red : .green)
                }
            }
            .padding()
            .background(Color.gray.opacity(0.1))
            .cornerRadius(15)
            
            // Progress bar
            ProgressView(value: userProfile.dailyProgress)
                .progressViewStyle(LinearProgressViewStyle(tint: userProfile.currentPlan.color))
        }
    }
    
    @ViewBuilder
    private var pricingPackagesSection: some View {
        VStack(spacing: 20) {
            Text("Choose Your Plan")
                .font(.title2)
                .fontWeight(.bold)
            
            if subscriptionManager.availableProducts.isEmpty {
                VStack(spacing: 15) {
                    Image(systemName: "wifi.slash")
                        .font(.system(size: 50))
                        .foregroundColor(.gray)
                    Text("Unable to load subscription plans")
                        .font(.headline)
                        .foregroundColor(.gray)
                    Text("Please check your internet connection")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Button("Retry") {
                        Task {
                            await subscriptionManager.loadProducts()
                        }
                    }
                    .buttonStyle(.bordered)
                }
                .frame(height: 200)
            } else {
                LazyVGrid(columns: [
                    GridItem(.flexible()),
                    GridItem(.flexible())
                ], spacing: 15) {
                    // Always show free plan first
                    PricingCard(
                        package: .free,
                        isSelected: selectedProduct == nil,
                        onSelect: { selectedProduct = nil }
                    )
                    
                    // Show StoreKit products
                    ForEach(subscriptionManager.availableProducts, id: \.id) { product in
                        StoreKitPricingCard(
                            product: product,
                            isSelected: selectedProduct?.id == product.id,
                            isPurchased: subscriptionManager.isPurchased(product.id),
                            onSelect: { selectedProduct = product }
                        )
                    }
                }
            }
        }
    }
    
    @ViewBuilder
    private var featuresComparisonSection: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("What's Included")
                .font(.title2)
                .fontWeight(.bold)
            
            let features = selectedProduct?.userPackage.features ?? UserPackage.free.features
            
            VStack(spacing: 12) {
                ForEach(features, id: \.self) { feature in
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                        Text(feature)
                            .font(.subheadline)
                        Spacer()
                    }
                }
            }
            .padding()
            .background(Color.gray.opacity(0.05))
            .cornerRadius(15)
        }
    }
    
    @ViewBuilder
    private var purchaseButtonSection: some View {
        if let selectedProduct = selectedProduct {
            VStack(spacing: 15) {
                Button(action: {
                    Task {
                        await purchaseSelectedProduct()
                    }
                }) {
                    HStack {
                        if subscriptionManager.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                .scaleEffect(0.8)
                        } else {
                            Text("Upgrade to \(selectedProduct.userPackage.displayName)")
                                .fontWeight(.semibold)
                        }
                        
                        Spacer()
                        
                        Text(selectedProduct.displayPrice + "/month")
                            .fontWeight(.bold)
                    }
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding()
                    .background(
                        LinearGradient(
                            colors: [selectedProduct.userPackage.color, selectedProduct.userPackage.color.opacity(0.8)],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .cornerRadius(15)
                }
                .disabled(subscriptionManager.isLoading)
                
                // Value proposition
                VStack(spacing: 8) {
                    Text("💰 Great Value")
                        .font(.headline)
                        .foregroundColor(.green)
                    
                    Text("Only $\(Double(truncating: selectedProduct.userPackage.costPerGeneration as NSNumber), specifier: "%.2f") per generation")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                    
                    Text("vs $0.07 pay-as-you-go pricing")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .padding()
                .background(Color.green.opacity(0.1))
                .cornerRadius(12)
                
                // Restore purchases button
                Button("Restore Purchases") {
                    Task {
                        await subscriptionManager.restorePurchases()
                    }
                }
                .font(.subheadline)
                .foregroundColor(.blue)
                .disabled(subscriptionManager.isLoading)
            }
        }
    }
    
    @ViewBuilder
    private var disclaimerSection: some View {
        VStack(spacing: 8) {
            Text("💡 Transparent Pricing")
                .font(.headline)
                .foregroundColor(.blue)
            
            Text("Our pricing includes AI processing costs, cloud storage, app development, and customer support. Each generation costs us $0.02 in API fees.")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Text("🎵 High-quality AI music generation powered by state-of-the-art models")
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
        .background(Color.blue.opacity(0.05))
        .cornerRadius(12)
    }
    
    func purchaseSelectedProduct() async {
        guard let selectedProduct = selectedProduct else { return }
        
        do {
            let transaction = try await subscriptionManager.purchase(selectedProduct)
            
            if transaction != nil {
                showingPurchaseConfirmation = true
            }
            
        } catch {
            print("Purchase failed: \(error)")
            // Show error to user
        }
    }
}

// MARK: - StoreKit Pricing Card Component
struct StoreKitPricingCard: View {
    let product: Product
    let isSelected: Bool
    let isPurchased: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            VStack(spacing: 15) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: product.userPackage.icon)
                        .font(.system(size: 30))
                        .foregroundColor(product.userPackage.color)
                    
                    Text(product.userPackage.displayName)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    if product.isPopular {
                        Text("MOST POPULAR")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.orange)
                            .cornerRadius(8)
                    }
                    
                    if isPurchased {
                        Text("ACTIVE")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.green)
                            .cornerRadius(8)
                    }
                }
                
                // Price
                VStack(spacing: 4) {
                    Text(product.displayPrice)
                        .font(.title)
                        .fontWeight(.bold)
                        .foregroundColor(product.userPackage.color)
                    
                    Text("per month")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Key stats
                VStack(spacing: 8) {
                    HStack {
                        Text("Generations")
                            .font(.caption)
                        Spacer()
                        Text("\(product.userPackage.pointsIncluded)")
                            .font(.caption)
                            .fontWeight(.bold)
                    }
                    
                    HStack {
                        Text("Daily Limit")
                            .font(.caption)
                        Spacer()
                        Text("\(product.userPackage.dailyLimit)")
                            .font(.caption)
                            .fontWeight(.bold)
                    }
                    
                    HStack {
                        Text("Per Generation")
                            .font(.caption)
                        Spacer()
                        Text("$\(Double(truncating: product.userPackage.costPerGeneration as NSNumber), specifier: "%.2f")")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    }
                }
                .foregroundColor(.secondary)
                
                Spacer()
            }
            .padding()
            .frame(height: 220)
            .background(
                RoundedRectangle(cornerRadius: 15)
                    .fill(isSelected ? product.userPackage.color.opacity(0.1) : Color.gray.opacity(0.05))
                    .overlay(
                        RoundedRectangle(cornerRadius: 15)
                            .stroke(isSelected ? product.userPackage.color : Color.clear, lineWidth: 2)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Pricing Card Component
struct PricingCard: View {
    let package: UserPackage
    let isSelected: Bool
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            VStack(spacing: 15) {
                // Header
                VStack(spacing: 8) {
                    Image(systemName: package.icon)
                        .font(.system(size: 30))
                        .foregroundColor(package.color)
                    
                    Text(package.displayName)
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    if package.isPopular {
                        Text("MOST POPULAR")
                            .font(.caption)
                            .fontWeight(.bold)
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.orange)
                            .cornerRadius(8)
                    }
                }
                
                // Price
                VStack(spacing: 4) {
                    if package == .free {
                        Text("FREE")
                            .font(.title)
                            .fontWeight(.bold)
                            .foregroundColor(package.color)
                    } else {
                        HStack(alignment: .top, spacing: 2) {
                            Text("$")
                                .font(.headline)
                                .fontWeight(.bold)
                            Text("\(Double(truncating: package.monthlyPrice as NSNumber), specifier: "%.0f")")
                                .font(.title)
                                .fontWeight(.bold)
                            Text("99")
                                .font(.headline)
                                .fontWeight(.bold)
                        }
                        .foregroundColor(package.color)
                        
                        Text("per month")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                // Key stats
                VStack(spacing: 8) {
                    HStack {
                        Text("Generations")
                            .font(.caption)
                        Spacer()
                        Text("\(package.pointsIncluded)")
                            .font(.caption)
                            .fontWeight(.bold)
                    }
                    
                    HStack {
                        Text("Daily Limit")
                            .font(.caption)
                        Spacer()
                        Text("\(package.dailyLimit)")
                            .font(.caption)
                            .fontWeight(.bold)
                    }
                    
                    if package != .free {
                        HStack {
                            Text("Per Generation")
                                .font(.caption)
                            Spacer()
                            Text("$\(Double(truncating: package.costPerGeneration as NSNumber), specifier: "%.2f")")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.green)
                        }
                    }
                }
                .foregroundColor(.secondary)
                
                Spacer()
            }
            .padding()
            .frame(height: 220)
            .background(
                RoundedRectangle(cornerRadius: 15)
                    .fill(isSelected ? package.color.opacity(0.1) : Color.gray.opacity(0.05))
                    .overlay(
                        RoundedRectangle(cornerRadius: 15)
                            .stroke(isSelected ? package.color : Color.clear, lineWidth: 2)
                    )
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Profit Analysis View (Admin/Debug)
struct ProfitAnalysisView: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("💰 Profit Analysis")
                .font(.title2)
                .fontWeight(.bold)
            
            ForEach(UserPackage.allCases.filter { $0 != .free }, id: \.self) { package in
                VStack(alignment: .leading, spacing: 8) {
                    Text(package.displayName)
                        .font(.headline)
                        .foregroundColor(package.color)
                    
                    HStack {
                        Text("Revenue:")
                        Spacer()
                        Text("$\(Double(truncating: package.monthlyPrice as NSNumber), specifier: "%.2f")")
                            .fontWeight(.bold)
                    }
                    
                    HStack {
                        Text("API Costs:")
                        Spacer()
                        Text("$\(Double(truncating: Decimal(package.pointsIncluded) * PricingAnalytics.apiCostPerGeneration as NSNumber), specifier: "%.2f")")
                            .foregroundColor(.red)
                    }
                    
                    HStack {
                        Text("Profit:")
                        Spacer()
                        Text("$\(Double(truncating: PricingAnalytics.calculateProfit(for: package) as NSNumber), specifier: "%.2f")")
                            .fontWeight(.bold)
                            .foregroundColor(.green)
                    }
                    
                    HStack {
                        Text("Margin:")
                        Spacer()
                        Text("\(Double(truncating: PricingAnalytics.calculateProfitMargin(for: package) * 100 as NSNumber), specifier: "%.1f")%")
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.05))
                .cornerRadius(12)
            }
        }
        .padding()
    }
}

struct SubscriptionView_Previews: PreviewProvider {
    static var previews: some View {
        SubscriptionView()
            .environmentObject(FirebaseManager.shared)
    }
}