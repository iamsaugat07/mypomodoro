import { Timestamp } from 'firebase/firestore';

// Timer related types
export interface TimerPreset {
  work: number;
  break: number;
  longBreak: number;
  name?: string;
  createdAt?: Timestamp;
}

export type SessionType = 'work' | 'break' | 'longBreak';

// User types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  
  // Cached statistics for quick access
  totalSessions: number;
  totalFocusMinutes: number;
  currentStreak: number;
  longestStreak: number;
  
  settings: UserSettings;
}

export interface UserSettings {
  notifications: boolean;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  defaultWorkDuration: number; // in minutes
  defaultBreakDuration: number; // in minutes
  defaultLongBreakDuration: number; // in minutes
  customPresets: Record<string, CustomPreset>;
}

export interface CustomPreset {
  name: string;
  work: number;
  break: number;
  longBreak: number;
  createdAt: Timestamp;
}

// Session types
export interface PomodoroSession {
  id: string;
  type: SessionType;
  startedAt: Timestamp;
  endedAt: Timestamp | null;
  duration: number; // planned duration in seconds
  actualDuration: number; // actual time spent in seconds
  completed: boolean;
  presetUsed: string; // which preset was used
  
  // For easy querying
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  week: string; // YYYY-WW
  month: string; // YYYY-MM
}

// Stats types
export interface DailyStats {
  date: string; // YYYY-MM-DD
  workSessions: number;
  breakSessions: number;
  totalFocusMinutes: number;
  completedSessions: number;
  totalSessions: number;
  longestStreak: number;
  
  // Hourly breakdown for detailed analytics
  hourlyBreakdown: Record<string, number>;
  
  updatedAt: Timestamp;
}

export interface WeeklyStats {
  week: string; // YYYY-WW
  totalSessions: number;
  totalFocusMinutes: number;
  dailyBreakdown: number[]; // [mon, tue, wed, thu, fri, sat, sun]
  updatedAt: Timestamp;
}

// Authentication types
export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Component prop types
export interface CustomTimerModalProps {
  visible: boolean;
  onClose: () => void;
  onSetCustomTimer: (customTimes: TimerPreset) => void;
}