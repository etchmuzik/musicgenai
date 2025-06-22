// Quick script to check your n8n setup
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjNTg1NTQxNi1jMWQ0LTQ3NTctYWYzMi0zYzBlOGI1ZTVmZjgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUwNjA0ODMxfQ.s8o4k9McDO0g5nUe4bcGcitlSACUEv2uwdTSNEbYzCQ';

async function checkN8nSetup() {
    console.log('🔍 Checking your n8n setup...\n');

    // Check common n8n endpoints
    const endpoints = [
        'http://localhost:5678',
        'https://localhost:5678',
        'http://localhost:5679',
        'https://app.n8n.cloud',
        'https://n8n.cloud'
    ];

    for (const endpoint of endpoints) {
        try {
            console.log(`Testing ${endpoint}...`);
            const response = await fetch(endpoint + '/api/v1/health', {
                headers: { 'X-N8N-API-KEY': API_KEY }
            });
            
            if (response.ok) {
                console.log(`✅ Found n8n at: ${endpoint}`);
                console.log('Response:', await response.json());
                return endpoint;
            }
        } catch (error) {
            // Silent fail, try next
        }
    }

    console.log('\n❌ Could not find n8n. Please check:');
    console.log('1. Is n8n running?');
    console.log('2. What URL is it running on?');
    console.log('3. Is this a cloud instance? If so, what\'s your instance URL?');
}

// Check if this is a cloud API key
function analyzeApiKey(key) {
    try {
        // Decode JWT without verification
        const parts = key.split('.');
        const payload = JSON.parse(atob(parts[1]));
        
        console.log('\n📋 API Key Info:');
        console.log('- Subject:', payload.sub);
        console.log('- Issuer:', payload.iss);
        console.log('- Audience:', payload.aud);
        console.log('- Issued at:', new Date(payload.iat * 1000).toLocaleString());
        
        return payload;
    } catch (error) {
        console.error('Could not decode API key');
    }
}

// If running in Node.js
if (typeof window === 'undefined') {
    checkN8nSetup();
    analyzeApiKey(API_KEY);
} else {
    // Browser environment
    console.log('Run checkN8nSetup() to test your connection');
    window.checkN8nSetup = checkN8nSetup;
    window.analyzeApiKey = analyzeApiKey;
}