import { useState, useEffect } from 'react';
import { 
  getTodaySessions, 
  getTodayStats, 
  getWeeklyStats,
  startSession,
  completeSession,
  cancelSession
} from '../services/sessions';
import { updateUserSettings } from '../services/auth';
import { useAuth } from '../context/AuthContext';
import { PomodoroSession, DailyStats, SessionType, UserSettings } from '../types';

// Hook for managing today's sessions
export const useTodaySessions = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const unsubscribe = getTodaySessions(user.uid, (newSessions) => {
      setSessions(newSessions);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  return { sessions, loading };
};

// Hook for managing today's stats
export const useTodayStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DailyStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setStats(null);
      setLoading(false);
      return;
    }

    const unsubscribe = getTodayStats(user.uid, (newStats) => {
      setStats(newStats);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  return { stats, loading };
};

// Hook for managing weekly stats
export const useWeeklyStats = () => {
  const { user } = useAuth();
  const [weeklyStats, setWeeklyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setWeeklyStats([]);
      setLoading(false);
      return;
    }

    const fetchWeeklyStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const stats = await getWeeklyStats(user.uid);
        setWeeklyStats(stats);
      } catch (err) {
        console.error('Error fetching weekly stats:', err);
        setError('Failed to load weekly stats');
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyStats();
  }, [user]);

  return { weeklyStats, loading, error };
};

// Hook for managing Pomodoro sessions
export const usePomodoroSession = () => {
  const { user } = useAuth();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const start = async (
    type: SessionType,
    duration: number,
    presetUsed: string
  ): Promise<string | null> => {
    if (!user) {
      throw new Error('User must be authenticated to start session');
    }

    try {
      setLoading(true);
      const sessionId = await startSession(user.uid, type, duration, presetUsed);
      setCurrentSessionId(sessionId);
      return sessionId;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const complete = async (
    sessionId: string,
    actualDuration: number,
    wasCompleted: boolean = true
  ): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to complete session');
    }

    try {
      setLoading(true);
      await completeSession(user.uid, sessionId, actualDuration, wasCompleted);
      setCurrentSessionId(null);
    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const cancel = async (sessionId: string): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to cancel session');
    }

    try {
      setLoading(true);
      await cancelSession(user.uid, sessionId);
      setCurrentSessionId(null);
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    currentSessionId,
    loading,
    start,
    complete,
    cancel,
  };
};

// Hook for managing user settings
export const useUserSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const updateSettings = async (settings: Partial<UserSettings>): Promise<void> => {
    if (!user) {
      throw new Error('User must be authenticated to update settings');
    }

    try {
      setLoading(true);
      await updateUserSettings(user.uid, settings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    settings: user?.settings || null,
    loading,
    updateSettings,
  };
};