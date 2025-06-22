// Daily Creation Streak Tracker
class StreakTracker {
    constructor() {
        this.streakData = this.loadStreakData();
        this.callbacks = {};
        this.isInitialized = false;
        
        // Streak milestones and rewards
        this.milestones = {
            3: { title: 'Getting Started', icon: '🔥', points: 50, badge: 'starter' },
            7: { title: 'Week Warrior', icon: '⚡', points: 150, badge: 'warrior' },
            14: { title: 'Two Week Champion', icon: '🏆', points: 300, badge: 'champion' },
            30: { title: 'Monthly Master', icon: '👑', points: 750, badge: 'master' },
            50: { title: 'Unstoppable Force', icon: '🌟', points: 1250, badge: 'unstoppable' },
            100: { title: 'Legendary Creator', icon: '💎', points: 2500, badge: 'legendary' },
            365: { title: 'Year-Long Dedication', icon: '🎯', points: 10000, badge: 'dedicated' }
        };
        
        this.init();
    }
    
    async init() {
        // Check and update streak status on initialization
        this.checkStreakStatus();
        
        // Set up daily check interval
        this.startDailyCheckInterval();
        
        this.isInitialized = true;
        console.log('Streak Tracker initialized');
        this.emit('initialized');
    }
    
    loadStreakData() {
        const defaultData = {
            currentStreak: 0,
            longestStreak: 0,
            lastActiveDate: null,
            totalActiveDays: 0,
            streakHistory: [],
            milestonesBadges: [],
            streakStartDate: null,
            weeklyStats: {},
            monthlyStats: {},
            yearlyStats: {}
        };
        
        const saved = localStorage.getItem('musicgen_streak_data');
        return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
    }
    
    saveStreakData() {
        localStorage.setItem('musicgen_streak_data', JSON.stringify(this.streakData));
    }
    
    // Core streak tracking methods
    recordActivity() {
        const today = this.getTodayString();
        const yesterday = this.getYesterdayString();
        
        // Don't record multiple activities on same day
        if (this.streakData.lastActiveDate === today) {
            return this.streakData.currentStreak;
        }
        
        // Update streak logic
        if (this.streakData.lastActiveDate === yesterday) {
            // Continuing streak
            this.streakData.currentStreak++;
        } else if (this.streakData.lastActiveDate === null || this.streakData.lastActiveDate < yesterday) {
            // Starting new streak or broken streak
            if (this.streakData.currentStreak > 0) {
                this.recordStreakBreak();
            }
            this.streakData.currentStreak = 1;
            this.streakData.streakStartDate = today;
        }
        
        // Update tracking data
        this.streakData.lastActiveDate = today;
        this.streakData.totalActiveDays++;
        
        // Update longest streak
        if (this.streakData.currentStreak > this.streakData.longestStreak) {
            this.streakData.longestStreak = this.streakData.currentStreak;
            this.emit('newLongestStreak', { 
                streak: this.streakData.longestStreak,
                previousLongest: this.streakData.longestStreak - 1 
            });
        }
        
        // Update statistics
        this.updateStatistics(today);
        
        // Check for milestone achievements
        this.checkMilestones();
        
        // Save data
        this.saveStreakData();
        
        // Emit streak update event
        this.emit('streakUpdated', {
            currentStreak: this.streakData.currentStreak,
            longestStreak: this.streakData.longestStreak,
            totalActiveDays: this.streakData.totalActiveDays
        });
        
        return this.streakData.currentStreak;
    }
    
    checkStreakStatus() {
        const today = this.getTodayString();
        const yesterday = this.getYesterdayString();
        
        // Check if streak should be broken
        if (this.streakData.lastActiveDate && 
            this.streakData.lastActiveDate < yesterday && 
            this.streakData.currentStreak > 0) {
            
            this.recordStreakBreak();
            this.emit('streakBroken', {
                brokenStreak: this.streakData.currentStreak,
                longestStreak: this.streakData.longestStreak
            });
        }
    }
    
    recordStreakBreak() {
        if (this.streakData.currentStreak > 0) {
            // Record the broken streak in history
            this.streakData.streakHistory.push({
                streak: this.streakData.currentStreak,
                startDate: this.streakData.streakStartDate,
                endDate: this.streakData.lastActiveDate,
                brokenDate: this.getTodayString()
            });
            
            // Reset current streak
            this.streakData.currentStreak = 0;
            this.streakData.streakStartDate = null;
            
            this.saveStreakData();
        }
    }
    
