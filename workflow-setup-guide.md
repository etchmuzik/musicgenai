# 🎵 Music Generation Workflow Setup

## Step 1: Import the Workflow

1. **Open n8n** at http://localhost:5679
2. Click **"New Workflow"** or the **"+"** button
3. Click the **3-dot menu** (⋯) in the top right
4. Select **"Import from file"**
5. Choose the file: `music-generation-workflow.json`

## Step 2: Configure Environment Variables

Before activating, you need to set your PiAPI key:

1. In n8n, go to **Settings** → **Variables**
2. Add a new variable:
   - **Name**: `PIAPI_KEY`
   - **Value**: Your PiAPI API key
   - **Type**: String

## Step 3: Review the Workflow

The imported workflow includes:

- **Webhook**: Receives POST requests at `/webhook/generate-music-ai`
- **Generate Music**: Calls PiAPI for music generation
- **Generate Artwork**: Calls PiAPI for image generation  
- **Check if Extend**: Conditionally extends music if duration > 60s
- **Extend Music**: Creates extended version
- **Respond to Webhook**: Returns JSON with CORS headers

## Step 4: Activate the Workflow

1. Click the **"Active"** toggle switch (top right)
2. The workflow should now be listening for webhooks

## Step 5: Get Your Webhook URL

After activation, the webhook URL will be:
`http://localhost:5679/webhook/generate-music-ai`

## Step 6: Test the Integration

1. Open: http://localhost:8181/quick-test-n8n.html
2. Click **"Test Webhook Connection"**
3. If successful, try **"Generate Test Music"**

## Expected Response Format

```json
{
  "audio_url": "https://storage.googleapis.com/...",
  "image_url": "https://storage.googleapis.com/...",
  "extended_audio_url": "https://storage.googleapis.com/..." // or null,
  "prompt": "User's prompt",
  "artworkPrompt": "Generated artwork prompt",
  "genre": "electronic",
  "duration": 60,
  "quality": "high",
  "status": "completed",
  "timestamp": "2025-06-22T15:37:00.000Z"
}
```

## Troubleshooting

### Workflow Import Issues
- Make sure the JSON file is valid
- Try creating nodes manually if import fails

### API Issues
- Verify PIAPI_KEY is set correctly in Variables
- Check PiAPI documentation for correct endpoints

### CORS Issues
- The workflow includes CORS headers in the response
- Make sure "Respond to Webhook" node is configured properly

### No Response
- Check if workflow is **Active** (toggle switch)
- Look at execution logs in n8n for errors
- Verify all HTTP Request nodes have correct URLs

## Files Location
- Workflow JSON: `/Users/etch/Downloads/musicgenmain/musicgenmain/website/music-generation-workflow.json`
- Test page: http://localhost:8181/quick-test-n8n.html
- Main app: http://localhost:8181/app.html

Your web app should now work seamlessly with the n8n workflow! 🎵