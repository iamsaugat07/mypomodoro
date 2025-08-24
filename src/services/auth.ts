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
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { auth, db } from '../config/firebase';
import { UserProfile, UserSettings } from '../types';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration from your Google Services files
const GOOGLE_OAUTH_CONFIG = {
  iosClientId: '96748369657-95pplni45ck7ur52lh1pa5qv9mni1klh.apps.googleusercontent.com',
  androidClientId: '96748369657-ofh8d6ehs4nsgfsddbblv3d29rciip3j.apps.googleusercontent.com',
  expoClientId: '96748369657-10e7bht1ndqgr2n3rj6mqgva5387icqd.apps.googleusercontent.com'
};

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
    let clientId = GOOGLE_OAUTH_CONFIG.expoClientId;
    
    // Use platform-specific client ID for production builds
    if (Platform.OS === 'ios') {
      clientId = GOOGLE_OAUTH_CONFIG.iosClientId;
    } else if (Platform.OS === 'android') {
      clientId = GOOGLE_OAUTH_CONFIG.androidClientId;
    }
    
    const request = new AuthSession.AuthRequest({
      clientId,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri(),
      responseType: AuthSession.ResponseType.IdToken,
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://accounts.google.com/oauth/authorize',
    });

    if (result.type === 'success' && result.params.id_token) {
      const googleCredential = GoogleAuthProvider.credential(result.params.id_token);
      const { user } = await signInWithCredential(auth, googleCredential);
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

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
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

// Export the auth state change listener for the provider
export { onAuthStateChanged };