    checkMilestones() {
        const currentStreak = this.streakData.currentStreak;
        
        // Check if current streak hits a milestone
        if (this.milestones[currentStreak]) {
            const milestone = this.milestones[currentStreak];
            
            // Check if this milestone badge hasn't been earned yet
            if (!this.streakData.milestonesBadges.includes(milestone.badge)) {
                this.streakData.milestonesBadges.push(milestone.badge);
                
                this.emit('milestoneReached', {
                    streak: currentStreak,
                    milestone: milestone,
                    isNewRecord: currentStreak === this.streakData.longestStreak
                });
                
                this.saveStreakData();
            }
        }
    }
    
    updateStatistics(dateString) {
        const date = new Date(dateString);
        const week = this.getWeekString(date);
        const month = this.getMonthString(date);
        const year = date.getFullYear().toString();
        
        // Update weekly stats
        if (!this.streakData.weeklyStats[week]) {
            this.streakData.weeklyStats[week] = { activeDays: 0, tracksCreated: 0 };
        }
        this.streakData.weeklyStats[week].activeDays++;
        
        // Update monthly stats
        if (!this.streakData.monthlyStats[month]) {
            this.streakData.monthlyStats[month] = { activeDays: 0, tracksCreated: 0, averageStreak: 0 };
        }
        this.streakData.monthlyStats[month].activeDays++;
        
        // Update yearly stats
        if (!this.streakData.yearlyStats[year]) {
            this.streakData.yearlyStats[year] = { activeDays: 0, tracksCreated: 0, longestStreak: 0 };
        }
        this.streakData.yearlyStats[year].activeDays++;
        
        // Update longest streak for the year
        if (this.streakData.currentStreak > (this.streakData.yearlyStats[year].longestStreak || 0)) {
            this.streakData.yearlyStats[year].longestStreak = this.streakData.currentStreak;
        }
    }
    
    // Analytics and insights
    getStreakAnalytics() {
        return {
            current: this.streakData.currentStreak,
            longest: this.streakData.longestStreak,
            totalActiveDays: this.streakData.totalActiveDays,
            averageStreak: this.calculateAverageStreak(),
            streakBreaks: this.streakData.streakHistory.length,
            consistencyScore: this.calculateConsistencyScore(),
            weeklyAverage: this.calculateWeeklyAverage(),
            monthlyAverage: this.calculateMonthlyAverage(),
            streakTrend: this.calculateStreakTrend(),
            nextMilestone: this.getNextMilestone(),
            daysUntilNextMilestone: this.getDaysUntilNextMilestone()
        };
    }
    
    calculateAverageStreak() {
        if (this.streakData.streakHistory.length === 0) {
            return this.streakData.currentStreak;
        }
        
        const totalStreakDays = this.streakData.streakHistory.reduce((sum, streak) => sum + streak.streak, 0) + this.streakData.currentStreak;
        const totalStreaks = this.streakData.streakHistory.length + (this.streakData.currentStreak > 0 ? 1 : 0);
        
        return totalStreaks > 0 ? Math.round(totalStreakDays / totalStreaks) : 0;
    }
    
    calculateConsistencyScore() {
        // Calculate consistency based on active days vs total days since first activity
        if (!this.streakData.lastActiveDate) return 0;
        
        const firstActivity = this.streakData.streakHistory.length > 0 
            ? this.streakData.streakHistory[0].startDate 
            : this.streakData.streakStartDate;
            
        if (!firstActivity) return 100;
        
        const daysSinceFirst = this.getDaysBetween(firstActivity, this.getTodayString());
        return Math.min(100, Math.round((this.streakData.totalActiveDays / daysSinceFirst) * 100));
    }
    
    calculateWeeklyAverage() {
        const weeks = Object.values(this.streakData.weeklyStats);
        if (weeks.length === 0) return 0;
        
        const totalDays = weeks.reduce((sum, week) => sum + week.activeDays, 0);
        return Math.round((totalDays / weeks.length) * 10) / 10;
    }
    
    calculateMonthlyAverage() {
        const months = Object.values(this.streakData.monthlyStats);
        if (months.length === 0) return 0;
        
        const totalDays = months.reduce((sum, month) => sum + month.activeDays, 0);
        return Math.round((totalDays / months.length) * 10) / 10;
    }
    
