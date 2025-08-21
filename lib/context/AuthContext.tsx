import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../firebase/config';
import { 
  signInWithEmail as authSignInWithEmail,
  signUpWithEmail as authSignUpWithEmail,
  signInWithGoogle as authSignInWithGoogle,
  signOut as authSignOut,
  getUserProfile,
  createUserProfile
} from '../services/auth';
import { AuthContextType, UserProfile } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      try {
        setLoading(true);
        
        if (firebaseUser) {
          console.log('User authenticated:', firebaseUser.email);
          
          // Get full user profile from Firestore
          let userProfile = await getUserProfile(firebaseUser.uid);
          
          if (!userProfile) {
            // Create profile if it doesn't exist
            console.log('Creating user profile...');
            await createUserProfile(firebaseUser);
            userProfile = await getUserProfile(firebaseUser.uid);
          }
          
          setUser(userProfile);
        } else {
          console.log('User not authenticated');
          setUser(null);
        }
      } catch (error) {
        console.error('Error in auth state change:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signInWithEmail = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      await authSignInWithEmail(email, password);
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUpWithEmail = async (
    email: string, 
    password: string, 
    displayName: string
  ): Promise<void> => {
    try {
      setLoading(true);
      await authSignUpWithEmail(email, password, displayName);
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    try {
      setLoading(true);
      await authSignInWithGoogle();
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      setLoading(true);
      await authSignOut();
      // User state will be updated by onAuthStateChanged listener
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};