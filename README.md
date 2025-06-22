# 🎵 MusicGen AI - iOS App

**AI-Powered Music Generation for iOS**  
Transform your ideas into professional music with cutting-edge AI technology.

---

## 🚀 Quick Start

### Prerequisites
- Xcode 15.0+
- iOS 16.0+ target
- Active Firebase project
- PiAPI key

### Setup
1. **Clone & Open**
   ```bash
   git clone [your-repo]
   cd musicgenmain
   open musicgenmain.xcodeproj
   ```

2. **Configure API Keys**
   - Add your `GoogleService-Info.plist` to the project
   - Update PiAPI key in `UniversalPiAPI.swift:31`

3. **Build & Run**
   - Select iOS Simulator or device
   - ⌘+R to build and run

---

## 🏗 Architecture

```
musicgenmain/
├── Core/
│   ├── musicgenmainApp.swift      # App entry point
│   ├── RootView.swift            # Root navigation
│   └── ContentView.swift         # Main generation UI
├── Managers/
│   ├── FirebaseManager.swift     # Backend integration
│   ├── UniversalPiAPI.swift      # Music generation API
│   └── SubscriptionManager.swift # In-app purchases
├── Models/
│   └── UserModels.swift          # Data structures
├── Views/
│   ├── GenerationView.swift      # Music creation
│   ├── LibraryView.swift         # User library
│   ├── ProfileView.swift         # User profile
│   └── [Other Views...]
└── Assets/
    └── AppIcon assets
```

---

## 💰 Subscription Tiers

| Plan | Price | Points | Daily Limit |
|------|-------|--------|-------------|
| Free | $0 | 10 | 3 |
| Starter | $9.99 | 500 | 20 |
| Pro | $29.99 | 2000 | 100 |
| Unlimited | $79.99 | 10000 | ∞ |

---

## 🔧 Key Features

✅ **Core Music Generation** - Professional AI-powered tracks  
✅ **Multiple Genres** - Techno, House, Hip Hop, Pop, Jazz, etc.  
✅ **Custom Lyrics** - Add your own or use AI-generated  
✅ **Extend & Remix** - Build on existing tracks  
✅ **Social Discovery** - Share and discover community tracks  
✅ **Offline Library** - Save and manage your creations  
✅ **Subscription System** - 4 tiers with StoreKit 2  

---

## 🛠 Development

### API Configuration
```swift
// UniversalPiAPI.swift
private let apiKey = "YOUR_PIAPI_KEY_HERE"
private let baseURL = "https://piapi.ai/api/suno/music/generate"
```

### Firebase Setup
```bash
1. Add GoogleService-Info.plist to project
2. Enable Authentication (Email/Password)
3. Set up Firestore database
4. Configure App Check for production
```

### Build Configurations
- **Debug**: Development with debug logging
- **Release**: Production-ready build

---

## 📱 App Store Deployment

### Pre-Launch Checklist
- [ ] App Store Connect setup
- [ ] Screenshots (6.5", 5.5", 12.9" displays)
- [ ] Privacy Policy URL
- [ ] In-app purchase configuration
- [ ] TestFlight beta testing

### Required Assets
- App Icon: 1024x1024px ✅
- Screenshots: Multiple sizes needed
- App Description & Keywords
- Privacy Policy & Terms

---

## 🐛 Troubleshooting

### Common Issues
1. **Firebase not connecting**: Check GoogleService-Info.plist
2. **Generation failing**: Verify PiAPI key and quota
3. **Subscription issues**: Test in Sandbox environment
4. **Build errors**: Clean build folder (⇧⌘K)

### Debug Logging
Enable verbose logging in Debug builds for troubleshooting.

---

## 📞 Support

**Technical Stack**
- SwiftUI + iOS 16.0+
- Firebase (Auth, Firestore, Storage)
- PiAPI for music generation
- StoreKit 2 for subscriptions

**Contact**
- Developer: Etch EG
- Support: [Add support email]
- Issues: Use GitHub Issues

---

## 📄 License

[Add your license information]

---

*Last updated: June 2025*