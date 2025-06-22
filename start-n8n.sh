#!/bin/bash

# Set the PiAPI key environment variable
export PIAPI_API_KEY="d3a513bec58ea7c7e60eebf377fbbfb806f2304f12e1ef208cd701139658c088"

# Set recommended n8n settings
export N8N_RUNNERS_ENABLED=true
export N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true

# Start n8n on port 5679
export N8N_PORT=5679

echo "🚀 Starting n8n with:"
echo "   - Port: 5679"
echo "   - PiAPI Key: Set"
echo "   - Task Runners: Enabled"
echo ""
echo "🌐 Access n8n at: http://localhost:5679"
echo "📋 Workflow: 'Music Generation AI Workflow' imported"
echo "🔗 Webhook: http://localhost:5679/webhook/generate-music-ai"
echo ""

npx n8n start