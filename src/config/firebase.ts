import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Firebase configuration from your project
const firebaseConfig = {
  apiKey: "AIzaSyBBSqSrc7Gom_DjwuPbFG-3Xx3uc_xpxH8",
  authDomain: "pomodoro-f0021.firebaseapp.com", 
  projectId: "pomodoro-f0021",
  storageBucket: "pomodoro-f0021.firebasestorage.app",
  messagingSenderId: "96748369657",
  appId: "1:96748369657:android:cdaec5ab0971d59a57d428"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services with React Native persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const db = getFirestore(app);

// Connect to emulators in development if needed
if (__DEV__ && Constants.expoConfig?.extra?.useEmulators) {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    console.log('Emulator connection failed:', error);
  }
}

export { auth, db };