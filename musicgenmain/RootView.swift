import SwiftUI

struct RootView: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @EnvironmentObject var appSettings: AppSettings
    @State private var showWelcome = false
    @State private var isNewUser = false
    
    var body: some View {
        Group {
            if firebaseManager.isAuthenticated {
                if showWelcome && isNewUser {
                    WelcomeView()
                        .environmentObject(firebaseManager)
                        .onAppear {
                            // Auto-dismiss welcome after 3 seconds
                            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                                showWelcome = false
                            }
                        }
                } else {
                    MainTabView()
                        .environmentObject(appSettings)
                        .environmentObject(firebaseManager)
                        .onAppear {
                            // Refresh user limits when app becomes active
                            Task {
                                do {
                                    try await firebaseManager.refreshDailyLimits()
                                    try await firebaseManager.refreshWeeklyPoints()
                                } catch {
                                    print("Error refreshing limits: \(error)")
                                }
                            }
                        }
                }
            } else {
                AuthenticationView()
                    .environmentObject(firebaseManager)
            }
        }
        .onChange(of: firebaseManager.isAuthenticated) { isAuthenticated in
            if isAuthenticated {
                // Check if this is a new user
                if let userProfile = firebaseManager.userProfile,
                   Calendar.current.isDate(userProfile.createdAt, inSameDayAs: Date()) {
                    isNewUser = true
                    showWelcome = true
                }
            } else {
                isNewUser = false
                showWelcome = false
            }
        }
    }
}

// MARK: - Points Usage Interceptor
struct PointsInterceptor: ViewModifier {
    @EnvironmentObject var firebaseManager: FirebaseManager
    let action: () -> Void
    @State private var showingUpgrade = false
    
    func body(content: Content) -> some View {
        content
            .onTapGesture {
                let validation = firebaseManager.canUserGenerate()
                
                if validation.canGenerate {
                    // Consume point and proceed
                    Task {
                        do {
                            try await firebaseManager.consumePoint()
                            action()
                        } catch {
                            print("Error consuming point: \(error)")
                        }
                    }
                } else {
                    // Show upgrade screen
                    showingUpgrade = true
                }
            }
            .sheet(isPresented: $showingUpgrade) {
                SubscriptionView()
                    .environmentObject(firebaseManager)
            }
    }
}

extension View {
    func requiresPoints(action: @escaping () -> Void) -> some View {
        self.modifier(PointsInterceptor(action: action))
    }
}

struct RootView_Previews: PreviewProvider {
    static var previews: some View {
        RootView()
            .environmentObject(FirebaseManager.shared)
            .environmentObject(AppSettings())
    }
}