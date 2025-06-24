/**
 * Stripe Checkout Modal Component
 * Handles subscription billing and payment processing UI
 */

class CheckoutModal {
    constructor() {
        this.isOpen = false;
        this.selectedPlan = null;
        this.selectedBilling = 'monthly';
        this.createModal();
        this.initializeEventListeners();
    }
    
    createModal() {
        const modalHTML = `
            <div class="checkout-modal" id="checkoutModal">
                <div class="checkout-modal-overlay" onclick="window.checkoutModal.close()"></div>
                <div class="checkout-modal-content">
                    <button class="checkout-modal-close" onclick="window.checkoutModal.close()">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <!-- Plan Selection Step -->
                    <div class="checkout-step" id="planSelectionStep">
                        <div class="checkout-header">
                            <h2>Choose Your Plan</h2>
                            <p>Select the perfect plan for your music creation needs</p>
                        </div>
                        
                        <div class="billing-toggle">
                            <button class="billing-option active" data-billing="monthly">
                                Monthly
                            </button>
                            <button class="billing-option" data-billing="yearly">
                                Yearly
                                <span class="savings-badge">Save 20%</span>
                            </button>
                        </div>
                        
                        <div class="checkout-plans">
                            <div class="checkout-plan-card" data-plan="starter">
                                <div class="plan-header">
                                    <h3>Starter</h3>
                                    <div class="plan-price">
                                        <span class="price monthly">$9</span>
                                        <span class="price yearly" style="display: none;">$86</span>
                                        <span class="period monthly">/month</span>
                                        <span class="period yearly" style="display: none;">/year</span>
                                    </div>
                                </div>
                                <ul class="plan-features">
                                    <li><i class="fas fa-check"></i> 500 credits/month</li>
                                    <li><i class="fas fa-check"></i> 100 songs per month</li>
                                    <li><i class="fas fa-check"></i> High quality audio</li>
                                    <li><i class="fas fa-check"></i> Basic remix features</li>
                                </ul>
                                <button class="plan-select-btn" onclick="window.checkoutModal.selectPlan('starter')">
                                    Select Starter
                                </button>
                            </div>
                            
                            <div class="checkout-plan-card popular" data-plan="pro">
                                <div class="popular-badge">Most Popular</div>
                                <div class="plan-header">
                                    <h3>Pro</h3>
                                    <div class="plan-price">
                                        <span class="price monthly">$29</span>
                                        <span class="price yearly" style="display: none;">$278</span>
                                        <span class="period monthly">/month</span>
                                        <span class="period yearly" style="display: none;">/year</span>
                                    </div>
                                </div>
                                <ul class="plan-features">
                                    <li><i class="fas fa-check"></i> 2,000 credits/month</li>
                                    <li><i class="fas fa-check"></i> 400 songs per month</li>
                                    <li><i class="fas fa-check"></i> Studio quality audio</li>
                                    <li><i class="fas fa-check"></i> Commercial license</li>
                                    <li><i class="fas fa-check"></i> API access</li>
                                </ul>
                                <button class="plan-select-btn" onclick="window.checkoutModal.selectPlan('pro')">
                                    Select Pro
                                </button>
                            </div>
                            
                            <div class="checkout-plan-card" data-plan="unlimited">
                                <div class="plan-header">
                                    <h3>Unlimited</h3>
                                    <div class="plan-price">
                                        <span class="price monthly">$79</span>
                                        <span class="price yearly" style="display: none;">$758</span>
                                        <span class="period monthly">/month</span>
                                        <span class="period yearly" style="display: none;">/year</span>
                                    </div>
                                </div>
                                <ul class="plan-features">
                                    <li><i class="fas fa-check"></i> 10,000 credits/month</li>
                                    <li><i class="fas fa-check"></i> 2000+ songs per month</li>
                                    <li><i class="fas fa-check"></i> Lossless quality</li>
                                    <li><i class="fas fa-check"></i> Custom AI training</li>
                                    <li><i class="fas fa-check"></i> Dedicated support</li>
                                </ul>
                                <button class="plan-select-btn" onclick="window.checkoutModal.selectPlan('unlimited')">
                                    Select Unlimited
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Payment Processing Step -->
                    <div class="checkout-step" id="paymentStep" style="display: none;">
                        <div class="checkout-header">
                            <h2>Payment Details</h2>
                            <p>Complete your subscription to start creating music</p>
                        </div>
                        
                        <div class="selected-plan-summary">
                            <div class="plan-summary-header">
                                <h3 id="selectedPlanName">Pro Plan</h3>
                                <div class="plan-summary-price">
                                    <span id="selectedPlanPrice">$29</span>
                                    <span id="selectedPlanPeriod">/month</span>
                                </div>
                            </div>
                            <div class="plan-summary-features" id="selectedPlanFeatures">
                                <!-- Features will be populated -->
                            </div>
                        </div>
                        
                        <div class="payment-form">
                            <div class="payment-method-section">
                                <h4>Payment Method</h4>
                                
                                <!-- Stripe Elements will be inserted here -->
                                <div class="card-element-container">
                                    <div id="card-element">
                                        <!-- Stripe Elements will create form elements here -->
                                    </div>
                                    <div id="card-errors" class="payment-error"></div>
                                </div>
                            </div>
                            
                            <div class="billing-info-section">
                                <h4>Billing Information</h4>
                                <div class="billing-fields">
                                    <div class="field-group">
                                        <label for="billingName">Full Name</label>
                                        <input type="text" id="billingName" placeholder="Enter your full name" required>
                                    </div>
                                    <div class="field-group">
                                        <label for="billingEmail">Email</label>
                                        <input type="email" id="billingEmail" placeholder="Enter your email" required>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="payment-actions">
                                <button class="btn btn-secondary" onclick="window.checkoutModal.goBack()">
                                    <i class="fas fa-arrow-left"></i>
                                    Back to Plans
                                </button>
                                <button class="btn btn-primary" id="submitPaymentBtn" onclick="window.checkoutModal.processPayment()">
                                    <i class="fas fa-credit-card"></i>
                                    Complete Purchase
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Loading Step -->
                    <div class="checkout-step checkout-loading" id="loadingStep" style="display: none;">
                        <div class="loading-content">
                            <div class="checkout-spinner"></div>
                            <h3>Processing Payment...</h3>
                            <p>Please don't close this window</p>
                        </div>
                    </div>
                    
                    <!-- Success Step -->
                    <div class="checkout-step checkout-success" id="successStep" style="display: none;">
                        <div class="success-content">
                            <div class="success-icon">
                                <i class="fas fa-check-circle"></i>
                            </div>
                            <h3>Payment Successful!</h3>
                            <p>Welcome to your new plan! Your credits have been updated and new features are now available.</p>
                            <div class="success-actions">
                                <button class="btn btn-primary" onclick="window.checkoutModal.completeCheckout()">
                                    Start Creating Music
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.addModalStyles();
    }
    
    addModalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Checkout Modal */
            .checkout-modal {
                position: fixed;
                inset: 0;
                z-index: 10000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 1rem;
            }
            
            .checkout-modal.active {
                display: flex;
            }
            
            .checkout-modal-overlay {
                position: absolute;
                inset: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
            }
            
            .checkout-modal-content {
                position: relative;
                background: var(--bg-secondary);
                border: 1px solid var(--border-color);
                border-radius: 1rem;
                width: 100%;
                max-width: 800px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
            }
            
            .checkout-modal-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                color: var(--text-secondary);
                font-size: 1.25rem;
                cursor: pointer;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease;
                z-index: 1;
            }
            
            .checkout-modal-close:hover {
                background: rgba(255, 255, 255, 0.1);
                color: var(--text-primary);
            }
            
            .checkout-step {
                padding: 2rem;
            }
            
            .checkout-header {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .checkout-header h2 {
                font-size: 1.75rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                color: var(--text-primary);
            }
            
            .checkout-header p {
                color: var(--text-secondary);
                font-size: 1rem;
            }
            
            .billing-toggle {
                display: flex;
                justify-content: center;
                background: var(--bg-tertiary);
                border-radius: 2rem;
                padding: 0.25rem;
                margin: 2rem auto;
                width: fit-content;
            }
            
            .billing-option {
                padding: 0.75rem 1.5rem;
                border-radius: 2rem;
                background: transparent;
                border: none;
                color: var(--text-secondary);
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .billing-option.active {
                background: var(--primary);
                color: white;
            }
            
            .savings-badge {
                background: var(--accent);
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 1rem;
                font-size: 0.75rem;
                font-weight: 600;
            }
            
            .checkout-plans {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .checkout-plan-card {
                background: var(--bg-card);
                border: 2px solid var(--border);
                border-radius: 1rem;
                padding: 1.5rem;
                position: relative;
                transition: all 0.2s ease;
                cursor: pointer;
            }
            
            .checkout-plan-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            }
            
            .checkout-plan-card.popular {
                border-color: var(--primary);
                background: rgba(139, 92, 246, 0.05);
            }
            
            .popular-badge {
                position: absolute;
                top: -12px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--primary);
                color: white;
                padding: 0.25rem 1rem;
                border-radius: 1rem;
                font-size: 0.875rem;
                font-weight: 600;
            }
            
            .plan-header h3 {
                font-size: 1.25rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
            }
            
            .plan-price {
                margin-bottom: 1.5rem;
            }
            
            .plan-price .price {
                font-size: 2rem;
                font-weight: 800;
                color: var(--primary);
            }
            
            .plan-price .period {
                color: var(--text-secondary);
                font-size: 1rem;
            }
            
            .plan-features {
                list-style: none;
                padding: 0;
                margin: 0 0 1.5rem 0;
            }
            
            .plan-features li {
                padding: 0.5rem 0;
                display: flex;
                align-items: center;
                gap: 0.75rem;
                font-size: 0.875rem;
            }
            
            .plan-features i {
                color: var(--success);
                font-size: 1rem;
            }
            
            .plan-select-btn {
                width: 100%;
                background: var(--primary-gradient);
                border: none;
                border-radius: 0.5rem;
                padding: 0.75rem;
                color: white;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .plan-select-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
            }
            
            .selected-plan-summary {
                background: var(--bg-card);
                border: 1px solid var(--border);
                border-radius: 1rem;
                padding: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .plan-summary-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid var(--border);
            }
            
            .plan-summary-header h3 {
                font-size: 1.25rem;
                font-weight: 700;
                margin: 0;
            }
            
            .plan-summary-price {
                font-size: 1.5rem;
                font-weight: 800;
                color: var(--primary);
            }
            
            .plan-summary-features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 0.5rem;
                font-size: 0.875rem;
                color: var(--text-secondary);
            }
            
            .payment-form {
                max-width: 500px;
                margin: 0 auto;
            }
            
            .payment-method-section,
            .billing-info-section {
                margin-bottom: 2rem;
            }
            
            .payment-method-section h4,
            .billing-info-section h4 {
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
                color: var(--text-primary);
            }
            
            .card-element-container {
                background: var(--bg-tertiary);
                border: 2px solid transparent;
                border-radius: 0.5rem;
                padding: 1rem;
                transition: border-color 0.2s ease;
            }
            
            .card-element-container:focus-within {
                border-color: var(--primary);
            }
            
            .payment-error {
                color: #ef4444;
                font-size: 0.875rem;
                margin-top: 0.5rem;
                display: none;
            }
            
            .payment-error.active {
                display: block;
            }
            
            .billing-fields {
                display: grid;
                gap: 1rem;
            }
            
            .field-group label {
                display: block;
                font-weight: 500;
                margin-bottom: 0.5rem;
                color: var(--text-primary);
                font-size: 0.875rem;
            }
            
            .field-group input {
                width: 100%;
                background: var(--bg-tertiary);
                border: 2px solid transparent;
                border-radius: 0.5rem;
                padding: 0.75rem;
                color: var(--text-primary);
                font-size: 1rem;
                transition: border-color 0.2s ease;
            }
            
            .field-group input:focus {
                outline: none;
                border-color: var(--primary);
            }
            
            .payment-actions {
                display: flex;
                gap: 1rem;
                justify-content: space-between;
                margin-top: 2rem;
            }
            
            .payment-actions .btn {
                flex: 1;
                padding: 0.875rem;
                font-weight: 600;
                border-radius: 0.5rem;
            }
            
            .checkout-loading,
            .checkout-success {
                text-align: center;
                padding: 3rem 2rem;
            }
            
            .loading-content h3,
            .success-content h3 {
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
            }
            
            .loading-content p,
            .success-content p {
                color: var(--text-secondary);
                margin-bottom: 2rem;
            }
            
            .checkout-spinner {
                width: 50px;
                height: 50px;
                border: 4px solid rgba(139, 92, 246, 0.2);
                border-top: 4px solid var(--primary);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 2rem;
            }
            
            .success-icon {
                font-size: 4rem;
                color: var(--success);
                margin-bottom: 1rem;
            }
            
            .success-actions .btn {
                padding: 1rem 2rem;
                font-size: 1.125rem;
                font-weight: 600;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Mobile Responsive */
            @media (max-width: 768px) {
                .checkout-modal-content {
                    max-width: none;
                    width: 100%;
                    height: 100%;
                    max-height: none;
                    border-radius: 0;
                }
                
                .checkout-step {
                    padding: 1.5rem;
                }
                
                .checkout-plans {
                    grid-template-columns: 1fr;
                }
                
                .payment-actions {
                    flex-direction: column;
                }
                
                .billing-toggle {
                    width: 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    initializeEventListeners() {
        // Billing toggle
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('billing-option')) {
                document.querySelectorAll('.billing-option').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
                this.selectedBilling = e.target.dataset.billing;
                this.updatePlanPricing();
            }
        });
        
        // Close modal on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }
    
    open(plan = null) {
        this.isOpen = true;
        document.getElementById('checkoutModal').classList.add('active');
        document.body.style.overflow = 'hidden';
        
        if (plan) {
            this.selectPlan(plan);
        } else {
            this.showStep('planSelectionStep');
        }
        
        // Initialize user data if authenticated
        if (window.authManager && window.authManager.isAuthenticated()) {
            const user = window.authManager.getCurrentUser();
            if (user) {
                document.getElementById('billingName').value = user.displayName || '';
                document.getElementById('billingEmail').value = user.email || '';
            }
        }
    }
    
    close() {
        this.isOpen = false;
        document.getElementById('checkoutModal').classList.remove('active');
        document.body.style.overflow = '';
        this.reset();
    }
    
    reset() {
        this.selectedPlan = null;
        this.selectedBilling = 'monthly';
        this.showStep('planSelectionStep');
        this.clearCardElement();
        
        // Reset form
        document.getElementById('billingName').value = '';
        document.getElementById('billingEmail').value = '';
        document.getElementById('card-errors').textContent = '';
        document.getElementById('card-errors').classList.remove('active');
    }
    
    showStep(stepId) {
        document.querySelectorAll('.checkout-step').forEach(step => {
            step.style.display = 'none';
        });
        document.getElementById(stepId).style.display = 'block';
    }
    
    selectPlan(plan) {
        this.selectedPlan = plan;
        this.updatePlanSummary();
        this.showStep('paymentStep');
        this.initializeStripeElements();
    }
    
    goBack() {
        this.showStep('planSelectionStep');
        this.clearCardElement();
    }
    
    updatePlanPricing() {
        const yearlyActive = this.selectedBilling === 'yearly';
        
        document.querySelectorAll('.monthly').forEach(el => {
            el.style.display = yearlyActive ? 'none' : 'inline';
        });
        
        document.querySelectorAll('.yearly').forEach(el => {
            el.style.display = yearlyActive ? 'inline' : 'none';
        });
        
        if (this.selectedPlan) {
            this.updatePlanSummary();
        }
    }
    
    updatePlanSummary() {
        const planData = {
            starter: {
                name: 'Starter Plan',
                price: { monthly: '$9', yearly: '$86' },
                period: { monthly: '/month', yearly: '/year' },
                features: ['500 credits/month', '100 songs per month', 'High quality audio', 'Basic remix features']
            },
            pro: {
                name: 'Pro Plan',
                price: { monthly: '$29', yearly: '$278' },
                period: { monthly: '/month', yearly: '/year' },
                features: ['2,000 credits/month', '400 songs per month', 'Studio quality audio', 'Commercial license', 'API access']
            },
            unlimited: {
                name: 'Unlimited Plan',
                price: { monthly: '$79', yearly: '$758' },
                period: { monthly: '/month', yearly: '/year' },
                features: ['10,000 credits/month', '2000+ songs per month', 'Lossless quality', 'Custom AI training', 'Dedicated support']
            }
        };
        
        const plan = planData[this.selectedPlan];
        if (!plan) return;
        
        document.getElementById('selectedPlanName').textContent = plan.name;
        document.getElementById('selectedPlanPrice').textContent = plan.price[this.selectedBilling];
        document.getElementById('selectedPlanPeriod').textContent = plan.period[this.selectedBilling];
        
        const featuresHtml = plan.features.map(feature => 
            `<div><i class="fas fa-check" style="color: var(--success); margin-right: 0.5rem;"></i>${feature}</div>`
        ).join('');
        document.getElementById('selectedPlanFeatures').innerHTML = featuresHtml;
    }
    
    async initializeStripeElements() {
        if (!window.paymentManager || !window.paymentManager.isInitialized) {
            console.error('Payment manager not initialized');
            return;
        }
        
        // Create Stripe Elements
        const elements = window.paymentManager.stripe.elements();
        
        // Create card element
        this.cardElement = elements.create('card', {
            style: {
                base: {
                    fontSize: '16px',
                    color: getComputedStyle(document.documentElement).getPropertyValue('--text-primary'),
                    '::placeholder': {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                    },
                },
            },
        });
        
        // Mount card element
        this.cardElement.mount('#card-element');
        
        // Handle real-time validation errors from the card Element
        this.cardElement.on('change', (event) => {
            const displayError = document.getElementById('card-errors');
            if (event.error) {
                displayError.textContent = event.error.message;
                displayError.classList.add('active');
            } else {
                displayError.textContent = '';
                displayError.classList.remove('active');
            }
        });
    }
    
    clearCardElement() {
        if (this.cardElement) {
            this.cardElement.unmount();
            this.cardElement = null;
        }
    }
    
    async processPayment() {
        if (!this.validateForm()) return;
        
        this.showStep('loadingStep');
        
        try {
            const priceId = window.paymentManager.getPriceId(this.selectedPlan, this.selectedBilling);
            if (!priceId) {
                throw new Error('Invalid plan configuration');
            }
            
            // Create checkout session and redirect to Stripe
            const result = await window.paymentManager.createCheckoutSession(
                priceId,
                `${window.location.origin}/success`,
                `${window.location.origin}/pricing`
            );
            
            if (result.success) {
                await window.paymentManager.redirectToCheckout(result.sessionId);
            } else {
                throw new Error(result.error);
            }
            
        } catch (error) {
            console.error('Payment processing failed:', error);
            this.showPaymentError(error.message);
            this.showStep('paymentStep');
        }
    }
    
    validateForm() {
        const name = document.getElementById('billingName').value.trim();
        const email = document.getElementById('billingEmail').value.trim();
        
        if (!name) {
            this.showPaymentError('Please enter your full name');
            return false;
        }
        
        if (!email) {
            this.showPaymentError('Please enter your email address');
            return false;
        }
        
        if (!this.cardElement) {
            this.showPaymentError('Please enter your payment information');
            return false;
        }
        
        return true;
    }
    
    showPaymentError(message) {
        const errorElement = document.getElementById('card-errors');
        errorElement.textContent = message;
        errorElement.classList.add('active');
    }
    
    showSuccess() {
        this.showStep('successStep');
    }
    
    completeCheckout() {
        this.close();
        // Redirect to create page or reload current page
        if (window.location.pathname === '/pricing') {
            window.location.reload();
        } else {
            window.location.href = '/create';
        }
    }
}

// Initialize checkout modal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.checkoutModal = new CheckoutModal();
});

export default CheckoutModal;