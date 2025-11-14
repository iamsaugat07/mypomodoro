import { getApp } from '@react-native-firebase/app';
import { getAuth, GoogleAuthProvider } from '@react-native-firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  runTransaction,
  Timestamp,
  FieldValue,
  FirebaseFirestoreTypes
} from '@react-native-firebase/firestore';
import { getStorage } from '@react-native-firebase/storage';
import { getAnalytics } from '@react-native-firebase/analytics';
import { getMessaging } from '@react-native-firebase/messaging';

/**
 * React Native Firebase Configuration - Modular API (v22+)
 *
 * Configuration is loaded from native files:
 * - iOS: GoogleService-Info.plist
 * - Android: google-services.json
 *
 * RNFirebase auto-initializes from native configuration
 */

// Get the default Firebase app instance
export const app = getApp();

// Get Firebase service instances using modular API
export const firebaseAuth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const firebaseAnalytics = getAnalytics(app);
export const firebaseMessaging = getMessaging(app);

// Backward compatibility aliases
export { firebaseAuth as auth };

// Firebase utilities - modular API
export const FirebaseTimestamp = Timestamp;
export { serverTimestamp, increment, arrayUnion, arrayRemove } from '@react-native-firebase/firestore';

// Re-export modular Firestore functions
export {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  runTransaction,
  Timestamp,
  FieldValue,
  GoogleAuthProvider
};

// Type exports
export type { FirebaseFirestoreTypes };

console.log('Firebase initialized successfully with React Native Firebase (Modular API)');
