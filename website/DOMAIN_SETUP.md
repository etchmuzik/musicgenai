# 🌐 MusicGen AI Domain Setup Guide

**Domain**: www.musicgenai.app  
**App Name**: MusicGen AI  
**Bundle ID**: com.beyond.musicgenmain

---

## 🚀 Quick Setup Checklist

### 1. **Landing Page (Priority: HIGH)**
Host a simple landing page with:
- App description & features
- Download links (App Store button)
- Privacy Policy & Terms of Service
- Support contact

### 2. **Required URLs for App Store**
Create these pages on your domain:

#### **Privacy Policy**
`https://www.musicgenai.app/privacy`

#### **Terms of Service**  
`https://www.musicgenai.app/terms`

#### **Support Page**
`https://www.musicgenai.app/support`

---

## 📱 Universal Links Setup (iOS Deep Linking)

### 1. **Apple App Site Association File**
Create `apple-app-site-association` file at:
`https://www.musicgenai.app/.well-known/apple-app-site-association`

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.beyond.musicgenmain",
        "paths": [
          "/app/*",
          "/tracks/*",
          "/share/*"
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": ["TEAMID.com.beyond.musicgenmain"]
  }
}
```

### 2. **Update Info.plist**
Add to your app's Info.plist:
```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:www.musicgenai.app</string>
    <string>webcredentials:www.musicgenai.app</string>
</array>
```

---

## 🎨 Simple Landing Page Template

Create `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MusicGen AI - AI-Powered Music Creation</title>
    <meta name="description" content="Create original music with AI. Generate tracks in any genre, customize with lyrics, and share your creations.">
    <link rel="icon" type="image/png" href="/favicon.png">
    <style>
        :root {
            --primary: #007AFF;
            --dark: #1C1C1E;
            --light: #F2F2F7;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--light);
            color: var(--dark);
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        header {
            text-align: center;
            padding: 80px 20px;
            background: white;
        }
        
        .logo {
            font-size: 80px;
            margin-bottom: 20px;
        }
        
        h1 {
            font-size: 48px;
            margin-bottom: 16px;
        }
        
        .tagline {
            font-size: 24px;
            color: #666;
            margin-bottom: 40px;
        }
        
        .download-button {
            display: inline-block;
            background: var(--primary);
            color: white;
            padding: 16px 32px;
            border-radius: 30px;
            text-decoration: none;
            font-size: 18px;
            font-weight: 600;
            transition: transform 0.2s;
        }
        
        .download-button:hover {
            transform: translateY(-2px);
        }
        
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 40px;
            padding: 80px 0;
        }
        
        .feature {
            text-align: center;
            padding: 40px;
            background: white;
            border-radius: 20px;
        }
        
        .feature-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        .feature h3 {
            font-size: 24px;
            margin-bottom: 12px;
        }
        
        footer {
            text-align: center;
            padding: 40px;
            background: var(--dark);
            color: white;
        }
        
        footer a {
            color: white;
            margin: 0 20px;
        }
        
        @media (max-width: 768px) {
            h1 { font-size: 36px; }
            .tagline { font-size: 20px; }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <div class="logo">🎵</div>
            <h1>MusicGen AI</h1>
            <p class="tagline">Create Original Music with AI</p>
            <a href="#" class="download-button" id="downloadBtn">
                Coming Soon to App Store
            </a>
        </div>
    </header>
    
    <section class="features container">
        <div class="feature">
            <div class="feature-icon">🎹</div>
            <h3>Any Genre</h3>
            <p>From Techno to Classical, create music in any style you imagine</p>
        </div>
        
        <div class="feature">
            <div class="feature-icon">✨</div>
            <h3>AI-Powered</h3>
            <p>State-of-the-art AI generates professional-quality tracks</p>
        </div>
        
        <div class="feature">
            <div class="feature-icon">🎤</div>
            <h3>Custom Lyrics</h3>
            <p>Add your own lyrics or let AI create them for you</p>
        </div>
        
        <div class="feature">
            <div class="feature-icon">♾️</div>
            <h3>Extend & Remix</h3>
            <p>Transform tracks with extend and remix features</p>
        </div>
        
        <div class="feature">
            <div class="feature-icon">🌍</div>
            <h3>Share & Discover</h3>
            <p>Share your creations and discover music from the community</p>
        </div>
        
        <div class="feature">
            <div class="feature-icon">💎</div>
            <h3>Flexible Plans</h3>
            <p>Free tier plus affordable subscriptions for power users</p>
        </div>
    </section>
    
    <footer>
        <div class="container">
            <p>&copy; 2025 MusicGen AI. All rights reserved.</p>
            <p>
                <a href="/privacy">Privacy Policy</a>
                <a href="/terms">Terms of Service</a>
                <a href="/support">Support</a>
            </p>
        </div>
    </footer>
    
    <script>
        // Update button when app is live
        document.getElementById('downloadBtn').addEventListener('click', function(e) {
            e.preventDefault();
            alert('MusicGen AI will be available on the App Store soon!');
            // When live, replace with:
            // window.location.href = 'https://apps.apple.com/app/idYOURAPPID';
        });
    </script>
</body>
</html>
```

---

## 🚀 Hosting Options

### **Option 1: GitHub Pages (Free)**
1. Create repo: `musicgenai-website`
2. Push your HTML files
3. Enable GitHub Pages
4. Add custom domain in settings

### **Option 2: Vercel (Free)**
1. Sign up at vercel.com
2. Import GitHub repo
3. Add custom domain
4. Auto-deploy on push

### **Option 3: Netlify (Free)**
1. Sign up at netlify.com
2. Drag & drop your folder
3. Add custom domain
4. Instant deployment

---

## 📱 App Store Connect URLs

Update these in App Store Connect:

- **Marketing URL**: `https://www.musicgenai.app`
- **Support URL**: `https://www.musicgenai.app/support`
- **Privacy Policy**: `https://www.musicgenai.app/privacy`

---

## 🔒 SSL Certificate

All hosting options above provide free SSL certificates automatically.

---

## 📧 Email Setup

Consider setting up:
- `support@musicgenai.app`
- `hello@musicgenai.app`
- `privacy@musicgenai.app`

Use your domain registrar's email forwarding or Google Workspace.

---

## 🎯 Launch Strategy

1. **Pre-Launch** (Now)
   - Set up landing page with "Coming Soon"
   - Collect email signups
   - Build anticipation

2. **TestFlight** (1-2 weeks)
   - Update page with "Beta Testing"
   - Link to TestFlight signup

3. **Launch** (After approval)
   - Update with App Store download button
   - Add screenshots and demo video
   - Share on social media

---

## 📊 Analytics

Add to your landing page:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

---

## 🎨 Brand Assets Needed

- App Icon (1024x1024)
- Favicon (32x32, 192x192, 512x512)
- Open Graph image (1200x630)
- App Store badge SVG

---

*Remember to replace TEAMID with your actual Apple Developer Team ID*