// Personalized Music Recommendations System
class MusicRecommendationEngine {
    constructor() {
        this.userProfile = null;
        this.trackHistory = [];
        this.genreWeights = {};
        this.stylePreferences = {};
        this.timeBasedPatterns = {};
        this.init();
    }

    async init() {
        // Load user data and track history
        await this.loadUserProfile();
        this.analyzeUserPreferences();
        this.trackUserBehavior();
    }

    async loadUserProfile() {
        try {
            if (window.authManager && window.authManager.currentUser) {
                this.userProfile = await window.authManager.getUserData();
                await this.loadTrackHistory();
            }
        } catch (error) {
            console.error('Failed to load user profile for recommendations:', error);
        }
    }

    async loadTrackHistory() {
        if (!window.authManager?.currentUser) return;

        try {
            const { db } = await import('./firebase-config.js');
            const { collection, query, orderBy, limit, getDocs } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            const tracksQuery = query(
                collection(db, 'users', window.authManager.currentUser.uid, 'tracks'),
                orderBy('createdAt', 'desc'),
                limit(100)
            );

            const querySnapshot = await getDocs(tracksQuery);
            this.trackHistory = querySnapshot.docs.map(doc => doc.data());
        } catch (error) {
            console.error('Failed to load track history:', error);
        }
    }

    analyzeUserPreferences() {
        if (!this.trackHistory.length) return;

        // Analyze genre preferences
        this.trackHistory.forEach(track => {
            if (track.genre) {
                this.genreWeights[track.genre] = (this.genreWeights[track.genre] || 0) + 1;
            }

            // Analyze time patterns
            const hour = new Date(track.createdAt).getHours();
            const timeSlot = this.getTimeSlot(hour);
            if (track.genre) {
                if (!this.timeBasedPatterns[timeSlot]) {
                    this.timeBasedPatterns[timeSlot] = {};
                }
                this.timeBasedPatterns[timeSlot][track.genre] = 
                    (this.timeBasedPatterns[timeSlot][track.genre] || 0) + 1;
            }

            // Analyze style preferences from prompts
            if (track.prompt) {
                this.analyzePromptPatterns(track.prompt, track.genre);
            }
        });

        // Normalize weights
        this.normalizeWeights();
    }

    getTimeSlot(hour) {
        if (hour >= 6 && hour < 12) return 'morning';
        if (hour >= 12 && hour < 18) return 'afternoon';
        if (hour >= 18 && hour < 22) return 'evening';
        return 'night';
    }

    analyzePromptPatterns(prompt, genre) {
        const keywords = prompt.toLowerCase().split(/\s+/);
        const styleKeywords = [
            'chill', 'relaxing', 'upbeat', 'energetic', 'calm', 'peaceful',
            'dramatic', 'intense', 'soft', 'hard', 'melodic', 'rhythmic',
            'atmospheric', 'minimal', 'complex', 'simple', 'dark', 'bright',
            'fast', 'slow', 'heavy', 'light', 'emotional', 'fun'
        ];

        keywords.forEach(keyword => {
            if (styleKeywords.includes(keyword)) {
                if (!this.stylePreferences[keyword]) {
                    this.stylePreferences[keyword] = {};
                }
                this.stylePreferences[keyword][genre] = 
                    (this.stylePreferences[keyword][genre] || 0) + 1;
            }
        });
    }

    normalizeWeights() {
        const totalTracks = this.trackHistory.length;
        
        // Normalize genre weights
        Object.keys(this.genreWeights).forEach(genre => {
            this.genreWeights[genre] = this.genreWeights[genre] / totalTracks;
        });
    }

    trackUserBehavior() {
        // Track play behavior
        window.addEventListener('trackPlayed', (event) => {
            this.recordUserAction('play', event.detail.track);
        });

        // Track like/favorite behavior
        window.addEventListener('trackFavorited', (event) => {
            this.recordUserAction('favorite', event.detail.track);
        });

        // Track remix behavior
        window.addEventListener('trackRemixed', (event) => {
            this.recordUserAction('remix', event.detail.track);
        });
    }

