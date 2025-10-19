import { getApp } from '@react-native-firebase/app';
import { getAuth } from '@react-native-firebase/auth';
import {
  getFirestore,
  Timestamp,
  serverTimestamp as firestoreServerTimestamp,
  increment as firestoreIncrement,
} from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';
import { getAnalytics } from '@react-native-firebase/analytics';
import { getMessaging } from '@react-native-firebase/messaging';

/**
 * React Native Firebase Configuration (Modular API v23+)
 *
 * Configuration is loaded from native files:
 * - iOS: GoogleService-Info.plist
 * - Android: google-services.json
 *
 * No manual initialization required - RNFirebase auto-initializes
 */

const app = getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const firebaseAnalytics = getAnalytics(app);
export const firebaseMessaging = getMessaging(app);

// For backward compatibility
export const firebaseAuth = auth;

// Firebase utilities - direct modular imports (no deprecation warnings for these)
export const FirebaseTimestamp = Timestamp;
export const serverTimestamp = firestoreServerTimestamp;
export const increment = firestoreIncrement;

console.log('Firebase initialized successfully with React Native Firebase (Modular API)');
