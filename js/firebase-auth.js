/**
 * Firebase Authentication Manager
 * Handles user authentication, registration, and profile management
 */

import { 
    getAuth, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut,
    onAuthStateChanged,
    updateProfile,
    updatePassword,
    sendPasswordResetEmail,
    deleteUser
} from 'firebase/auth';

import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    serverTimestamp,
    collection,
    query,
    where,
    getDocs
} from 'firebase/firestore';

import { app } from './firebase-config-safe.js';
import CreditsManager from './credits-manager.js';

class FirebaseAuthManager {
    constructor() {
        this.auth = getAuth(app);
        this.db = getFirestore(app);
        this.googleProvider = new GoogleAuthProvider();
        this.currentUser = null;
        this.authStateListeners = [];
        this.creditsManager = new CreditsManager();
        
        // Configure Google provider
        this.googleProvider.addScope('profile');
        this.googleProvider.addScope('email');
        
        // Listen to auth state changes
        this.initAuthStateListener();
    }
    
    initAuthStateListener() {
        onAuthStateChanged(this.auth, async (user) => {
            this.currentUser = user;
            
            if (user) {
                // User is signed in
                await this.syncUserProfile(user);
                await this.creditsManager.initializeUser(user);
                this.updateUIForAuthenticatedUser(user);
            } else {
                // User is signed out
                await this.creditsManager.initializeUser(null);
                this.updateUIForUnauthenticatedUser();
            }
            
            // Notify all listeners
            this.authStateListeners.forEach(callback => callback(user));
        });
    }
    
