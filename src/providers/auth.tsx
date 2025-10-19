import { createContext, useContext, useEffect, useState } from 'react';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { AuthContextType, UserProfile } from '../types';
import { onAuthStateChanged } from '../services/auth';
import * as authService from '../services/auth';

// Type alias for Firebase User
type User = FirebaseAuthTypes.User;

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
    const unsubscribe = onAuthStateChanged(async (firebaseUser: User | null) => {
      try {
        setLoading(true);

        if (firebaseUser) {
          let userProfile = await authService.getUserProfile(firebaseUser.uid);

          if (!userProfile) {
            await authService.createUserProfile(firebaseUser);
            userProfile = await authService.getUserProfile(firebaseUser.uid);
          }

          setUser(userProfile);
        } else {
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
    setLoading(true);
    try {
      await authService.signInWithEmail(email, password);
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
    setLoading(true);
    try {
      await authService.signUpWithEmail(email, password, displayName);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await authService.signOut();
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