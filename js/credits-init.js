// Credits initialization module - loads credits manager on all pages
import { authManager } from './firebase-config-safe.js';
import './credits-manager.js';

// Initialize credits when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Add data-credits-display attribute to all credit display elements
    const creditElements = document.querySelectorAll('#userCredits, .credits-value');
    creditElements.forEach(el => {
        el.setAttribute('data-credits-display', 'true');
    });
    
    // Listen for credit updates
    window.addEventListener('creditsUpdated', (event) => {
        const credits = event.detail;
        console.log('Credits updated:', credits);
    });
});

// Export for use in other modules
export const creditsManager = window.creditsManager;