    async recordUserAction(action, track) {
        try {
            if (!window.authManager?.currentUser) return;

            const { db } = await import('./firebase-config.js');
            const { collection, addDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');

            await addDoc(collection(db, 'users', window.authManager.currentUser.uid, 'activity'), {
                action,
                trackId: track.id,
                genre: track.genre,
                timestamp: new Date().toISOString(),
                prompt: track.prompt
            });

            // Update real-time preferences
            this.updateRealtimePreferences(action, track);
        } catch (error) {
            console.error('Failed to record user action:', error);
        }
    }

    updateRealtimePreferences(action, track) {
        const weight = action === 'favorite' ? 2 : action === 'play' ? 1 : 1.5;
        
        if (track.genre) {
            this.genreWeights[track.genre] = 
                (this.genreWeights[track.genre] || 0) + (weight * 0.1);
        }
    }

    getRecommendations(type = 'general', count = 5) {
        const currentHour = new Date().getHours();
        const timeSlot = this.getTimeSlot(currentHour);

        switch (type) {
            case 'genres':
                return this.getGenreRecommendations(count);
            case 'prompts':
                return this.getPromptRecommendations(count);
            case 'timeBasedGenres':
                return this.getTimeBasedRecommendations(timeSlot, count);
            case 'styles':
                return this.getStyleRecommendations(count);
            default:
                return this.getGeneralRecommendations(count);
        }
    }

    getGenreRecommendations(count = 3) {
        const sortedGenres = Object.entries(this.genreWeights)
            .sort(([,a], [,b]) => b - a)
            .slice(0, count)
            .map(([genre]) => genre);

        // Include some variety
        const allGenres = [
            'electronic', 'hip-hop', 'rock', 'pop', 'jazz', 'classical',
            'ambient', 'folk', 'reggae', 'country', 'latin', 'arabic',
            'indian', 'african', 'lo-fi', 'synthwave'
        ];

        const recommendations = [...sortedGenres];
        
        // Add some discovery genres
        const unexplored = allGenres.filter(genre => !this.genreWeights[genre]);
        recommendations.push(...unexplored.slice(0, Math.max(1, count - sortedGenres.length)));

        return recommendations.slice(0, count);
    }

    getPromptRecommendations(count = 5) {
        const recommendations = [];
        const preferredGenres = this.getGenreRecommendations(3);
        const currentTimeSlot = this.getTimeSlot(new Date().getHours());

        // Time-based prompts
        const timePrompts = {
            morning: [
                'uplifting morning {genre} to start the day',
                'energetic {genre} for motivation',
                'peaceful {genre} for morning meditation'
            ],
            afternoon: [
                'productive {genre} for work focus',
                'upbeat {genre} for afternoon energy',
                'melodic {genre} background music'
            ],
            evening: [
                'relaxing {genre} for unwinding',
                'atmospheric {genre} for dinner',
                'mellow {genre} for evening calm'
            ],
            night: [
                'chill {genre} for late night vibes',
                'ambient {genre} for relaxation',
                'soft {genre} for winding down'
            ]
        };

        // Generate personalized prompts
        preferredGenres.forEach(genre => {
            const templates = timePrompts[currentTimeSlot] || timePrompts.evening;
            const template = templates[Math.floor(Math.random() * templates.length)];
            recommendations.push(template.replace('{genre}', genre));
        });

        // Add style-based recommendations
        const topStyles = Object.keys(this.stylePreferences)
            .sort((a, b) => {
                const aTotal = Object.values(this.stylePreferences[a]).reduce((sum, val) => sum + val, 0);
                const bTotal = Object.values(this.stylePreferences[b]).reduce((sum, val) => sum + val, 0);
                return bTotal - aTotal;
            })
            .slice(0, 2);

        topStyles.forEach(style => {
            const genre = preferredGenres[0] || 'electronic';
            recommendations.push(`${style} ${genre} with modern production`);
        });

        return recommendations.slice(0, count);
    }

    getTimeBasedRecommendations(timeSlot, count = 3) {
        const timePreferences = this.timeBasedPatterns[timeSlot] || {};
        const sortedGenres = Object.entries(timePreferences)
            .sort(([,a], [,b]) => b - a)
            .slice(0, count)
            .map(([genre]) => genre);

        return sortedGenres;
    }

    getStyleRecommendations(count = 3) {
        const styleScores = {};
        
        Object.entries(this.stylePreferences).forEach(([style, genres]) => {
            styleScores[style] = Object.values(genres).reduce((sum, val) => sum + val, 0);
        });

        return Object.entries(styleScores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, count)
            .map(([style]) => style);
    }

    getGeneralRecommendations(count = 5) {
        return {
            genres: this.getGenreRecommendations(3),
            prompts: this.getPromptRecommendations(3),
            styles: this.getStyleRecommendations(2)
        };
    }

    // Get recommendations for similar users (collaborative filtering)
    async getSimilarUserRecommendations() {
        try {
            if (!window.authManager?.currentUser) return [];

            // This would require a more complex backend implementation
            // For now, return genre-based recommendations
            return this.getGenreRecommendations(5);
        } catch (error) {
            console.error('Failed to get similar user recommendations:', error);
            return [];
        }
    }

    // Export user preferences for debugging
    exportPreferences() {
        return {
            genreWeights: this.genreWeights,
            stylePreferences: this.stylePreferences,
            timeBasedPatterns: this.timeBasedPatterns,
            trackCount: this.trackHistory.length
        };
    }
}

// Initialize recommendation engine
const recommendationEngine = new MusicRecommendationEngine();

// Export for global use
window.recommendationEngine = recommendationEngine;

export { MusicRecommendationEngine, recommendationEngine };