# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MusicGen AI is a comprehensive AI-powered music creation platform featuring:
- **iOS App**: SwiftUI-based native mobile app using PiAPI for AI music generation
- **Web App**: Modern HTML/JS SPA with Suno-style UI and advanced features  
- **Firebase Backend**: Authentication, Firestore database, and cloud storage
- **n8n Automation**: Workflow automation for complex music generation pipelines

## Development Commands

### Local Development Server
```bash
# Start the main development server (recommended)
node server.js
# Opens on http://localhost:8080 with CORS proxy for n8n

# Alternative: Simple HTTP server
python3 -m http.server 8181
npx http-server -p 8181
```

### iOS Development
```bash
# Open Xcode project
open musicgenmain.xcodeproj

# Build and run: ⌘+R in Xcode
# Clean build: ⇧⌘K in Xcode  
# Run tests: ⌘+U in Xcode

# Check PiAPI service status
./check_piapi_status.sh
```

### n8n Workflow Development
```bash
# Start n8n (if installed locally)
n8n start --port 5679

# Setup n8n workflows
./start-n8n.sh

# Test n8n integration
node check-n8n-setup.js
```

### Deployment
```bash
# Web deployment (Vercel - automatic via git push)
git add . && git commit -m "Update" && git push

# iOS deployment requires Xcode Archive → Upload to App Store Connect
```

## Architecture Overview

### Web Application Structure
The web app features a dual-architecture approach:

#### Original Complex UI
- **index.html**: Full-featured landing page with multiple studio options
- **suno-home.html**, **suno-create.html**, **suno-library.html**: Suno-style interface
- **music-studio.html**: Advanced music generation with 50+ genres
- **ai-studio.html**: AI-powered music tools and features
- **audio-editor.html**: Professional audio processing

#### Simplified UI (Current Focus)
- **index-simple.html**: Clean landing page with single CTA button (/simple route)
- **create-simple.html**: Streamlined music creation interface (/create route)
- Eliminates user confusion with clear, focused user experience

### Core iOS Components
- **musicgenmainApp.swift**: App entry point with Firebase configuration
- **UniversalPiAPI.swift**: Main music generation service handling PiAPI integration
- **FirebaseManager.swift**: Authentication, user management, and Firestore operations
- **TrackPlayer.swift**: Audio playback engine
- **SubscriptionManager.swift**: In-app purchase handling with 4 subscription tiers

### JavaScript Modules
- **firebase-config-safe.js**: Graceful Firebase initialization with mock fallbacks
- **musicGeneration.js**: Frontend API integration for music generation
- **advanced-music-generation.js**: Extended generation engine with complex workflows
- **audio-engine.js**: Real-time audio processing and effects
- **gamification-engine.js**: Achievement tracking and rewards system

### Data Models
- **UserModels.swift**: Core user profile and subscription data structures
- **GeneratedTrack**: Music track metadata and file references
- **TrackData**: Firestore-compatible track storage format

## Key Configuration Files

### API Integration
- **APIConfiguration.swift**: PiAPI endpoints and authentication for iOS
- **UniversalPiAPI.swift:31**: PiAPI key configuration location
- **server.js**: Express server with n8n webhook proxy

### Firebase Configuration
- **GoogleService-Info.plist**: Firebase project configuration (iOS)
- **firebase-config-safe.js**: Web Firebase with safe fallbacks
- **firestore.rules**: Database security rules

### Build & Deployment
- **musicgenmain.xcodeproj**: Xcode project with build settings
- **vercel.json**: Web deployment routing with clean URLs
- **musicgenmain.entitlements**: iOS app capabilities and permissions

## Core Workflows

### Music Generation Flow
1. User inputs genre, mood, and optional prompt
2. `UniversalPiAPI.generateMusic()` creates PiAPI task
3. Progress polling via `waitForCompletion()`
4. Track download and local storage
5. Firebase sync for cloud backup
6. UI updates with playable track

### Web Authentication Flow
1. Firebase Auth for sign-in/sign-up (when configured)
2. Graceful degradation to guest mode when Firebase not configured
3. Mock authentication services via `firebase-config-safe.js`
4. Cross-platform data synchronization when available

### Subscription System
- 4 tiers: Free (10 points), Starter ($9.99), Pro ($29.99), Unlimited ($79.99)
- Points-based generation limits
- Daily usage tracking and auto-refresh
- StoreKit 2 integration for iOS purchases

## Current User Experience Strategy

