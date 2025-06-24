// Credits Manager - Handles user credits based on subscription plans
import { auth, db, isFirebaseConfigured } from './firebase-config-safe.js';

class CreditsManager {
    constructor() {
        this.currentUser = null;
        this.userCredits = null;
        this.subscriptionPlans = {
            free: {
                name: 'Free',
                monthlyCredits: 10,
                dailyCredits: 0,
                creditCost: 1
            },
            starter: {
                name: 'Starter',
                monthlyCredits: 500,
                dailyCredits: 0,
                creditCost: 1
            },
            pro: {
                name: 'Pro',
                monthlyCredits: 2000,
                dailyCredits: 0,
                creditCost: 1
            },
            unlimited: {
                name: 'Unlimited',
                monthlyCredits: 10000, // Effectively unlimited
                dailyCredits: 0,
                creditCost: 0 // No credit cost for unlimited
            }
        };
    }

    async initializeUser(user) {
        if (!user || !isFirebaseConfigured) {
            this.currentUser = null;
            this.userCredits = this.getDefaultCredits();
            return;
        }

        this.currentUser = user;
        await this.loadUserCredits();
    }

    getDefaultCredits() {
        // Default free tier credits
        return {
            current: 10,
            monthly: 10,
            lastRefresh: new Date().toISOString(),
            subscription: 'free',
            usageHistory: []
        };
    }

    async loadUserCredits() {
        if (!isFirebaseConfigured || !this.currentUser) {
            this.userCredits = this.getDefaultCredits();
            return;
        }

        try {
            const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            // Get user document
            const userRef = doc(db, 'users', this.currentUser.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                const userData = userDoc.data();
                const subscription = userData.subscription || 'free';
                const plan = this.subscriptionPlans[subscription];
                
                // Check if credits need to be refreshed
                const lastRefresh = userData.creditsLastRefresh ? new Date(userData.creditsLastRefresh) : new Date(0);
                const now = new Date();
                const shouldRefresh = this.shouldRefreshCredits(lastRefresh, now, subscription);
                
                if (shouldRefresh) {
                    // Refresh credits
                    this.userCredits = {
                        current: plan.monthlyCredits,
                        monthly: plan.monthlyCredits,
                        lastRefresh: now.toISOString(),
                        subscription: subscription,
                        usageHistory: []
                    };
                    
                    // Update in Firebase
                    await this.updateCreditsInFirebase();
                } else {
                    // Use existing credits
                    this.userCredits = {
                        current: userData.creditsRemaining || plan.monthlyCredits,
                        monthly: plan.monthlyCredits,
                        lastRefresh: userData.creditsLastRefresh || now.toISOString(),
                        subscription: subscription,
                        usageHistory: userData.creditsUsageHistory || []
                    };
                }
            } else {
                // New user - create default credits
                this.userCredits = this.getDefaultCredits();
                await this.createUserCreditsDocument();
            }
        } catch (error) {
            console.error('Error loading user credits:', error);
            this.userCredits = this.getDefaultCredits();
        }
    }

    shouldRefreshCredits(lastRefresh, now, subscription) {
        // Monthly refresh on the 1st of each month
        const lastRefreshDate = new Date(lastRefresh);
        const isNewMonth = now.getMonth() !== lastRefreshDate.getMonth() || 
                          now.getFullYear() !== lastRefreshDate.getFullYear();
        
        // For paid plans, refresh monthly
        if (subscription !== 'free' && isNewMonth) {
            return true;
        }
        
        // For free plan, could implement daily refresh if needed
        // const daysSinceRefresh = (now - lastRefreshDate) / (1000 * 60 * 60 * 24);
        // if (subscription === 'free' && daysSinceRefresh >= 30) {
        //     return true;
        // }
        
        return false;
    }

