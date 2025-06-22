# Firebase Setup Guide 🔥

This guide will help you set up Firebase Authentication and Firestore for your MusicGen AI app with the subscription and points system.

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name: `musicgen-ai` (or your preferred name)
4. Enable Google Analytics (optional)
5. Create project

## 2. Add iOS App to Firebase

1. In Firebase Console, click "Add app" → iOS
2. Enter iOS bundle ID: `com.yourcompany.musicgenmain` (match your Xcode bundle ID)
   - **Your project ID**: `musicgen-6cea1`
3. Enter App nickname: "MusicGen AI iOS"
4. Download `GoogleService-Info.plist`
5. **IMPORTANT**: Replace the template file `GoogleService-Info.plist.template` with your downloaded `GoogleService-Info.plist`

## 3. Enable Authentication

1. In Firebase Console → Authentication → Get Started
2. Go to "Sign-in method" tab
3. Enable these providers:
   - **Email/Password**: Required for basic auth
   - **Google Sign-In**: Optional but recommended
4. For Google Sign-In, you may need to configure OAuth consent screen

## 4. Create Firestore Database

1. In Firebase Console → Firestore Database → Create database
2. Choose "Start in test mode" for now
3. Select your preferred region (closest to users)
4. Database created!

## 5. Configure Firestore Security Rules

Go to Firestore → Rules and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User tracks - only authenticated users can access their tracks
    match /users/{userId}/tracks/{trackId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public read access for app metadata (pricing, etc.)
    match /app_metadata/{document=**} {
      allow read: if true;
      allow write: if false; // Only admins should write metadata
    }
  }
}
```

## 6. Set Up Firestore Collections

### Users Collection Structure
```
/users/{userId}
├── uid: string
├── email: string
├── displayName: string
├── createdAt: timestamp
├── currentPlan: string (free|starter|pro|unlimited)
├── totalPoints: number
├── usedPointsToday: number
├── usedPointsThisWeek: number
├── lastPointRefresh: timestamp
├── subscriptionStatus: string (active|expired|cancelled|trial)
├── totalGenerations: number
├── totalPlays: number
├── profileImageURL: string (optional)
└── preferences: object (optional)
```

### User Tracks Sub-collection
```
/users/{userId}/tracks/{trackId}
├── id: string
├── title: string
├── genre: string
├── mood: string
├── prompt: string
├── duration: number
├── audioURL: string (optional)
├── taskId: string (optional)
├── createdAt: timestamp
├── isPublished: boolean
├── isFavorite: boolean
├── plays: number
├── likes: number
├── imageURL: string (optional)
└── tags: array
```

## 7. Add Firebase Dependencies

Add these to your `Package.swift` or Xcode Package Manager:

```swift
dependencies: [
    .package(url: "https://github.com/firebase/firebase-ios-sdk", from: "10.0.0")
]
```

Required Firebase products:
- FirebaseAuth
- FirebaseFirestore
- FirebaseAnalytics (optional)

## 8. Subscription & Points System

The app includes a comprehensive subscription system with:

### Pricing Packages (70% Profit Margin)
- **Free**: 5 generations, 2/day limit
- **Starter**: $9.99/month, 50 generations, 10/day limit
- **Pro**: $24.99/month, 150 generations, 25/day limit  
- **Unlimited**: $79.99/month, 500 generations, 100/day limit

### Points System Features
- ✅ Daily usage limits
- ✅ Weekly point refresh
- ✅ Real-time point consumption
- ✅ New user welcome credits
- ✅ Subscription upgrade flow
- ✅ Transparent pricing

## 9. Test Your Setup

1. Build and run the app
2. Sign up with a new account
3. Verify you receive 5 free points
4. Try generating music
5. Check Firestore Console to see user data

## 10. Production Considerations

### Security Rules (Production)
Update Firestore rules for production:
- Add proper validation
- Limit write operations
- Add rate limiting

### API Keys
- Use environment variables for sensitive keys
- Enable API key restrictions in Google Cloud Console

### Monitoring
- Enable Firebase Analytics
- Set up Crashlytics for error tracking
- Monitor Firestore usage and costs

## Troubleshooting

### Common Issues

1. **"No GoogleService-Info.plist found"**
   - Make sure you renamed the template file to `GoogleService-Info.plist`
   - Verify the file is added to your Xcode project

2. **"Permission denied" in Firestore**
   - Check authentication status
   - Verify Firestore rules are correctly set

3. **Google Sign-In not working**
   - Configure OAuth consent screen
   - Add correct bundle ID in Firebase settings

### Support
- [Firebase Documentation](https://firebase.google.com/docs)
- [Stack Overflow - Firebase](https://stackoverflow.com/questions/tagged/firebase)

---

🎵 **Ready to create AI music with subscriptions!** 🚀