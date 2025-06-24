/**
 * Authentication Modal Component
 * Handles login, signup, and password reset forms
 */

class AuthModal {
    constructor() {
        this.createModal();
        this.initializeEventListeners();
        this.currentMode = 'login';
    }
    
    createModal() {
        const modalHTML = `
            <div class="auth-modal" id="authModal">
                <div class="auth-modal-overlay" onclick="window.authManager.hideAuthModal()"></div>
                <div class="auth-modal-content">
                    <button class="auth-modal-close" onclick="window.authManager.hideAuthModal()">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <!-- Login Form -->
                    <div class="auth-form" id="loginForm">
                        <div class="auth-header">
                            <h2>Welcome Back</h2>
                            <p>Sign in to your MusicGen AI account</p>
                        </div>
                        
                        <button class="auth-google-btn" onclick="this.handleGoogleSignIn()">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                        </button>
                        
                        <div class="auth-divider">
                            <span>or</span>
                        </div>
                        
                        <form onsubmit="this.handleEmailSignIn(event)">
                            <div class="auth-input-group">
                                <label for="loginEmail">Email</label>
                                <input type="email" id="loginEmail" required 
                                       placeholder="Enter your email">
                            </div>
                            
                            <div class="auth-input-group">
                                <label for="loginPassword">Password</label>
                                <input type="password" id="loginPassword" required 
                                       placeholder="Enter your password">
                            </div>
                            
                            <button type="button" class="auth-forgot-link" 
                                    onclick="window.authManager.setAuthMode('forgot')">
                                Forgot your password?
                            </button>
                            
                            <button type="submit" class="auth-submit-btn">
                                Sign In
                            </button>
                        </form>
                        
                        <div class="auth-switch">
                            Don't have an account? 
                            <button type="button" onclick="window.authManager.setAuthMode('signup')">
                                Sign Up
                            </button>
                        </div>
                    </div>
                    
                    <!-- Signup Form -->
                    <div class="auth-form" id="signupForm" style="display: none;">
                        <div class="auth-header">
                            <h2>Create Account</h2>
                            <p>Join MusicGen AI and start creating</p>
                        </div>
                        
                        <button class="auth-google-btn" onclick="this.handleGoogleSignIn()">
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                            </svg>
                            Continue with Google
                        </button>
                        
                        <div class="auth-divider">
                            <span>or</span>
                        </div>
                        
                        <form onsubmit="this.handleEmailSignUp(event)">
                            <div class="auth-input-group">
                                <label for="signupName">Full Name</label>
                                <input type="text" id="signupName" required 
                                       placeholder="Enter your full name">
                            </div>
                            
                            <div class="auth-input-group">
                                <label for="signupEmail">Email</label>
                                <input type="email" id="signupEmail" required 
                                       placeholder="Enter your email">
                            </div>
                            
                            <div class="auth-input-group">
                                <label for="signupPassword">Password</label>
                                <input type="password" id="signupPassword" required 
                                       placeholder="Create a password (min 6 characters)" minlength="6">
                            </div>
                            
                            <div class="auth-terms">
                                <label class="auth-checkbox">
                                    <input type="checkbox" id="acceptTerms" required>
                                    <span class="checkmark"></span>
                                    I agree to the <a href="/terms" target="_blank">Terms of Service</a> 
                                    and <a href="/privacy" target="_blank">Privacy Policy</a>
                                </label>
                            </div>
                            
                            <button type="submit" class="auth-submit-btn">
                                Create Account
                            </button>
                        </form>
                        
                        <div class="auth-switch">
                            Already have an account? 
                            <button type="button" onclick="window.authManager.setAuthMode('login')">
                                Sign In
                            </button>
                        </div>
                    </div>
                    
                    <!-- Forgot Password Form -->
                    <div class="auth-form" id="forgotPasswordForm" style="display: none;">
                        <div class="auth-header">
                            <h2>Reset Password</h2>
                            <p>Enter your email to receive a password reset link</p>
                        </div>
                        
                        <form onsubmit="this.handleForgotPassword(event)">
                            <div class="auth-input-group">
                                <label for="forgotEmail">Email</label>
                                <input type="email" id="forgotEmail" required 
                                       placeholder="Enter your email">
                            </div>
                            
                            <button type="submit" class="auth-submit-btn">
                                Send Reset Link
                            </button>
                        </form>
                        
                        <div class="auth-switch">
                            Remember your password? 
                            <button type="button" onclick="window.authManager.setAuthMode('login')">
                                Sign In
                            </button>
                        </div>
                    </div>
                    
                    <!-- Loading State -->
                    <div class="auth-loading" id="authLoading" style="display: none;">
                        <div class="auth-spinner"></div>
                        <p>Signing you in...</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.addModalStyles();
    }
    
    addModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Auth Modal */
            .auth-modal {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 1rem;
            }
            
            .auth-modal.active {
                display: flex;
            }
            
            .auth-modal-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
            }
            
            .auth-modal-content {
                position: relative;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 1rem;
                width: 100%;
                max-width: 400px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
            
            .auth-modal-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 1.25rem;
                cursor: pointer;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                z-index: 1;
            }
            
            .auth-modal-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: var(--text-primary);
            }
            
            .auth-form {
                padding: 2rem;
            }
            
            .auth-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .auth-header h2 {
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                color: var(--text-primary);
            }
            
            .auth-header p {
                color: var(--text-secondary);
                font-size: 0.875rem;
            }
            
            .auth-google-btn {
                width: 100%;
                background: white;
                color: #333;
                border: 1px solid #ddd;
                border-radius: 0.5rem;
                padding: 0.75rem 1rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                margin-bottom: 1.5rem;
            }
            
            .auth-google-btn:hover {
                background: #f8f9fa;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .auth-divider {
                position: relative;
                text-align: center;
                margin: 1.5rem 0;
                color: var(--text-secondary);
                font-size: 0.875rem;
            }
            
            .auth-divider::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 1px;
                background: var(--border-color);
            }
            
            .auth-divider span {
                background: var(--bg-secondary);
                padding: 0 1rem;
            }
            
            .auth-input-group {
                margin-bottom: 1rem;
            }
            
            .auth-input-group label {
                display: block;
                font-weight: 500;
                margin-bottom: 0.5rem;
                color: var(--text-primary);
                font-size: 0.875rem;
            }
            
            .auth-input-group input {
                width: 100%;
                background: var(--bg-tertiary);
                border: 2px solid transparent;
                border-radius: 0.5rem;
                padding: 0.75rem;
                color: var(--text-primary);
                font-size: 1rem;
                transition: all 0.2s ease;
            }
            
            .auth-input-group input:focus {
                outline: none;
                border-color: var(--primary);
                background: var(--bg-primary);
            }
            
            .auth-input-group input::placeholder {
                color: var(--text-tertiary);
            }
            
            .auth-forgot-link {
                background: none;
                border: none;
                color: var(--primary);
                font-size: 0.875rem;
                cursor: pointer;
                text-decoration: underline;
                margin-bottom: 1.5rem;
                display: block;
            }
            
            .auth-forgot-link:hover {
                opacity: 0.8;
            }
            
            .auth-submit-btn {
                width: 100%;
                background: var(--primary-gradient);
                border: none;
                border-radius: 0.5rem;
                padding: 0.75rem;
                color: white;
                font-weight: 600;
                font-size: 1rem;
                cursor: pointer;
                transition: all 0.2s ease;
                margin-bottom: 1.5rem;
            }
            
            .auth-submit-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
            }
            
            .auth-submit-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
            
            .auth-terms {
                margin-bottom: 1.5rem;
            }
            
            .auth-checkbox {
                display: flex;
                align-items: flex-start;
                gap: 0.75rem;
                font-size: 0.875rem;
                color: var(--text-secondary);
                cursor: pointer;
                line-height: 1.4;
            }
            
            .auth-checkbox input {
                width: auto !important;
                margin: 0;
            }
            
            .auth-checkbox a {
                color: var(--primary);
                text-decoration: underline;
            }
            
            .auth-switch {
                text-align: center;
                font-size: 0.875rem;
                color: var(--text-secondary);
            }
            
            .auth-switch button {
                background: none;
                border: none;
                color: var(--primary);
                font-weight: 500;
                cursor: pointer;
                text-decoration: underline;
            }
            
            .auth-switch button:hover {
                opacity: 0.8;
            }
            
            .auth-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 3rem 2rem;
                text-align: center;
            }
            
            .auth-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(139, 92, 246, 0.2);
                border-top: 3px solid var(--primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .auth-loading p {
                color: var(--text-secondary);
                margin: 0;
            }
            
            /* Error/Success Messages */
            .auth-message {
                padding: 0.75rem;
                border-radius: 0.5rem;
                margin-bottom: 1rem;
                font-size: 0.875rem;
                text-align: center;
            }
            
            .auth-message.error {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #ef4444;
            }
            
            .auth-message.success {
                background: rgba(34, 197, 94, 0.1);
                border: 1px solid rgba(34, 197, 94, 0.3);
                color: #22c55e;
            }
            
            /* Mobile Responsive */
            @media (max-width: 480px) {
                .auth-modal-content {
                    max-width: none;
                    width: 100%;
                    height: 100%;
                    max-height: none;
                    border-radius: 0;
                }
                
                .auth-form {
                    padding: 1.5rem;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    initializeEventListeners() {
        // Override form submissions to use our auth manager
        document.addEventListener('submit', (e) => {
            if (e.target.closest('#loginForm')) {
                e.preventDefault();
                this.handleEmailSignIn(e);
            } else if (e.target.closest('#signupForm')) {
                e.preventDefault();
                this.handleEmailSignUp(e);
            } else if (e.target.closest('#forgotPasswordForm')) {
                e.preventDefault();
                this.handleForgotPassword(e);
            }
        });
        
        // Override Google sign-in buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.auth-google-btn')) {
                e.preventDefault();
                this.handleGoogleSignIn();
            }
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('authModal').classList.contains('active')) {
                window.authManager.hideAuthModal();
            }
        });
    }
    
    async handleEmailSignIn(event) {
        event.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        this.showLoading();
        
        const result = await window.authManager.signInWithEmail(email, password);
        
        this.hideLoading();
        
        if (result.success) {
            this.showMessage('Welcome back!', 'success');
            setTimeout(() => {
                window.authManager.hideAuthModal();
                this.handlePostLogin();
            }, 1000);
        } else {
            this.showMessage(result.error, 'error');
        }
    }
    
    async handleEmailSignUp(event) {
        event.preventDefault();
        
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const acceptedTerms = document.getElementById('acceptTerms').checked;
        
        if (!acceptedTerms) {
            this.showMessage('Please accept the Terms of Service and Privacy Policy', 'error');
            return;
        }
        
        this.showLoading();
        
        const result = await window.authManager.signUpWithEmail(email, password, name);
        
        this.hideLoading();
        
        if (result.success) {
            this.showMessage('Account created successfully! Welcome to MusicGen AI!', 'success');
            setTimeout(() => {
                window.authManager.hideAuthModal();
                this.handlePostLogin();
            }, 1500);
        } else {
            this.showMessage(result.error, 'error');
        }
    }
    
    async handleGoogleSignIn() {
        this.showLoading();
        
        const result = await window.authManager.signInWithGoogle();
        
        this.hideLoading();
        
        if (result.success) {
            this.showMessage('Welcome to MusicGen AI!', 'success');
            setTimeout(() => {
                window.authManager.hideAuthModal();
                this.handlePostLogin();
            }, 1000);
        } else {
            this.showMessage(result.error, 'error');
        }
    }
    
    async handleForgotPassword(event) {
        event.preventDefault();
        
        const email = document.getElementById('forgotEmail').value;
        
        this.showLoading();
        
        const result = await window.authManager.resetPassword(email);
        
        this.hideLoading();
        
        if (result.success) {
            this.showMessage('Password reset email sent! Check your inbox.', 'success');
            setTimeout(() => {
                window.authManager.setAuthMode('login');
            }, 2000);
        } else {
            this.showMessage(result.error, 'error');
        }
    }
    
    showLoading() {
        document.querySelectorAll('.auth-form').forEach(form => {
            form.style.display = 'none';
        });
        document.getElementById('authLoading').style.display = 'flex';
    }
    
    hideLoading() {
        document.getElementById('authLoading').style.display = 'none';
        window.authManager.setAuthMode(this.currentMode);
    }
    
    showMessage(message, type = 'error') {
        // Remove existing messages
        document.querySelectorAll('.auth-message').forEach(msg => msg.remove());
        
        const messageEl = document.createElement('div');
        messageEl.className = `auth-message ${type}`;
        messageEl.textContent = message;
        
        const activeForm = document.querySelector('.auth-form[style*="block"], .auth-form:not([style*="none"])');
        if (activeForm) {
            activeForm.insertBefore(messageEl, activeForm.firstChild);
        }
    }
    
    handlePostLogin() {
        // Check for stored plan selection
        const selectedPlan = sessionStorage.getItem('selectedPlan');
        if (selectedPlan) {
            sessionStorage.removeItem('selectedPlan');
            if (typeof selectPlan === 'function') {
                selectPlan(selectedPlan);
            }
        }
    }
}

// Initialize auth modal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.authModal = new AuthModal();
});

export default AuthModal;