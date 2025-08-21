# 🔥 Firebase Setup Guide for Mobile Pomodoro App

## Prerequisites
- Firebase account (free)
- Google Cloud Console access (for OAuth)
- **Mobile development environment** (iOS/Android)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter project name: `pomodoro-timer-mobile`
4. Enable Google Analytics (recommended for mobile apps)
5. Click "Create Project"

## Step 2: Add Mobile Apps to Firebase

### Add iOS App
1. In Project Settings, click **Add app** → **iOS** (🍎)
2. iOS bundle ID: `com.pomodorotimer.app`
3. App nickname: "Pomodoro Timer iOS"
4. App Store ID: (leave blank for now)
5. Download **GoogleService-Info.plist**
6. Keep this file safe - you'll need it for iOS builds

### Add Android App  
1. In Project Settings, click **Add app** → **Android** (🤖)
2. Android package name: `com.pomodorotimer.app` 
3. App nickname: "Pomodoro Timer Android"
4. SHA-1 certificate fingerprint: (get from your keystore)
5. Download **google-services.json**
6. Keep this file safe - you'll need it for Android builds

## Step 3: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Enable these providers:
   - **Email/Password**: Click enable → Save
   - **Google**: Click enable → Enter support email → Save

## Step 4: Configure Google OAuth for Mobile

### Get Mobile OAuth Client IDs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your Firebase project
3. **APIs & Services** > **Credentials**
4. You should see auto-created OAuth clients for your mobile apps
5. **Copy the Client IDs** for iOS and Android apps

### For Expo Go Development
1. Create additional **Web application** OAuth client
2. Name: "Pomodoro Timer Expo"
3. Authorized redirect URIs:
   - `https://auth.expo.io/@your-expo-username/pomodoro-timer-app`
4. Copy this Client ID for development

## Step 5: Create Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Choose **Start in test mode** (we'll add security rules later)
3. Select your preferred location (closest to your users)
4. Click **Done**

```javascript
// Your Firebase config will look like this:
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "pomodoro-app-xxxxx.firebaseapp.com",
  projectId: "pomodoro-app-xxxxx",
  storageBucket: "pomodoro-app-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};
```

## Step 5: Configure Google OAuth for Expo

### For Expo Development
1. In Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Create new **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: "Pomodoro App Expo"
5. Authorized redirect URIs: 
   - `https://auth.expo.io/@your-expo-username/pomodoro-app`
   - `http://localhost:8081` (for development)

### Update Your Code
Replace the placeholder values in `lib/firebase/config.ts`:

```typescript
// lib/firebase/config.ts
const firebaseConfig = {
  // Paste your actual config here
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

And in `lib/services/auth.ts`:

```typescript
// lib/services/auth.ts
const GOOGLE_OAUTH_CONFIG = {
  clientId: 'your-google-oauth-client-id.googleusercontent.com',
};
```

## Step 6: Set Up Security Rules

In Firestore, go to **Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Subcollections inherit parent permissions
      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /dailyStats/{date} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /weeklyStats/{week} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## Step 7: Test the Setup

1. Run `npm start` or `expo start`
2. Try creating an account with email/password
3. Try signing in with Google (may require Expo Go app)
4. Check Firebase Console > Authentication to see users
5. Check Firestore to see user data being created

## Troubleshooting

### Google Sign-In Issues
- Make sure your OAuth client ID is correct
- For Expo Go, you might need to use a different client ID
- Check that your redirect URIs include Expo's auth domain

### Firestore Permission Errors
- Ensure your security rules match the ones above
- Check that the user is authenticated before making requests

### General Issues
- Check console logs for detailed error messages
- Ensure all Firebase packages are properly installed
- Verify your Firebase config is correctly set

## Optional: Enable Firebase Analytics

1. Go to **Analytics** in Firebase Console
2. Click **Enable Google Analytics**
3. Create or select Analytics account
4. Analytics will automatically track user engagement

## Production Considerations

1. **Security Rules**: Review and tighten security rules
2. **Rate Limiting**: Consider adding rate limiting for writes
3. **Backup**: Set up regular Firestore backups
4. **Monitoring**: Enable Firebase Performance Monitoring
5. **Costs**: Monitor Firestore usage and set budget alerts

Your Pomodoro app is now fully integrated with Firebase! 🎉