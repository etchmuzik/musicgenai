// Firebase Configuration for MusicGen AI Web App
// Safe version that handles missing configuration

// Check if Firebase config is provided
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Check if configuration is valid
const isFirebaseConfigured = firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY";

// Mock Firebase services when not configured
class MockAuthManager {
    constructor() {
        this.currentUser = null;
        this.authCallbacks = [];
    }

    onAuthStateChange(callback) {
        // Always return not authenticated
        setTimeout(() => callback(null), 100);
    }

    async signInWithGoogle() {
        return { 
            success: false, 
            error: 'Firebase is not configured. Please see /firebase-setup for instructions.' 
        };
    }

    async signInWithEmail(email, password) {
        return { 
            success: false, 
            error: 'Firebase is not configured. Please see /firebase-setup for instructions.' 
        };
    }

    async signUpWithEmail(email, password, displayName) {
        return { 
            success: false, 
            error: 'Firebase is not configured. Please see /firebase-setup for instructions.' 
        };
    }

    async signOut() {
        return { success: true };
    }

    isAuthenticated() {
        return false;
    }

    getUser() {
        return null;
    }

    async getUserData() {
        return null;
    }

    updateUI(isAuthenticated) {
        // Update UI to show not authenticated
        const authElements = document.querySelectorAll('[data-auth="true"]');
        const noAuthElements = document.querySelectorAll('[data-auth="false"]');

        authElements.forEach(el => {
            el.style.display = 'none';
        });

        noAuthElements.forEach(el => {
            el.style.display = 'block';
        });
    }
}

// Real AuthManager class for Firebase
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authStateCallbacks = [];
    }

    onAuthStateChange(callback) {
        this.authStateCallbacks.push(callback);
        if (auth) {
            auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                callback(user);
            });
        }
    }

    async signInWithEmail(email, password) {
        if (!auth) return { success: false, error: 'Firebase not configured' };
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signUpWithEmail(email, password, displayName) {
        if (!auth) return { success: false, error: 'Firebase not configured' };
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            if (displayName) {
                await userCredential.user.updateProfile({ displayName });
            }
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        if (!auth) return { success: false };
        try {
            await auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    isAuthenticated() {
        return this.currentUser !== null;
    }

    getUser() {
        return this.currentUser;
    }
}

// Export based on configuration
let authManager, auth, db;

if (isFirebaseConfigured) {
    // Try to initialize Firebase
    try {
        const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js');
        const { getAuth } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
        const { getFirestore } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
        
        const app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        
        // Create real AuthManager
        authManager = new AuthManager();
    } catch (error) {
        console.error('Firebase initialization failed:', error);
        authManager = new MockAuthManager();
    }
} else {
    // Use mock services
    console.warn('Firebase is not configured. Authentication features are disabled.');
    console.warn('Visit /firebase-setup for setup instructions.');
    authManager = new MockAuthManager();
    auth = null;
    db = null;
}

// Show warning on pages that require auth
if (!isFirebaseConfigured && typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Check if this is an auth-required page
        const requiresAuth = document.querySelector('[data-requires-auth="true"]');
        if (requiresAuth) {
            const warning = document.createElement('div');
            warning.style.cssText = `
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(245,158,11,0.9);
                color: white;
                padding: 1rem 2rem;
                border-radius: 0.5rem;
                z-index: 10000;
                text-align: center;
                max-width: 90%;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            `;
            warning.innerHTML = `
                <strong>⚠️ Authentication Disabled</strong><br>
                Firebase is not configured. 
                <a href="/firebase-setup" style="color: white; text-decoration: underline;">Learn more</a> | 
                <a href="/music-gen-fix" style="color: white; text-decoration: underline;">Use Music Generator</a>
            `;
            document.body.appendChild(warning);
        }
    });
}

// Export for global use
window.authManager = authManager;
window.auth = auth;
window.db = db;
window.isFirebaseConfigured = isFirebaseConfigured;

export { authManager, auth, db, isFirebaseConfigured };