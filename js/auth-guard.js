// Authentication Guard - Protects pages that require login
// Include this script on all protected pages

(function() {
    'use strict';
    
    // Define public pages that don't require authentication
    const publicPages = [
        '/',
        '/index.html',
        '/auth.html',
        '/explore.html',
        '/pricing.html',
        '/terms.html',
        '/privacy.html',
        '/about.html'
    ];
    
    // Get current page path
    const currentPath = window.location.pathname;
    
    // Check if current page is public
    const isPublicPage = publicPages.some(page => 
        currentPath === page || currentPath.endsWith(page)
    );
    
    // If not a public page, check authentication
    if (!isPublicPage) {
        // Check for any auth indicators
        const hasAuth = 
            localStorage.getItem('userToken') || 
            sessionStorage.getItem('user') ||
            localStorage.getItem('userProfile') ||
            localStorage.getItem('user');
        
        // If no auth found, redirect to login
        if (!hasAuth) {
            const redirectUrl = encodeURIComponent(window.location.href);
            window.location.replace(`/auth.html?redirect=${redirectUrl}`);
            return;
        }
        
        // If using mock auth, ensure we have basic user data
        if (!localStorage.getItem('userProfile')) {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.email) {
                // Create basic profile from auth data
                const profile = {
                    uid: 'mock_' + Date.now(),
                    email: user.email,
                    displayName: user.name || user.email.split('@')[0],
                    credits: 10,
                    subscription: 'free',
                    totalSongsGenerated: 0,
                    createdAt: new Date().toISOString()
                };
                localStorage.setItem('userProfile', JSON.stringify(profile));
            }
        }
    }
    
    // Add auth state indicator to body
    document.addEventListener('DOMContentLoaded', function() {
        const isAuthenticated = !!(
            localStorage.getItem('userToken') || 
            sessionStorage.getItem('user') ||
            localStorage.getItem('userProfile')
        );
        
        document.body.classList.add(isAuthenticated ? 'authenticated' : 'unauthenticated');
        
        // Update auth-dependent UI elements
        document.querySelectorAll('[data-auth="true"]').forEach(el => {
            el.style.display = isAuthenticated ? '' : 'none';
        });
        
        document.querySelectorAll('[data-auth="false"]').forEach(el => {
            el.style.display = isAuthenticated ? 'none' : '';
        });
    });
    
    // Global logout function
    window.logout = function() {
        // Clear all auth data
        localStorage.removeItem('userToken');
        localStorage.removeItem('userProfile');
        localStorage.removeItem('user');
        localStorage.removeItem('rememberUser');
        sessionStorage.clear();
        
        // Redirect to home
        window.location.href = '/';
    };
})();