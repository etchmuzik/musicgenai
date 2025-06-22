import SwiftUI
import FirebaseAuth

struct AuthenticationView: View {
    @EnvironmentObject var firebaseManager: FirebaseManager
    @State private var isSignUp = false
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var displayName = ""
    @State private var showingForgotPassword = false
    @State private var showingError = false
    @State private var errorMessage = ""
    
    var body: some View {
        ZStack {
            // Background gradient
            LinearGradient(
                colors: [Color.blue.opacity(0.8), Color.purple.opacity(0.8)],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()
            
            ScrollView {
                VStack(spacing: 30) {
                    Spacer().frame(height: 60)
                    
                    // App logo/title
                    VStack(spacing: 10) {
                        Image(systemName: "waveform.and.mic")
                            .font(.system(size: 80))
                            .foregroundColor(.white)
                        
                        Text("MusicGen AI")
                            .font(.system(size: 36, weight: .bold, design: .rounded))
                            .foregroundColor(.white)
                        
                        Text("Create AI-Powered Music")
                            .font(.headline)
                            .foregroundColor(.white.opacity(0.8))
                    }
                    .padding(.bottom, 40)
                    
                    // Auth form
                    VStack(spacing: 20) {
                        // Toggle between Sign In / Sign Up
                        Picker("Auth Mode", selection: $isSignUp) {
                            Text("Sign In").tag(false)
                            Text("Sign Up").tag(true)
                        }
                        .pickerStyle(SegmentedPickerStyle())
                        .padding()
                        .background(Color.white.opacity(0.1))
                        .cornerRadius(15)
                        
                        // Form fields
                        VStack(spacing: 15) {
                            if isSignUp {
                                TextField("Display Name", text: $displayName)
                                    .textFieldStyle(AuthTextFieldStyle())
                            }
                            
                            TextField("Email", text: $email)
                                .textFieldStyle(AuthTextFieldStyle())
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                            
                            SecureField("Password", text: $password)
                                .textFieldStyle(AuthTextFieldStyle())
                            
                            if isSignUp {
                                SecureField("Confirm Password", text: $confirmPassword)
                                    .textFieldStyle(AuthTextFieldStyle())
                            }
                        }
                        
                        // Auth button
                        Button(action: handleAuthentication) {
                            HStack {
                                if firebaseManager.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .scaleEffect(0.8)
                                } else {
                                    Text(isSignUp ? "Create Account" : "Sign In")
                                        .fontWeight(.semibold)
                                }
                            }
                            .font(.headline)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                LinearGradient(
                                    colors: [Color.orange, Color.red],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .cornerRadius(15)
                        }
                        .disabled(firebaseManager.isLoading || !isFormValid)
                        .opacity(isFormValid ? 1.0 : 0.6)
                        
                        // Forgot password
                        if !isSignUp {
                            Button("Forgot Password?") {
                                showingForgotPassword = true
                            }
                            .foregroundColor(.white.opacity(0.8))
                            .font(.subheadline)
                        }
                        
                        // Social sign in
                        Divider()
                            .background(Color.white.opacity(0.3))
                        
                        Button(action: signInWithGoogle) {
                            HStack {
                                Image(systemName: "globe")
                                Text("Continue with Google")
                            }
                            .font(.headline)
                            .foregroundColor(.black)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(15)
                        }
                        
                        // Terms and privacy
                        if isSignUp {
                            Text("By creating an account, you agree to our Terms of Service and Privacy Policy")
                                .font(.caption)
                                .foregroundColor(.white.opacity(0.7))
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                        }
                    }
                    .padding(.horizontal, 30)
                    
                    Spacer()
                }
            }
        }
        .alert("Reset Password", isPresented: $showingForgotPassword) {
            TextField("Email", text: $email)
            Button("Send Reset Link") {
                sendPasswordReset()
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("Enter your email address to receive a password reset link.")
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(errorMessage)
        }
        .onChange(of: firebaseManager.errorMessage) { error in
            if let error = error {
                errorMessage = error
                showingError = true
            }
        }
    }
    
    var isFormValid: Bool {
        if isSignUp {
            return !email.isEmpty && 
                   !password.isEmpty && 
                   !displayName.isEmpty && 
                   password == confirmPassword &&
                   password.count >= 6
        } else {
            return !email.isEmpty && !password.isEmpty
        }
    }
    
    func handleAuthentication() {
        Task {
            do {
                if isSignUp {
                    try await firebaseManager.signUpWithEmail(
                        email: email,
                        password: password,
                        displayName: displayName
                    )
                } else {
                    try await firebaseManager.signInWithEmail(
                        email: email,
                        password: password
                    )
                }
            } catch {
                // Error handled by FirebaseManager
            }
        }
    }
    
    func signInWithGoogle() {
        Task {
            do {
                try await firebaseManager.signInWithGoogle()
            } catch {
                errorMessage = "Google Sign-In not available yet"
                showingError = true
            }
        }
    }
    
    func sendPasswordReset() {
        Task {
            do {
                try await firebaseManager.resetPassword(email: email)
                errorMessage = "Password reset link sent to your email"
                showingError = true
            } catch {
                errorMessage = error.localizedDescription
                showingError = true
            }
        }
    }
}

// MARK: - Custom Text Field Style
struct AuthTextFieldStyle: TextFieldStyle {
    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding()
            .background(Color.white.opacity(0.2))
            .cornerRadius(15)
            .foregroundColor(.white)
            .font(.body)
    }
}


struct AuthenticationView_Previews: PreviewProvider {
    static var previews: some View {
        AuthenticationView()
            .environmentObject(FirebaseManager.shared)
    }
}