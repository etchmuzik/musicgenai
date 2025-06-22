# 🔥 Firebase Console Registration Steps

## **URGENT: Complete These Steps to Fix AppCheck Errors**

### **Step 1: Access Firebase Console**
1. Go to: [Firebase Console](https://console.firebase.google.com/project/musicgen-6cea1)
2. Sign in with your Google account that has access to this project

### **Step 2: Verify iOS App Registration**
1. Click on **⚙️ Project Settings** (gear icon)
2. Scroll down to **"Your apps"** section
3. Look for an iOS app with:
   - **Bundle ID**: `com.beyond.musicgenmain`
   - **App ID**: `1:392958246299:ios:e702f3520efffa0778353e`

### **Step 3A: If iOS App is Missing**
1. Click **"Add app"** button
2. Select **iOS** icon
3. Enter Bundle ID: `com.beyond.musicgenmain`
4. Enter App nickname: `MusicGen iOS`
5. Click **"Register app"**
6. **Download** the new `GoogleService-Info.plist`
7. **Replace** the current file in Xcode

### **Step 3B: If iOS App Exists**
1. Click on the iOS app in the list
2. Verify Bundle ID matches: `com.beyond.musicgenmain`
3. **Download** `GoogleService-Info.plist` if needed

### **Step 4: Configure App Check**
1. In Firebase Console, go to **Build > App Check**
2. Click on **"Configure"** or **"Get started"**
3. Find your iOS app: `com.beyond.musicgenmain`
4. Click **"Register"** next to your app
5. Choose provider:
   - **For Development**: DeviceCheck (default)
   - **For Production**: App Attest (recommended)

### **Step 5: Enable Services**
Ensure these services are enabled:
1. **Authentication** > Sign-in method > Enable Email/Password
2. **Firestore Database** > Create database (if not created)
3. **Storage** > Get started (if not created)

### **Step 6: Security Rules**
Update Firestore rules for development:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## **Current Status:**
- ✅ **Bundle ID Fixed**: `com.beyond.musicgenmain` (consistent)
- ✅ **AppCheck Debug Mode**: Enabled in development
- ⚠️ **Manual Step Required**: Register iOS app in Firebase Console

## **After Completing These Steps:**
Your AppCheck errors should be resolved and Firebase will work properly in production.

## **Debug Mode Note:**
I've enabled AppCheck debug mode in development, which will suppress the registration errors while you complete the Firebase Console setup.