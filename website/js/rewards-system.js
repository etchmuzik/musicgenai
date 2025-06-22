// Rewards and Unlockable Content System
class RewardsSystem {
    constructor() {
        this.isInitialized = false;
        this.rewardsData = this.loadRewardsData();
        this.callbacks = {};
        
        // Reward types and categories
        this.rewardTypes = {
            BADGE: 'badge',
            PRESET: 'preset',
            EFFECT: 'effect',
            THEME: 'theme',
            FEATURE: 'feature',
            CURRENCY: 'currency',
            TITLE: 'title'
        };
        
        // Virtual currency
        this.currency = {
            name: 'MusicCoins',
            symbol: '🪙',
            exchangeRate: {
                points: 10, // 10 points = 1 MusicCoin
                streak: 5,  // 5 streak days = 1 MusicCoin
                achievement: 50 // 1 achievement = 50 MusicCoins
            }
        };
        
        // Unlockable content catalog
        this.contentCatalog = {
            presets: {
                'epic_orchestral': {
                    id: 'epic_orchestral',
                    name: 'Epic Orchestral Pack',
                    description: 'Hollywood-style orchestral presets',
                    type: this.rewardTypes.PRESET,
                    rarity: 'epic',
                    cost: { musicCoins: 100 },
                    requirements: { level: 5, achievements: ['music_master'] },
                    unlocked: false,
                    preview: 'https://musicgenai.app/previews/epic_orchestral.mp3',
                    icon: '🎼'
                },
                'synthwave_collection': {
                    id: 'synthwave_collection',
                    name: 'Synthwave Collection',
                    description: 'Retro 80s synthwave sounds',
                    type: this.rewardTypes.PRESET,
                    rarity: 'rare',
                    cost: { musicCoins: 75 },
                    requirements: { tracksCreated: 25, genresExplored: 5 },
                    unlocked: false,
                    preview: 'https://musicgenai.app/previews/synthwave.mp3',
                    icon: '🌊'
                },
                'jazz_fusion': {
                    id: 'jazz_fusion',
                    name: 'Jazz Fusion Masters',
                    description: 'Advanced jazz harmony and rhythm',
                    type: this.rewardTypes.PRESET,
                    rarity: 'legendary',
                    cost: { musicCoins: 200 },
                    requirements: { level: 10, perfectRatingTracks: 5 },
                    unlocked: false,
                    preview: 'https://musicgenai.app/previews/jazz_fusion.mp3',
                    icon: '🎷'
                }
            },
            effects: {
                'vintage_reverb': {
                    id: 'vintage_reverb',
                    name: 'Vintage Reverb Suite',
                    description: 'Classic reverb algorithms',
                    type: this.rewardTypes.EFFECT,
                    rarity: 'uncommon',
                    cost: { musicCoins: 50 },
                    requirements: { currentStreak: 7 },
                    unlocked: false,
                    icon: '🔊'
                },
                'ai_mastering_pro': {
                    id: 'ai_mastering_pro',
                    name: 'AI Mastering Pro',
                    description: 'Advanced AI mastering algorithms',
                    type: this.rewardTypes.EFFECT,
                    rarity: 'epic',
                    cost: { musicCoins: 150 },
                    requirements: { aiFeaturesUsed: 4, tracksShared: 10 },
                    unlocked: false,
                    icon: '🤖'
                }
            },
            themes: {
                'dark_mode_pro': {
                    id: 'dark_mode_pro',
                    name: 'Dark Mode Pro',
                    description: 'Premium dark theme with animations',
                    type: this.rewardTypes.THEME,
                    rarity: 'rare',
                    cost: { musicCoins: 40 },
                    requirements: { totalActiveDays: 30 },
                    unlocked: false,
                    icon: '🌙'
                },
                'neon_studio': {
                    id: 'neon_studio',
                    name: 'Neon Studio',
                    description: 'Cyberpunk neon theme',
                    type: this.rewardTypes.THEME,
                    rarity: 'epic',
                    cost: { musicCoins: 80 },
                    requirements: { level: 8, challengesCompleted: 15 },
                    unlocked: false,
                    icon: '⚡'
                }
            },
            features: {
                'collaboration_tools': {
                    id: 'collaboration_tools',
                    name: 'Collaboration Tools',
                    description: 'Real-time collaboration features',
                    type: this.rewardTypes.FEATURE,
                    rarity: 'legendary',
                    cost: { musicCoins: 300 },
                    requirements: { socialScore: 1000, followers: 50 },
                    unlocked: false,
                    icon: '🤝'
                },
                'advanced_ai': {
                    id: 'advanced_ai',
                    name: 'Advanced AI Features',
                    description: 'Cutting-edge AI capabilities',
                    type: this.rewardTypes.FEATURE,
                    rarity: 'legendary',
                    cost: { musicCoins: 500 },
                    requirements: { level: 15, longestStreak: 50 },
                    unlocked: false,
                    icon: '🧠'
                }
            },
            titles: {
                'beat_master': {
                    id: 'beat_master',
                    name: 'Beat Master',
                    description: 'Master of rhythm and beats',
                    type: this.rewardTypes.TITLE,
                    rarity: 'rare',
                    cost: { musicCoins: 25 },
                    requirements: { rhythmTracks: 20 },
                    unlocked: false,
                    icon: '🥁'
                },
                'melody_wizard': {
                    id: 'melody_wizard',
                    name: 'Melody Wizard',
                    description: 'Creator of unforgettable melodies',
                    type: this.rewardTypes.TITLE,
                    rarity: 'epic',
                    cost: { musicCoins: 75 },
                    requirements: { melodicTracks: 30, highRatedTracks: 15 },
                    unlocked: false,
                    icon: '🧙‍♂️'
                },
                'ai_conductor': {
                    id: 'ai_conductor',
                    name: 'AI Conductor',
                    description: 'Master of AI-powered music',
                    type: this.rewardTypes.TITLE,
                    rarity: 'legendary',
                    cost: { musicCoins: 150 },
                    requirements: { aiMasterTracks: 50, perfectAIUsage: true },
                    unlocked: false,
                    icon: '🎯'
                }
            },
            badges: {
                'early_adopter': {
                    id: 'early_adopter',
                    name: 'Early Adopter',
                    description: 'One of the first to explore AI music',
                    type: this.rewardTypes.BADGE,
                    rarity: 'legendary',
                    cost: { free: true },
                    requirements: { joinedBefore: '2024-01-01' },
                    unlocked: false,
                    icon: '🚀'
                },
                'community_champion': {
                    id: 'community_champion',
                    name: 'Community Champion',
                    description: 'Active community contributor',
                    type: this.rewardTypes.BADGE,
                    rarity: 'epic',
                    cost: { musicCoins: 100 },
                    requirements: { helpfulComments: 50, tracksShared: 25 },
                    unlocked: false,
                    icon: '👑'
                }
            }
        };
        
        // Special event rewards
        this.eventRewards = {
            daily_login: {
                name: 'Daily Login Bonus',
                description: 'Claim your daily rewards',
                rewards: [
                    { day: 1, musicCoins: 5, icon: '🪙' },
                    { day: 2, musicCoins: 10, icon: '🪙' },
                    { day: 3, musicCoins: 15, icon: '🪙' },
                    { day: 4, musicCoins: 20, icon: '🪙' },
                    { day: 5, musicCoins: 25, icon: '🪙' },
                    { day: 6, musicCoins: 30, icon: '🪙' },
                    { day: 7, musicCoins: 50, unlockable: 'vintage_reverb', icon: '🎁' }
                ]
            },
            seasonal: {
                'winter_wonderland': {
                    name: 'Winter Wonderland',
                    description: 'Special winter-themed rewards',
                    active: false,
                    rewards: {
                        'snow_theme': { type: 'theme', icon: '❄️' },
                        'winter_presets': { type: 'preset', icon: '🎿' }
                    }
                }
            }
        };
        
        this.init();
    }
    
