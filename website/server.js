const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Enable CORS for all origins
app.use(cors());

// Serve static files from current directory
app.use(express.static('.'));

// Simple proxy endpoint for n8n webhook (optional)
app.use('/api/webhook/*', async (req, res) => {
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(`http://localhost:5679/webhook/${req.params[0]}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...req.headers
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });
    
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`
🚀 Server running at http://localhost:${PORT}

📁 Files being served:
- http://localhost:${PORT}/app.html
- http://localhost:${PORT}/studio.html
- http://localhost:${PORT}/test-integration.html
- http://localhost:${PORT}/quick-test-n8n.html

✅ CORS is enabled for all origins
🔗 n8n webhook proxy available at: http://localhost:${PORT}/api/webhook/*
  `);
});