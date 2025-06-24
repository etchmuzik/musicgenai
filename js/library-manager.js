// Library Manager - Handles fetching and displaying real user tracks from Firebase
import { auth, db, isFirebaseConfigured } from './firebase-config-safe.js';

class LibraryManager {
    constructor() {
        this.tracks = [];
        this.isLoading = false;
        this.currentUser = null;
    }

    async loadUserTracks() {
        if (!isFirebaseConfigured || !auth?.currentUser) {
            console.log('Firebase not configured or user not authenticated');
            return this.loadLocalTracks();
        }

        this.isLoading = true;
        this.currentUser = auth.currentUser;

        try {
            const { collection, query, where, orderBy, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Query user's tracks from Firestore
            const tracksRef = collection(db, 'tracks');
            const q = query(
                tracksRef, 
                where('userId', '==', this.currentUser.uid),
                orderBy('createdAt', 'desc')
            );
            
            const querySnapshot = await getDocs(q);
            this.tracks = [];
            
            querySnapshot.forEach((doc) => {
                this.tracks.push({
                    id: doc.id,
                    ...doc.data(),
                    duration: this.formatDuration(doc.data().duration || 180) // Default 3 minutes if not set
                });
            });

            // Also check localStorage for any tracks not yet synced
            const localTracks = this.loadLocalTracks();
            
            // Merge local tracks that aren't in Firebase yet
            localTracks.forEach(localTrack => {
                if (!this.tracks.find(t => t.id === localTrack.id)) {
                    this.tracks.push({
                        ...localTrack,
                        isLocal: true,
                        needsSync: true
                    });
                }
            });

            return this.tracks;
        } catch (error) {
            console.error('Error loading tracks from Firebase:', error);
            // Fallback to local storage
            return this.loadLocalTracks();
        } finally {
            this.isLoading = false;
        }
    }

    loadLocalTracks() {
        // Load from localStorage as fallback
        const savedTracks = JSON.parse(localStorage.getItem('musicLibrary') || '[]');
        return savedTracks.map(track => ({
            ...track,
            duration: this.formatDuration(track.duration || 180),
            isLocal: true
        }));
    }

    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '3:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    async syncLocalTrack(track) {
        if (!isFirebaseConfigured || !auth?.currentUser) return false;

        try {
            const { collection, addDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const trackData = {
                ...track,
                userId: auth.currentUser.uid,
                createdAt: serverTimestamp(),
                syncedAt: serverTimestamp()
            };

            delete trackData.id; // Remove local ID
            delete trackData.isLocal;
            delete trackData.needsSync;

            const docRef = await addDoc(collection(db, 'tracks'), trackData);
            
            // Update local storage to mark as synced
            const localTracks = JSON.parse(localStorage.getItem('musicLibrary') || '[]');
            const trackIndex = localTracks.findIndex(t => t.id === track.id);
            if (trackIndex !== -1) {
                localTracks[trackIndex].firebaseId = docRef.id;
                localTracks[trackIndex].synced = true;
                localStorage.setItem('musicLibrary', JSON.stringify(localTracks));
            }

            return true;
        } catch (error) {
            console.error('Error syncing track to Firebase:', error);
            return false;
        }
    }

    async deleteTrack(trackId) {
        if (!isFirebaseConfigured || !auth?.currentUser) {
            // Delete from local storage only
            const localTracks = JSON.parse(localStorage.getItem('musicLibrary') || '[]');
            const filtered = localTracks.filter(t => t.id !== trackId);
            localStorage.setItem('musicLibrary', JSON.stringify(filtered));
            return true;
        }

        try {
            const { doc, deleteDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Delete from Firestore
            await deleteDoc(doc(db, 'tracks', trackId));
            
            // Also remove from local storage if exists
            const localTracks = JSON.parse(localStorage.getItem('musicLibrary') || '[]');
            const filtered = localTracks.filter(t => t.id !== trackId && t.firebaseId !== trackId);
            localStorage.setItem('musicLibrary', JSON.stringify(filtered));
            
            return true;
        } catch (error) {
            console.error('Error deleting track:', error);
            return false;
        }
    }

    getGradientForIndex(index) {
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
        ];
        return gradients[index % gradients.length];
    }

    renderEmptyState() {
        return `
            <div class="empty-library-state">
                <div class="empty-icon">
                    <i class="fas fa-music"></i>
                </div>
                <h2>Your Music Library is Empty</h2>
                <p>Start creating amazing AI-generated music to fill your library!</p>
                <a href="/create" class="btn btn-primary">
                    <i class="fas fa-plus"></i>
                    Create Your First Track
                </a>
            </div>
        `;
    }

    renderLoadingState() {
        return `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Loading your tracks...</p>
            </div>
        `;
    }

    renderTrackCard(track, index) {
        const gradient = track.image_url ? '' : this.getGradientForIndex(index);
        const coverStyle = track.image_url 
            ? `background-image: url(${track.image_url}); background-size: cover; background-position: center;`
            : `background: ${gradient};`;

        return `
            <div class="song-card ${track.isLocal ? 'local-track' : ''}" data-track-id="${track.id}" data-audio-url="${track.audio_url || ''}">
                <div class="song-cover" style="${coverStyle}">
                    <div class="play-overlay">
                        <button class="play-button" onclick="window.libraryManager.playTrack('${track.id}')">
                            <i class="fas fa-play"></i>
                        </button>
                    </div>
                    ${track.needsSync ? '<div class="sync-badge" title="Not synced to cloud"><i class="fas fa-cloud-upload-alt"></i></div>' : ''}
                </div>
                <div class="song-info">
                    <h3 class="song-title">${track.title || 'Untitled Track'}</h3>
                    <div class="song-meta">
                        <span class="song-genre">${track.genre || 'AI Generated'}</span>
                        <span class="song-duration">${track.duration}</span>
                    </div>
                    <div class="song-actions">
                        <button class="action-btn" onclick="window.libraryManager.downloadTrack('${track.id}')" title="Download">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="action-btn" onclick="window.libraryManager.shareTrack('${track.id}')" title="Share">
                            <i class="fas fa-share"></i>
                        </button>
                        <button class="action-btn delete" onclick="window.libraryManager.confirmDelete('${track.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    async renderLibrary(containerId = 'songsGrid') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Show loading state
        container.innerHTML = this.renderLoadingState();

        // Load tracks
        const tracks = await this.loadUserTracks();

        // Render tracks or empty state
        if (tracks.length === 0) {
            container.innerHTML = this.renderEmptyState();
        } else {
            container.innerHTML = tracks.map((track, index) => 
                this.renderTrackCard(track, index)
            ).join('');
        }

        // Sync any local tracks in the background
        this.syncLocalTracksInBackground();
    }

    async syncLocalTracksInBackground() {
        if (!isFirebaseConfigured || !auth?.currentUser) return;

        const localTracks = this.tracks.filter(t => t.needsSync);
        for (const track of localTracks) {
            await this.syncLocalTrack(track);
        }
    }

    playTrack(trackId) {
        const track = this.tracks.find(t => t.id === trackId);
        if (!track || !track.audio_url) {
            console.error('Track not found or no audio URL');
            return;
        }

        // Find track index for playlist
        const trackIndex = this.tracks.findIndex(t => t.id === trackId);
        
        // Use the audio player to play the track
        if (window.audioPlayer) {
            window.audioPlayer.setPlaylist(this.tracks, trackIndex);
        }
    }

    downloadTrack(trackId) {
        const track = this.tracks.find(t => t.id === trackId);
        if (!track || !track.audio_url) return;

        const a = document.createElement('a');
        a.href = track.audio_url;
        a.download = `${track.title || 'track'}.mp3`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    shareTrack(trackId) {
        const track = this.tracks.find(t => t.id === trackId);
        if (!track) return;

        const shareData = {
            title: track.title || 'AI Generated Music',
            text: `Check out this AI-generated track: ${track.title}`,
            url: window.location.origin + `/track/${trackId}`
        };

        if (navigator.share) {
            navigator.share(shareData).catch(console.error);
        } else {
            // Fallback - copy link to clipboard
            navigator.clipboard.writeText(shareData.url).then(() => {
                alert('Link copied to clipboard!');
            });
        }
    }

    confirmDelete(trackId) {
        if (confirm('Are you sure you want to delete this track? This action cannot be undone.')) {
            this.deleteTrack(trackId).then(success => {
                if (success) {
                    // Re-render the library
                    this.renderLibrary();
                }
            });
        }
    }
}

// Create global instance
window.libraryManager = new LibraryManager();

// Export for module usage
export default LibraryManager;