    async init() {
        try {
            // Check for available rewards
            this.checkUnlockableContent();
            
            // Initialize daily login system
            this.initializeDailyLogin();
            
            // Set up currency exchange system
            this.setupCurrencyExchange();
            
            this.isInitialized = true;
            console.log('Rewards System initialized');
            this.emit('initialized');
        } catch (error) {
            console.error('Failed to initialize Rewards System:', error);
        }
    }
    
    loadRewardsData() {
        const defaultData = {
            currency: {
                musicCoins: 0,
                totalEarned: 0,
                totalSpent: 0
            },
            unlockedContent: {
                presets: [],
                effects: [],
                themes: [],
                features: [],
                titles: [],
                badges: []
            },
            dailyLogin: {
                currentStreak: 0,
                lastLoginDate: null,
                totalLogins: 0,
                rewardsClaimed: []
            },
            purchaseHistory: [],
            activeTitle: null,
            activeBadges: [],
            rewardStats: {
                totalRewardsEarned: 0,
                totalContentUnlocked: 0,
                favoriteRewardType: null
            }
        };
        
        const saved = localStorage.getItem('musicgen_rewards_data');
        return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
    }
    
    saveRewardsData() {
        localStorage.setItem('musicgen_rewards_data', JSON.stringify(this.rewardsData));
    }
    
