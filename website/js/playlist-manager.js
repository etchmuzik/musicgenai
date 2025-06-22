// Playlist Management System
class PlaylistManager {
    constructor() {
        this.playlists = this.loadPlaylists();
        this.currentPlaylist = null;
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.shuffle = false;
        this.repeat = 'none'; // none, one, all
        this.callbacks = {};
        
        // Audio player instance
        this.audioPlayer = new Audio();
        this.setupAudioHandlers();
        
        // Playlist templates
        this.templates = {
            workout: {
                name: 'Workout Mix',
                description: 'High-energy tracks to power your workout',
                icon: '💪',
                criteria: { energy: ['energetic', 'intense'], tempo: { min: 120 } }
            },
            focus: {
                name: 'Focus Flow',
                description: 'Ambient sounds for deep concentration',
                icon: '🧠',
                criteria: { energy: ['calm', 'relaxed'], genre: ['ambient', 'classical'] }
            },
            party: {
                name: 'Party Vibes',
                description: 'Dance floor favorites',
                icon: '🎉',
                criteria: { genre: ['dance_pop', 'house', 'trap'], energy: ['energetic'] }
            },
            chill: {
                name: 'Chill Sessions',
                description: 'Laid-back tunes for relaxation',
                icon: '😌',
                criteria: { mood: ['relaxed', 'neutral'], tempo: { max: 100 } }
            },
            discovery: {
                name: 'Discovery Weekly',
                description: 'Explore new sounds and genres',
                icon: '🔍',
                criteria: { recent: true, diverse: true }
            }
        };
        
        this.init();
    }
    
    init() {
        // Initialize smart playlists
        this.initializeSmartPlaylists();
        
        // Set up auto-save
        this.setupAutoSave();
        
        console.log('Playlist Manager initialized');
    }
    
    loadPlaylists() {
        const defaultPlaylists = {
            userPlaylists: [],
            smartPlaylists: [],
            recentlyPlayed: [],
            favorites: [],
            queue: []
        };
        
        const saved = localStorage.getItem('musicgen_playlists');
        return saved ? { ...defaultPlaylists, ...JSON.parse(saved) } : defaultPlaylists;
    }
    
    savePlaylists() {
        localStorage.setItem('musicgen_playlists', JSON.stringify(this.playlists));
        this.emit('playlistsUpdated', this.playlists);
    }
    
    setupAutoSave() {
        // Auto-save every minute if there are changes
        setInterval(() => {
            if (this.hasUnsavedChanges) {
                this.savePlaylists();
                this.hasUnsavedChanges = false;
            }
        }, 60000);
    }
    
