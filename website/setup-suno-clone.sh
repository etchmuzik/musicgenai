#!/bin/bash

echo "🎵 Suno Clone Setup Script"
echo "========================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found."
    echo "Please run this script from your Next.js project root."
    exit 1
fi

# Function to prompt for input
prompt_input() {
    local prompt=$1
    local var_name=$2
    local default=$3
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " value
        value=${value:-$default}
    else
        read -p "$prompt: " value
    fi
    
    eval "$var_name='$value'"
}

# Select integration method
echo "🔌 Select Integration Method:"
echo "1) n8n Webhook (recommended)"
echo "2) Direct PiAPI"
echo ""
prompt_input "Enter choice (1 or 2)" INTEGRATION_METHOD "1"

# Configure based on choice
if [ "$INTEGRATION_METHOD" = "1" ]; then
    echo ""
    echo "📡 n8n Webhook Configuration"
    echo "----------------------------"
    prompt_input "Enter your n8n webhook URL" N8N_URL "https://your-n8n.com/webhook"
    
    # Create/update .env.local
    echo "N8N_WEBHOOK_URL=$N8N_URL" > .env.local
    echo "NEXT_PUBLIC_API_ENDPOINT=/api/proxy" >> .env.local
    
    echo ""
    echo "✅ n8n configuration saved to .env.local"
    echo ""
    echo "📋 Next steps for n8n:"
    echo "1. Import the workflow JSON from suno-integration-guide.md"
    echo "2. Configure PiAPI credentials in n8n"
    echo "3. Enable CORS in webhook settings"
    echo "4. Test with: node test-connection.js"
    
else
    echo ""
    echo "🔑 Direct PiAPI Configuration"
    echo "-----------------------------"
    prompt_input "Enter your PiAPI key" PIAPI_KEY ""
    
    # Create/update .env.local
    echo "PIAPI_KEY=$PIAPI_KEY" > .env.local
    echo "PIAPI_BASE_URL=https://api.piapi.ai" >> .env.local
    echo "NEXT_PUBLIC_API_ENDPOINT=/api/generate-music" >> .env.local
    
    echo ""
    echo "✅ PiAPI configuration saved to .env.local"
fi

# Install dependencies if needed
echo ""
echo "📦 Checking dependencies..."
if ! grep -q "lucide-react" package.json; then
    echo "Installing required packages..."
    npm install lucide-react wavesurfer.js
fi

# Create API directory if it doesn't exist
mkdir -p pages/api

# Create proxy endpoint for n8n
if [ "$INTEGRATION_METHOD" = "1" ]; then
    cat > pages/api/proxy/[...path].ts << 'EOF'
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path } = req.query;
  const endpoint = Array.isArray(path) ? path.join('/') : path;
  
  try {
    const response = await fetch(`${process.env.N8N_WEBHOOK_URL}/${endpoint}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy request failed' });
  }
}
EOF
fi

# Create direct API endpoint
if [ "$INTEGRATION_METHOD" = "2" ]; then
    cat > pages/api/generate-music.ts << 'EOF'
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://api.piapi.ai/api/suno/v1/music', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.PIAPI_KEY!
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    
    // Start polling for completion
    if (data.data?.task_id) {
      // You can implement polling here or return task_id for client-side polling
      res.status(200).json({ success: true, taskId: data.data.task_id });
    } else {
      res.status(500).json({ error: 'Failed to start generation' });
    }
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate music' });
  }
}
EOF
fi

# Update next.config.js for CORS
if [ ! -f "next.config.js" ]; then
    cat > next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
EOF
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "✅ Configuration saved to .env.local"
echo "✅ API endpoints created"
echo "✅ CORS configured"
echo ""
echo "📋 To start development:"
echo "npm run dev"
echo ""
echo "📋 To test connection:"
echo "node test-connection.js"
echo ""
echo "📋 To deploy:"
echo "vercel --prod"
echo ""
echo "🔗 Resources:"
echo "- Integration guide: suno-integration-guide.md"
echo "- Test script: test-connection.js"
echo "- PiAPI docs: https://piapi.ai/docs"