    // Currency Management
    earnCurrency(source, amount, multiplier = 1) {
        const earnedAmount = Math.round(amount * multiplier);
        this.rewardsData.currency.musicCoins += earnedAmount;
        this.rewardsData.currency.totalEarned += earnedAmount;
        
        this.saveRewardsData();
        
        this.emit('currencyEarned', {
            source,
            amount: earnedAmount,
            totalCoins: this.rewardsData.currency.musicCoins
        });
        
        return earnedAmount;
    }
    
    spendCurrency(amount, purpose) {
        if (this.rewardsData.currency.musicCoins >= amount) {
            this.rewardsData.currency.musicCoins -= amount;
            this.rewardsData.currency.totalSpent += amount;
            
            this.saveRewardsData();
            
            this.emit('currencySpent', {
                amount,
                purpose,
                remainingCoins: this.rewardsData.currency.musicCoins
            });
            
            return true;
        }
        
        return false;
    }
    
    // Points to currency conversion
    convertPointsToCurrency(points) {
        const coinsEarned = Math.floor(points / this.currency.exchangeRate.points);
        if (coinsEarned > 0) {
            this.earnCurrency('points_conversion', coinsEarned);
        }
        return coinsEarned;
    }
    
    convertStreakToCurrency(streakDays) {
        const coinsEarned = Math.floor(streakDays / this.currency.exchangeRate.streak);
        if (coinsEarned > 0) {
            this.earnCurrency('streak_bonus', coinsEarned);
        }
        return coinsEarned;
    }
    
    convertAchievementToCurrency(achievementRarity) {
        const multipliers = { common: 1, uncommon: 2, rare: 3, epic: 5, legendary: 10 };
        const baseCoins = this.currency.exchangeRate.achievement;
        const coinsEarned = baseCoins * (multipliers[achievementRarity] || 1);
        
        this.earnCurrency('achievement_bonus', coinsEarned);
        return coinsEarned;
    }
    
    // Content unlocking system
    checkUnlockableContent() {
        let newUnlocks = [];
        
        // Check all content categories
        Object.entries(this.contentCatalog).forEach(([category, items]) => {
            Object.values(items).forEach(item => {
                if (!item.unlocked && this.meetsRequirements(item.requirements)) {
                    // Mark as available for purchase
                    item.availableForPurchase = true;
                    newUnlocks.push(item);
                }
            });
        });
        
        if (newUnlocks.length > 0) {
            this.emit('newContentAvailable', newUnlocks);
        }
        
        return newUnlocks;
    }
    
    meetsRequirements(requirements) {
        // This would check against actual user stats
        // For now, simplified mock logic
        return Object.entries(requirements).every(([key, value]) => {
            switch (key) {
                case 'level':
                    return this.getUserLevel() >= value;
                case 'tracksCreated':
                    return this.getUserTracksCreated() >= value;
                case 'currentStreak':
                    return this.getUserCurrentStreak() >= value;
                case 'achievements':
                    return this.hasAchievements(value);
                default:
                    return true; // Unknown requirement passes for demo
            }
        });
    }
    
    // Mock user data getters (would integrate with actual user system)
    getUserLevel() {
        return JSON.parse(localStorage.getItem('musicgen_user_stats') || '{}').level || 1;
    }
    
    getUserTracksCreated() {
        return JSON.parse(localStorage.getItem('musicgen_user_stats') || '{}').tracksCreated || 0;
    }
    
    getUserCurrentStreak() {
        return JSON.parse(localStorage.getItem('musicgen_streak_data') || '{}').currentStreak || 0;
    }
    