### Simplified UI (Primary Focus)
The current development focuses on eliminating user confusion through:
- **Single CTA**: One prominent "Create Your First Song" button
- **Clean Navigation**: Minimal options, clear user flow
- **Step-by-step Process**: Progress indicators and guided creation
- **Routes**: `/simple` (landing) and `/create` (creation interface)

### Complex UI (Legacy/Advanced)
The original multi-studio interface remains available but is de-emphasized:
- Multiple generation options can confuse new users
- Advanced features accessible for power users
- Suno-style interface for familiar workflow

## Common Issues and Solutions

### PiAPI Connection
- **503 Service Unavailable**: PiAPI under maintenance - app shows appropriate user message
- **API Key Issues**: Update `APIConfiguration.piApiKey` for iOS or environment variables
- **Rate Limiting**: Implemented in `UniversalPiAPI` with queue management

### Firebase Integration
- **Configuration Missing**: `firebase-config-safe.js` provides mock services and warnings
- **GoogleService-Info.plist missing**: Required for production iOS builds
- **Firestore offline**: App gracefully degrades to local-only mode

### Build Problems
- **Swift Package Dependencies**: Use File → Packages → Resolve Package Versions
- **Signing Issues**: Update development team in project settings
- **Web CORS Issues**: Use `node server.js` for local development

### DNS and SSL Issues
- **SSL Certificate Provisioning**: Vercel automatically handles after DNS propagation
- **Domain Configuration**: Ensure A record points to Vercel IP (76.76.21.21)
- **HSTS Errors**: Wait for certificate renewal or use Vercel dashboard refresh

## API Endpoints

### PiAPI Music Generation
- Base URL: `https://api.piapi.ai/api/v1/task`
- Models: `music-u` (standard), `lyrics-ai`, `music-remix`, `music-extend`
- Headers: `Authorization: Bearer YOUR_API_KEY`

### n8n Workflows
- Local Development: `http://localhost:5679/webhook/music-generate`
- Production: Configure custom domain in n8n settings
- CORS Proxy: `http://localhost:8080/api/webhook/*` (via server.js)

### Web Routes (vercel.json)
- `/simple` → `index-simple.html` (simplified landing)
- `/create` → `create-simple.html` (simplified creation)
- `/suno-home` → `suno-home.html` (Suno-style interface)
- Clean URLs enabled for all routes

## Security Considerations

### Development vs Production
- **API Keys**: Use placeholder values in development, environment variables in production
- **Firebase**: Mock services when not configured, full services in production
- **CORS**: Enabled for development, configured for production domains

### User Data Protection
- Firebase security rules restrict user data access
- Audio files stored locally and synced to user's private cloud storage
- No sensitive data logged or exposed in client code

## Performance Optimizations

### iOS App
- Lazy loading for large track libraries
- Background queue processing for downloads
- Firestore offline persistence enabled
- Image caching for album artwork

### Web App
- Debounced API calls to prevent rate limiting
- Web Workers for audio processing
- Progressive loading of UI components
- CDN optimization for static assets

## Integration Points

### PiAPI Music Generation
- Primary endpoint: `https://api.piapi.ai/api/v1/task`
- Models: `music-u` (standard), `Qubico/diffrhythm` (extended)
- Supports lyrics, instrumental, and style transfer
- Task-based generation with progress polling

### Firebase Services
- **Auth**: Email/password, Google OAuth (planned)
- **Firestore**: User profiles, track metadata, community feed
- **Storage**: Audio file cloud backup
- **Safe Initialization**: Graceful fallbacks when not configured

### n8n Automation
- Web-based workflow automation for complex generation tasks
- Webhook endpoints for music generation
- CORS handling for local development via server.js proxy
- JSON workflow files for version control

## Future Enhancements

### Planned Features
- Enhanced simplified UI based on user feedback
- Real-time collaboration features
- Advanced audio editing capabilities
- Extended social sharing and community features

### Technical Improvements
- Unified error handling across platforms
- Performance monitoring integration
- Automated testing expansion
- Progressive Web App capabilities enhancement

## Development Notes

### Code Style
- SwiftUI declarative UI patterns for iOS
- Modern ES6+ JavaScript for web
- Async/await patterns for API calls
- Published properties for reactive UI updates

### Testing Strategy
- Xcode built-in testing for iOS (⌘+U)
- Browser testing for web functionality
- API connectivity verification scripts
- Manual testing checklist for deployment

### Deployment Strategy
- iOS: TestFlight beta → App Store release
- Web: Vercel automatic deployment via git push
- Feature flags for gradual rollout
- Environment-specific configuration management