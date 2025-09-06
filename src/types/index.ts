import { Timestamp } from 'firebase/firestore';

export interface UserSettings {
  notifications: boolean;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  defaultWorkDuration: number;
  defaultBreakDuration: number;
  defaultLongBreakDuration: number;
  customPresets: Record<string, TimerPreset>;
}

export interface TimerPreset {
  work: number;
  break: number;
  longBreak: number;
  sessionsUntilLongBreak?: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  totalSessions: number;
  totalFocusMinutes: number;
  currentStreak: number;
  longestStreak: number;
  settings: UserSettings;
  
  // Subscription fields
  subscriptionStatus: 'free' | 'premium' | 'expired';
  subscriptionPlatform?: 'android';
  subscriptionExpiresAt?: Timestamp;
  subscriptionProductId?: string;
  premiumFeaturesUsed: string[];
  revenueCatCustomerId?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export interface PomodoroSession {
  id?: string;
  userId: string;
  type: 'work' | 'break' | 'longBreak';
  duration: number;
  completedAt: Timestamp;
  interrupted: boolean;
  date: string;
}

export type SessionType = 'work' | 'break' | 'longBreak';