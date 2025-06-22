# 🔧 n8n CORS Configuration Guide

## Problem
Your web app can't connect to n8n because of CORS (Cross-Origin Resource Sharing) restrictions.

## Solution: Update the "Respond to Web App" Node

### Method 1: Use Response Headers in "Respond to Web App" Node

1. Open your n8n workflow
2. Click on the "Respond to Web App" node (last node in your workflow)
3. In the node settings, add these **Response Headers**:

```json
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Allow-Credentials": "false"
}
```

### Method 2: Add a Set Node Before Response

Alternatively, add a "Set" node before "Respond to Web App":

1. Add a new "Set" node before the final response
2. Set these values:
   - `headers.Access-Control-Allow-Origin` = `*`
   - `headers.Access-Control-Allow-Methods` = `POST, GET, OPTIONS`
   - `headers.Access-Control-Allow-Headers` = `Content-Type, Accept`

### Method 3: Handle OPTIONS Requests

For full CORS support, you might need to handle OPTIONS preflight requests:

1. In your webhook node, enable "Options" method
2. Add an IF node after webhook to check request method
3. If method is OPTIONS, respond immediately with CORS headers

## Test After Changes

1. Save your n8n workflow
2. Make sure n8n is running on localhost:5678
3. Refresh your debug page: http://localhost:8000/debug-n8n.html
4. Run the tests again

## Expected Results After Fix

✅ n8n Status: Should show "n8n server appears to be running"
✅ CORS Test: Should show CORS headers are present
✅ Webhook Test: Should get a response (even if it's an error about missing data)
✅ Full Generation: Should work end-to-end
