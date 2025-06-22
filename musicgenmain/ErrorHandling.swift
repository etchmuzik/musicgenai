import Foundation

// MARK: - Enhanced Error Handling for MusicGen App

extension APIError {
    var userFriendlyMessage: String {
        switch self {
        case .invalidURL:
            return "Connection issue. Please check your internet connection."
        case .noData:
            return "No music tracks were generated. Please try again."
        case .serverError:
            return "Service temporarily unavailable. Please try again in a moment."
        case .unauthorized:
            return "Authentication required. Please sign in to continue."
        case .networkError:
            return "Network connection lost. Please check your internet and try again."
        case .serviceUnavailable:
            return "Music generation service is under maintenance. Please try again later."
        }
    }
    
    var isRetryable: Bool {
        switch self {
        case .networkError, .serverError, .serviceUnavailable:
            return true
        case .noData:
            return true
        case .invalidURL, .unauthorized:
            return false
        }
    }
}

// MARK: - Network Resilience Helper

class NetworkResilienceManager {
    static let shared = NetworkResilienceManager()
    
    private let maxRetryAttempts = 3
    private let baseRetryDelay: Double = 2.0
    
    func executeWithRetry<T>(
        operation: @escaping () async throws -> T,
        retryableErrors: [APIError.Type] = [APIError.self]
    ) async throws -> T {
        
        var lastError: Error?
        
        for attempt in 1...maxRetryAttempts {
            do {
                print("🔄 Network attempt \(attempt)/\(maxRetryAttempts)")
                return try await operation()
                
            } catch let error as APIError where error.isRetryable {
                lastError = error
                print("⚠️ Retryable error on attempt \(attempt): \(error.userFriendlyMessage)")
                
                if attempt < maxRetryAttempts {
                    let delay = baseRetryDelay * Double(attempt)
                    print("⏳ Waiting \(delay)s before retry...")
                    try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                }
                
            } catch {
                // Non-retryable error, throw immediately
                print("❌ Non-retryable error: \(error)")
                throw error
            }
        }
        
        // All retries exhausted
        print("❌ All \(maxRetryAttempts) attempts failed")
        throw lastError ?? APIError.networkError
    }
}

// MARK: - Firebase Error Handling

extension FirebaseManager {
    func handleFirebaseError(_ error: Error, context: String = "") {
        print("🔥 Firebase Error (\(context)): \(error)")
        
        // Check for common Firebase issues
        if error.localizedDescription.contains("AppCheck") {
            print("⚠️ AppCheck issue detected - this is usually safe to ignore in development")
            return
        }
        
        if error.localizedDescription.contains("notAuthenticated") {
            print("🔐 Authentication required")
            DispatchQueue.main.async {
                self.errorMessage = "Please sign in to continue"
            }
            return
        }
        
        if error.localizedDescription.contains("network") {
            print("📡 Network issue - will use offline mode")
            DispatchQueue.main.async {
                self.isCloudSyncAvailable = false
                self.lastSyncError = "Network unavailable"
            }
            return
        }
        
        // Generic error handling
        DispatchQueue.main.async {
            self.errorMessage = "Something went wrong. Please try again."
        }
    }
}

// MARK: - User-Friendly Error Messages

struct ErrorMessageProvider {
    static func getMessage(for error: Error) -> String {
        if let apiError = error as? APIError {
            return apiError.userFriendlyMessage
        }
        
        if let authError = error as? AuthError {
            switch authError {
            case .notAuthenticated:
                return "Please sign in to continue"
            case .profileNotFound:
                return "User profile needs to be set up"
            case .invalidCredentials:
                return "Invalid email or password"
            }
        }
        
        if let pointsError = error as? PointsError {
            switch pointsError {
            case .insufficientPoints(let reason):
                return reason
            case .dailyLimitReached:
                return "Daily generation limit reached. Try again tomorrow!"
            case .subscriptionExpired:
                return "Please renew your subscription to continue"
            }
        }
        
        // Firebase errors
        if error.localizedDescription.contains("AppCheck") {
            return "Connecting to secure services..." // Hide AppCheck issues from users
        }
        
        // PiAPI specific errors
        if error.localizedDescription.contains("serverError") || error.localizedDescription.contains("404") {
            return "Music generation service temporarily unavailable. Please try again."
        }
        
        if error.localizedDescription.contains("network") {
            return "Please check your internet connection"
        }
        
        // Generic fallback
        return "Something went wrong. Please try again."
    }
    
    static func getRetryAction(for error: Error) -> String? {
        if let apiError = error as? APIError, apiError.isRetryable {
            return "Retry"
        }
        
        if error.localizedDescription.contains("network") {
            return "Retry"
        }
        
        return nil
    }
}