    calculateStreakTrend() {
        // Analyze last 30 days of activity to determine trend
        const last30Days = this.getLast30DaysActivity();
        const firstHalf = last30Days.slice(0, 15);
        const secondHalf = last30Days.slice(15);
        
        const firstHalfAvg = firstHalf.reduce((sum, day) => sum + (day ? 1 : 0), 0) / 15;
        const secondHalfAvg = secondHalf.reduce((sum, day) => sum + (day ? 1 : 0), 0) / 15;
        
        if (secondHalfAvg > firstHalfAvg + 0.1) return 'improving';
        if (secondHalfAvg < firstHalfAvg - 0.1) return 'declining';
        return 'stable';
    }
    
    getNextMilestone() {
        const currentStreak = this.streakData.currentStreak;
        const milestoneKeys = Object.keys(this.milestones).map(Number).sort((a, b) => a - b);
        
        for (const milestone of milestoneKeys) {
            if (milestone > currentStreak) {
                return {
                    days: milestone,
                    ...this.milestones[milestone]
                };
            }
        }
        
        return null; // No more milestones
    }
    
    getDaysUntilNextMilestone() {
        const nextMilestone = this.getNextMilestone();
        return nextMilestone ? nextMilestone.days - this.streakData.currentStreak : 0;
    }
    
    getLast30DaysActivity() {
        const activity = [];
        const today = new Date();
        
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateString = this.formatDateString(date);
            
            // Check if this date has activity
            const hasActivity = this.streakData.lastActiveDate >= dateString && 
                               this.wasActiveOnDate(dateString);
            activity.push(hasActivity);
        }
        
