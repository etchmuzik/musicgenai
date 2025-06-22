// Social Features and Sharing System
class SocialFeatures {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.socialData = this.loadSocialData();
        this.callbacks = {};
        
        // Social interaction types
        this.interactionTypes = {
            LIKE: 'like',
            SHARE: 'share',
            COMMENT: 'comment',
            FOLLOW: 'follow',
            REMIX: 'remix',
            COLLABORATE: 'collaborate'
        };
        
        // Sharing platforms
        this.platforms = {
            twitter: {
                name: 'Twitter',
                icon: '🐦',
                baseUrl: 'https://twitter.com/intent/tweet',
                params: (text, url) => `?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
            },
            facebook: {
                name: 'Facebook',
                icon: '📘',
                baseUrl: 'https://www.facebook.com/sharer/sharer.php',
                params: (text, url) => `?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
            },
            linkedin: {
                name: 'LinkedIn',
                icon: '💼',
                baseUrl: 'https://www.linkedin.com/sharing/share-offsite/',
                params: (text, url) => `?url=${encodeURIComponent(url)}`
            },
            whatsapp: {
                name: 'WhatsApp',
                icon: '💬',
                baseUrl: 'https://wa.me/',
                params: (text, url) => `?text=${encodeURIComponent(text + ' ' + url)}`
            },
            telegram: {
                name: 'Telegram',
                icon: '✈️',
                baseUrl: 'https://t.me/share/url',
                params: (text, url) => `?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`
            }
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize social data
            this.loadUserProfile();
            
            // Set up event listeners
            this.setupSocialEventListeners();
            
            this.isInitialized = true;
            console.log('Social Features initialized');
            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize Social Features:', error);
        }
    }
    
    loadSocialData() {
        const defaultData = {
            userProfile: {
                displayName: 'Music Creator',
                bio: '',
                avatar: '',
                followers: 0,
                following: 0,
                tracksShared: 0,
                totalLikes: 0,
                totalShares: 0,
                joinDate: new Date().toISOString()
            },
            connections: {
                followers: [],
                following: [],
                blockedUsers: []
            },
            sharedTracks: [],
            interactions: [],
            socialStats: {
                totalInteractions: 0,
                likesGiven: 0,
                sharesGiven: 0,
                commentsGiven: 0
            },
            privacy: {
                profilePublic: true,
                tracksPublic: true,
                allowComments: true,
                allowRemixes: true,
                allowCollaborations: true
            }
        };
        
        const saved = localStorage.getItem('musicgen_social_data');
        return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
    }
    
    saveSocialData() {
        localStorage.setItem('musicgen_social_data', JSON.stringify(this.socialData));
    }
    
    loadUserProfile() {
        // In a real implementation, this would load from a backend
        this.currentUser = this.socialData.userProfile;
    }
    
    // Track sharing and social interactions
    shareTrack(trackData, platforms = [], customMessage = '') {
        const shareId = this.generateShareId();
        const timestamp = new Date().toISOString();
        
        const shareData = {
            id: shareId,
            trackId: trackData.id,
            trackTitle: trackData.title,
            trackUrl: trackData.url || this.generateTrackUrl(trackData.id),
            platforms: platforms,
            customMessage: customMessage,
            timestamp: timestamp,
            interactions: {
                views: 0,
                likes: 0,
                shares: 0,
                comments: []
            }
        };
        
        // Add to shared tracks
        this.socialData.sharedTracks.push(shareData);
        this.socialData.userProfile.tracksShared++;
        
        // Generate share content
        const shareContent = this.generateShareContent(trackData, customMessage);
        
        // Track social interaction
        this.recordInteraction(this.interactionTypes.SHARE, {
            shareId: shareId,
            trackId: trackData.id,
            platforms: platforms
        });
        
        // Save data
        this.saveSocialData();
        
        // Emit share event
        this.emit('trackShared', {
            shareData,
            shareContent,
            platforms
        });
        
        // Open sharing windows if platforms specified
        if (platforms.length > 0) {
            this.openSharingWindows(shareContent, platforms);
        }
        
        return shareData;
    }
    
    generateShareContent(trackData, customMessage = '') {
        const baseMessage = customMessage || this.getDefaultShareMessage(trackData);
        const trackUrl = trackData.url || this.generateTrackUrl(trackData.id);
        const hashtags = this.generateHashtags(trackData);
        
        return {
            text: `${baseMessage} ${hashtags}`,
            url: trackUrl,
            title: trackData.title,
            description: trackData.description || `Check out this amazing track created with MusicGen AI!`,
            image: trackData.artwork || this.getDefaultArtwork()
        };
    }
    
    getDefaultShareMessage(trackData) {
        const messages = [
            `🎵 Just created "${trackData.title}" with AI! Listen to this amazing track:`,
            `🔥 Fresh beats alert! Check out my new AI-generated track "${trackData.title}":`,
            `🎶 Music magic happening! Created "${trackData.title}" using AI:`,
            `✨ AI-powered creativity in action! My latest track "${trackData.title}":`,
            `🎼 Composed with artificial intelligence! "${trackData.title}" is ready:`
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }
    
    generateHashtags(trackData) {
        const hashtags = ['#MusicGenAI', '#AIMusic', '#MusicCreation'];
        
        if (trackData.genre) {
            hashtags.push(`#${trackData.genre.replace(/\s+/g, '')}`);
        }
        
        if (trackData.mood) {
            hashtags.push(`#${trackData.mood}Music`);
        }
        
        return hashtags.join(' ');
    }
    
    generateTrackUrl(trackId) {
        return `https://musicgenai.app/track/${trackId}`;
    }
    
    getDefaultArtwork() {
        return 'https://musicgenai.app/assets/default-track-artwork.png';
    }
    
    openSharingWindows(shareContent, platforms) {
        platforms.forEach(platformKey => {
            const platform = this.platforms[platformKey];
            if (platform) {
                const shareUrl = platform.baseUrl + platform.params(shareContent.text, shareContent.url);
                this.openShareWindow(shareUrl, platform.name);
            }
        });
    }
    
    openShareWindow(url, platformName) {
        const width = 600;
        const height = 400;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        
        window.open(
            url,
            `share-${platformName}`,
            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes`
        );
    }
    
    // Track interactions (likes, comments, etc.)
    recordInteraction(type, data) {
        const interaction = {
            id: this.generateInteractionId(),
            type: type,
            data: data,
            timestamp: new Date().toISOString(),
            userId: this.currentUser?.id || 'anonymous'
        };
        
        this.socialData.interactions.push(interaction);
        this.socialData.socialStats.totalInteractions++;
        
        // Update specific stats
        switch (type) {
            case this.interactionTypes.LIKE:
                this.socialData.socialStats.likesGiven++;
                break;
            case this.interactionTypes.SHARE:
                this.socialData.socialStats.sharesGiven++;
                break;
            case this.interactionTypes.COMMENT:
                this.socialData.socialStats.commentsGiven++;
                break;
        }
        
        this.saveSocialData();
        this.emit('interactionRecorded', interaction);
        
        return interaction;
    }
    
    likeTrack(trackId, trackOwnerId = null) {
        const likeData = {
            trackId: trackId,
            trackOwnerId: trackOwnerId,
            action: 'like'
        };
        
        return this.recordInteraction(this.interactionTypes.LIKE, likeData);
    }
    
    unlikeTrack(trackId) {
        // Remove like interaction
        this.socialData.interactions = this.socialData.interactions.filter(
            interaction => !(interaction.type === this.interactionTypes.LIKE && 
                           interaction.data.trackId === trackId)
        );
        
        this.socialData.socialStats.likesGiven = Math.max(0, this.socialData.socialStats.likesGiven - 1);
        this.socialData.socialStats.totalInteractions = Math.max(0, this.socialData.socialStats.totalInteractions - 1);
        
        this.saveSocialData();
        this.emit('trackUnliked', { trackId });
    }
    
    commentOnTrack(trackId, comment, trackOwnerId = null) {
        const commentData = {
            trackId: trackId,
            trackOwnerId: trackOwnerId,
            comment: comment,
            timestamp: new Date().toISOString()
        };
        
        return this.recordInteraction(this.interactionTypes.COMMENT, commentData);
    }
    
    // Follow/unfollow functionality
    followUser(userId, userProfile) {
        if (!this.socialData.connections.following.includes(userId)) {
            this.socialData.connections.following.push(userId);
            this.socialData.userProfile.following++;
            
            this.recordInteraction(this.interactionTypes.FOLLOW, {
                userId: userId,
                userProfile: userProfile,
                action: 'follow'
            });
            
            this.saveSocialData();
            this.emit('userFollowed', { userId, userProfile });
        }
    }
    
    unfollowUser(userId) {
        const index = this.socialData.connections.following.indexOf(userId);
        if (index > -1) {
            this.socialData.connections.following.splice(index, 1);
            this.socialData.userProfile.following = Math.max(0, this.socialData.userProfile.following - 1);
            
            this.saveSocialData();
            this.emit('userUnfollowed', { userId });
        }
    }
    
    blockUser(userId) {
        if (!this.socialData.connections.blockedUsers.includes(userId)) {
            this.socialData.connections.blockedUsers.push(userId);
            
            // Remove from following if currently following
            this.unfollowUser(userId);
            
            this.saveSocialData();
            this.emit('userBlocked', { userId });
        }
    }
    
    unblockUser(userId) {
        const index = this.socialData.connections.blockedUsers.indexOf(userId);
        if (index > -1) {
            this.socialData.connections.blockedUsers.splice(index, 1);
            this.saveSocialData();
            this.emit('userUnblocked', { userId });
        }
    }
    
    // Social feed and discovery
    generateSocialFeed(limit = 20) {
        // In a real implementation, this would fetch from backend
        // For now, generate mock social feed data
        const feedItems = [];
        
        // Add user's own shared tracks
        const userTracks = this.socialData.sharedTracks
            .slice(-5)
            .map(track => ({
                id: track.id,
                type: 'track_share',
                user: this.socialData.userProfile,
                track: track,
                timestamp: track.timestamp,
                interactions: track.interactions
            }));
        
        feedItems.push(...userTracks);
        
        // Add mock community content
        const mockCommunityContent = this.generateMockFeedContent(limit - userTracks.length);
        feedItems.push(...mockCommunityContent);
        
        // Sort by timestamp
        return feedItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }
    
    generateMockFeedContent(count) {
        const mockUsers = [
            { name: 'BeatMaster92', avatar: '🎧', followers: 1234 },
            { name: 'MelodyMaker', avatar: '🎹', followers: 856 },
            { name: 'SynthWave2024', avatar: '🌊', followers: 2341 },
            { name: 'RhythmRider', avatar: '🥁', followers: 445 },
            { name: 'HarmonyHero', avatar: '🎵', followers: 1876 }
        ];
        
        const mockTracks = [
            { title: 'Midnight Dreams', genre: 'ambient', likes: 45, comments: 12 },
            { title: 'Electric Pulse', genre: 'electronic', likes: 78, comments: 23 },
            { title: 'Jazz Fusion', genre: 'jazz', likes: 34, comments: 8 },
            { title: 'Rock Anthem', genre: 'rock', likes: 102, comments: 31 },
            { title: 'Classical Remix', genre: 'classical', likes: 67, comments: 15 }
        ];
        
        const feedItems = [];
        
        for (let i = 0; i < count; i++) {
            const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
            const track = mockTracks[Math.floor(Math.random() * mockTracks.length)];
            
            const item = {
                id: `feed_${Date.now()}_${i}`,
                type: 'track_share',
                user: user,
                track: {
                    ...track,
                    id: `track_${Date.now()}_${i}`,
                    url: `https://musicgenai.app/track/demo_${i}`
                },
                timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
                interactions: {
                    views: Math.floor(Math.random() * 200) + 20,
                    likes: track.likes,
                    shares: Math.floor(Math.random() * 15) + 1,
                    comments: Array.from({ length: track.comments }, (_, j) => ({
                        id: `comment_${i}_${j}`,
                        user: mockUsers[Math.floor(Math.random() * mockUsers.length)].name,
                        text: this.generateMockComment(),
                        timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
                    }))
                }
            };
            
            feedItems.push(item);
        }
        
        return feedItems;
    }
    
    generateMockComment() {
        const comments = [
            "This is absolutely amazing! 🔥",
            "Love the vibe of this track! 💫",
            "How did you create this? Incredible work!",
            "This goes straight to my playlist! 🎵",
            "The production quality is stunning!",
            "Can't stop listening to this! 🎧",
            "This gives me chills every time! ❄️",
            "Perfect for my morning workout! 💪",
            "AI music is getting so good! 🤖",
            "This deserves more recognition! 👏"
        ];
        
        return comments[Math.floor(Math.random() * comments.length)];
    }
    
    // Collaboration features
    requestCollaboration(userId, trackId, message = '') {
        const collaborationRequest = {
            id: this.generateCollaborationId(),
            fromUser: this.currentUser.id,
            toUser: userId,
            trackId: trackId,
            message: message,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        
        this.recordInteraction(this.interactionTypes.COLLABORATE, collaborationRequest);
        this.emit('collaborationRequested', collaborationRequest);
        
        return collaborationRequest;
    }
    
    respondToCollaboration(collaborationId, response, message = '') {
        // In real implementation, this would update backend
        const collaborationResponse = {
            collaborationId: collaborationId,
            response: response, // 'accepted' or 'declined'
            message: message,
            timestamp: new Date().toISOString()
        };
        
        this.emit('collaborationResponse', collaborationResponse);
        return collaborationResponse;
    }
    
    // Remix functionality
    requestRemix(trackId, trackOwnerId, remixIdea = '') {
        const remixRequest = {
            id: this.generateRemixId(),
            originalTrackId: trackId,
            originalOwnerId: trackOwnerId,
            remixerUserId: this.currentUser.id,
            remixIdea: remixIdea,
            status: 'pending',
            timestamp: new Date().toISOString()
        };
        
        this.recordInteraction(this.interactionTypes.REMIX, remixRequest);
        this.emit('remixRequested', remixRequest);
        
        return remixRequest;
    }
    
    // Privacy and settings
    updatePrivacySettings(settings) {
        this.socialData.privacy = { ...this.socialData.privacy, ...settings };
        this.saveSocialData();
        this.emit('privacySettingsUpdated', this.socialData.privacy);
    }
    
    updateUserProfile(profileData) {
        this.socialData.userProfile = { ...this.socialData.userProfile, ...profileData };
        this.saveSocialData();
        this.emit('profileUpdated', this.socialData.userProfile);
    }
    
    // Analytics and insights
    getSocialAnalytics() {
        const analytics = {
            profile: {
                followers: this.socialData.userProfile.followers,
                following: this.socialData.userProfile.following,
                tracksShared: this.socialData.userProfile.tracksShared,
                totalLikes: this.socialData.userProfile.totalLikes,
                totalShares: this.socialData.userProfile.totalShares
            },
            engagement: {
                totalInteractions: this.socialData.socialStats.totalInteractions,
                likesGiven: this.socialData.socialStats.likesGiven,
                sharesGiven: this.socialData.socialStats.sharesGiven,
                commentsGiven: this.socialData.socialStats.commentsGiven,
                averageLikesPerTrack: this.calculateAverageLikesPerTrack(),
                engagementRate: this.calculateEngagementRate()
            },
            topTracks: this.getTopSharedTracks(),
            recentActivity: this.getRecentActivity(),
            growthMetrics: this.calculateGrowthMetrics()
        };
        
        return analytics;
    }
    
    calculateAverageLikesPerTrack() {
        if (this.socialData.sharedTracks.length === 0) return 0;
        const totalLikes = this.socialData.sharedTracks.reduce((sum, track) => sum + track.interactions.likes, 0);
        return Math.round(totalLikes / this.socialData.sharedTracks.length);
    }
    
    calculateEngagementRate() {
        const totalTracks = this.socialData.sharedTracks.length;
        if (totalTracks === 0) return 0;
        
        const totalEngagements = this.socialData.sharedTracks.reduce((sum, track) => 
            sum + track.interactions.likes + track.interactions.shares + track.interactions.comments.length, 0);
        const totalViews = this.socialData.sharedTracks.reduce((sum, track) => sum + track.interactions.views, 0);
        
        return totalViews > 0 ? Math.round((totalEngagements / totalViews) * 100) : 0;
    }
    
    getTopSharedTracks(limit = 5) {
        return this.socialData.sharedTracks
            .sort((a, b) => (b.interactions.likes + b.interactions.shares) - (a.interactions.likes + a.interactions.shares))
            .slice(0, limit)
            .map(track => ({
                title: track.trackTitle,
                likes: track.interactions.likes,
                shares: track.interactions.shares,
                views: track.interactions.views,
                totalEngagement: track.interactions.likes + track.interactions.shares + track.interactions.comments.length
            }));
    }
    
    getRecentActivity(limit = 10) {
        return this.socialData.interactions
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit)
            .map(interaction => ({
                type: interaction.type,
                timestamp: interaction.timestamp,
                data: interaction.data
            }));
    }
    
    calculateGrowthMetrics() {
        // Simplified growth calculation - in real implementation would use historical data
        return {
            followersGrowth: '+5%', // Mock data
            engagementGrowth: '+12%', // Mock data
            tracksSharedGrowth: '+8%', // Mock data
            period: 'last 30 days'
        };
    }
    
    // Event listeners for social actions
    setupSocialEventListeners() {
        // Listen for track shares from other parts of the app
        document.addEventListener('musicgen:trackShared', (event) => {
            this.handleTrackSharedEvent(event.detail);
        });
        
        // Listen for track likes
        document.addEventListener('musicgen:trackLiked', (event) => {
            this.likeTrack(event.detail.trackId, event.detail.trackOwnerId);
        });
        
        // Listen for comments
        document.addEventListener('musicgen:trackCommented', (event) => {
            this.commentOnTrack(event.detail.trackId, event.detail.comment, event.detail.trackOwnerId);
        });
    }
    
    handleTrackSharedEvent(data) {
        this.shareTrack(data.track, data.platforms, data.message);
    }
    
    // Utility functions
    generateShareId() {
        return 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateInteractionId() {
        return 'interaction_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateCollaborationId() {
        return 'collab_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateRemixId() {
        return 'remix_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Public API methods
    getSocialData() {
        return { ...this.socialData };
    }
    
    getUserProfile() {
        return { ...this.socialData.userProfile };
    }
    
    getConnections() {
        return { ...this.socialData.connections };
    }
    
    getSharedTracks() {
        return [...this.socialData.sharedTracks];
    }
    
    getSocialStats() {
        return { ...this.socialData.socialStats };
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
    
    // Cleanup
    destroy() {
        this.saveSocialData();
        this.callbacks = {};
    }
}

export { SocialFeatures };