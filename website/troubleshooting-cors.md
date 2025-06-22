# 🔧 Fixing "Failed to fetch" Error

## Common Causes & Solutions

### 1. **CORS Issue** (Most Likely)
Your n8n webhook needs to allow requests from your web app.

**Fix in n8n:**
1. Go to your webhook node in n8n
2. Add these response headers:
   - `Access-Control-Allow-Origin: *`
   - `Access-Control-Allow-Methods: POST, GET, OPTIONS`
   - `Access-Control-Allow-Headers: Content-Type`

**OR use HTTP Request node settings:**
- Enable "Allow Unauthorized Certificates"
- Add CORS headers in the response

### 2. **n8n Not Running**
Check if n8n is actually running:
```bash
# Check if n8n is accessible
curl http://localhost:5678/webhook/generate-music-ai -X POST \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test","genre":"electronic","duration":30,"quality":"standard"}'
```

### 3. **Wrong URL/Port**
Verify your n8n webhook URL:
- Default: `http://localhost:5678/webhook/generate-music-ai`
- Cloud: `https://your-instance.n8n.cloud/webhook/generate-music-ai`
- Docker: Might be on different port

### 4. **Webhook Not Active**
- Make sure your n8n workflow is **activated** (not just saved)
- The webhook node should show as "Listening"

## Quick Fixes to Try

### Option 1: Add CORS Headers to n8n
In your n8n webhook node, add a "Set" node after to add headers:
```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
}
```

### Option 2: Use a Proxy (Development)
Create a simple proxy server:

```javascript
// proxy-server.js
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/webhook/*', async (req, res) => {
  try {
    const response = await axios.post(
      `http://localhost:5678${req.path}`,
      req.body,
      { headers: { 'Content-Type': 'application/json' } }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Proxy running on http://localhost:3001');
});
```

Then update your web app to use: `http://localhost:3001/webhook/generate-music-ai`

### Option 3: Test with cURL First
```bash
# Test if webhook is reachable
curl -X POST http://localhost:5678/webhook/generate-music-ai \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test music",
    "genre": "electronic",
    "duration": 30,
    "quality": "standard"
  }' -v
```

### Option 4: Browser Console Debug
Open DevTools and check:
1. **Network tab** - See the failed request details
2. **Console** - Look for CORS errors
3. Common CORS error: `Access to fetch at 'http://localhost:5678/...' from origin 'http://localhost:...' has been blocked by CORS policy`

## Alternative: Direct File Access
If CORS is too complex, run your web app on a local server:

```bash
# Python 3
python3 -m http.server 8080

# Node.js
npx http-server -p 8080

# Then access: http://localhost:8080/test-integration.html
```

## n8n Webhook Configuration Example

In your n8n workflow, after the webhook node, add a "Respond to Webhook" node with:

**Options:**
- Response Mode: "When Last Node Finishes"
- Response Code: 200
- Response Headers:
  ```
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: POST, GET, OPTIONS
  Access-Control-Allow-Headers: Content-Type
  Content-Type: application/json
  ```

This should resolve the CORS issues!