# Firebase Setup Instructions

## 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `musicgen-ai`
4. Enable Google Analytics (optional)
5. Select default account

## 2. Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable the following providers:
   - **Email/Password**: Enable
   - **Google**: Enable and configure OAuth consent screen

3. Configure authorized domains:
   - Add your domain: `musicgenai.app`
   - Add localhost for development: `localhost`

## 3. Create Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Start in **production mode**
3. Choose location closest to your users
4. Deploy the security rules from `firestore.rules`

## 4. Configure Web App

1. Go to **Project settings** > **General**
2. Scroll down to "Your apps"
3. Click "Add app" > Web (</>) 
4. Enter app nickname: "MusicGen AI Web"
5. Enable "Firebase Hosting" (optional)
6. Copy the config object

## 5. Update Configuration

Replace the placeholder values in `js/firebase-config.js`:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_ACTUAL_API_KEY",
    authDomain: "musicgen-ai.firebaseapp.com",
    projectId: "musicgen-ai",
    storageBucket: "musicgen-ai.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## 6. Deploy Firestore Rules

Using Firebase CLI:
```bash
firebase init firestore
firebase deploy --only firestore:rules
```

## 7. Test Authentication

1. Open the app in browser
2. Try signing up with email
3. Try signing in with Google
4. Check that user data is created in Firestore

## 8. Security Checklist

- [ ] Firestore rules deployed
- [ ] Only authorized domains in Auth settings
- [ ] API keys restricted in Google Cloud Console
- [ ] User data isolated by userId
- [ ] No sensitive data in client code

## 9. Environment Variables

For production, consider using environment variables:

```javascript
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};
```

## 10. Firestore Collections Structure

```
/users/{userId}
  - uid: string
  - email: string
  - displayName: string
  - photoURL: string
  - createdAt: timestamp
  - subscription: string
  - credits: number
  - preferences: object

/users/{userId}/tracks/{trackId}
  - title: string
  - audioUrl: string
  - duration: number
  - genre: string
  - prompt: string
  - createdAt: timestamp
  - userId: string

/users/{userId}/playlists/{playlistId}
  - name: string
  - tracks: array
  - createdAt: timestamp
  - userId: string
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify Firebase configuration
3. Check Firestore rules
4. Ensure domains are authorized