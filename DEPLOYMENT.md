# 🚀 MusicGen AI Website Deployment Guide

**Domain**: www.musicgenai.app  
**App Bundle ID**: com.beyond.musicgenai  
**Team ID**: CHSAVJ5X6U

---

## 📁 Website Structure

Your website files are ready in the `/website` folder:

```
website/
├── index.html              # Landing page
├── privacy.html            # Privacy policy
├── terms.html              # Terms of service
├── support.html            # Support center
├── DEPLOYMENT.md           # This guide
└── .well-known/
    └── apple-app-site-association  # Universal links
```

---

## 🎯 Quick Deployment Options

### **Option 1: Vercel (Recommended)**

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Navigate to website folder
cd /Users/etch/Downloads/musicgenmain/musicgenmain/website

# 3. Deploy
vercel

# 4. Add custom domain
vercel domains add musicgenai.app
vercel domains add www.musicgenai.app
```

### **Option 2: Netlify**

1. Go to [netlify.com](https://netlify.com)
2. Drag & drop the `/website` folder
3. Add custom domain: www.musicgenai.app

### **Option 3: GitHub Pages**

```bash
# 1. Create new repo: musicgenai-website
# 2. Copy website files to repo
# 3. Enable GitHub Pages in settings
# 4. Add custom domain
```

---

## 🔧 Domain Configuration

### **DNS Settings** (Configure with your domain registrar)

```
Type: CNAME
Name: www
Value: [your-hosting-provider-domain]

Type: A (if needed)
Name: @
Value: [hosting-provider-IP]
```

### **Hosting Provider Examples**

**Vercel:**
- CNAME: www → cname.vercel-dns.com
- A: @ → 76.76.19.61

**Netlify:**
- CNAME: www → [your-site].netlify.app

---

## 📱 Apple App Site Association

The universal links file is configured for your app:

**File**: `/.well-known/apple-app-site-association`
**Team ID**: CHSAVJ5X6U
**Bundle ID**: com.beyond.musicgenai

### **iOS App Configuration**

Add to your app's `Info.plist`:

```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:www.musicgenai.app</string>
    <string>webcredentials:www.musicgenai.app</string>
</array>
```

---

## 🔄 App Store Connect URLs

Update these in App Store Connect:

- **Marketing URL**: `https://www.musicgenai.app`
- **Support URL**: `https://www.musicgenai.app/support`
- **Privacy Policy**: `https://www.musicgenai.app/privacy`

---

## ✅ Pre-Launch Checklist

- [ ] Deploy website to hosting provider
- [ ] Configure custom domain DNS
- [ ] Verify SSL certificate is active
- [ ] Test all pages load correctly
- [ ] Verify universal links file is accessible
- [ ] Update App Store Connect URLs
- [ ] Test universal links from iOS device

---

## 🎨 Customization

### **Update App Store Button** (when live)

In `index.html`, replace:
```javascript
alert('MusicGen AI will be available on the App Store soon!');
```

With:
```javascript
window.location.href = 'https://apps.apple.com/app/idYOURAPPID';
```

### **Add Analytics**

Add Google Analytics to all pages:
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

## 📧 Email Setup

Consider setting up professional emails:
- `support@musicgenai.app`
- `hello@musicgenai.app`
- `privacy@musicgenai.app`

Use Google Workspace or your domain registrar's email service.

---

## 🔍 Testing Universal Links

After deployment, test universal links:

1. Open Safari on iOS device
2. Visit: `https://www.musicgenai.app/app/test`
3. Should prompt to open in your app (when installed)

---

## 🎉 Launch Strategy

1. **Pre-Launch** (Now)
   - Deploy with "Coming Soon" message
   - Start building anticipation

2. **TestFlight** (1-2 weeks)
   - Update to "Beta Testing Available"
   - Add TestFlight signup link

3. **App Store Launch**
   - Update with download button
   - Add app screenshots/demo
   - Announce on social media

---

**Your website is production-ready! Choose a hosting option and deploy when ready.**