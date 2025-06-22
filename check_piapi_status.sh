#!/bin/bash

# PiAPI Status Checker
# Run this script to check if PiAPI service is back online

echo "🔍 Checking PiAPI Service Status..."
echo "======================================"

# Test the main endpoint
response=$(curl -s -X POST "https://api.piapi.ai/api/v1/task" \
-H "X-API-Key: d3a513bec58ea7c7e60eebf377fbbfb806f2304f12e1ef208cd701139658c088" \
-H "Content-Type: application/json" \
-d '{
  "model": "music-s",
  "task_type": "generate_music",
  "input": {
    "gpt_description_prompt": "test connectivity",
    "make_instrumental": true
  },
  "config": {
    "service_mode": "public"
  }
}')

echo "📡 Response: $response"
echo ""

# Check if service is available
if echo "$response" | grep -q "Service is under maintenance"; then
    echo "❌ PIAPI STATUS: UNDER MAINTENANCE"
    echo "   The service is still down. Your app will show maintenance errors."
    echo ""
    echo "🔄 What to do:"
    echo "   - Wait for PiAPI to complete maintenance"
    echo "   - Users will see: 'Music generation service is under maintenance'"
    echo "   - Monitor this script periodically"
elif echo "$response" | grep -q "task_id"; then
    echo "✅ PIAPI STATUS: ONLINE"
    echo "   Service is working! Your app should generate music successfully."
    echo ""
    echo "🎉 Your app is ready for music generation!"
else
    echo "⚠️  PIAPI STATUS: UNKNOWN"
    echo "   Unexpected response. Check your API key or network."
fi

echo ""
echo "🏁 Status check complete."