    // Playlist CRUD operations
    createPlaylist(data) {
        const playlist = {
            id: this.generatePlaylistId(),
            name: data.name || 'New Playlist',
            description: data.description || '',
            cover: data.cover || this.generateDefaultCover(),
            tracks: data.tracks || [],
            isPublic: data.isPublic || false,
            collaborative: data.collaborative || false,
            tags: data.tags || [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: this.getCurrentUserId(),
            stats: {
                plays: 0,
                likes: 0,
                shares: 0,
                totalDuration: 0
            }
        };
        
        this.playlists.userPlaylists.push(playlist);
        this.hasUnsavedChanges = true;
        
        this.emit('playlistCreated', playlist);
        return playlist;
    }
    
    updatePlaylist(playlistId, updates) {
        const playlist = this.findPlaylist(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        Object.assign(playlist, updates, {
            updatedAt: new Date().toISOString()
        });
        
        // Recalculate stats if tracks changed
        if (updates.tracks) {
            playlist.stats.totalDuration = this.calculateTotalDuration(playlist.tracks);
        }
        
        this.hasUnsavedChanges = true;
        this.emit('playlistUpdated', playlist);
        return playlist;
    }
    
    deletePlaylist(playlistId) {
        const index = this.playlists.userPlaylists.findIndex(p => p.id === playlistId);
        if (index === -1) {
            throw new Error('Playlist not found');
        }
        
        const deleted = this.playlists.userPlaylists.splice(index, 1)[0];
        this.hasUnsavedChanges = true;
        
        this.emit('playlistDeleted', deleted);
        return deleted;
    }
    
    // Track management
    addTrackToPlaylist(playlistId, track, position = null) {
        const playlist = this.findPlaylist(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        const trackData = {
            id: track.id,
            title: track.title,
            artist: track.artist || 'Unknown Artist',
            duration: track.duration,
            url: track.url,
            cover: track.cover,
            genre: track.genre,
            addedAt: new Date().toISOString(),
            addedBy: this.getCurrentUserId()
        };
        
        if (position !== null && position >= 0 && position <= playlist.tracks.length) {
            playlist.tracks.splice(position, 0, trackData);
        } else {
            playlist.tracks.push(trackData);
        }
        
        playlist.stats.totalDuration += track.duration;
        playlist.updatedAt = new Date().toISOString();
        
        this.hasUnsavedChanges = true;
        this.emit('trackAdded', { playlist, track: trackData, position });
        
        return playlist;
    }
    
    removeTrackFromPlaylist(playlistId, trackId) {
        const playlist = this.findPlaylist(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        const trackIndex = playlist.tracks.findIndex(t => t.id === trackId);
        if (trackIndex === -1) {
            throw new Error('Track not found in playlist');
        }
        
        const removed = playlist.tracks.splice(trackIndex, 1)[0];
        playlist.stats.totalDuration -= removed.duration;
        playlist.updatedAt = new Date().toISOString();
        
        this.hasUnsavedChanges = true;
        this.emit('trackRemoved', { playlist, track: removed, index: trackIndex });
        
        return playlist;
    }
    
    reorderTracks(playlistId, fromIndex, toIndex) {
        const playlist = this.findPlaylist(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        if (fromIndex < 0 || fromIndex >= playlist.tracks.length ||
            toIndex < 0 || toIndex >= playlist.tracks.length) {
            throw new Error('Invalid track indices');
        }
        
        const [track] = playlist.tracks.splice(fromIndex, 1);
        playlist.tracks.splice(toIndex, 0, track);
        playlist.updatedAt = new Date().toISOString();
        
        this.hasUnsavedChanges = true;
        this.emit('tracksReordered', { playlist, fromIndex, toIndex });
        
        return playlist;
    }
    
    // Smart playlist functionality
    initializeSmartPlaylists() {
        Object.entries(this.templates).forEach(([key, template]) => {
            const existingIndex = this.playlists.smartPlaylists.findIndex(p => p.templateKey === key);
            
            const smartPlaylist = {
                id: `smart_${key}`,
                templateKey: key,
                name: template.name,
                description: template.description,
                icon: template.icon,
                criteria: template.criteria,
                tracks: [],
                autoUpdate: true,
                updatedAt: new Date().toISOString()
            };
            
            if (existingIndex >= 0) {
                this.playlists.smartPlaylists[existingIndex] = {
                    ...this.playlists.smartPlaylists[existingIndex],
                    ...smartPlaylist
                };
            } else {
                this.playlists.smartPlaylists.push(smartPlaylist);
            }
        });
        
        // Update smart playlists with current tracks
        this.updateSmartPlaylists();
    }
    
    updateSmartPlaylists() {
        const allTracks = this.getAllAvailableTracks();
        
        this.playlists.smartPlaylists.forEach(playlist => {
            if (!playlist.autoUpdate) return;
            
            const matchingTracks = allTracks.filter(track => 
                this.matchesCriteria(track, playlist.criteria)
            );
            
            playlist.tracks = this.sortAndLimitTracks(matchingTracks, playlist.criteria);
            playlist.updatedAt = new Date().toISOString();
        });
        
        this.hasUnsavedChanges = true;
    }
    
    matchesCriteria(track, criteria) {
        // Check energy criteria
        if (criteria.energy && !criteria.energy.includes(track.energy)) {
            return false;
        }
        
        // Check genre criteria
        if (criteria.genre && !criteria.genre.includes(track.genre)) {
            return false;
        }
        
        // Check mood criteria
        if (criteria.mood && !criteria.mood.includes(track.mood)) {
            return false;
        }
        
        // Check tempo criteria
        if (criteria.tempo) {
            if (criteria.tempo.min && track.tempo < criteria.tempo.min) return false;
            if (criteria.tempo.max && track.tempo > criteria.tempo.max) return false;
        }
        
        // Check recency
        if (criteria.recent) {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (new Date(track.createdAt) < weekAgo) return false;
        }
        
        return true;
    }
    
    sortAndLimitTracks(tracks, criteria) {
        let sorted = [...tracks];
        
        // Sort by relevance or recency
        if (criteria.recent) {
            sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } else {
            // Default sort by popularity/plays
            sorted.sort((a, b) => (b.plays || 0) - (a.plays || 0));
        }
        
        // Ensure diversity if requested
        if (criteria.diverse) {
            sorted = this.diversifyTracks(sorted);
        }
        
        // Limit to reasonable size
        return sorted.slice(0, 50);
    }
    
    diversifyTracks(tracks) {
        const genreGroups = {};
        tracks.forEach(track => {
            if (!genreGroups[track.genre]) {
                genreGroups[track.genre] = [];
            }
            genreGroups[track.genre].push(track);
        });
        
        // Take up to 3 tracks from each genre
        const diversified = [];
        Object.values(genreGroups).forEach(group => {
            diversified.push(...group.slice(0, 3));
        });
        
        return diversified;
    }
    
    // Playback functionality
    loadPlaylist(playlistId) {
        const playlist = this.findPlaylist(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        this.currentPlaylist = playlist;
        this.currentTrackIndex = 0;
        
        // Update stats
        playlist.stats.plays++;
        this.addToRecentlyPlayed(playlist);
        
        this.emit('playlistLoaded', playlist);
        return playlist;
    }
    
    play(trackIndex = null) {
        if (!this.currentPlaylist || this.currentPlaylist.tracks.length === 0) {
            throw new Error('No playlist loaded');
        }
        
        if (trackIndex !== null) {
            this.currentTrackIndex = trackIndex;
        }
        
        const track = this.getCurrentTrack();
        if (!track) {
            throw new Error('No track available');
        }
        
        this.audioPlayer.src = track.url;
        this.audioPlayer.play();
        this.isPlaying = true;
        
        this.emit('playbackStarted', { playlist: this.currentPlaylist, track, index: this.currentTrackIndex });
    }
    
    pause() {
        this.audioPlayer.pause();
        this.isPlaying = false;
        this.emit('playbackPaused');
    }
    
    next() {
        if (!this.currentPlaylist) return;
        
        let nextIndex;
        
        if (this.shuffle) {
            // Random track except current
            const availableIndices = Array.from({ length: this.currentPlaylist.tracks.length }, (_, i) => i)
                .filter(i => i !== this.currentTrackIndex);
            nextIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        } else {
            nextIndex = this.currentTrackIndex + 1;
            
            if (nextIndex >= this.currentPlaylist.tracks.length) {
                if (this.repeat === 'all') {
                    nextIndex = 0;
                } else {
                    this.emit('playlistEnded');
                    return;
                }
            }
        }
        
        this.play(nextIndex);
    }
    
    previous() {
        if (!this.currentPlaylist) return;
        
        // If more than 3 seconds into track, restart it
        if (this.audioPlayer.currentTime > 3) {
            this.audioPlayer.currentTime = 0;
            return;
        }
        
        let prevIndex = this.currentTrackIndex - 1;
        if (prevIndex < 0) {
            if (this.repeat === 'all') {
                prevIndex = this.currentPlaylist.tracks.length - 1;
            } else {
                prevIndex = 0;
            }
        }
        
        this.play(prevIndex);
    }
    
    seek(position) {
        if (this.audioPlayer.duration) {
            this.audioPlayer.currentTime = position * this.audioPlayer.duration;
        }
    }
    
    setVolume(volume) {
        this.audioPlayer.volume = Math.max(0, Math.min(1, volume));
    }
    
    toggleShuffle() {
        this.shuffle = !this.shuffle;
        this.emit('shuffleChanged', this.shuffle);
        return this.shuffle;
    }
    
    setRepeat(mode) {
        if (!['none', 'one', 'all'].includes(mode)) {
            throw new Error('Invalid repeat mode');
        }
        this.repeat = mode;
        this.emit('repeatChanged', this.repeat);
        return this.repeat;
    }
    
    // Audio event handlers
    setupAudioHandlers() {
        this.audioPlayer.addEventListener('ended', () => {
            if (this.repeat === 'one') {
                this.play(this.currentTrackIndex);
            } else {
                this.next();
            }
        });
        
        this.audioPlayer.addEventListener('timeupdate', () => {
            this.emit('timeUpdate', {
                currentTime: this.audioPlayer.currentTime,
                duration: this.audioPlayer.duration,
                progress: this.audioPlayer.currentTime / this.audioPlayer.duration
            });
        });
        
        this.audioPlayer.addEventListener('error', (error) => {
            console.error('Playback error:', error);
            this.emit('playbackError', error);
        });
    }
    
    // Queue management
    addToQueue(track, position = null) {
        const queueItem = {
            ...track,
            queuedAt: new Date().toISOString()
        };
        
        if (position !== null && position >= 0 && position <= this.playlists.queue.length) {
            this.playlists.queue.splice(position, 0, queueItem);
        } else {
            this.playlists.queue.push(queueItem);
        }
        
        this.hasUnsavedChanges = true;
        this.emit('queueUpdated', this.playlists.queue);
        return this.playlists.queue;
    }
    
    removeFromQueue(index) {
        if (index < 0 || index >= this.playlists.queue.length) {
            throw new Error('Invalid queue index');
        }
        
        const removed = this.playlists.queue.splice(index, 1)[0];
        this.hasUnsavedChanges = true;
        this.emit('queueUpdated', this.playlists.queue);
        return removed;
    }
    
    clearQueue() {
        this.playlists.queue = [];
        this.hasUnsavedChanges = true;
        this.emit('queueCleared');
    }
    
    playNext() {
        if (this.playlists.queue.length > 0) {
            const nextTrack = this.playlists.queue.shift();
            this.hasUnsavedChanges = true;
            
            // Create temporary playlist for queue
            const queuePlaylist = {
                id: 'queue',
                name: 'Queue',
                tracks: [nextTrack, ...this.playlists.queue]
            };
            
            this.currentPlaylist = queuePlaylist;
            this.currentTrackIndex = 0;
            this.play();
        } else {
            this.next();
        }
    }
    
    // Favorites management
    addToFavorites(track) {
        const exists = this.playlists.favorites.some(t => t.id === track.id);
        if (!exists) {
            this.playlists.favorites.push({
                ...track,
                favoritedAt: new Date().toISOString()
            });
            this.hasUnsavedChanges = true;
            this.emit('favoriteAdded', track);
        }
        return this.playlists.favorites;
    }
    
    removeFromFavorites(trackId) {
        const index = this.playlists.favorites.findIndex(t => t.id === trackId);
        if (index >= 0) {
            const removed = this.playlists.favorites.splice(index, 1)[0];
            this.hasUnsavedChanges = true;
            this.emit('favoriteRemoved', removed);
            return removed;
        }
        return null;
    }
    
    isFavorite(trackId) {
        return this.playlists.favorites.some(t => t.id === trackId);
    }
    
    // Recently played tracking
    addToRecentlyPlayed(item) {
        const recentItem = {
            ...item,
            playedAt: new Date().toISOString()
        };
        
        // Remove if already exists
        this.playlists.recentlyPlayed = this.playlists.recentlyPlayed.filter(
            i => i.id !== item.id
        );
        
        // Add to beginning
        this.playlists.recentlyPlayed.unshift(recentItem);
        
        // Keep only last 50
        this.playlists.recentlyPlayed = this.playlists.recentlyPlayed.slice(0, 50);
        
        this.hasUnsavedChanges = true;
    }
    
    // Collaborative features
    sharePlaylist(playlistId, shareOptions = {}) {
        const playlist = this.findPlaylist(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        const shareData = {
            playlistId: playlist.id,
            name: playlist.name,
            tracks: playlist.tracks.length,
            sharedBy: this.getCurrentUserId(),
            sharedAt: new Date().toISOString(),
            permissions: shareOptions.permissions || 'view',
            expiresAt: shareOptions.expiresAt || null
        };
        
        // Generate share link
        const shareLink = this.generateShareLink(shareData);
        
        playlist.stats.shares++;
        this.hasUnsavedChanges = true;
        
        this.emit('playlistShared', { playlist, shareLink, shareData });
        return shareLink;
    }
    
    importPlaylist(shareLink) {
        try {
            const shareData = this.parseShareLink(shareLink);
            
            // Fetch playlist data (would be from server in production)
            const importedPlaylist = this.createPlaylist({
                name: `${shareData.name} (Imported)`,
                description: `Imported from ${shareData.sharedBy}`,
                tracks: [], // Would fetch actual tracks
                tags: ['imported']
            });
            
            this.emit('playlistImported', importedPlaylist);
            return importedPlaylist;
            
        } catch (error) {
            throw new Error('Invalid share link');
        }
    }
    
    // Analytics
    getPlaylistAnalytics(playlistId) {
        const playlist = this.findPlaylist(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        return {
            basic: {
                totalTracks: playlist.tracks.length,
                totalDuration: playlist.stats.totalDuration,
                plays: playlist.stats.plays,
                likes: playlist.stats.likes,
                shares: playlist.stats.shares
            },
            genres: this.analyzeGenres(playlist.tracks),
            moods: this.analyzeMoods(playlist.tracks),
            tempos: this.analyzeTempos(playlist.tracks),
            engagement: this.calculateEngagement(playlist)
        };
    }
    
    analyzeGenres(tracks) {
        const genres = {};
        tracks.forEach(track => {
            genres[track.genre] = (genres[track.genre] || 0) + 1;
        });
        return genres;
    }
    
    analyzeMoods(tracks) {
        const moods = {};
        tracks.forEach(track => {
            if (track.mood) {
                moods[track.mood] = (moods[track.mood] || 0) + 1;
            }
        });
        return moods;
    }
    
    analyzeTempos(tracks) {
        const tempos = tracks.map(t => t.tempo).filter(Boolean);
        if (tempos.length === 0) return null;
        
        return {
            min: Math.min(...tempos),
            max: Math.max(...tempos),
            average: tempos.reduce((a, b) => a + b, 0) / tempos.length
        };
    }
    
    calculateEngagement(playlist) {
        const daysSinceCreation = (new Date() - new Date(playlist.createdAt)) / (1000 * 60 * 60 * 24);
        const playsPerDay = playlist.stats.plays / Math.max(1, daysSinceCreation);
        
        return {
            playsPerDay,
            engagement: (playlist.stats.likes + playlist.stats.shares) / Math.max(1, playlist.stats.plays),
            retention: playlist.tracks.length > 0 ? 1 - (playlist.stats.removedTracks || 0) / playlist.tracks.length : 0
        };
    }
    
    // Utility methods
    findPlaylist(playlistId) {
        return this.playlists.userPlaylists.find(p => p.id === playlistId) ||
               this.playlists.smartPlaylists.find(p => p.id === playlistId);
    }
    
    getAllAvailableTracks() {
        // In production, this would fetch from user's library
        const mockTracks = [];
        this.playlists.userPlaylists.forEach(playlist => {
            mockTracks.push(...playlist.tracks);
        });
        return mockTracks;
    }
    
    getCurrentTrack() {
        if (!this.currentPlaylist || this.currentTrackIndex >= this.currentPlaylist.tracks.length) {
            return null;
        }
        return this.currentPlaylist.tracks[this.currentTrackIndex];
    }
    
    calculateTotalDuration(tracks) {
        return tracks.reduce((total, track) => total + (track.duration || 0), 0);
    }
    
    generatePlaylistId() {
        return 'playlist_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateDefaultCover() {
        // Generate gradient-based cover
        const gradients = [
            'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)'
        ];
        return gradients[Math.floor(Math.random() * gradients.length)];
    }
    
    generateShareLink(shareData) {
        const encoded = btoa(JSON.stringify(shareData));
        return `https://musicgenai.app/playlist/import/${encoded}`;
    }
    
    parseShareLink(shareLink) {
        const match = shareLink.match(/\/playlist\/import\/(.+)$/);
        if (!match) throw new Error('Invalid share link format');
        
        return JSON.parse(atob(match[1]));
    }
    
    getCurrentUserId() {
        // In production, get from auth system
        return 'user_' + Date.now();
    }
    
    // Event system
    on(event, callback) {
        if (!this.callbacks[event]) {
            this.callbacks[event] = [];
        }
        this.callbacks[event].push(callback);
    }
    
    off(event, callback) {
        if (this.callbacks[event]) {
            this.callbacks[event] = this.callbacks[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, data) {
        if (this.callbacks[event]) {
            this.callbacks[event].forEach(callback => callback(data));
        }
    }
    
    // Public API
    getAllPlaylists() {
        return {
            user: this.playlists.userPlaylists,
            smart: this.playlists.smartPlaylists,
            recent: this.playlists.recentlyPlayed,
            favorites: this.playlists.favorites
        };
    }
    
    getQueue() {
        return this.playlists.queue;
    }
    
    getPlaybackState() {
        return {
            playlist: this.currentPlaylist,
            track: this.getCurrentTrack(),
            index: this.currentTrackIndex,
            isPlaying: this.isPlaying,
            shuffle: this.shuffle,
            repeat: this.repeat,
            currentTime: this.audioPlayer.currentTime,
            duration: this.audioPlayer.duration,
            volume: this.audioPlayer.volume
        };
    }
    
    exportPlaylist(playlistId, format = 'json') {
        const playlist = this.findPlaylist(playlistId);
        if (!playlist) {
            throw new Error('Playlist not found');
        }
        
        if (format === 'json') {
            return JSON.stringify(playlist, null, 2);
        } else if (format === 'm3u') {
            return this.convertToM3U(playlist);
        }
        
        throw new Error('Unsupported export format');
    }
    
    convertToM3U(playlist) {
        let m3u = '#EXTM3U\n';
        m3u += `#PLAYLIST:${playlist.name}\n`;
        
        playlist.tracks.forEach(track => {
            m3u += `#EXTINF:${track.duration},${track.artist} - ${track.title}\n`;
            m3u += `${track.url}\n`;
        });
        
        return m3u;
    }
}

export { PlaylistManager };