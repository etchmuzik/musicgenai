# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MusicGen AI is a comprehensive AI-powered music creation platform with:
- **iOS App**: SwiftUI-based native app using PiAPI for music generation
- **Web App**: Advanced HTML/JS PWA with extensive features
- **Firebase Backend**: Authentication, Firestore database, cloud storage
- **n8n Automation**: Workflow automation for music generation pipeline

## Development Commands

### iOS Development
```bash
# Open Xcode project
open musicgenmain/musicgenmain.xcodeproj

# Build and run: ⌘+R in Xcode
# Clean build: ⇧⌘K in Xcode
# Run tests: ⌘+U in Xcode

# Check PiAPI service status
./musicgenmain/check_piapi_status.sh
```

### Web Development
```bash
# Navigate to web directory
cd musicgenmain/website

# Start local development server
python3 -m http.server 8181
# or
npx http-server -p 8181

# Start n8n automation (if installed locally)
n8n start --port 5679
```

### Deployment
```bash
# Deploy website to Vercel (automatic via GitHub push)
git add -A && git commit -m "message" && git push

# iOS deployment requires Xcode Archive → Upload to App Store Connect
```

## Architecture Overview

### iOS Architecture
- **Core Services**:
  - `UniversalPiAPI.swift`: Music generation API (PiAPI integration)
  - `FirebaseManager.swift`: Backend integration and user management
  - `SubscriptionManager.swift`: StoreKit 2 subscription handling
  - `TrackPlayer.swift`: Audio playback engine

- **Key Views**:
  - `GenerationView`: Main music creation interface
  - `LibraryView`: Saved tracks management
  - `ExploreView`: Community discovery feed
  - `ProfileView`: User settings and subscription

### Web Architecture
- **Core Features**:
  - `music-studio.html`: Advanced music generation (50+ genres, lyrics, remix)
  - `ai-studio.html`: AI-powered music tools and features
  - `audio-editor.html`: Professional audio processing
  - `stem-separation.html`: AI stem extraction
  - `gamification.html`: Achievement and rewards system

- **JavaScript Modules**:
  - `advanced-music-generation.js`: Extended generation engine
  - `audio-processor.js`: Real-time audio processing
  - `stem-separator.js`: AI-based stem extraction
  - `gamification-engine.js`: Achievement tracking
  - `playlist-manager.js`: Playlist and queue management

### Data Models
- **iOS**: `UserModels.swift` - User profiles, subscriptions, track data
- **Web**: localStorage for client-side persistence
- **Firestore**: User data, track metadata, community content

## Core Workflows

### Music Generation Flow
1. User selects parameters (genre, mood, duration, etc.)
2. API call to PiAPI with generation task
3. Progress polling until completion
4. Track download and storage (local + Firebase)
5. UI update with playable track

### Subscription Tiers
| Plan | Price | Points | Daily Limit |
|------|-------|--------|-------------|
| Free | $0 | 10 | 3 |
| Starter | $9.99 | 500 | 20 |
| Pro | $29.99 | 2000 | 100 |
| Unlimited | $79.99 | 10000 | ∞ |

## Key Features

### Music Generation
- **50+ Genres**: Electronic, Rock, Hip Hop, Jazz, Classical, World, Pop, Folk
- **Advanced Controls**: Duration, tempo, key, time signature, energy, mood
- **Generation Modes**: Text-to-music, lyrics-to-music, remix, extend
- **Smart Playlists**: Auto-generated based on user preferences

### Audio Processing
- **Real-time Effects**: Reverb, delay, compression, EQ, filters
- **Stem Separation**: Extract vocals, drums, bass, instruments
- **Audio Editor**: Trim, fade, normalize, pitch shift, time stretch
- **Format Support**: MP3, WAV, AAC, OGG

### Gamification System
- **35+ Achievements**: Creation milestones, quality ratings, exploration
- **Daily Challenges**: Genre-specific, collaborative, creative tasks
- **Leaderboards**: Points, streaks, tracks created, achievements
- **Virtual Currency**: MusicCoins for unlocking premium content
- **Social Features**: Share, remix, collaborate, follow

## Common Issues and Solutions

### PiAPI Integration
- **503 Error**: Service temporarily unavailable - retry or use fallback
- **Rate Limiting**: Implement queue management in `UniversalPiAPI`
- **API Key**: Update in `UniversalPiAPI.swift:31` or environment variables

### Firebase Setup
- **iOS**: Add `GoogleService-Info.plist` to Xcode project
- **Web**: Configure in `firebase-config.js`
- **Rules**: Apply security rules from `FIRESTORE_RULES.md`

### Build Issues
- **iOS**: File → Packages → Resolve Package Versions
- **Signing**: Update team in project settings
- **Web**: Ensure all JS modules use proper import/export syntax

## API Endpoints

### PiAPI Music Generation
- Base URL: `https://api.piapi.ai/api/v1/task`
- Models: `music-u`, `lyrics-ai`, `music-remix`, `music-extend`
- Headers: `Authorization: Bearer YOUR_API_KEY`

### n8n Workflows
- Local: `http://localhost:5679/webhook/music-generate`
- Production: Configure custom domain in n8n settings

## Important Files

### Configuration
- `vercel.json`: Web deployment routing
- `APIConfiguration.swift`: iOS API settings
- `firebase-config.js`: Web Firebase configuration

### Documentation
- `README.md`: iOS app overview and setup
- `website/DEPLOYMENT.md`: Web deployment guide
- `GAMIFICATION_SYSTEM.md`: Complete gamification features
- `MUSIC_GENERATION_ENHANCEMENTS.md`: Advanced generation features

## Recent Major Features

1. **Advanced Music Studio** (`music-studio.html`)
   - 64 subgenres with specific characteristics
   - Lyrics generation and integration
   - Remix and extend capabilities
   - Smart playlist management

2. **Gamification System** (`gamification.html`)
   - Achievement detection and rewards
   - Challenge framework with daily/weekly tasks
   - Leaderboards and social features
   - Virtual currency economy

3. **Audio Processing** (`audio-editor.html`)
   - Professional audio effects
   - AI-powered stem separation
   - Real-time waveform visualization
   - Multi-format export

## Performance Considerations

- **iOS**: Lazy loading for track libraries, background queue for downloads
- **Web**: Debounced API calls, Web Workers for audio processing
- **Firebase**: Offline persistence, batch operations for efficiency
- **Audio**: Chunked processing for large files, WebAudio API optimization