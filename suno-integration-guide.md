# Suno Clone + n8n PiAPI Integration Guide

## 🚀 Quick Setup

### 1. **n8n Webhook Configuration**

First, let's create the n8n workflows for the Suno clone:

```json
{
  "meta": {
    "instanceId": "2b4ab318d4f8eba10155f5eb0f51c5f5d883c3a9b9a506cad7c0e0c2f2c8874e"
  },
  "name": "Suno Clone Music Generation",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "generate-music-ai",
        "responseMode": "responseNode",
        "options": {
          "cors": {
            "allowedOrigins": "*"
          }
        }
      },
      "id": "webhook-node-1",
      "name": "Webhook - Generate Music",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [250, 300],
      "webhookId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.piapi.ai/api/suno/v1/music",
        "authentication": "genericCredentialType",
        "genericAuthType": "httpHeaderAuth",
        "sendHeaders": true,
        "headerParameters": {
          "parameters": [
            {
              "name": "X-API-Key",
              "value": "={{ $env.PIAPI_KEY }}"
            }
          ]
        },
        "sendBody": true,
        "bodyParameters": {
          "parameters": [
            {
              "name": "prompt",
              "value": "={{ $json.body.prompt }}"
            },
            {
              "name": "custom_mode",
              "value": "={{ $json.body.customMode }}"
            },
            {
              "name": "title",
              "value": "={{ $json.body.title }}"
            },
            {
              "name": "tags",
              "value": "={{ $json.body.tags }}"
            },
            {
              "name": "continue_clip_id",
              "value": "={{ $json.body.continueClipId }}"
            },
            {
              "name": "continue_at",
              "value": "={{ $json.body.continueAt }}"
            },
            {
              "name": "model",
              "value": "={{ $json.body.model || 'chirp-v3-5' }}"
            }
          ]
        },
        "options": {}
      },
      "id": "http-node-1",
      "name": "PiAPI - Generate Music",
      "type": "n8n-nodes-base.httpRequest",
      "typeVersion": 4.2,
      "position": [450, 300],
      "credentials": {
        "httpHeaderAuth": {
          "id": null,
          "name": "PiAPI Auth"
        }
      }
    },
    {
      "parameters": {
        "mode": "runOnceForEachItem",
        "jsCode": "// Poll for completion\nconst taskId = $input.item.json.data.task_id;\nconst maxAttempts = 60; // 5 minutes\nlet attempts = 0;\n\nwhile (attempts < maxAttempts) {\n  const response = await $http.request({\n    method: 'GET',\n    url: `https://api.piapi.ai/api/suno/v1/music/${taskId}`,\n    headers: {\n      'X-API-Key': $env.PIAPI_KEY\n    }\n  });\n  \n  if (response.data.status === 'completed') {\n    return {\n      success: true,\n      songs: response.data.data.clips,\n      taskId: taskId\n    };\n  }\n  \n  if (response.data.status === 'failed') {\n    throw new Error('Music generation failed');\n  }\n  \n  // Wait 5 seconds before next check\n  await new Promise(resolve => setTimeout(resolve, 5000));\n  attempts++;\n}\n\nthrow new Error('Generation timeout');"
      },
      "id": "code-node-1",
      "name": "Poll for Completion",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [650, 300]
    },
    {
      "parameters": {
        "respondWith": "json",
        "responseBody": "={{ $json }}",
        "options": {
          "responseCode": 200,
          "responseHeaders": {
            "entries": [
              {
                "name": "Content-Type",
                "value": "application/json"
              },
              {
                "name": "Access-Control-Allow-Origin",
                "value": "*"
              }
            ]
          }
        }
      },
      "id": "respond-node-1",
      "name": "Return Response",
      "type": "n8n-nodes-base.respondToWebhook",
      "typeVersion": 1.1,
      "position": [850, 300]
    }
  ],
  "connections": {
    "Webhook - Generate Music": {
      "main": [[{"node": "PiAPI - Generate Music", "type": "main", "index": 0}]]
    },
    "PiAPI - Generate Music": {
      "main": [[{"node": "Poll for Completion", "type": "main", "index": 0}]]
    },
    "Poll for Completion": {
      "main": [[{"node": "Return Response", "type": "main", "index": 0}]]
    }
  }
}
```

### 2. **Environment Variables**

Add to your `.env.local`:

```env
# n8n Webhook URL
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook

