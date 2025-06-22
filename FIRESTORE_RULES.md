# Firestore Security Rules for MusicGen App

## Current Issue
Your app is getting permission errors because Firestore security rules are blocking access. Here are the rules you need to set up in Firebase Console.

## Setup Instructions

1. **Go to Firebase Console** → Your Project → Firestore Database → Rules
2. **Replace the current rules** with the appropriate set below

---

## Development/Testing Rules (Use First)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes for testing
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**⚠️ WARNING: These rules allow anyone to read/write your database. Only use for testing!**

---

## Production Rules (Switch to These Later)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // User profiles - users can only access their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User tracks - users can only access their own tracks
    match /users/{userId}/tracks/{trackId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Published tracks - public read, owner write
    match /published_tracks/{trackId} {
      allow read: if true; // Anyone can read published tracks
      allow write: if request.auth != null && 
        (request.auth.uid == resource.data.ownerUID || 
         request.auth.uid == request.resource.data.ownerUID);
    }
    
    // User likes - users can manage their own likes
    match /user_likes/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Analytics and stats - read only
    match /analytics/{document} {
      allow read: if true;
      allow write: if false; // Only server-side functions can write
    }
  }
}
```

---

## How to Apply

1. Copy the **Development Rules** first
2. Go to Firebase Console → Firestore → Rules
3. Paste and click **Publish**
4. Test your app - errors should disappear
5. When ready for production, switch to **Production Rules**

---

## Enable Required APIs

You also need to enable these Firebase APIs:

1. **Firebase App Check API**: https://console.developers.google.com/apis/api/firebaseappcheck.googleapis.com/overview?project=YOUR_PROJECT_ID
2. **Firebase In-App Messaging API**: https://console.developers.google.com/apis/api/firebaseinappmessaging.googleapis.com/overview?project=YOUR_PROJECT_ID

Replace `YOUR_PROJECT_ID` with your actual Firebase project ID: `musicgen-6cea1`

---

## What Each Rule Does

### Development Rules
- ✅ Allow all read/write operations
- ✅ Perfect for testing and debugging
- ❌ NOT secure for production

### Production Rules
- ✅ Users can only access their own data
- ✅ Published tracks are publicly readable
- ✅ Only track owners can modify their tracks
- ✅ Analytics are read-only
- ✅ Secure and follows Firebase best practices

---

Start with Development rules to fix immediate errors, then switch to Production rules before going live!