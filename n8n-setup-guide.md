# 🔧 n8n Setup Guide

## Current Status
- ✅ n8n is running on port **5679**
- ✅ Web server running on port **8181**
- ❌ Webhook not responding (workflow needs to be set up)

## Step-by-Step Setup

### 1. Access n8n Interface
Open: http://localhost:5679

### 2. Create/Import Your Workflow

If you have a workflow JSON file:
1. Click **"Workflows"** → **"Import from File"**
2. Select your workflow JSON

If you need to create from scratch:
1. Click **"New Workflow"**
2. Add a **Webhook** node:
   - Click **"+"** → Search **"Webhook"**
   - Set **HTTP Method**: POST
   - Set **Path**: `generate-music-ai`
   - Click **"Listen For Test Event"**

3. Add your PiAPI nodes for:
   - Music generation
   - Image generation
   - Extended audio (optional)

4. Add a **Respond to Webhook** node:
   - Set **Response Mode**: "When Last Node Finishes"
   - Add **Response Headers**:
     ```
     Access-Control-Allow-Origin: *
     Access-Control-Allow-Methods: POST, OPTIONS
     Access-Control-Allow-Headers: Content-Type
     ```
   - Set **Response Data**: Output from your last node

### 3. Get Your Webhook URL

After adding the webhook node:
1. The webhook URL will be shown in the node
2. It should look like: `http://localhost:5679/webhook/generate-music-ai`
3. Or it might have a unique ID: `http://localhost:5679/webhook/abc123def456`

### 4. Update Your Code

If the webhook path is different, update `musicGeneration.js`:
```javascript
this.possibleEndpoints = [
    'http://localhost:5679/webhook/YOUR-ACTUAL-PATH-HERE',
    // ... other endpoints
];
```

### 5. Activate the Workflow

**IMPORTANT**: Click the **"Active"** toggle to activate your workflow!

### 6. Test Your Connection

1. Open: http://localhost:8181/quick-test-n8n.html
2. Click **"Test Webhook Connection"**
3. If successful, try **"Generate Test Music"**

## Troubleshooting

### "Failed to fetch" Error
- Check if workflow is **activated** (not just saved)
- Verify the webhook path matches your code
- Make sure all nodes are connected properly

### "404 Not Found" Error
- The webhook path is wrong
- Copy the exact path from the webhook node

### No Response
- Check if the workflow completed successfully
- Look for errors in n8n execution logs
- Make sure "Respond to Webhook" node is at the end

## Test Without Browser CORS

```bash
# Test your webhook directly
curl -X POST http://localhost:5679/webhook/YOUR-PATH \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test music",
    "genre": "electronic",
    "duration": 30,
    "quality": "high"
  }'
```

## Next Steps

1. Get your workflow running
2. Note the exact webhook path
3. Update the code if needed
4. Test the integration

Your web pages are available at:
- http://localhost:8181/app.html
- http://localhost:8181/studio.html
- http://localhost:8181/test-integration.html
- http://localhost:8181/quick-test-n8n.html