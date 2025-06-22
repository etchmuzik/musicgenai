# 🛠️ Manual Workflow Setup

Since the JSON import is having issues, let's create the workflow manually in the n8n interface.

## 🚀 **Step 1: Start n8n**
```bash
cd /Users/etch/Downloads/musicgenmain/musicgenmain/website
PIAPI_API_KEY="d3a513bec58ea7c7e60eebf377fbbfb806f2304f12e1ef208cd701139658c088" N8N_PORT=5679 npx n8n start
```

## 🌐 **Step 2: Open n8n Dashboard**
Go to: **http://localhost:5679**

## ➕ **Step 3: Create New Workflow**
1. Click **"+ Add Workflow"**
2. Click **"From scratch"**

## 🔧 **Step 4: Add Nodes (Drag from left panel)**

### **Node 1: Webhook**
- Drag **"Webhook"** node to canvas
- **Path**: `generate-music-ai`
- **Method**: `POST`
- Leave other settings as default

### **Node 2: HTTP Request** 
- Drag **"HTTP Request"** node to canvas
- **Method**: `POST`
- **URL**: `https://api.piapi.ai/api/v1/task`
- **Body**: `JSON`
- **JSON Body**:
```json
{
  "model": "music-u",
  "task_type": "generate_music", 
  "input": {
    "gpt_description_prompt": "{{$json.prompt}}",
    "negative_tags": "",
    "lyrics_type": "instrumental",
    "seed": -1
  }
}
```
- **Headers**: Add header
  - **Name**: `x-api-key`
  - **Value**: `d3a513bec58ea7c7e60eebf377fbbfb806f2304f12e1ef208cd701139658c088`

### **Node 3: Wait**
- Drag **"Wait"** node to canvas  
- **Amount**: `30`
- **Unit**: `seconds`

### **Node 4: HTTP Request** (Get Result)
- Drag another **"HTTP Request"** node
- **Method**: `GET`
- **URL**: `https://api.piapi.ai/api/v1/task/{{$node["HTTP Request"].json.data.task_id}}`
- **Headers**: Add header
  - **Name**: `x-api-key`
  - **Value**: `d3a513bec58ea7c7e60eebf377fbbfb806f2304f12e1ef208cd701139658c088`

### **Node 5: Respond to Webhook**
- Drag **"Respond to Webhook"** node
- Leave default settings

## 🔗 **Step 5: Connect Nodes**
Connect them in order:
**Webhook** → **HTTP Request** → **Wait** → **HTTP Request** → **Respond to Webhook**

## ✅ **Step 6: Save & Activate**
1. **Save** the workflow (Ctrl+S)
2. **Name it**: "Music Generator"
3. **Activate** it (toggle switch top-right)

## 🧪 **Step 7: Test**
Go to: **http://localhost:8181/quick-test.html**
- Enter: "upbeat electronic music"
- Click "Test Music Generation"

## 📋 **Expected Result**
After ~30 seconds, you should get JSON with:
```json
{
  "data": {
    "task_id": "...",
    "status": "completed", 
    "output": {
      "audio_url": "https://..."
    }
  }
}
```

This manual approach avoids the JSON import issues completely!