// Test Connection Script for Suno Clone + PiAPI
// Run with: node test-connection.js

const https = require('https');

// Configuration
const config = {
  // Option 1: n8n webhook
  n8nWebhook: 'https://your-n8n.com/webhook/generate-music-ai',
  
  // Option 2: Direct PiAPI
  piApiKey: 'YOUR_PIAPI_KEY',
  piApiUrl: 'https://api.piapi.ai/api/suno/v1/music'
};

// Test n8n Connection
async function testN8nConnection() {
  console.log('🔄 Testing n8n webhook connection...');
  
  const data = JSON.stringify({
    prompt: 'Test: upbeat electronic music',
    customMode: false,
    model: 'chirp-v3-5'
  });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(config.n8nWebhook, options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ n8n Response:', res.statusCode);
        console.log('📦 Data:', responseData.substring(0, 200) + '...');
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ n8n Error:', error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Test Direct PiAPI Connection
async function testPiApiConnection() {
  console.log('\n🔄 Testing direct PiAPI connection...');
  
  const data = JSON.stringify({
    prompt: 'Test: ambient relaxing music',
    custom_mode: false,
    model: 'chirp-v3-5'
  });

  const url = new URL(config.piApiUrl);
  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': config.piApiKey,
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        console.log('✅ PiAPI Response:', res.statusCode);
        try {
          const jsonData = JSON.parse(responseData);
          if (jsonData.data && jsonData.data.task_id) {
            console.log('📦 Task ID:', jsonData.data.task_id);
            console.log('🎵 Status:', jsonData.data.status);
          } else {
            console.log('📦 Response:', responseData.substring(0, 200) + '...');
          }
        } catch (e) {
          console.log('📦 Raw Response:', responseData.substring(0, 200) + '...');
        }
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error('❌ PiAPI Error:', error.message);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Test CORS Preflight
async function testCors(url) {
  console.log(`\n🔄 Testing CORS for ${url}...`);
  
  const urlObj = new URL(url);
  const options = {
    hostname: urlObj.hostname,
    path: urlObj.pathname,
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'Content-Type'
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      console.log('✅ CORS Status:', res.statusCode);
      console.log('📦 Headers:', {
        'access-control-allow-origin': res.headers['access-control-allow-origin'],
        'access-control-allow-methods': res.headers['access-control-allow-methods'],
        'access-control-allow-headers': res.headers['access-control-allow-headers']
      });
      resolve();
    });

    req.on('error', (error) => {
      console.error('❌ CORS Error:', error.message);
      resolve();
    });

    req.end();
  });
}

// Run tests
async function runTests() {
  console.log('🚀 Suno Clone Connection Test\n');
  
  // Test n8n if configured
  if (config.n8nWebhook !== 'https://your-n8n.com/webhook/generate-music-ai') {
    await testCors(config.n8nWebhook);
    await testN8nConnection().catch(e => console.error('n8n test failed:', e.message));
  } else {
    console.log('⏭️  Skipping n8n test (not configured)');
  }
  
  // Test PiAPI if configured  
  if (config.piApiKey !== 'YOUR_PIAPI_KEY') {
    await testPiApiConnection().catch(e => console.error('PiAPI test failed:', e.message));
  } else {
    console.log('⏭️  Skipping PiAPI test (not configured)');
  }
  
  console.log('\n✅ Connection test complete!');
  console.log('\n📌 Next steps:');
  console.log('1. Update the config object with your actual URLs/keys');
  console.log('2. Run this script again to verify connections');
  console.log('3. Update your .env.local with working values');
  console.log('4. Deploy to Vercel with environment variables');
}

// Run the tests
runTests();