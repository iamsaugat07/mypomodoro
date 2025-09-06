import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';
import { auth, db } from '../config/firebase';
import { UserProfile, UserSettings } from '../types';

// Google OAuth configuration from your Google Services files
const GOOGLE_OAUTH_CONFIG = {
  iosClientId: '96748369657-95pplni45ck7ur52lh1pa5qv9mni1klh.apps.googleusercontent.com',
  androidClientId: '96748369657-oo6pf942ll19ootlrg1mqvincae9vrvv.apps.googleusercontent.com',
  expoClientId: '96748369657-10e7bht1ndqgr2n3rj6mqgva5387icqd.apps.googleusercontent.com'
};

// Configure Google Sign-In
GoogleSignin.configure({
  iosClientId: GOOGLE_OAUTH_CONFIG.iosClientId,
  webClientId: GOOGLE_OAUTH_CONFIG.androidClientId, // Use Android client ID as web client ID
  offlineAccess: true,
});

const defaultSettings: UserSettings = {
  notifications: true,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  defaultWorkDuration: 25,
  defaultBreakDuration: 5,
  defaultLongBreakDuration: 15,
  customPresets: {}
};

export const createUserProfile = async (user: User, additionalData?: any) => {
  if (!user) return;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    const now = serverTimestamp();

    const userProfile: Omit<UserProfile, 'uid'> = {
      email: email || '',
      displayName: displayName || email?.split('@')[0] || 'Anonymous',
      photoURL: photoURL || null,
      createdAt: now,
      lastActiveAt: now,
      totalSessions: 0,
      totalFocusMinutes: 0,
      currentStreak: 0,
      longestStreak: 0,
      settings: defaultSettings,
      
      // Default subscription fields
      subscriptionStatus: 'free',
      subscriptionPlatform: 'android',
      premiumFeaturesUsed: [],
      
      ...additionalData
    };

    try {
      await setDoc(userRef, userProfile);
      console.log('User profile created successfully');
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  } else {
    await setDoc(userRef, { 
      lastActiveAt: serverTimestamp() 
    }, { merge: true });
    console.log('User last active time updated');
  }

  return userRef;
};

export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName: string
): Promise<User> => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(user, { displayName });
    await createUserProfile(user, { displayName });
    return user;
  } catch (error: any) {
    console.error('Error signing up with email:', error);
    throw new Error(error.message || 'Failed to create account');
  }
};

export const signInWithEmail = async (
  email: string, 
  password: string
): Promise<User> => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    await createUserProfile(user);
    return user;
  } catch (error: any) {
    console.error('Error signing in with email:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

export const signInWithGoogle = async (): Promise<User> => {
  try {
    console.log('Starting Google Sign-In...');
    
    // Check if Google Play Services are available
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    
    // Sign in with Google
    const response = await GoogleSignin.signIn();
    console.log('Google Sign-In Response:', {
      type: response.type,
      data: response.data ? {
        user: response.data.user?.email,
        hasIdToken: !!response.data.idToken
      } : null
    });

    if (response.type === 'success' && response.data?.idToken) {
      // Create Firebase credential from Google ID token
      const googleCredential = GoogleAuthProvider.credential(response.data.idToken);
      
      // Sign in to Firebase with the Google credential
      const { user } = await signInWithCredential(auth, googleCredential);
      
      // Create or update user profile
      await createUserProfile(user);
      
      console.log('Firebase sign-in successful:', user.email);
      return user;
    } else if (response.type === 'cancelled') {
      throw new Error('Google sign-in was cancelled');
    } else {
      throw new Error('Google sign-in failed: No ID token received');
    }
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    
    // Handle specific Google Sign-In errors
    if (error.code === 'SIGN_IN_CANCELLED') {
      throw new Error('Sign-in was cancelled');
    } else if (error.code === 'PLAY_SERVICES_NOT_AVAILABLE') {
      throw new Error('Google Play Services not available');
    } else if (error.code === 'SIGN_IN_REQUIRED') {
      throw new Error('Sign-in required');
    } else {
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  }
};

export const signOut = async (): Promise<void> => {
  try {
    // Sign out from Firebase
    await firebaseSignOut(auth);
    
    // Sign out from Google
    try {
      await GoogleSignin.signOut();
    } catch (googleError) {
      console.warn('Google sign out failed:', googleError);
      // Continue with Firebase sign out even if Google sign out fails
    }
    
    console.log('User signed out successfully');
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return { 
        uid, 
        ...data,
        createdAt: data.createdAt || Timestamp.now(),
        lastActiveAt: data.lastActiveAt || Timestamp.now(),
      } as UserProfile;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserSettings = async (
  uid: string, 
  settings: Partial<UserSettings>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      settings: {
        ...defaultSettings,
        ...settings
      }
    }, { merge: true });
    console.log('User settings updated successfully');
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
};

export const updateUserSubscription = async (
  uid: string,
  subscriptionData: {
    subscriptionStatus: 'free' | 'premium' | 'expired';
    subscriptionExpiresAt?: Timestamp;
    subscriptionProductId?: string;
    revenueCatCustomerId?: string;
  }
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      ...subscriptionData,
      lastActiveAt: serverTimestamp()
    }, { merge: true });
    console.log('User subscription updated successfully');
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
};

// Export the auth state change listener for the provider
export { onAuthStateChanged };