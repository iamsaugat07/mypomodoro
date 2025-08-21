# 📱 Mobile Setup Guide for Pomodoro Timer App

## Overview
This is a **mobile-only** React Native Expo app with Firebase backend. It supports iOS and Android platforms with Firebase Authentication and Firestore database.

## Prerequisites
- Node.js (v18 or later)
- Expo CLI: `npm install -g @expo/cli`
- Firebase account
- iOS: Xcode (for iOS development)
- Android: Android Studio (for Android development)

## 📱 Platform Support
- ✅ **iOS** (iPhone/iPad)
- ✅ **Android** (Phone/Tablet)
- ❌ **Web** (Not supported - mobile-only app)

## 🚀 Quick Start

### 1. Clone and Install
```bash
git clone <your-repo>
cd pomodoroapp
npm install
```

### 2. Firebase Mobile Setup

#### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create new project: "Pomodoro Timer"
3. Enable Authentication & Firestore

#### Add Mobile Apps to Firebase

**For iOS:**
1. Click "Add app" → iOS
2. Bundle ID: `com.pomodorotimer.app` 
3. Download `GoogleService-Info.plist`
4. Place in your iOS project root (when building)

**For Android:**
1. Click "Add app" → Android  
2. Package name: `com.pomodorotimer.app`
3. Download `google-services.json`
4. Place in `android/app/` folder (when building)

### 3. Configure Authentication

#### Enable Sign-in Methods
1. Authentication → Sign-in method
2. Enable **Email/Password**
3. Enable **Google** sign-in

#### Get OAuth Client IDs
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Create OAuth 2.0 Client IDs for:
   - **iOS application** (for production iOS builds)
   - **Android application** (for production Android builds)
   - **Web application** (for Expo Go development)

### 4. Update Configuration Files

#### Firebase Config (`lib/firebase/config.ts`)
```typescript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id", 
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
  // Mobile client IDs
  iosClientId: "your-ios-client-id.googleusercontent.com",
  androidClientId: "your-android-client-id.googleusercontent.com"
};
```

#### OAuth Config (`lib/services/auth.ts`)
```typescript
const GOOGLE_OAUTH_CONFIG = {
  iosClientId: 'your-ios-client-id.googleusercontent.com',
  androidClientId: 'your-android-client-id.googleusercontent.com', 
  expoClientId: 'your-expo-client-id.googleusercontent.com'
};
```

#### App Config (`app.json`)
```json
{
  "expo": {
    "name": "Pomodoro Timer",
    "slug": "pomodoro-timer-app",
    "bundleIdentifier": "com.pomodorotimer.app", // iOS
    "package": "com.pomodorotimer.app", // Android
    "scheme": "pomodoroapp"
  }
}
```

### 5. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /dailyStats/{date} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 🧪 Development & Testing

### Run in Development
```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator  
npm run android

# Test on physical device with Expo Go
# Scan QR code with Expo Go app
```

### Testing Authentication
1. Create account with email/password
2. Test Google sign-in (requires proper OAuth setup)
3. Verify user data appears in Firebase Console
4. Test offline functionality

## 📦 Building for Production

### iOS Build
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure build
eas build:configure

# Build for iOS
eas build --platform ios

# Submit to App Store (optional)
eas submit --platform ios
```

### Android Build
```bash
# Build for Android
eas build --platform android

# Generate APK for testing
eas build --platform android --profile preview

# Submit to Google Play (optional)
eas submit --platform android
```

## 🔧 Mobile-Specific Features

### Permissions (Android)
- `INTERNET` - Firebase connectivity
- `ACCESS_NETWORK_STATE` - Network status
- `VIBRATE` - Timer notifications

### iOS Configuration
- Deep linking support with URL schemes
- Background app refresh capabilities
- Push notification permissions (future enhancement)

### Offline Support
- Firebase Firestore offline persistence
- AsyncStorage for local data caching
- Graceful offline/online transitions

## 📊 App Architecture

### Navigation
```
App Root
├── /auth (Login/Signup)
└── /(tabs) - Main App
    ├── /index (Timer)
    ├── /stats (Statistics) 
    └── /settings (Settings)
```

### Data Flow
```
Mobile App ↔ Firebase Auth ↔ Firestore
     ↓
AsyncStorage (offline cache)
```

## 🐛 Troubleshooting

### Google Sign-In Issues
- Verify OAuth client IDs match your platform
- Check bundle ID/package name consistency
- Ensure redirect URIs are correctly configured

### Firebase Connection Issues
- Check internet connectivity
- Verify Firebase project configuration
- Review Firestore security rules

### Build Issues
- Ensure all native dependencies are properly linked
- Check that GoogleService files are in correct locations
- Verify app identifiers match Firebase project

## 🚀 Deployment Checklist

- [ ] Firebase project configured
- [ ] OAuth credentials for both platforms
- [ ] Bundle ID/Package name consistency
- [ ] Firestore security rules updated
- [ ] App icons and splash screens optimized
- [ ] Privacy policy and terms (if publishing)
- [ ] App Store/Play Store metadata prepared

## 📈 Performance Optimization

### Firebase
- Firestore indexes optimized for queries
- Offline persistence enabled
- Real-time listeners optimized

### React Native
- Image assets optimized for mobile
- Bundle size minimized
- Lazy loading where appropriate

Your mobile Pomodoro timer is ready for production deployment! 🍅📱