    hasAchievements(requiredAchievements) {
        const userAchievements = JSON.parse(localStorage.getItem('musicgen_achievements') || '{}');
        return requiredAchievements.every(achId => userAchievements[achId]);
    }
    
    // Purchase system
    purchaseContent(contentId) {
        const content = this.findContentById(contentId);
        if (!content) {
            throw new Error('Content not found');
        }
        
        if (content.unlocked) {
            throw new Error('Content already unlocked');
        }
        
        if (!content.availableForPurchase && !this.meetsRequirements(content.requirements)) {
            throw new Error('Requirements not met');
        }
        
        // Check if free content
        if (content.cost.free) {
            return this.unlockContent(contentId, 'free');
        }
        
        // Check currency
        if (content.cost.musicCoins && this.rewardsData.currency.musicCoins < content.cost.musicCoins) {
            throw new Error('Insufficient MusicCoins');
        }
        
        // Process purchase
        if (this.spendCurrency(content.cost.musicCoins, `purchase_${contentId}`)) {
            return this.unlockContent(contentId, 'purchase');
        }
        
        throw new Error('Purchase failed');
    }
    
    unlockContent(contentId, method = 'unlock') {
        const content = this.findContentById(contentId);
        if (!content) {
            throw new Error('Content not found');
        }
        
        // Mark as unlocked
        content.unlocked = true;
        
        // Add to user's unlocked content
        const category = this.getContentCategory(contentId);
        if (category && !this.rewardsData.unlockedContent[category].includes(contentId)) {
            this.rewardsData.unlockedContent[category].push(contentId);
        }
        
        // Record purchase
        const purchase = {
            id: this.generatePurchaseId(),
            contentId: contentId,
            contentName: content.name,
            cost: content.cost,
            method: method,
            timestamp: new Date().toISOString()
        };
        
        this.rewardsData.purchaseHistory.push(purchase);
        this.rewardsData.rewardStats.totalContentUnlocked++;
        
        this.saveRewardsData();
        
        this.emit('contentUnlocked', {
            content,
            purchase,
            method
        });
        
        return content;
    }
    
    findContentById(contentId) {
        for (const category of Object.values(this.contentCatalog)) {
            if (category[contentId]) {
                return category[contentId];
            }
        }
        return null;
    }
    
    getContentCategory(contentId) {
        for (const [categoryName, items] of Object.entries(this.contentCatalog)) {
            if (items[contentId]) {
                return categoryName;
            }
        }
        return null;
    }
    
    // Daily login system
    initializeDailyLogin() {
        this.checkDailyLogin();
    }
    
    checkDailyLogin() {
        const today = new Date().toDateString();
        const lastLoginDate = this.rewardsData.dailyLogin.lastLoginDate;
        
        if (lastLoginDate !== today) {
            this.processDailyLogin(today, lastLoginDate);
        }
    }
    
    processDailyLogin(today, lastLoginDate) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toDateString();
        
        // Update login streak
        if (lastLoginDate === yesterdayString) {
            // Consecutive day
            this.rewardsData.dailyLogin.currentStreak++;
        } else if (lastLoginDate && lastLoginDate !== today) {
            // Streak broken
            this.rewardsData.dailyLogin.currentStreak = 1;
        } else if (!lastLoginDate) {
            // First login
            this.rewardsData.dailyLogin.currentStreak = 1;
        }
        
        this.rewardsData.dailyLogin.lastLoginDate = today;
        this.rewardsData.dailyLogin.totalLogins++;
        
        // Check for daily reward
        const dailyReward = this.getDailyLoginReward();
        if (dailyReward) {
            this.processDailyReward(dailyReward);
        }
        