    async createUserCreditsDocument() {
        if (!isFirebaseConfigured || !this.currentUser) return;

        try {
            const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userRef = doc(db, 'users', this.currentUser.uid);
            await setDoc(userRef, {
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName || 'User',
                subscription: 'free',
                creditsRemaining: this.userCredits.current,
                creditsMonthly: this.userCredits.monthly,
                creditsLastRefresh: this.userCredits.lastRefresh,
                creditsUsageHistory: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('Error creating user credits document:', error);
        }
    }

    async updateCreditsInFirebase() {
        if (!isFirebaseConfigured || !this.currentUser) return;

        try {
            const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
            
            const userRef = doc(db, 'users', this.currentUser.uid);
            await updateDoc(userRef, {
                creditsRemaining: this.userCredits.current,
                creditsLastRefresh: this.userCredits.lastRefresh,
                creditsUsageHistory: this.userCredits.usageHistory,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating credits in Firebase:', error);
        }
    }

    async useCredits(amount = 10, description = 'Music generation') {
        // Check if user has enough credits
        const plan = this.subscriptionPlans[this.userCredits.subscription];
        const creditCost = plan.creditCost * amount;
        
        if (this.userCredits.subscription === 'unlimited') {
            // Unlimited users don't consume credits
            return {
                success: true,
                creditsUsed: 0,
                remainingCredits: this.userCredits.current,
                message: 'Unlimited plan - no credits consumed'
            };
        }
        
        if (this.userCredits.current < creditCost) {
            return {
                success: false,
                error: 'Insufficient credits. Please upgrade your plan.',
                remainingCredits: this.userCredits.current,
                required: creditCost
            };
        }
        
        // Deduct credits
        this.userCredits.current -= creditCost;
        
        // Add to usage history
        this.userCredits.usageHistory.push({
            amount: creditCost,
            description: description,
            timestamp: new Date().toISOString(),
            remaining: this.userCredits.current
        });
        
        // Keep only last 100 usage records
        if (this.userCredits.usageHistory.length > 100) {
            this.userCredits.usageHistory = this.userCredits.usageHistory.slice(-100);
        }
        
        // Update Firebase
        await this.updateCreditsInFirebase();
        
        // Update UI
        this.updateCreditsDisplay();
        
        return {
            success: true,
            creditsUsed: creditCost,
            remainingCredits: this.userCredits.current,
            message: `Used ${creditCost} credits for ${description}`
        };
    }

    async addCredits(amount, description = 'Credits added') {
        this.userCredits.current += amount;
        
        // Add to history
        this.userCredits.usageHistory.push({
            amount: amount,
            description: description,
            timestamp: new Date().toISOString(),
            remaining: this.userCredits.current,
            type: 'addition'
        });
        
        // Update Firebase
        await this.updateCreditsInFirebase();
        
        // Update UI
        this.updateCreditsDisplay();
        
        return {
            success: true,
            creditsAdded: amount,
            remainingCredits: this.userCredits.current
        };
    }

    async updateSubscription(newPlan) {
        if (!this.subscriptionPlans[newPlan]) {
            return { success: false, error: 'Invalid subscription plan' };
        }
        
        const oldPlan = this.userCredits.subscription;
        const planData = this.subscriptionPlans[newPlan];
        
        // Update subscription
        this.userCredits.subscription = newPlan;
        this.userCredits.monthly = planData.monthlyCredits;
        
        // If upgrading, add the difference in credits
        if (planData.monthlyCredits > this.subscriptionPlans[oldPlan].monthlyCredits) {
            const creditDifference = planData.monthlyCredits - this.subscriptionPlans[oldPlan].monthlyCredits;
            await this.addCredits(creditDifference, `Upgraded from ${oldPlan} to ${newPlan}`);
        }
        
        // Update Firebase
        if (isFirebaseConfigured && this.currentUser) {
            try {
                const { doc, updateDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
                
                const userRef = doc(db, 'users', this.currentUser.uid);
                await updateDoc(userRef, {
                    subscription: newPlan,
                    creditsMonthly: planData.monthlyCredits,
                    updatedAt: serverTimestamp()
                });
            } catch (error) {
                console.error('Error updating subscription:', error);
            }
        }
        
        return {
            success: true,
            newPlan: newPlan,
            creditsAdded: planData.monthlyCredits > this.subscriptionPlans[oldPlan].monthlyCredits ? 
                         planData.monthlyCredits - this.subscriptionPlans[oldPlan].monthlyCredits : 0,
            totalCredits: this.userCredits.current
        };
    }

    getCredits() {
        return {
            current: this.userCredits?.current || 0,
            monthly: this.userCredits?.monthly || 0,
            subscription: this.userCredits?.subscription || 'free',
            lastRefresh: this.userCredits?.lastRefresh || new Date().toISOString()
        };
    }

    getUsageHistory() {
        return this.userCredits?.usageHistory || [];
    }

    updateCreditsDisplay() {
        // Update all credit displays on the page
        const creditElements = document.querySelectorAll('[data-credits-display]');
        creditElements.forEach(element => {
            element.textContent = this.userCredits?.current || 0;
        });
        
        // Update specific elements by ID
        const userCreditsEl = document.getElementById('userCredits');
        if (userCreditsEl) {
            userCreditsEl.textContent = this.userCredits?.current || 0;
        }
        
        // Update header credits (if showing monetary value)
        const headerCreditsEl = document.getElementById('headerCredits');
        if (headerCreditsEl) {
            // Convert credits to approximate monetary value (example: 1 credit = $0.095)
            const monetaryValue = (this.userCredits?.current || 0) * 0.095;
            headerCreditsEl.textContent = monetaryValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
        
        // Dispatch custom event for other components
        window.dispatchEvent(new CustomEvent('creditsUpdated', {
            detail: this.getCredits()
        }));
    }

    // Check if user can afford an operation
    canAfford(creditCost = 10) {
        if (this.userCredits?.subscription === 'unlimited') {
            return true;
        }
        return (this.userCredits?.current || 0) >= creditCost;
    }

    // Get credit cost for different operations
    getCreditCost(operation = 'generate') {
        const costs = {
            'generate': 10,
            'extend': 5,
            'remix': 8,
            'lyrics': 3,
            'enhance': 5
        };
        
        // Unlimited users have no cost
        if (this.userCredits?.subscription === 'unlimited') {
            return 0;
        }
        
        return costs[operation] || 10;
    }
}

// Create global instance
window.creditsManager = new CreditsManager();

// Export for module usage
export default CreditsManager;