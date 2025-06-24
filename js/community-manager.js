// Community Manager - Handles fetching and displaying community tracks from Firebase
import { auth, db, isFirebaseConfigured } from './firebase-config-safe.js';

class CommunityManager {
    constructor() {
        this.tracks = [];
        this.isLoading = false;
        this.lastDoc = null;
        this.pageSize = 20;
    }

    async loadCommunityTracks(filter = 'all', query = '') {
        if (!isFirebaseConfigured) {
            console.log('Firebase not configured, showing demo tracks');
            return this.generateDemoTracks();
        }

        this.isLoading = true;

        try {
            const { collection, query: firestoreQuery, where, orderBy, limit, getDocs, startAfter } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Build query based on filter
            let q;
            const tracksRef = collection(db, 'tracks');
            
            switch(filter) {
                case 'trending':
                    // Order by plays count descending
                    q = firestoreQuery(tracksRef, orderBy('plays', 'desc'), limit(this.pageSize));
                    break;
                case 'recent':
                    // Order by creation date descending
                    q = firestoreQuery(tracksRef, orderBy('createdAt', 'desc'), limit(this.pageSize));
                    break;
                case 'top-rated':
                    // Order by likes/rating descending
                    q = firestoreQuery(tracksRef, orderBy('likes', 'desc'), limit(this.pageSize));
                    break;
                case 'electronic':
                case 'pop':
                case 'rock':
                case 'hiphop':
                case 'jazz':
                    // Filter by genre
                    const genreMap = { 'hiphop': 'Hip Hop' };
                    const genreName = genreMap[filter] || filter.charAt(0).toUpperCase() + filter.slice(1);
                    q = firestoreQuery(tracksRef, where('genre', '==', genreName), orderBy('createdAt', 'desc'), limit(this.pageSize));
                    break;
                default:
                    // All tracks, ordered by creation date
                    q = firestoreQuery(tracksRef, orderBy('createdAt', 'desc'), limit(this.pageSize));
            }

            // Add pagination if loading more
            if (this.lastDoc) {
                q = firestoreQuery(q, startAfter(this.lastDoc));
            }
            
            const querySnapshot = await getDocs(q);
            const newTracks = [];
            
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                newTracks.push({
                    id: doc.id,
                    ...data,
                    duration: data.duration || 180,
                    plays: data.plays || Math.floor(Math.random() * 10000),
                    likes: data.likes || Math.floor(Math.random() * 1000),
                    rating: data.rating || (Math.random() * 2 + 3).toFixed(1),
                    trending: data.plays > 5000, // Mark as trending if > 5k plays
                    artist: data.artist || 'Community Artist'
                });
            });

            // Update last document for pagination
            if (querySnapshot.docs.length > 0) {
                this.lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];
            }

            // If first page, replace tracks; otherwise append
            if (!this.lastDoc || querySnapshot.docs.length === this.pageSize) {
                this.tracks = this.lastDoc ? [...this.tracks, ...newTracks] : newTracks;
            } else {
                this.tracks = newTracks;
            }

            // If we have search query, filter results
            if (query) {
                const lowerQuery = query.toLowerCase();
                this.tracks = this.tracks.filter(track => 
                    track.title.toLowerCase().includes(lowerQuery) ||
                    track.artist.toLowerCase().includes(lowerQuery) ||
                    track.genre.toLowerCase().includes(lowerQuery) ||
                    (track.prompt && track.prompt.toLowerCase().includes(lowerQuery))
                );
            }

            return this.tracks;
        } catch (error) {
            console.error('Error loading community tracks:', error);
            // Fallback to demo tracks
            return this.generateDemoTracks();
        } finally {
            this.isLoading = false;
        }
    }

    generateDemoTracks() {
        const genres = ['Electronic', 'Pop', 'Rock', 'Hip Hop', 'Jazz', 'Classical', 'Indie', 'R&B'];
        const adjectives = ['Dreamy', 'Epic', 'Chill', 'Energetic', 'Melodic', 'Dark', 'Uplifting', 'Ambient'];
        const nouns = ['Nights', 'Dreams', 'Journey', 'Vibes', 'Beats', 'Soul', 'Heart', 'Mind'];
        
        const tracks = [];
        
        for (let i = 0; i < 20; i++) {
            const genre = genres[Math.floor(Math.random() * genres.length)];
            const title = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
            const plays = Math.floor(Math.random() * 50000);
            
            tracks.push({
                id: `demo-${Date.now()}-${i}`,
                title,
                artist: `Artist ${Math.floor(Math.random() * 100)}`,
                genre,
                duration: 180 + Math.floor(Math.random() * 120),
                plays,
                likes: Math.floor(plays * 0.1),
                rating: (Math.random() * 2 + 3).toFixed(1),
                trending: plays > 10000,
                createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                isDemo: true
            });
        }
        
        this.tracks = tracks;
        return tracks;
    }

    async loadMore() {
        if (this.isLoading || !this.lastDoc) return [];
        
        return await this.loadCommunityTracks();
    }

    getTrendingTracks(limit = 6) {
        return this.tracks
            .filter(track => track.trending)
            .sort((a, b) => b.plays - a.plays)
            .slice(0, limit);
    }

    getTracksByGenre(genre, limit = 4) {
        return this.tracks
            .filter(track => track.genre === genre)
            .sort((a, b) => b.plays - a.plays)
            .slice(0, limit);
    }

    async likeTrack(trackId) {
        if (!isFirebaseConfigured || !auth?.currentUser) {
            alert('Please sign in to like tracks');
            return false;
        }

        try {
            const { doc, updateDoc, increment } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Update likes count in Firestore
            await updateDoc(doc(db, 'tracks', trackId), {
                likes: increment(1)
            });
            
            // Update local state
            const track = this.tracks.find(t => t.id === trackId);
            if (track) {
                track.likes++;
            }
            
            return true;
        } catch (error) {
            console.error('Error liking track:', error);
            return false;
        }
    }

    async incrementPlayCount(trackId) {
        if (!isFirebaseConfigured || trackId.startsWith('demo-')) return;

        try {
            const { doc, updateDoc, increment } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Update play count in Firestore
            await updateDoc(doc(db, 'tracks', trackId), {
                plays: increment(1)
            });
            
            // Update local state
            const track = this.tracks.find(t => t.id === trackId);
            if (track) {
                track.plays++;
            }
        } catch (error) {
            console.error('Error updating play count:', error);
        }
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    formatDuration(seconds) {
        if (!seconds || isNaN(seconds)) return '3:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    getGradientForTrack(index) {
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
}

// Create global instance
window.communityManager = new CommunityManager();

// Export for module usage
export default CommunityManager;