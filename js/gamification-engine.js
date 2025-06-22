// Gamification Engine for MusicGen AI
class GamificationEngine {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.userStats = {};
        this.achievements = new Map();
        this.challenges = new Map();
        this.leaderboards = new Map();
        this.callbacks = {};
        
        // Achievement categories and definitions
        this.achievementDefinitions = {
            creation: {
                'first_track': {
                    id: 'first_track',
                    title: 'First Steps',
                    description: 'Create your first music track',
                    icon: '🎵',
                    rarity: 'common',
                    points: 10,
                    requirement: { type: 'tracks_created', value: 1 }
                },
                'prolific_creator': {
                    id: 'prolific_creator',
                    title: 'Prolific Creator',
                    description: 'Create 50 music tracks',
                    icon: '🎼',
                    rarity: 'rare',
                    points: 500,
                    requirement: { type: 'tracks_created', value: 50 }
                },
                'music_master': {
                    id: 'music_master',
                    title: 'Music Master',
                    description: 'Create 200 music tracks',
                    icon: '👑',
                    rarity: 'legendary',
                    points: 2000,
                    requirement: { type: 'tracks_created', value: 200 }
                }
            },
            quality: {
                'quality_connoisseur': {
                    id: 'quality_connoisseur',
                    title: 'Quality Connoisseur',
                    description: 'Create 10 tracks with 4+ star ratings',
                    icon: '⭐',
                    rarity: 'uncommon',
                    points: 150,
                    requirement: { type: 'high_rated_tracks', value: 10 }
                },
                'perfectionist': {
                    id: 'perfectionist',
                    title: 'Perfectionist',
                    description: 'Create a track with 5-star rating',
                    icon: '💎',
                    rarity: 'rare',
                    points: 300,
                    requirement: { type: 'perfect_rating', value: 1 }
                }
            },
            exploration: {
                'genre_explorer': {
                    id: 'genre_explorer',
                    title: 'Genre Explorer',
                    description: 'Create tracks in 10 different genres',
                    icon: '🗺️',
                    rarity: 'uncommon',
                    points: 200,
                    requirement: { type: 'genres_explored', value: 10 }
                },
                'ai_experimenter': {
                    id: 'ai_experimenter',
                    title: 'AI Experimenter',
                    description: 'Use all AI features at least once',
                    icon: '🧪',
                    rarity: 'rare',
                    points: 250,
                    requirement: { type: 'ai_features_used', value: ['voice_to_music', 'style_transfer', 'auto_mastering', 'lyrics_generation'] }
                }
            },
            social: {
                'social_butterfly': {
                    id: 'social_butterfly',
                    title: 'Social Butterfly',
                    description: 'Share 25 tracks publicly',
                    icon: '🦋',
                    rarity: 'uncommon',
                    points: 125,
                    requirement: { type: 'tracks_shared', value: 25 }
                },
                'community_favorite': {
                    id: 'community_favorite',
                    title: 'Community Favorite',
                    description: 'Receive 100 likes on your tracks',
                    icon: '❤️',
                    rarity: 'rare',
                    points: 400,
                    requirement: { type: 'total_likes', value: 100 }
                }
            },
            streaks: {
                'dedicated_composer': {
                    id: 'dedicated_composer',
                    title: 'Dedicated Composer',
                    description: 'Create music for 7 days in a row',
                    icon: '🔥',
                    rarity: 'uncommon',
                    points: 100,
                    requirement: { type: 'daily_streak', value: 7 }
                },
                'music_marathon': {
                    id: 'music_marathon',
                    title: 'Music Marathon',
                    description: 'Maintain a 30-day creation streak',
                    icon: '🏃‍♂️',
                    rarity: 'epic',
                    points: 1000,
                    requirement: { type: 'daily_streak', value: 30 }
                },
                'unstoppable_force': {
                    id: 'unstoppable_force',
                    title: 'Unstoppable Force',
                    description: 'Maintain a 100-day creation streak',
                    icon: '⚡',
                    rarity: 'legendary',
                    points: 5000,
                    requirement: { type: 'daily_streak', value: 100 }
                }
            },
            challenges: {
                'speed_demon': {
                    id: 'speed_demon',
                    title: 'Speed Demon',
                    description: 'Complete a challenge in under 5 minutes',
                    icon: '💨',
                    rarity: 'rare',
                    points: 300,
                    requirement: { type: 'challenge_speed', value: 300 } // seconds
                },
                'challenge_master': {
                    id: 'challenge_master',
                    title: 'Challenge Master',
                    description: 'Complete 10 challenges',
                    icon: '🏆',
                    rarity: 'epic',
                    points: 750,
                    requirement: { type: 'challenges_completed', value: 10 }
                }
            }
        };
        