    // Auth State Management
    onAuthStateChange(callback) {
        this.authStateListeners.push(callback);
        
        // Return unsubscribe function
        return () => {
            this.authStateListeners = this.authStateListeners.filter(cb => cb !== callback);
        };
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isAuthenticated() {
        return !!this.currentUser;
    }
    
    // Email/Password Authentication
    async signUpWithEmail(email, password, displayName) {
        try {
            const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
            const user = userCredential.user;
            
            // Update profile with display name
            await updateProfile(user, { displayName });
            
            // Create user document in Firestore
            await this.createUserDocument(user, { displayName });
            
            return { success: true, user };
        } catch (error) {
            console.error('Sign up error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    async signInWithEmail(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    // Google OAuth Authentication
    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(this.auth, this.googleProvider);
            const user = result.user;
            
            // Create or update user document
            await this.createUserDocument(user);
            
            return { success: true, user };
        } catch (error) {
            console.error('Google sign in error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    // Sign Out
    async signOut() {
        try {
            await signOut(this.auth);
            this.clearUserData();
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    // Password Reset
    async resetPassword(email) {
        try {
            await sendPasswordResetEmail(this.auth, email);
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    // User Profile Management
    async createUserDocument(user, additionalData = {}) {
        if (!user) return;
        
        const userRef = doc(this.db, 'users', user.uid);
        const userSnapshot = await getDoc(userRef);
        
        if (!userSnapshot.exists()) {
            const { displayName, email, photoURL } = user;
            const userData = {
                uid: user.uid,
                displayName: displayName || additionalData.displayName || '',
                email,
                photoURL: photoURL || '',
                subscription: 'free',
                creditsRemaining: 10, // Free tier starts with 10 credits
                creditsMonthly: 10,
                creditsLastRefresh: new Date().toISOString(),
                creditsUsageHistory: [],
                totalSongsCreated: 0,
                joinedAt: serverTimestamp(),
                lastLoginAt: serverTimestamp(),
                preferences: {
                    theme: 'dark',
                    notifications: true,
                    autoPlay: true
                },
                ...additionalData
            };
            
            try {
                await setDoc(userRef, userData);
                console.log('User document created successfully');
            } catch (error) {
                console.error('Error creating user document:', error);
            }
        } else {
            // Update last login time
            await updateDoc(userRef, {
                lastLoginAt: serverTimestamp()
            });
        }
    }
    
    async syncUserProfile(user) {
        if (!user) return;
        
        try {
            const userRef = doc(this.db, 'users', user.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                
                // Store user data locally for quick access
                localStorage.setItem('userProfile', JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || userData.displayName,
                    photoURL: user.photoURL || userData.photoURL,
                    subscription: userData.subscription || 'free',
                    credits: userData.credits || 200,
                    totalSongsCreated: userData.totalSongsCreated || 0,
                    preferences: userData.preferences || {}
                }));
                
                return userData;
            }
        } catch (error) {
            console.error('Error syncing user profile:', error);
        }
        
        return null;
    }
    
    async updateUserProfile(updates) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            const userRef = doc(this.db, 'users', this.currentUser.uid);
            await updateDoc(userRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            
            // Update Firebase Auth profile if needed
            if (updates.displayName || updates.photoURL) {
                await updateProfile(this.currentUser, {
                    displayName: updates.displayName,
                    photoURL: updates.photoURL
                });
            }
            
            // Refresh local profile
            await this.syncUserProfile(this.currentUser);
            
            return { success: true };
        } catch (error) {
            console.error('Error updating profile:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    async changePassword(newPassword) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            await updatePassword(this.currentUser, newPassword);
            return { success: true };
        } catch (error) {
            console.error('Error changing password:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    // Subscription Management
    async updateSubscription(subscriptionType) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        return await this.creditsManager.updateSubscription(subscriptionType);
    }
    
    async useCredits(amount = 10, description = 'Music generation') {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        return await this.creditsManager.useCredits(amount, description);
    }
    
    async addCredits(amount, description) {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        return await this.creditsManager.addCredits(amount, description);
    }
    
    getCredits() {
        return this.creditsManager.getCredits();
    }
    
    canAfford(creditCost) {
        return this.creditsManager.canAfford(creditCost);
    }
    
    getCreditCost(operation) {
        return this.creditsManager.getCreditCost(operation);
    }
    
    // Account Deletion
    async deleteAccount() {
        if (!this.currentUser) return { success: false, error: 'Not authenticated' };
        
        try {
            // Delete user document from Firestore
            const userRef = doc(this.db, 'users', this.currentUser.uid);
            await deleteDoc(userRef);
            
            // Delete Firebase Auth account
            await deleteUser(this.currentUser);
            
            this.clearUserData();
            return { success: true };
        } catch (error) {
            console.error('Error deleting account:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    // UI Updates
    updateUIForAuthenticatedUser(user) {
        // Update credits display using credits manager
        this.creditsManager.updateCreditsDisplay();
        
        // Update navigation
        this.updateNavigation(true, user);
        
        // Show authenticated user elements
        document.querySelectorAll('.auth-required').forEach(el => {
            el.style.display = '';
        });
        
        document.querySelectorAll('.auth-hidden').forEach(el => {
            el.style.display = 'none';
        });
    }
    
    updateUIForUnauthenticatedUser() {
        // Update credits display using credits manager (will show default)
        this.creditsManager.updateCreditsDisplay();
        
        // Update navigation
        this.updateNavigation(false);
        
        // Hide authenticated user elements
        document.querySelectorAll('.auth-required').forEach(el => {
            el.style.display = 'none';
        });
        
        document.querySelectorAll('.auth-hidden').forEach(el => {
            el.style.display = '';
        });
    }
    
    updateNavigation(isAuthenticated, user = null) {
        // Add profile/login buttons to navigation
        const nav = document.querySelector('.nav-menu');
        if (!nav) return;
        
        // Remove existing auth items
        nav.querySelectorAll('.auth-nav-item').forEach(item => item.remove());
        
        if (isAuthenticated && user) {
            // Add profile menu
            const profile = JSON.parse(localStorage.getItem('userProfile') || '{}');
            const profileHTML = `
                <li class="nav-item auth-nav-item">
                    <a href="/profile" class="nav-link ${window.location.pathname === '/profile' ? 'active' : ''}">
                        <span class="nav-icon">
                            ${profile.photoURL ? 
                                `<img src="${profile.photoURL}" alt="Profile" style="width: 20px; height: 20px; border-radius: 50%;">` :
                                '<i class="fas fa-user"></i>'
                            }
                        </span>
                        Profile
                    </a>
                </li>
                <li class="nav-item auth-nav-item">
                    <button class="nav-link" onclick="window.authManager.signOut()" style="background: none; border: none; width: 100%; text-align: left;">
                        <span class="nav-icon"><i class="fas fa-sign-out-alt"></i></span>
                        Sign Out
                    </button>
                </li>
            `;
            nav.insertAdjacentHTML('beforeend', profileHTML);
        } else {
            // Add login button
            const loginHTML = `
                <li class="nav-item auth-nav-item">
                    <button class="nav-link" onclick="window.authManager.showAuthModal('login')" style="background: none; border: none; width: 100%; text-align: left;">
                        <span class="nav-icon"><i class="fas fa-sign-in-alt"></i></span>
                        Sign In
                    </button>
                </li>
            `;
            nav.insertAdjacentHTML('beforeend', loginHTML);
        }
    }
    
    // Modal Management
    showAuthModal(mode = 'login') {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.add('active');
            this.setAuthMode(mode);
        }
    }
    
    hideAuthModal() {
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    setAuthMode(mode) {
        const loginForm = document.getElementById('loginForm');
        const signupForm = document.getElementById('signupForm');
        const forgotForm = document.getElementById('forgotPasswordForm');
        
        // Hide all forms
        [loginForm, signupForm, forgotForm].forEach(form => {
            if (form) form.style.display = 'none';
        });
        
        // Show selected form
        if (mode === 'login' && loginForm) {
            loginForm.style.display = 'block';
        } else if (mode === 'signup' && signupForm) {
            signupForm.style.display = 'block';
        } else if (mode === 'forgot' && forgotForm) {
            forgotForm.style.display = 'block';
        }
    }
    
    // Utility Functions
    clearUserData() {
        localStorage.removeItem('userProfile');
        localStorage.removeItem('musicLibrary');
    }
    
    getErrorMessage(error) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password.',
            'auth/email-already-in-use': 'An account with this email already exists.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/popup-closed-by-user': 'Sign-in popup was closed.',
            'auth/cancelled-popup-request': 'Sign-in was cancelled.'
        };
        
        return errorMessages[error.code] || error.message || 'An error occurred. Please try again.';
    }
    
    // Get user profile data
    getUserProfile() {
        return JSON.parse(localStorage.getItem('userProfile') || '{}');
    }
    
    // Check if user has sufficient credits
    hasCredits(amount = 10) {
        const profile = this.getUserProfile();
        return (profile.credits || 0) >= amount;
    }
}

// Create global instance
window.authManager = new FirebaseAuthManager();

export default FirebaseAuthManager;
export { FirebaseAuthManager };