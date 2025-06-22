# 🚀 QUICK START - Music Generation

## ✅ **Current Status**
- ✅ n8n running: http://localhost:5679
- ✅ Web server: http://localhost:8181
- ✅ Simple workflow imported: "Music Generator"

## 🎯 **ACTIVATE WORKFLOW (Required)**

### **1. Open n8n Dashboard**
**http://localhost:5679**

### **2. Find & Open Workflow**
- Look for: **"Music Generator"** 
- Click on it

### **3. Activate the Workflow**
- Click the **toggle switch** (top-right corner)
- Should turn **blue/green** when active

## 🧪 **TEST THE WORKFLOW**

### **Option 1: Quick Test Page**
**http://localhost:8181/quick-test.html**
- Enter: "chill lo-fi hip hop beats"
- Click "Test Music Generation"
- Wait 30-60 seconds for result

### **Option 2: Main App**
**http://localhost:8181/app.html**
- Full music generation interface

### **Option 3: cURL Test**
```bash
curl -X POST http://localhost:5679/webhook/generate-music-ai \
  -H "Content-Type: application/json" \
  -d '{"prompt": "upbeat electronic music"}'
```

## 🔧 **If It Doesn't Work**

### **Error: "webhook not registered"**
- Workflow is not active
- Go to n8n dashboard and activate it

### **Error: "Could not find workflow"**
- Workflow didn't import properly
- Re-import: `npx n8n import:workflow --input=simple-working-workflow.json`

### **Error: "Failed to fetch"**
- Check CORS or network issues
- Use the quick-test.html page

## 🎵 **What Happens When Working**
1. **Input**: Music prompt
2. **Processing**: ~30-60 seconds 
3. **Output**: JSON with audio URL
4. **Play**: Direct audio link

**The simplified workflow just generates music - no artwork for now to keep it simple!**