        // Challenge templates
        this.challengeTemplates = {
            daily: {
                'daily_creation': {
                    id: 'daily_creation',
                    title: 'Daily Creator',
                    description: 'Create any music track today',
                    type: 'daily',
                    duration: 24 * 60 * 60 * 1000, // 24 hours
                    reward: { points: 25, badge: '📅' },
                    requirement: { type: 'tracks_created', value: 1 }
                },
                'genre_focus': {
                    id: 'genre_focus',
                    title: 'Genre Focus',
                    description: 'Create a track in today\'s featured genre',
                    type: 'daily',
                    duration: 24 * 60 * 60 * 1000,
                    reward: { points: 35, badge: '🎯' },
                    requirement: { type: 'specific_genre', value: null } // Set dynamically
                }
            },
            weekly: {
                'ai_mastery': {
                    id: 'ai_mastery',
                    title: 'AI Mastery Week',
                    description: 'Use each AI feature at least once this week',
                    type: 'weekly',
                    duration: 7 * 24 * 60 * 60 * 1000, // 7 days
                    reward: { points: 200, badge: '🤖' },
                    requirement: { type: 'ai_features_used', value: ['voice_to_music', 'style_transfer', 'auto_mastering'] }
                },
                'collaboration_week': {
                    id: 'collaboration_week',
                    title: 'Collaboration Week',
                    description: 'Share and remix 5 tracks this week',
                    type: 'weekly',
                    duration: 7 * 24 * 60 * 60 * 1000,
                    reward: { points: 150, badge: '🤝' },
                    requirement: { type: 'social_actions', value: 5 }
                }
            },
            special: {
                'theme_contest': {
                    id: 'theme_contest',
                    title: 'Theme Contest',
                    description: 'Create music based on the monthly theme',
                    type: 'contest',
                    duration: 30 * 24 * 60 * 60 * 1000, // 30 days
                    reward: { points: 500, badge: '🏅', unlocks: ['exclusive_presets'] },
                    requirement: { type: 'theme_track', value: null } // Set dynamically
                }
            }
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Initialize user stats
            this.userStats = this.loadUserStats();
            
            // Load achievements
            this.loadAchievements();
            
            // Initialize leaderboards
            this.initializeLeaderboards();
            
            // Start daily challenge rotation
            this.startChallengeRotation();
            
            this.isInitialized = true;
            console.log('Gamification Engine initialized');
            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize Gamification Engine:', error);
        }
    }
    
    // User Stats Management
    loadUserStats() {
        const defaultStats = {
            level: 1,
            totalPoints: 0,
            tracksCreated: 0,
            challengesCompleted: 0,
            achievementsUnlocked: 0,
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
            genresExplored: new Set(),
            aiFeaturesUsed: new Set(),
            tracksShared: 0,
            totalLikes: 0,
            highRatedTracks: 0,
            perfectRatingTracks: 0,
            joinDate: new Date().toISOString(),
            dailyStats: {},
            weeklyStats: {},
            monthlyStats: {}
        };
        
        const saved = localStorage.getItem('musicgen_user_stats');
        return saved ? { ...defaultStats, ...JSON.parse(saved) } : defaultStats;
    }
    
    saveUserStats() {
        // Convert Set objects to arrays for JSON serialization
        const statsToSave = {
            ...this.userStats,
            genresExplored: Array.from(this.userStats.genresExplored),
            aiFeaturesUsed: Array.from(this.userStats.aiFeaturesUsed)
        };
        localStorage.setItem('musicgen_user_stats', JSON.stringify(statsToSave));
    }
    
    // Achievement System
    loadAchievements() {
        const saved = localStorage.getItem('musicgen_achievements');
        const unlockedAchievements = saved ? JSON.parse(saved) : {};
        
        // Convert to Map
        Object.entries(unlockedAchievements).forEach(([id, achievement]) => {
            this.achievements.set(id, achievement);
        });
    }
    
    saveAchievements() {
        const achievementsObj = Object.fromEntries(this.achievements);
        localStorage.setItem('musicgen_achievements', JSON.stringify(achievementsObj));
    }
    
    checkAchievements(action, data = {}) {
        const newAchievements = [];
        
        // Check all achievement categories
        Object.values(this.achievementDefinitions).forEach(category => {
            Object.values(category).forEach(achievement => {
                if (!this.achievements.has(achievement.id)) {
                    if (this.isAchievementEarned(achievement, action, data)) {
                        this.unlockAchievement(achievement);
                        newAchievements.push(achievement);
                    }
                }
            });
        });
        
        return newAchievements;
    }
    
    isAchievementEarned(achievement, action, data) {
        const req = achievement.requirement;
        
        switch (req.type) {
            case 'tracks_created':
                return this.userStats.tracksCreated >= req.value;
            case 'high_rated_tracks':
                return this.userStats.highRatedTracks >= req.value;
            case 'perfect_rating':
                return this.userStats.perfectRatingTracks >= req.value;
            case 'genres_explored':
                return this.userStats.genresExplored.size >= req.value;
            case 'ai_features_used':
                return req.value.every(feature => this.userStats.aiFeaturesUsed.has(feature));
            case 'tracks_shared':
                return this.userStats.tracksShared >= req.value;
            case 'total_likes':
                return this.userStats.totalLikes >= req.value;
            case 'daily_streak':
                return this.userStats.currentStreak >= req.value;
            case 'challenges_completed':
                return this.userStats.challengesCompleted >= req.value;
            case 'challenge_speed':
                return action === 'challenge_completed' && data.completionTime <= req.value;
            default:
                return false;
        }
    }
    
    unlockAchievement(achievement) {
        const unlockedAt = new Date().toISOString();
        const achievementData = {
            ...achievement,
            unlockedAt,
            isNew: true
        };
        
        this.achievements.set(achievement.id, achievementData);
        this.userStats.achievementsUnlocked++;
        this.userStats.totalPoints += achievement.points;
        
        // Update level based on points
        this.updateLevel();
        
        this.saveAchievements();
        this.saveUserStats();
        
        this.emit('achievementUnlocked', achievementData);
        this.showAchievementNotification(achievementData);
    }
    
    // Challenge System
    startChallengeRotation() {
        // Set daily challenges
        this.rotateDailyChallenges();
        
        // Set weekly challenges
        this.rotateWeeklyChallenges();
        
        // Schedule automatic rotation
        setInterval(() => {
            this.rotateDailyChallenges();
        }, 24 * 60 * 60 * 1000); // Daily
        
        setInterval(() => {
            this.rotateWeeklyChallenges();
        }, 7 * 24 * 60 * 60 * 1000); // Weekly
    }
    
    rotateDailyChallenges() {
        const today = new Date().toDateString();
        const genres = ['pop', 'rock', 'jazz', 'electronic', 'classical', 'hip-hop', 'folk', 'country'];
        const randomGenre = genres[Math.floor(Math.random() * genres.length)];
        
        // Set daily creation challenge
        const dailyCreation = {
            ...this.challengeTemplates.daily.daily_creation,
            id: `daily_creation_${today}`,
            startDate: today,
            endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString()
        };
        
        // Set genre focus challenge
        const genreFocus = {
            ...this.challengeTemplates.daily.genre_focus,
            id: `genre_focus_${today}`,
            startDate: today,
            endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toDateString(),
            requirement: { type: 'specific_genre', value: randomGenre },
            description: `Create a ${randomGenre} track today`
        };
        
        this.challenges.set(dailyCreation.id, dailyCreation);
        this.challenges.set(genreFocus.id, genreFocus);
        
        this.emit('dailyChallengesUpdated', { dailyCreation, genreFocus });
    }
    
    rotateWeeklyChallenges() {
        const thisWeek = this.getWeekIdentifier();
        
        Object.values(this.challengeTemplates.weekly).forEach(template => {
            const challenge = {
                ...template,
                id: `${template.id}_${thisWeek}`,
                startDate: this.getWeekStart().toDateString(),
                endDate: this.getWeekEnd().toDateString()
            };
            
            this.challenges.set(challenge.id, challenge);
        });
        
        this.emit('weeklyChallengesUpdated', Array.from(this.challenges.values()).filter(c => c.type === 'weekly'));
    }
    
    // User Actions and Progress Tracking
    trackAction(action, data = {}) {
        switch (action) {
            case 'track_created':
                this.handleTrackCreated(data);
                break;
            case 'track_rated':
                this.handleTrackRated(data);
                break;
            case 'track_shared':
                this.handleTrackShared(data);
                break;
            case 'track_liked':
                this.handleTrackLiked(data);
                break;
            case 'ai_feature_used':
                this.handleAIFeatureUsed(data);
                break;
            case 'challenge_completed':
                this.handleChallengeCompleted(data);
                break;
        }
        
        // Update daily streak
        this.updateDailyStreak();
        
        // Check for new achievements
        const newAchievements = this.checkAchievements(action, data);
        
        // Update challenge progress
        this.updateChallengeProgress(action, data);
        
        // Save progress
        this.saveUserStats();
        
        this.emit('progressUpdated', {
            action,
            data,
            stats: this.userStats,
            newAchievements
        });
    }
    
    handleTrackCreated(data) {
        this.userStats.tracksCreated++;
        
        if (data.genre) {
            this.userStats.genresExplored.add(data.genre);
        }
        
        // Update daily stats
        const today = new Date().toDateString();
        if (!this.userStats.dailyStats[today]) {
            this.userStats.dailyStats[today] = { tracksCreated: 0 };
        }
        this.userStats.dailyStats[today].tracksCreated++;
    }
    
    handleTrackRated(data) {
        if (data.rating >= 4) {
            this.userStats.highRatedTracks++;
        }
        if (data.rating === 5) {
            this.userStats.perfectRatingTracks++;
        }
    }
    
    handleTrackShared(data) {
        this.userStats.tracksShared++;
    }
    
    handleTrackLiked(data) {
        this.userStats.totalLikes++;
    }
    
    handleAIFeatureUsed(data) {
        if (data.feature) {
            this.userStats.aiFeaturesUsed.add(data.feature);
        }
    }
    
    handleChallengeCompleted(data) {
        this.userStats.challengesCompleted++;
        this.userStats.totalPoints += data.points || 0;
        this.updateLevel();
    }
    
    updateDailyStreak() {
        const today = new Date().toDateString();
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
        
        if (this.userStats.lastActiveDate === yesterday) {
            // Continuing streak
            this.userStats.currentStreak++;
        } else if (this.userStats.lastActiveDate !== today) {
            // New streak or broken streak
            this.userStats.currentStreak = 1;
        }
        
        // Update longest streak
        if (this.userStats.currentStreak > this.userStats.longestStreak) {
            this.userStats.longestStreak = this.userStats.currentStreak;
        }
        
        this.userStats.lastActiveDate = today;
    }
    
    updateLevel() {
        const pointsPerLevel = 1000;
        const newLevel = Math.floor(this.userStats.totalPoints / pointsPerLevel) + 1;
        
        if (newLevel > this.userStats.level) {
            const oldLevel = this.userStats.level;
            this.userStats.level = newLevel;
            this.emit('levelUp', { oldLevel, newLevel, totalPoints: this.userStats.totalPoints });
        }
    }
    
    updateChallengeProgress(action, data) {
        const activeChallenges = this.getActiveChallenges();
        
        activeChallenges.forEach(challenge => {
            if (this.isChallengeActionRelevant(challenge, action, data)) {
                const progress = this.getChallengeProgress(challenge.id) || { completed: false, progress: 0 };
                
                if (!progress.completed) {
                    progress.progress = this.calculateChallengeProgress(challenge, action, data);
                    
                    if (progress.progress >= 1) {
                        progress.completed = true;
                        progress.completedAt = new Date().toISOString();
                        this.completeChallengeProgress(challenge, data);
                    }
                    
                    this.setChallengeProgress(challenge.id, progress);
                }
            }
        });
    }
    
    // Leaderboards
    initializeLeaderboards() {
        const leaderboardTypes = [
            'total_points',
            'tracks_created', 
            'current_streak',
            'achievements_unlocked',
            'weekly_points',
            'monthly_points'
        ];
        
        leaderboardTypes.forEach(type => {
            this.leaderboards.set(type, []);
        });
    }
    
    updateLeaderboards() {
        // In a real implementation, this would sync with a backend
        // For now, we'll simulate local leaderboard data
        const mockUsers = this.generateMockLeaderboardData();
        
        this.leaderboards.set('total_points', mockUsers.sort((a, b) => b.totalPoints - a.totalPoints));
        this.leaderboards.set('tracks_created', mockUsers.sort((a, b) => b.tracksCreated - a.tracksCreated));
        this.leaderboards.set('current_streak', mockUsers.sort((a, b) => b.currentStreak - a.currentStreak));
        this.leaderboards.set('achievements_unlocked', mockUsers.sort((a, b) => b.achievementsUnlocked - a.achievementsUnlocked));
        
        this.emit('leaderboardsUpdated', Object.fromEntries(this.leaderboards));
    }
    
    generateMockLeaderboardData() {
        // Generate mock data including current user
        const mockUsers = [
            { username: 'MusicMaster92', totalPoints: 15420, tracksCreated: 156, currentStreak: 45, achievementsUnlocked: 28 },
            { username: 'BeatDropper', totalPoints: 12890, tracksCreated: 134, currentStreak: 23, achievementsUnlocked: 25 },
            { username: 'SynthWave2024', totalPoints: 11200, tracksCreated: 98, currentStreak: 12, achievementsUnlocked: 22 },
            { username: 'MelodyMaker', totalPoints: 9875, tracksCreated: 87, currentStreak: 31, achievementsUnlocked: 19 },
            { username: 'RhythmRider', totalPoints: 8650, tracksCreated: 76, currentStreak: 18, achievementsUnlocked: 17 },
            // Current user
            { 
                username: 'You', 
                totalPoints: this.userStats.totalPoints, 
                tracksCreated: this.userStats.tracksCreated, 
                currentStreak: this.userStats.currentStreak, 
                achievementsUnlocked: this.userStats.achievementsUnlocked,
                isCurrentUser: true 
            }
        ];
        
        return mockUsers;
    }
    
    // Utility Methods
    getActiveChallenges() {
        const now = Date.now();
        return Array.from(this.challenges.values()).filter(challenge => {
            const endTime = new Date(challenge.endDate).getTime();
            return endTime > now;
        });
    }
    
    isChallengeActionRelevant(challenge, action, data) {
        const req = challenge.requirement;
        
        switch (req.type) {
            case 'tracks_created':
                return action === 'track_created';
            case 'specific_genre':
                return action === 'track_created' && data.genre === req.value;
            case 'ai_features_used':
                return action === 'ai_feature_used';
            case 'social_actions':
                return action === 'track_shared' || action === 'track_liked';
            default:
                return false;
        }
    }
    
    calculateChallengeProgress(challenge, action, data) {
        const req = challenge.requirement;
        const progressKey = `challenge_${challenge.id}`;
        
        // Get current progress from localStorage or initialize
        let currentProgress = JSON.parse(localStorage.getItem(progressKey) || '{}');
        
        switch (req.type) {
            case 'tracks_created':
                currentProgress.count = (currentProgress.count || 0) + 1;
                return Math.min(currentProgress.count / req.value, 1);
                
            case 'specific_genre':
                if (data.genre === req.value) {
                    currentProgress.completed = true;
                    return 1;
                }
                return 0;
                
            case 'ai_features_used':
                if (!currentProgress.featuresUsed) currentProgress.featuresUsed = [];
                if (!currentProgress.featuresUsed.includes(data.feature)) {
                    currentProgress.featuresUsed.push(data.feature);
                }
                return Math.min(currentProgress.featuresUsed.length / req.value.length, 1);
                
            case 'social_actions':
                currentProgress.count = (currentProgress.count || 0) + 1;
                return Math.min(currentProgress.count / req.value, 1);
                
            default:
                return 0;
        }
    }
    
    getChallengeProgress(challengeId) {
        const progressKey = `challenge_${challengeId}`;
        return JSON.parse(localStorage.getItem(progressKey) || 'null');
    }
    
    setChallengeProgress(challengeId, progress) {
        const progressKey = `challenge_${challengeId}`;
        localStorage.setItem(progressKey, JSON.stringify(progress));
    }
    
    completeChallengeProgress(challenge, data) {
        this.userStats.totalPoints += challenge.reward.points;
        this.updateLevel();
        
        this.emit('challengeCompleted', {
            challenge,
            reward: challenge.reward,
            completionTime: data.completionTime
        });
    }
    
    getWeekIdentifier() {
        const now = new Date();
        const year = now.getFullYear();
        const week = Math.ceil(((now - new Date(year, 0, 1)) / 86400000 + 1) / 7);
        return `${year}_W${week}`;
    }
    
    getWeekStart() {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day;
        return new Date(now.setDate(diff));
    }
    
    getWeekEnd() {
        const start = this.getWeekStart();
        return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
    }
    
    showAchievementNotification(achievement) {
        // Create achievement notification
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-content">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${achievement.title}</div>
                <div class="achievement-description">${achievement.description}</div>
                <div class="achievement-points">+${achievement.points} points</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 5000);
    }
    
    // Public API Methods
    getUserStats() {
        return { ...this.userStats };
    }
    
    getAchievements() {
        return Array.from(this.achievements.values());
    }
    
    getChallenges() {
        return Array.from(this.challenges.values());
    }
    
    getLeaderboard(type) {
        return this.leaderboards.get(type) || [];
    }
    
    getUserRank(type) {
        const leaderboard = this.getLeaderboard(type);
        const userIndex = leaderboard.findIndex(user => user.isCurrentUser);
        return userIndex >= 0 ? userIndex + 1 : null;
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
        this.saveUserStats();
        this.saveAchievements();
        this.callbacks = {};
    }
}

export { GamificationEngine };