/**
 * Stripe Payment Management System
 * Handles subscription billing, payment processing, and customer management
 */

class StripePaymentManager {
    constructor() {
        this.stripe = null;
        this.customerId = null;
        this.currentSubscription = null;
        this.isInitialized = false;
        
        this.initializeStripe();
    }
    
    async initializeStripe() {
        try {
            // Load Stripe.js
            if (!window.Stripe) {
                await this.loadStripeScript();
            }
            
            // Initialize Stripe with publishable key
            this.stripe = Stripe(this.getPublishableKey());
            this.isInitialized = true;
            
            console.log('Stripe initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Stripe:', error);
        }
    }
    
    loadStripeScript() {
        return new Promise((resolve, reject) => {
            if (window.Stripe) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    getPublishableKey() {
        // Use test key for development, environment variable for production
        return process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51Rd8XZGUsJxbJ78Wb4zFtpkKqcKLqj3vpgMerC0KpC6v69QWqB54Ya7MG2wrNfb82MFC8VtH1cjnUU1ny6qpWuhD00RsELXARB';
    }
    
    getApiEndpoint() {
        // In production, this would be your backend API
        return '/api/stripe';
    }
    
    // Subscription Management
    async createSubscription(priceId, customerId = null) {
        if (!this.isInitialized) {
            throw new Error('Stripe not initialized');
        }
        
        try {
            const response = await fetch(`${this.getApiEndpoint()}/create-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    priceId,
                    customerId: customerId || this.customerId
                })
            });
            
            const { clientSecret, subscriptionId } = await response.json();
            
            if (!clientSecret) {
                throw new Error('Failed to create subscription');
            }
            
            // Confirm payment
            const { error, paymentIntent } = await this.stripe.confirmCardPayment(clientSecret);
            
            if (error) {
                throw error;
            }
            
            return {
                success: true,
                subscriptionId,
                paymentIntent
            };
        } catch (error) {
            console.error('Subscription creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async updateSubscription(subscriptionId, newPriceId) {
        try {
            const response = await fetch(`${this.getApiEndpoint()}/update-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    subscriptionId,
                    newPriceId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.currentSubscription = result.subscription;
                await this.syncSubscriptionWithAuth(result.subscription);
                return { success: true, subscription: result.subscription };
            }
            
            throw new Error(result.error);
        } catch (error) {
            console.error('Subscription update failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async cancelSubscription(subscriptionId, immediately = false) {
        try {
            const response = await fetch(`${this.getApiEndpoint()}/cancel-subscription`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    subscriptionId,
                    immediately
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                await this.syncSubscriptionWithAuth(result.subscription);
                return { success: true, subscription: result.subscription };
            }
            
            throw new Error(result.error);
        } catch (error) {
            console.error('Subscription cancellation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Payment Methods
    async createSetupIntent(customerId = null) {
        try {
            const response = await fetch(`${this.getApiEndpoint()}/create-setup-intent`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    customerId: customerId || this.customerId
                })
            });
            
            const { clientSecret } = await response.json();
            return { success: true, clientSecret };
        } catch (error) {
            console.error('Setup intent creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async confirmSetupIntent(clientSecret, cardElement) {
        if (!this.isInitialized) {
            throw new Error('Stripe not initialized');
        }
        
        try {
            const { error, setupIntent } = await this.stripe.confirmCardSetup(clientSecret, {
                payment_method: {
                    card: cardElement,
                    billing_details: {
                        name: this.getCurrentUser()?.displayName || 'Customer'
                    }
                }
            });
            
            if (error) {
                throw error;
            }
            
            return {
                success: true,
                paymentMethod: setupIntent.payment_method
            };
        } catch (error) {
            console.error('Setup intent confirmation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async getPaymentMethods(customerId = null) {
        try {
            const response = await fetch(`${this.getApiEndpoint()}/payment-methods?customerId=${customerId || this.customerId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const result = await response.json();
            return result.paymentMethods || [];
        } catch (error) {
            console.error('Failed to fetch payment methods:', error);
            return [];
        }
    }
    
    async deletePaymentMethod(paymentMethodId) {
        try {
            const response = await fetch(`${this.getApiEndpoint()}/delete-payment-method`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ paymentMethodId })
            });
            
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('Failed to delete payment method:', error);
            return { success: false, error: error.message };
        }
    }
    
    // Customer Management
    async createCustomer(email, name) {
        try {
            const response = await fetch(`${this.getApiEndpoint()}/create-customer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({ email, name })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.customerId = result.customer.id;
                return { success: true, customer: result.customer };
            }
            
            throw new Error(result.error);
        } catch (error) {
            console.error('Customer creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async getCustomer(customerId = null) {
        try {
            const response = await fetch(`${this.getApiEndpoint()}/customer?customerId=${customerId || this.customerId}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.currentCustomer = result.customer;
                return { success: true, customer: result.customer };
            }
            
            throw new Error(result.error);
        } catch (error) {
            console.error('Failed to fetch customer:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Billing & Invoices
    async getInvoices(customerId = null, limit = 10) {
        try {
            const response = await fetch(`${this.getApiEndpoint()}/invoices?customerId=${customerId || this.customerId}&limit=${limit}`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            const result = await response.json();
            return result.invoices || [];
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
            return [];
        }
    }
    
    async downloadInvoice(invoiceId) {
        try {
            const response = await fetch(`${this.getApiEndpoint()}/invoice/${invoiceId}/pdf`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `invoice-${invoiceId}.pdf`;
                link.click();
                window.URL.revokeObjectURL(url);
                return { success: true };
            }
            
            throw new Error('Failed to download invoice');
        } catch (error) {
            console.error('Invoice download failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Subscription Plans Configuration
    getSubscriptionPlans() {
        return {
            starter: {
                monthly: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID || 'price_starter_monthly',
                yearly: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || 'price_starter_yearly',
                name: 'Starter',
                credits: 500,
                price: { monthly: 9, yearly: 86 }
            },
            pro: {
                monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly', 
                yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
                name: 'Pro',
                credits: 2000,
                price: { monthly: 29, yearly: 278 }
            },
            unlimited: {
                monthly: process.env.STRIPE_UNLIMITED_MONTHLY_PRICE_ID || 'price_unlimited_monthly',
                yearly: process.env.STRIPE_UNLIMITED_YEARLY_PRICE_ID || 'price_unlimited_yearly', 
                name: 'Unlimited',
                credits: 10000,
                price: { monthly: 79, yearly: 758 }
            }
        };
    }
    
    getPriceId(plan, billing = 'monthly') {
        const plans = this.getSubscriptionPlans();
        return plans[plan]?.[billing] || null;
    }
    
    // Checkout Session
    async createCheckoutSession(priceId, successUrl, cancelUrl) {
        try {
            const response = await fetch(`${this.getApiEndpoint()}/create-checkout-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    priceId,
                    successUrl,
                    cancelUrl,
                    customerId: this.customerId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                return { success: true, sessionId: result.sessionId };
            }
            
            throw new Error(result.error);
        } catch (error) {
            console.error('Checkout session creation failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    async redirectToCheckout(sessionId) {
        if (!this.isInitialized) {
            throw new Error('Stripe not initialized');
        }
        
        const { error } = await this.stripe.redirectToCheckout({ sessionId });
        
        if (error) {
            console.error('Checkout redirect failed:', error);
            return { success: false, error: error.message };
        }
        
        return { success: true };
    }
    
    // Usage Credits
    async purchaseCredits(amount, paymentMethodId) {
        try {
            const response = await fetch(`${this.getApiEndpoint()}/purchase-credits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.getAuthToken()}`
                },
                body: JSON.stringify({
                    amount,
                    paymentMethodId,
                    customerId: this.customerId
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                await this.syncCreditsWithAuth(result.totalCredits);
                return { success: true, credits: result.totalCredits };
            }
            
            throw new Error(result.error);
        } catch (error) {
            console.error('Credit purchase failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Utility Methods
    async syncSubscriptionWithAuth(subscription) {
        if (window.authManager && subscription) {
            const planType = this.getPlanTypeFromPrice(subscription.items.data[0].price.id);
            await window.authManager.updateSubscription(planType);
        }
    }
    
    async syncCreditsWithAuth(credits) {
        if (window.authManager && typeof credits === 'number') {
            const profile = window.authManager.getUserProfile();
            profile.credits = credits;
            localStorage.setItem('userProfile', JSON.stringify(profile));
        }
    }
    
    getPlanTypeFromPrice(priceId) {
        const plans = this.getSubscriptionPlans();
        for (const [planType, config] of Object.entries(plans)) {
            if (config.monthly === priceId || config.yearly === priceId) {
                return planType;
            }
        }
        return 'free';
    }
    
    getCurrentUser() {
        return window.authManager?.getCurrentUser() || null;
    }
    
    getAuthToken() {
        // In production, this would return a valid JWT token
        return window.authManager?.getCurrentUser()?.accessToken || 'demo_token';
    }
    
    // Format currency
    formatCurrency(amount, currency = 'USD') {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            minimumFractionDigits: 0
        }).format(amount / 100);
    }
    
    // Format date
    formatDate(timestamp) {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Webhook Verification (for backend)
    static verifyWebhookSignature(payload, signature, secret) {
        // This would be implemented on the backend
        // Using Stripe's webhook signature verification
        return true;
    }
}

// Demo/Mock Implementation for Development
class MockStripePaymentManager extends StripePaymentManager {
    constructor() {
        super();
        this.isDemo = true;
        this.mockDelay = 1500; // Simulate API delays
    }
    
    async createSubscription(priceId, customerId = null) {
        await this.simulateDelay();
        
        // Mock successful subscription
        const planType = this.getPlanTypeFromPrice(priceId);
        const subscription = {
            id: 'sub_mock_' + Date.now(),
            status: 'active',
            current_period_end: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60),
            items: {
                data: [{
                    price: { id: priceId }
                }]
            }
        };
        
        await this.syncSubscriptionWithAuth(subscription);
        
        return {
            success: true,
            subscriptionId: subscription.id,
            subscription
        };
    }
    
    async createCheckoutSession(priceId, successUrl, cancelUrl) {
        await this.simulateDelay();
        
        // Mock checkout session - in demo, immediately redirect to success
        setTimeout(() => {
            const planType = this.getPlanTypeFromPrice(priceId);
            this.simulateSuccessfulPayment(planType);
        }, 2000);
        
        return {
            success: true,
            sessionId: 'cs_mock_' + Date.now()
        };
    }
    
    async redirectToCheckout(sessionId) {
        // Mock redirect - show success message
        alert('Mock Payment: Redirecting to checkout...\n\nIn production, this would redirect to Stripe Checkout.');
        return { success: true };
    }
    
    async simulateSuccessfulPayment(planType) {
        if (window.authManager) {
            await window.authManager.updateSubscription(planType);
            alert(`Payment Successful!\n\nYou've been upgraded to ${planType} plan.\nCredits have been updated.`);
            
            // Reload page to reflect changes
            if (window.location.pathname === '/pricing') {
                window.location.reload();
            }
        }
    }
    
    async simulateDelay() {
        return new Promise(resolve => setTimeout(resolve, this.mockDelay));
    }
    
    getPlanTypeFromPrice(priceId) {
        // Mock price ID mapping
        if (priceId.includes('starter')) return 'starter';
        if (priceId.includes('pro')) return 'pro'; 
        if (priceId.includes('unlimited')) return 'unlimited';
        return 'free';
    }
}

// Initialize payment manager
window.paymentManager = new MockStripePaymentManager();

export default StripePaymentManager;
export { MockStripePaymentManager };