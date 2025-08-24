import { useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { sessionManager, ActiveSession } from '../services/sessionManager';
import { useAuth } from '../providers/auth';

export interface UseSessionManagerReturn {
  activeSession: ActiveSession | null;
  isSessionActive: boolean;
  elapsedTime: number;
  startSession: (type: 'work' | 'break' | 'longBreak', duration: number) => Promise<string>;
  completeSession: (completed?: boolean) => Promise<void>;
  cancelSession: () => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  isPaused: boolean;
}

export const useSessionManager = (): UseSessionManagerReturn => {
  const { user } = useAuth();
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef(AppState.currentState);

  // Initialize and recover sessions on mount
  useEffect(() => {
    const initializeSession = async () => {
      const recovered = await sessionManager.recoverActiveSession();
      if (recovered) {
        setActiveSession(recovered);
        setIsPaused(recovered.pausedTime !== undefined);
      }
    };

    if (user) {
      initializeSession();
    }
  }, [user]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - resume tracking
        if (activeSession && !isPaused) {
          startElapsedTimeTracking();
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - pause tracking but don't pause session
        stopElapsedTimeTracking();
      }
      
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [activeSession, isPaused]);

  // Track elapsed time
  useEffect(() => {
    if (activeSession && !isPaused) {
      startElapsedTimeTracking();
    } else {
      stopElapsedTimeTracking();
    }

    return () => stopElapsedTimeTracking();
  }, [activeSession, isPaused]);

  const startElapsedTimeTracking = () => {
    stopElapsedTimeTracking(); // Clear any existing interval
    
    intervalRef.current = setInterval(() => {
      const elapsed = sessionManager.getElapsedTime();
      setElapsedTime(elapsed);
    }, 1000);
  };

  const stopElapsedTimeTracking = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startSession = async (type: 'work' | 'break' | 'longBreak', duration: number): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    const sessionId = await sessionManager.startSession(user.uid, type, duration);
    const session = sessionManager.getActiveSession();
    
    setActiveSession(session);
    setIsPaused(false);
    setElapsedTime(0);
    
    return sessionId;
  };

  const completeSession = async (completed: boolean = true): Promise<void> => {
    if (!activeSession) return;

    const actualDuration = Math.floor(sessionManager.getElapsedTime() / 1000);
    await sessionManager.completeSession(activeSession.sessionId, actualDuration, completed);
    
    setActiveSession(null);
    setElapsedTime(0);
    setIsPaused(false);
  };

  const cancelSession = async (): Promise<void> => {
    if (!activeSession) return;

    await sessionManager.cancelSession(activeSession.sessionId);
    
    setActiveSession(null);
    setElapsedTime(0);
    setIsPaused(false);
  };

  const pauseSession = (): void => {
    if (activeSession && !isPaused) {
      sessionManager.pauseSession();
      setIsPaused(true);
    }
  };

  const resumeSession = (): void => {
    if (activeSession && isPaused) {
      sessionManager.resumeSession();
      setIsPaused(false);
    }
  };

  return {
    activeSession,
    isSessionActive: activeSession !== null,
    elapsedTime,
    startSession,
    completeSession,
    cancelSession,
    pauseSession,
    resumeSession,
    isPaused
  };
};