# OR if using direct PiAPI
PIAPI_KEY=your_piapi_key_here
PIAPI_BASE_URL=https://api.piapi.ai
```

### 3. **Update API Configuration**

In `/lib/api.ts`, update the endpoint:

```typescript
const API_BASE = process.env.N8N_WEBHOOK_URL || 'http://localhost:5678/webhook';
```

### 4. **Direct PiAPI Integration (Alternative)**

If you prefer direct integration without n8n:

```typescript
// /pages/api/generate-music.ts
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Create task
    const createResponse = await fetch('https://api.piapi.ai/api/suno/v1/music', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.PIAPI_KEY!
      },
      body: JSON.stringify({
        prompt: req.body.prompt,
        custom_mode: req.body.customMode,
        title: req.body.title,
        tags: req.body.tags,
        model: req.body.model || 'chirp-v3-5'
      })
    });

    const { data } = await createResponse.json();
    const taskId = data.task_id;

    // Poll for completion
    let attempts = 0;
    while (attempts < 60) {
      const statusResponse = await fetch(`https://api.piapi.ai/api/suno/v1/music/${taskId}`, {
        headers: {
          'X-API-Key': process.env.PIAPI_KEY!
        }
      });

      const result = await statusResponse.json();
      
      if (result.data.status === 'completed') {
        return res.status(200).json({
          success: true,
          songs: result.data.clips,
          taskId
        });
      }

      if (result.data.status === 'failed') {
        throw new Error('Generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }

    throw new Error('Generation timeout');
  } catch (error) {
    console.error('Generation error:', error);
    res.status(500).json({ error: 'Failed to generate music' });
  }
}
```

### 5. **CORS Configuration**

If you're getting CORS errors, add this to `next.config.js`:

```javascript
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};
```

### 6. **Testing the Connection**

```bash
# Test n8n webhook
curl -X POST https://your-n8n.com/webhook/generate-music-ai \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "upbeat electronic dance music",
    "customMode": false,
    "model": "chirp-v3-5"
  }'

# Test direct API
curl -X POST http://localhost:3000/api/generate-music \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "upbeat electronic dance music"
  }'
```

### 7. **Deployment Steps**

1. **Deploy to Vercel**:
```bash
vercel --prod
```

2. **Set Environment Variables in Vercel**:
- Go to Vercel Dashboard → Settings → Environment Variables
- Add `N8N_WEBHOOK_URL` or `PIAPI_KEY`

3. **Update n8n Webhook URL**:
- In n8n, update the webhook node
- Add your Vercel domain to allowed origins

### 8. **Additional n8n Workflows**

**Extract Stems Workflow**:
```json
{
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "extract-stems",
        "responseMode": "responseNode",
        "options": {
          "cors": {
            "allowedOrigins": "*"
          }
        }
      },
      "id": "webhook-stems",
      "name": "Webhook - Extract Stems",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [250, 300]
    }
  ]
}
```

### 9. **Troubleshooting**

**CORS Issues**:
- Ensure n8n webhook has CORS enabled
- Add your domain to allowed origins
- Use the API proxy in production

**Authentication**:
- Store PiAPI key securely
- Never expose keys in frontend code
- Use server-side API routes

**Rate Limiting**:
- Implement request queuing
- Add user-based rate limits
- Cache generation results

## 🎉 You're Connected!

Your Suno clone is now connected to PiAPI through n8n. Users can:
- Generate music with AI
- Extract stems
- Continue/remix tracks
- Download generated songs

Need help? Check the console logs or n8n execution history.