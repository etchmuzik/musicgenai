import SwiftUI

struct WelcomeView: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @State private var animateWelcome = false
    @State private var showPoints = false
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [
                    Color.purple.opacity(0.8),
                    Color.blue.opacity(0.6),
                    Color.cyan.opacity(0.4)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            VStack(spacing: 30) {
                Spacer()
                
                // Welcome Animation
                VStack(spacing: 20) {
                    // Music Icon
                    Image(systemName: "music.note.house.fill")
                        .font(.system(size: 80))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [.white, .cyan, .purple],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .scaleEffect(animateWelcome ? 1.2 : 1.0)
                        .animation(
                            .easeInOut(duration: 2.0)
                            .repeatForever(autoreverses: true),
                            value: animateWelcome
                        )
                    
                    // Welcome Text
                    Text("Welcome to MusicGen!")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                        .multilineTextAlignment(.center)
                        .opacity(animateWelcome ? 1.0 : 0.0)
                        .animation(.easeIn(duration: 1.0).delay(0.5), value: animateWelcome)
                    
                    Text("Your AI-powered music creation journey begins now")
                        .font(.title3)
                        .foregroundColor(.white.opacity(0.9))
                        .multilineTextAlignment(.center)
                        .opacity(animateWelcome ? 1.0 : 0.0)
                        .animation(.easeIn(duration: 1.0).delay(1.0), value: animateWelcome)
                }
                
                // Points Reward
                if showPoints {
                    VStack(spacing: 15) {
                        HStack {
                            Image(systemName: "gift.fill")
                                .font(.title2)
                                .foregroundColor(.yellow)
                            
                            Text("Welcome Bonus!")
                                .font(.headline)
                                .foregroundColor(.white)
                        }
                        
                        HStack {
                            Image(systemName: "bolt.fill")
                                .font(.title3)
                                .foregroundColor(.cyan)
                            
                            Text("5 Free Generations")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .foregroundColor(.white)
                            
                            Image(systemName: "bolt.fill")
                                .font(.title3)
                                .foregroundColor(.cyan)
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 15)
                                .fill(.ultraThinMaterial)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 15)
                                        .stroke(Color.cyan.opacity(0.5), lineWidth: 1)
                                )
                        )
                    }
                    .scaleEffect(showPoints ? 1.0 : 0.5)
                    .opacity(showPoints ? 1.0 : 0.0)
                    .animation(.spring(response: 0.6, dampingFraction: 0.7), value: showPoints)
                }
                
                Spacer()
                
                // Get Started Hint
                VStack(spacing: 10) {
                    Text("🎵 Ready to create amazing music?")
                        .font(.headline)
                        .foregroundColor(.white)
                        .opacity(animateWelcome ? 1.0 : 0.0)
                        .animation(.easeIn(duration: 1.0).delay(2.0), value: animateWelcome)
                    
                    Text("Swipe to continue →")
                        .font(.subheadline)
                        .foregroundColor(.white.opacity(0.8))
                        .opacity(animateWelcome ? 1.0 : 0.0)
                        .animation(.easeIn(duration: 1.0).delay(2.5), value: animateWelcome)
                }
            }
            .padding(.horizontal, 30)
        }
        .onAppear {
            animateWelcome = true
            
            // Show points after 1.5 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                showPoints = true
            }
        }
    }
}

#Preview {
    WelcomeView()
        .environmentObject(FirebaseManager.shared)
}