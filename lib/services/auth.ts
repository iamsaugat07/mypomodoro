import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  User
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { auth, db } from '../firebase/config';
import { UserProfile, UserSettings } from '../types';

// Configure WebBrowser for auth session
WebBrowser.maybeCompleteAuthSession();

// TODO: Replace with your actual Google OAuth configuration for mobile
// Get these from Firebase Console > Authentication > Sign-in method > Google
// For iOS: Use the iOS client ID from GoogleService-Info.plist
// For Android: Use the Android client ID from google-services.json
const GOOGLE_OAUTH_CONFIG = {
  // Use your iOS client ID for iOS builds
  iosClientId: 'your-ios-client-id.googleusercontent.com',
  // Use your Android client ID for Android builds  
  androidClientId: 'your-android-client-id.googleusercontent.com',
  // For Expo Go development, use Expo's client ID
  expoClientId: 'your-expo-client-id.googleusercontent.com'
};

// Default user settings
const defaultSettings: UserSettings = {
  notifications: true,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  defaultWorkDuration: 25,
  defaultBreakDuration: 5,
  defaultLongBreakDuration: 15,
  customPresets: {}
};

// Create or update user profile in Firestore
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
    // Update last active time
    await setDoc(userRef, { 
      lastActiveAt: serverTimestamp() 
    }, { merge: true });
    console.log('User last active time updated');
  }

  return userRef;
};

// Sign up with email and password
export const signUpWithEmail = async (
  email: string, 
  password: string, 
  displayName: string
): Promise<User> => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update the user's display name
    await updateProfile(user, { displayName });
    
    // Create user profile in Firestore
    await createUserProfile(user, { displayName });
    
    return user;
  } catch (error: any) {
    console.error('Error signing up with email:', error);
    throw new Error(error.message || 'Failed to create account');
  }
};

// Sign in with email and password
export const signInWithEmail = async (
  email: string, 
  password: string
): Promise<User> => {
  try {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    
    // Update user profile with last login
    await createUserProfile(user);
    
    return user;
  } catch (error: any) {
    console.error('Error signing in with email:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

// Sign in with Google using Expo AuthSession (Mobile-optimized)
export const signInWithGoogle = async (): Promise<User> => {
  try {
    // Determine which client ID to use based on platform/environment
    let clientId = GOOGLE_OAUTH_CONFIG.expoClientId; // Default for Expo Go
    
    // TODO: Uncomment these when building for production
    // if (Platform.OS === 'ios') {
    //   clientId = GOOGLE_OAUTH_CONFIG.iosClientId;
    // } else if (Platform.OS === 'android') {
    //   clientId = GOOGLE_OAUTH_CONFIG.androidClientId;
    // }
    
    // Create auth request
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri(),
      responseType: AuthSession.ResponseType.IdToken,
    });

    // Start the auth session
    const result = await request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/oauth/authorize',
    });

    if (result.type === 'success' && result.params.id_token) {
      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(result.params.id_token);
      
      // Sign-in the user with the credential
      const { user } = await signInWithCredential(auth, googleCredential);
      
      // Create user profile in Firestore
      await createUserProfile(user);
      
      return user;
    } else {
      throw new Error('Google sign-in was cancelled or failed');
    }
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
    console.log('User signed out successfully');
  } catch (error: any) {
    console.error('Error signing out:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

// Get user profile from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      return { 
        uid, 
        ...data,
        // Convert Firestore timestamps to Timestamp objects
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

// Update user settings
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