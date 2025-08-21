import { initializeApp } from 'firebase/app';
import { initializeAuth, connectAuthEmulator, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// TODO: Replace with your actual Firebase config from Firebase Console
// Go to Project Settings > General > Your apps > Add Firebase to your iOS/Android app
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id",
  // iOS specific
  iosClientId: "your-ios-client-id.googleusercontent.com",
  // Android specific  
  androidClientId: "your-android-client-id.googleusercontent.com"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication with persistence for React Native
// Using browserLocalPersistence which works for React Native and provides
// persistent auth state across app sessions using AsyncStorage under the hood
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

// Initialize Cloud Firestore with offline persistence
export const db = getFirestore(app);

// Connect to emulators in development (optional)
if (__DEV__) {
  // Uncomment these lines if you're using Firebase emulators for development
  // connectAuthEmulator(auth, 'http://10.0.2.2:9099'); // Android emulator
  // connectFirestoreEmulator(db, '10.0.2.2', 8080); // Android emulator
  // For iOS simulator use 'localhost' instead of '10.0.2.2'
}

export default app;