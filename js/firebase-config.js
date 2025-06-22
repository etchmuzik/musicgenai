// Firebase Configuration for MusicGen AI Web App
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { 
    getAuth, 
    signInWithPopup, 
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    updateProfile
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    getDoc, 
    updateDoc,
    collection,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('profile');
googleProvider.addScope('email');

// Auth State Management
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authCallbacks = [];
        this.init();
    }

    init() {
        onAuthStateChanged(auth, (user) => {
            this.currentUser = user;
            this.authCallbacks.forEach(callback => callback(user));
            
            if (user) {
                this.syncUserData(user);
                this.updateUI(true);
            } else {
                this.updateUI(false);
            }
        });
    }

    onAuthStateChange(callback) {
        this.authCallbacks.push(callback);
    }

    async signInWithGoogle() {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;
            await this.createUserProfile(user);
            return { success: true, user };
        } catch (error) {
            console.error('Google sign in failed:', error);
            return { success: false, error: error.message };
        }
    }

    async signInWithEmail(email, password) {
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Email sign in failed:', error);
            return { success: false, error: error.message };
        }
    }

    async signUpWithEmail(email, password, displayName) {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            
            // Update profile with display name
            await updateProfile(result.user, { displayName });
            
            // Create user profile in Firestore
            await this.createUserProfile(result.user);
            
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Email sign up failed:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            await signOut(auth);
            localStorage.clear(); // Clear local storage on sign out
            return { success: true };
        } catch (error) {
            console.error('Sign out failed:', error);
            return { success: false, error: error.message };
        }
    }

    async createUserProfile(user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                subscription: 'free',
                credits: 10, // Free starter credits
                generationCount: 0,
                preferences: {
                    preferredGenres: [],
                    notifications: true,
                    autoSave: true
                },
                stats: {
                    totalGenerations: 0,
                    totalPlaytime: 0,
                    favoriteGenres: []
                }
            };

            await setDoc(userRef, userData);
        } else {
            // Update last login
            await updateDoc(userRef, {
                lastLogin: new Date().toISOString()
            });
        }
    }

    async updateUserProfile(updates) {
        if (!this.currentUser) return { success: false, error: 'No user logged in' };

        try {
            const userRef = doc(db, 'users', this.currentUser.uid);
            await updateDoc(userRef, {
                ...updates,
                updatedAt: new Date().toISOString()
            });
            return { success: true };
        } catch (error) {
            console.error('Profile update failed:', error);
            return { success: false, error: error.message };
        }
    }

    async getUserData() {
        if (!this.currentUser) return null;

        try {
            const userRef = doc(db, 'users', this.currentUser.uid);
            const userSnap = await getDoc(userRef);
            return userSnap.exists() ? userSnap.data() : null;
        } catch (error) {
            console.error('Failed to get user data:', error);
            return null;
        }
    }

    async syncUserData(user) {
        // Sync local storage data with Firestore
        const localTracks = JSON.parse(localStorage.getItem('generatedTracks') || '[]');
        const localPlaylists = JSON.parse(localStorage.getItem('playlists') || '[]');
        const localFavorites = JSON.parse(localStorage.getItem('favorites') || '[]');

        if (localTracks.length > 0 || localPlaylists.length > 0 || localFavorites.length > 0) {
            await this.syncLocalDataToCloud(user.uid, {
                tracks: localTracks,
                playlists: localPlaylists,
                favorites: localFavorites
            });
        }

        // Load cloud data
        await this.loadUserTracks(user.uid);
    }

    async syncLocalDataToCloud(userId, localData) {
        try {
            // Sync tracks
            for (const track of localData.tracks) {
                await addDoc(collection(db, 'users', userId, 'tracks'), {
                    ...track,
                    syncedAt: new Date().toISOString()
                });
            }

            // Sync playlists
            for (const playlist of localData.playlists) {
                await addDoc(collection(db, 'users', userId, 'playlists'), {
                    ...playlist,
                    syncedAt: new Date().toISOString()
                });
            }

            // Update favorites in user profile
            if (localData.favorites.length > 0) {
                await this.updateUserProfile({ favorites: localData.favorites });
            }

            // Clear local storage after successful sync
            localStorage.removeItem('generatedTracks');
            localStorage.removeItem('playlists');
            localStorage.removeItem('favorites');
        } catch (error) {
            console.error('Failed to sync local data:', error);
        }
    }

    async loadUserTracks(userId) {
        try {
            const tracksQuery = query(
                collection(db, 'users', userId, 'tracks'),
                orderBy('createdAt', 'desc')
            );

            const playlistsQuery = query(
                collection(db, 'users', userId, 'playlists'),
                orderBy('createdAt', 'desc')
            );

            // Set up real-time listeners
            onSnapshot(tracksQuery, (snapshot) => {
                const tracks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                window.dispatchEvent(new CustomEvent('tracksUpdated', { detail: tracks }));
            });

            onSnapshot(playlistsQuery, (snapshot) => {
                const playlists = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                window.dispatchEvent(new CustomEvent('playlistsUpdated', { detail: playlists }));
            });
        } catch (error) {
            console.error('Failed to load user tracks:', error);
        }
    }

    updateUI(isAuthenticated) {
        const authElements = document.querySelectorAll('[data-auth="true"]');
        const noAuthElements = document.querySelectorAll('[data-auth="false"]');

        authElements.forEach(el => {
            el.style.display = isAuthenticated ? 'block' : 'none';
        });

        noAuthElements.forEach(el => {
            el.style.display = isAuthenticated ? 'none' : 'block';
        });

        if (isAuthenticated && this.currentUser) {
            // Update user info in UI
            const userNameElements = document.querySelectorAll('[data-user="name"]');
            const userEmailElements = document.querySelectorAll('[data-user="email"]');
            const userPhotoElements = document.querySelectorAll('[data-user="photo"]');

            userNameElements.forEach(el => {
                el.textContent = this.currentUser.displayName || 'User';
            });

            userEmailElements.forEach(el => {
                el.textContent = this.currentUser.email;
            });

            userPhotoElements.forEach(el => {
                if (this.currentUser.photoURL) {
                    el.src = this.currentUser.photoURL;
                } else {
                    el.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.displayName || 'User')}&background=00d4ff&color=fff`;
                }
            });
        }
    }

    isAuthenticated() {
        return !!this.currentUser;
    }

    getUser() {
        return this.currentUser;
    }
}

// Initialize Auth Manager
const authManager = new AuthManager();

// Export for global use
window.authManager = authManager;
window.auth = auth;
window.db = db;

export { authManager, auth, db };