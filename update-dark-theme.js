const fs = require('fs');
const path = require('path');

// Dark theme CSS variables
const darkThemeCSS = `--primary: #ffffff;
            --secondary: #1a1a1a;
            --accent: #ffffff;
            --text-primary: #ffffff;
            --text-secondary: #a1a1aa;
            --text-muted: #6b7280;
            --bg-primary: #0a0a0a;
            --bg-secondary: #1a1a1a;
            --bg-glass: rgba(255, 255, 255, 0.05);
            --bg-glass-strong: rgba(255, 255, 255, 0.1);
            --border-glass: rgba(255, 255, 255, 0.1);
            --shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.3);`;

// Navigation fix
const navFix = {
    'href="/"': 'href="index.html"',
    'href="/about"': 'href="about.html"',
    'href="/pricing"': 'href="pricing.html"',
    'href="/help"': 'href="help.html"',
    'href="/app"': 'href="app-enhanced.html"',
    'href="/dashboard"': 'href="dashboard.html"',
    'href="/library"': 'href="library.html"',
    'href="/settings"': 'href="settings.html"'
};

// Files to update
const files = ['about.html', 'help.html', 'dashboard.html', 'library.html', 'settings.html'];

files.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf8');
        
        // Update CSS variables for dark theme
        content = content.replace(
            /--primary: #ffffff;[\s\S]*?--shadow-glass: 0 8px 32px rgba\(31, 38, 135, 0\.37\);/,
            darkThemeCSS
        );
        
        // Fix navigation links
        Object.entries(navFix).forEach(([old, new_]) => {
            content = content.replace(new RegExp(old, 'g'), new_);
        });
        
        // Fix navigation background
        content = content.replace(
            /background: rgba\(255, 255, 255, 0\.8\);/g,
            'background: rgba(10, 10, 10, 0.8);'
        );
        
        content = content.replace(
            /border-bottom: 1px solid rgba\(0, 0, 0, 0\.1\);/g,
            'border-bottom: 1px solid rgba(255, 255, 255, 0.1);'
        );
        
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${file} with dark theme and fixed navigation`);
    }
});

console.log('All pages updated with dark theme!');