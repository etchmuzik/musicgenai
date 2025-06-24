// Firebase Configuration for MusicGen AI
// IMPORTANT: Replace these values with your actual Firebase config

const firebaseConfig = {
    apiKey: "AIzaSyD73WJxgzzRMEGDbK-kuKmq5qMPrH0Pybs",
    authDomain: "musicgen-6cea1.firebaseapp.com",
    projectId: "musicgen-6cea1",
    storageBucket: "musicgen-6cea1.firebasestorage.app",
    messagingSenderId: "392958246299",
    appId: "1:392958246299:web:1371d17d3780263078353e"
};

// Initialize Firebase
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    sendEmailVerification,
    updateProfile,
    onAuthStateChanged,
    signOut
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    serverTimestamp,
    increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Auth Manager Class
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userDoc = null;
        this.authStateCallbacks = [];
        this.initAuthListener();
    }

    // Initialize auth state listener
    initAuthListener() {
        onAuthStateChanged(auth, async (user) => {
            this.currentUser = user;
            
            if (user) {
                // Load user document from Firestore
                await this.loadUserData(user.uid);
                // Check and refresh monthly credits
                await this.checkMonthlyCredits();
            } else {
                this.userDoc = null;
            }
            
            // Notify all callbacks
            this.authStateCallbacks.forEach(callback => callback(user));
            
            // Update UI
            this.updateUI(!!user);
        });
    }

    // Register new user with email/password
    async registerWithEmail(email, password, displayName) {
        try {
            // Create auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Update display name
            if (displayName) {
                await updateProfile(user, { displayName });
            }

            // Create user document in Firestore
            await this.createUserDocument(user, { displayName });

            // Send verification email
            await sendEmailVerification(user);

            return { success: true, user };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Sign in with email/password
    async signInWithEmail(email, password) {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Sign in with Google
    async signInWithGoogle() {
        try {
            const provider = new GoogleAuthProvider();
            const userCredential = await signInWithPopup(auth, provider);
            const user = userCredential.user;

            // Check if this is a new user
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (!userDoc.exists()) {
                await this.createUserDocument(user);
            }

            return { success: true, user };
        } catch (error) {
            console.error('Google sign in error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Send password reset email
    async sendPasswordReset(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            return { success: true };
        } catch (error) {
            console.error('Password reset error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Sign out
    async signOut() {
        try {
            await signOut(auth);
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: this.getErrorMessage(error) };
        }
    }

    // Create user document in Firestore
    async createUserDocument(user, additionalData = {}) {
        const userRef = doc(db, 'users', user.uid);
        
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || additionalData.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || null,
            createdAt: serverTimestamp(),
            credits: 10, // Free tier starts with 10 credits
            subscription: 'free',
            totalSongsGenerated: 0,
            lastCreditRefresh: serverTimestamp(),
            emailVerified: user.emailVerified,
            ...additionalData
        };

        await setDoc(userRef, userData);
        this.userDoc = userData;
    }

    // Load user data from Firestore
    async loadUserData(uid) {
        try {
            const userRef = doc(db, 'users', uid);
            const userSnap = await getDoc(userRef);
            
            if (userSnap.exists()) {
                this.userDoc = userSnap.data();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    // Check and refresh monthly credits
    async checkMonthlyCredits() {
        if (!this.userDoc || !this.currentUser) return;

        const lastRefresh = this.userDoc.lastCreditRefresh?.toDate() || new Date(0);
        const now = new Date();
        
        // Check if a month has passed
        const monthsSinceRefresh = (now.getFullYear() - lastRefresh.getFullYear()) * 12 + 
                                  (now.getMonth() - lastRefresh.getMonth());

        if (monthsSinceRefresh >= 1) {
            // Refresh credits based on subscription
            const creditAmounts = {
                free: 10,
                starter: 500,
                pro: 2000,
                unlimited: 10000
            };

            const newCredits = creditAmounts[this.userDoc.subscription] || 10;

            // Update in Firestore
            const userRef = doc(db, 'users', this.currentUser.uid);
            await updateDoc(userRef, {
                credits: newCredits,
                lastCreditRefresh: serverTimestamp()
            });

            // Update local data
            this.userDoc.credits = newCredits;
            this.userDoc.lastCreditRefresh = now;
        }
    }

    // Use credits
    async useCredits(amount, description = 'Music generation') {
        if (!this.currentUser || !this.userDoc) {
            throw new Error('User not authenticated');
        }

        if (this.userDoc.credits < amount) {
            throw new Error('Insufficient credits');
        }

        // Update in Firestore
        const userRef = doc(db, 'users', this.currentUser.uid);
        await updateDoc(userRef, {
            credits: increment(-amount),
            totalSongsGenerated: increment(1)
        });

        // Update local data
        this.userDoc.credits -= amount;
        this.userDoc.totalSongsGenerated += 1;

        // Log usage
        console.log(`Used ${amount} credits for ${description}`);

        return this.userDoc.credits;
    }

    // Get user data
    getUserData() {
        return this.userDoc;
    }

    // Get current user
    getUser() {
        return this.currentUser;
    }

    // Check if authenticated
    isAuthenticated() {
        return !!this.currentUser;
    }

    // Check if user has enough credits
    hasCredits(amount) {
        return this.userDoc?.credits >= amount;
    }

    // Add auth state change listener
    onAuthStateChange(callback) {
        this.authStateCallbacks.push(callback);
        // Call immediately with current state
        callback(this.currentUser);
    }

    // Update UI based on auth state
    updateUI(isAuthenticated) {
        // Update auth-dependent elements
        document.querySelectorAll('[data-auth="true"]').forEach(el => {
            el.style.display = isAuthenticated ? 'block' : 'none';
        });
        
        document.querySelectorAll('[data-auth="false"]').forEach(el => {
            el.style.display = isAuthenticated ? 'none' : 'block';
        });

        // Update user info displays
        if (isAuthenticated && this.userDoc) {
            document.querySelectorAll('[data-user-name]').forEach(el => {
                el.textContent = this.userDoc.displayName;
            });
            
            document.querySelectorAll('[data-user-email]').forEach(el => {
                el.textContent = this.userDoc.email;
            });
            
            document.querySelectorAll('[data-user-credits]').forEach(el => {
                el.textContent = this.userDoc.credits;
            });
        }
    }

    // Get user-friendly error message
    getErrorMessage(error) {
        const errorMessages = {
            'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
            'auth/invalid-email': 'Please enter a valid email address.',
            'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
            'auth/weak-password': 'Password should be at least 6 characters.',
            'auth/user-disabled': 'This account has been disabled.',
            'auth/user-not-found': 'No account found with this email.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/invalid-credential': 'Invalid email or password.',
            'auth/network-request-failed': 'Network error. Please check your connection.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
            'auth/popup-closed-by-user': 'Sign in was cancelled.',
        };

        return errorMessages[error.code] || error.message || 'An error occurred. Please try again.';
    }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Export for use in other modules
window.auth = auth;
window.db = db;
window.authManager = authManager;

export { auth, db, authManager };