        this.saveRewardsData();
        this.emit('dailyLoginProcessed', {
            streak: this.rewardsData.dailyLogin.currentStreak,
            reward: dailyReward
        });
    }
    
    getDailyLoginReward() {
        const streakDay = this.rewardsData.dailyLogin.currentStreak;
        const rewardCycle = this.eventRewards.daily_login.rewards;
        const rewardIndex = ((streakDay - 1) % rewardCycle.length);
        
        return rewardCycle[rewardIndex];
    }
    
    processDailyReward(reward) {
        if (reward.musicCoins) {
            this.earnCurrency('daily_login', reward.musicCoins);
        }
        
        if (reward.unlockable) {
            try {
                this.unlockContent(reward.unlockable, 'daily_reward');
            } catch (error) {
                console.log('Could not unlock daily reward content:', error.message);
            }
        }
        
        this.rewardsData.dailyLogin.rewardsClaimed.push({
            day: this.rewardsData.dailyLogin.currentStreak,
            reward: reward,
            timestamp: new Date().toISOString()
        });
    }
    
    // Title and badge system
    setActiveTitle(titleId) {
        const title = this.contentCatalog.titles[titleId];
        if (title && title.unlocked) {
            this.rewardsData.activeTitle = titleId;
            this.saveRewardsData();
            this.emit('titleChanged', title);
            return true;
        }
        return false;
    }
    
    toggleBadge(badgeId) {
        const badge = this.contentCatalog.badges[badgeId];
        if (!badge || !badge.unlocked) {
            return false;
        }
        
        const index = this.rewardsData.activeBadges.indexOf(badgeId);
        if (index > -1) {
            // Remove badge
            this.rewardsData.activeBadges.splice(index, 1);
        } else {
            // Add badge (limit to 3 active badges)
            if (this.rewardsData.activeBadges.length < 3) {
                this.rewardsData.activeBadges.push(badgeId);
            } else {
                return false; // Too many badges
            }
        }
        
        this.saveRewardsData();
        this.emit('badgesChanged', this.getActiveBadges());
        return true;
    }
    
    getActiveBadges() {
        return this.rewardsData.activeBadges.map(badgeId => this.contentCatalog.badges[badgeId]);
    }
    
    getActiveTitle() {
        return this.rewardsData.activeTitle ? this.contentCatalog.titles[this.rewardsData.activeTitle] : null;
    }
    
    // Reward recommendations
    getRecommendedRewards(userStats) {
        const recommendations = [];
        
        // Analyze user behavior and suggest relevant rewards
        Object.entries(this.contentCatalog).forEach(([category, items]) => {
            Object.values(items).forEach(item => {
                if (!item.unlocked && item.availableForPurchase) {
                    const relevanceScore = this.calculateRelevanceScore(item, userStats);
                    if (relevanceScore > 0.5) {
                        recommendations.push({
                            ...item,
                            relevanceScore,
                            reason: this.getRecommendationReason(item, userStats)
                        });
                    }
                }
            });
        });
        
        return recommendations
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 5);
    }
    
    calculateRelevanceScore(item, userStats) {
        let score = 0.5; // Base score
        
        // Factor in user preferences and behavior
        if (item.type === this.rewardTypes.PRESET && userStats.genresExplored > 5) {
            score += 0.3;
        }
        
        if (item.type === this.rewardTypes.EFFECT && userStats.aiFeatureUsage > 0.7) {
            score += 0.4;
        }
        
        if (item.type === this.rewardTypes.THEME && userStats.timeSpentInApp > 50) {
            score += 0.2;
        }
        
        return Math.min(score, 1.0);
    }
    
    getRecommendationReason(item, userStats) {
        if (item.type === this.rewardTypes.PRESET) {
            return "Perfect for expanding your musical palette";
        }
        if (item.type === this.rewardTypes.EFFECT) {
            return "Enhance your AI-powered creations";
        }
        if (item.type === this.rewardTypes.THEME) {
            return "Personalize your creative workspace";
        }
        return "Recommended based on your activity";
    }
    
    // Gift and sharing system
    generateGiftCode(contentId, recipientId = null) {
        const content = this.findContentById(contentId);
        if (!content) {
            throw new Error('Content not found');
        }
        
        const giftCode = {
            id: this.generateGiftCodeId(),
            contentId: contentId,
            contentName: content.name,
            giftedBy: this.getCurrentUserId(),
            recipientId: recipientId,
            code: this.generateRandomCode(),
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
            redeemed: false,
            createdAt: new Date().toISOString()
        };
        
        // In real implementation, this would be saved to backend
        localStorage.setItem(`gift_code_${giftCode.code}`, JSON.stringify(giftCode));
        
        this.emit('giftCodeGenerated', giftCode);
        return giftCode;
    }
    
    redeemGiftCode(code) {
        const giftCodeData = localStorage.getItem(`gift_code_${code}`);
        if (!giftCodeData) {
            throw new Error('Invalid gift code');
        }
        
        const giftCode = JSON.parse(giftCodeData);
        
        if (giftCode.redeemed) {
            throw new Error('Gift code already redeemed');
        }
        
        if (new Date(giftCode.expiresAt) < new Date()) {
            throw new Error('Gift code expired');
        }
        
        // Redeem the content
        const content = this.unlockContent(giftCode.contentId, 'gift');
        
        // Mark as redeemed
        giftCode.redeemed = true;
        giftCode.redeemedAt = new Date().toISOString();
        giftCode.redeemedBy = this.getCurrentUserId();
        
        localStorage.setItem(`gift_code_${code}`, JSON.stringify(giftCode));
        
        this.emit('giftCodeRedeemed', { giftCode, content });
        return content;
    }
    
    // Analytics and insights
    getRewardsAnalytics() {
        return {
            currency: {
                current: this.rewardsData.currency.musicCoins,
                totalEarned: this.rewardsData.currency.totalEarned,
                totalSpent: this.rewardsData.currency.totalSpent,
                netWorth: this.rewardsData.currency.totalEarned - this.rewardsData.currency.totalSpent
            },
            content: {
                totalUnlocked: this.rewardsData.rewardStats.totalContentUnlocked,
                unlockedByCategory: this.getUnlockedCountByCategory(),
                totalAvailable: this.getTotalAvailableContent(),
                completionPercentage: this.getCompletionPercentage()
            },
            activity: {
                dailyLoginStreak: this.rewardsData.dailyLogin.currentStreak,
                totalLogins: this.rewardsData.dailyLogin.totalLogins,
                totalPurchases: this.rewardsData.purchaseHistory.length,
                averageSpendingPerPurchase: this.getAverageSpendingPerPurchase()
            }
        };
    }
    
    getUnlockedCountByCategory() {
        const counts = {};
        Object.entries(this.rewardsData.unlockedContent).forEach(([category, items]) => {
            counts[category] = items.length;
        });
        return counts;
    }
    
    getTotalAvailableContent() {
        let total = 0;
        Object.values(this.contentCatalog).forEach(category => {
            total += Object.keys(category).length;
        });
        return total;
    }
    
    getCompletionPercentage() {
        const total = this.getTotalAvailableContent();
        const unlocked = this.rewardsData.rewardStats.totalContentUnlocked;
        return total > 0 ? Math.round((unlocked / total) * 100) : 0;
    }
    
    getAverageSpendingPerPurchase() {
        if (this.rewardsData.purchaseHistory.length === 0) return 0;
        const totalSpent = this.rewardsData.purchaseHistory.reduce((sum, purchase) => {
            return sum + (purchase.cost.musicCoins || 0);
        }, 0);
        return Math.round(totalSpent / this.rewardsData.purchaseHistory.length);
    }
    
    // Utility functions
    setupCurrencyExchange() {
        // Listen for gamification events to award currency
        document.addEventListener('musicgen:pointsEarned', (event) => {
            this.convertPointsToCurrency(event.detail.points);
        });
        
        document.addEventListener('musicgen:streakUpdated', (event) => {
            this.convertStreakToCurrency(event.detail.streak);
        });
        
        document.addEventListener('musicgen:achievementUnlocked', (event) => {
            this.convertAchievementToCurrency(event.detail.rarity);
        });
    }
    
    generatePurchaseId() {
        return 'purchase_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateGiftCodeId() {
        return 'gift_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateRandomCode() {
        return Math.random().toString(36).substr(2, 9).toUpperCase();
    }
    
    getCurrentUserId() {
        // In real implementation, get from auth system
        return 'user_' + Date.now();
    }
    
    // Public API
    getCurrency() {
        return { ...this.rewardsData.currency };
    }
    
    getUnlockedContent() {
        return { ...this.rewardsData.unlockedContent };
    }
    
    getAllContent() {
        return this.contentCatalog;
    }
    
    getAvailableContent() {
        const available = {};
        Object.entries(this.contentCatalog).forEach(([category, items]) => {
            available[category] = {};
            Object.entries(items).forEach(([id, item]) => {
                if (item.availableForPurchase && !item.unlocked) {
                    available[category][id] = item;
                }
            });
        });
        return available;
    }
    
    getDailyLoginStatus() {
        return { ...this.rewardsData.dailyLogin };
    }
    
    getPurchaseHistory() {
        return [...this.rewardsData.purchaseHistory];
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
        this.saveRewardsData();
        this.callbacks = {};
    }
}

export { RewardsSystem };