        return activity;
    }
    
    wasActiveOnDate(dateString) {
        // For now, simplified logic - in real implementation, this would check actual activity logs
        if (!this.streakData.lastActiveDate) return false;
        
        const targetDate = new Date(dateString);
        const lastActiveDate = new Date(this.streakData.lastActiveDate);
        const streakStartDate = this.streakData.streakStartDate ? new Date(this.streakData.streakStartDate) : null;
        
        // If within current streak period
        if (streakStartDate && targetDate >= streakStartDate && targetDate <= lastActiveDate) {
            return true;
        }
        
        // Check historical streaks
        return this.streakData.streakHistory.some(streak => {
            const start = new Date(streak.startDate);
            const end = new Date(streak.endDate);
            return targetDate >= start && targetDate <= end;
        });
    }
    
    // Streak recovery and motivation
    getStreakRecoveryPlan() {
        if (this.streakData.currentStreak > 0) {
            return null; // No recovery needed
        }
        
        const lastStreak = this.streakData.streakHistory[this.streakData.streakHistory.length - 1];
        const daysSinceBreak = lastStreak ? this.getDaysBetween(lastStreak.endDate, this.getTodayString()) : 0;
        
        return {
            lastStreak: lastStreak ? lastStreak.streak : 0,
            daysSinceBreak,
            motivation: this.getMotivationalMessage(daysSinceBreak),
            quickWins: this.getQuickWinSuggestions(),
            goalSuggestion: this.suggestRealisticGoal()
        };
    }
    
    getMotivationalMessage(daysSinceBreak) {
        if (daysSinceBreak <= 1) {
            return "Every master was once a beginner. Start your new streak today! 🌟";
        } else if (daysSinceBreak <= 7) {
            return "The best time to plant a tree was 20 years ago. The second best time is now! 🌱";
        } else if (daysSinceBreak <= 30) {
            return "Your musical journey continues! One track today can spark a new creative fire! 🔥";
        } else {
            return "Welcome back, creator! Every day is a chance to compose something amazing! 🎵";
        }
    }
    
    getQuickWinSuggestions() {
        return [
            "Create a 15-second loop using any genre",
            "Experiment with a new AI feature for 5 minutes",
            "Remix an existing track with a different style",
            "Generate lyrics and create a simple melody",
            "Record a voice memo and turn it into music"
        ];
    }
    
    suggestRealisticGoal() {
        const longestStreak = this.streakData.longestStreak;
        
        if (longestStreak === 0) {
            return { days: 3, message: "Start with 3 days - you can do it!" };
        } else if (longestStreak < 7) {
            return { days: 7, message: "Aim for a full week of creativity!" };
        } else if (longestStreak < 30) {
            return { days: Math.min(longestStreak + 7, 30), message: "Beat your record and reach new heights!" };
        } else {
            return { days: longestStreak + 14, message: "Challenge yourself to surpass your previous best!" };
        }
    }
    
    // Streak sharing and social features
    generateStreakShareData() {
        return {
            currentStreak: this.streakData.currentStreak,
            longestStreak: this.streakData.longestStreak,
            totalActiveDays: this.streakData.totalActiveDays,
            consistencyScore: this.calculateConsistencyScore(),
            milestones: this.streakData.milestonesBadges.length,
            shareText: this.generateShareText(),
            visualData: this.generateVisualData()
        };
    }
    
    generateShareText() {
        const current = this.streakData.currentStreak;
        const longest = this.streakData.longestStreak;
        
        if (current === 0) {
            return `Starting fresh on my music creation journey! 🎵 #MusicGenAI`;
        } else if (current === longest) {
            return `🔥 ${current} day music creation streak and still going! New personal record! 🎵 #MusicGenAI #StreakMaster`;
        } else {
            return `🎵 Day ${current} of my music creation streak! Longest ever: ${longest} days 🔥 #MusicGenAI`;
        }
    }
    
    generateVisualData() {
        // Generate data for visual streak calendar
        const last30Days = this.getLast30DaysActivity();
        return {
            calendar: last30Days,
            currentStreak: this.streakData.currentStreak,
            longestStreak: this.streakData.longestStreak,
            milestones: this.getAchievedMilestones()
        };
    }
    
    getAchievedMilestones() {
        return this.streakData.milestonesBadges.map(badge => {
            const milestone = Object.values(this.milestones).find(m => m.badge === badge);
            return milestone;
        }).filter(Boolean);
    }
    
    // Notification and reminder system
    startDailyCheckInterval() {
        // Check every hour to see if streak should be broken
        setInterval(() => {
            this.checkStreakStatus();
        }, 60 * 60 * 1000); // Every hour
        
        // Set up daily reminder notifications
        this.scheduleDailyReminders();
    }
    
    scheduleDailyReminders() {
        const now = new Date();
        const reminder1 = new Date();
        reminder1.setHours(10, 0, 0, 0); // 10 AM
        
        const reminder2 = new Date();
        reminder2.setHours(18, 0, 0, 0); // 6 PM
        
        const reminder3 = new Date();
        reminder3.setHours(21, 0, 0, 0); // 9 PM
        
        // If today's reminders have passed, schedule for tomorrow
        [reminder1, reminder2, reminder3].forEach((reminderTime, index) => {
            if (reminderTime <= now) {
                reminderTime.setDate(reminderTime.getDate() + 1);
            }
            
            const timeUntil = reminderTime.getTime() - now.getTime();
            setTimeout(() => {
                this.sendDailyReminder(index);
                // Schedule daily recurring reminder
                setInterval(() => this.sendDailyReminder(index), 24 * 60 * 60 * 1000);
            }, timeUntil);
        });
    }
    
    sendDailyReminder(reminderIndex) {
        const today = this.getTodayString();
        
        // Don't send reminder if already active today
        if (this.streakData.lastActiveDate === today) {
            return;
        }
        
        const messages = [
            `🌅 Good morning! Keep your ${this.streakData.currentStreak}-day streak alive - create something today!`,
            `🎵 Evening checkpoint: You haven't created music today. Don't break your ${this.streakData.currentStreak}-day streak!`,
            `🌙 Last chance! ${this.streakData.currentStreak} days of creativity - will you make it ${this.streakData.currentStreak + 1}?`
        ];
        
        this.emit('dailyReminder', {
            message: messages[reminderIndex],
            currentStreak: this.streakData.currentStreak,
            reminderType: ['morning', 'evening', 'night'][reminderIndex]
        });
    }
    
    // Utility methods
    getTodayString() {
        return this.formatDateString(new Date());
    }
    
    getYesterdayString() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return this.formatDateString(yesterday);
    }
    
    formatDateString(date) {
        return date.toISOString().split('T')[0];
    }
    
    getWeekString(date) {
        const year = date.getFullYear();
        const week = this.getWeekNumber(date);
        return `${year}-W${week.toString().padStart(2, '0')}`;
    }
    
    getMonthString(date) {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        return `${year}-${month.toString().padStart(2, '0')}`;
    }
    
    getWeekNumber(date) {
        const firstJan = new Date(date.getFullYear(), 0, 1);
        const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayOfYear = ((today - firstJan + 86400000) / 86400000);
        return Math.ceil(dayOfYear / 7);
    }
    
    getDaysBetween(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // Public API
    getCurrentStreak() {
        return this.streakData.currentStreak;
    }
    
    getLongestStreak() {
        return this.streakData.longestStreak;
    }
    
    getTotalActiveDays() {
        return this.streakData.totalActiveDays;
    }
    
    getStreakData() {
        return { ...this.streakData };
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
        this.saveStreakData();
        this.callbacks = {};
    }
}

export { StreakTracker };