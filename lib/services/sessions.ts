import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { PomodoroSession, SessionType, DailyStats } from '../types';

// Helper function to get today's date string
const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0];
};

// Helper function to get week string (YYYY-WW format)
const getWeekString = (date: Date): string => {
  const year = date.getFullYear();
  const week = Math.ceil(
    ((date.getTime() - new Date(year, 0, 1).getTime()) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7
  );
  return `${year}-${week.toString().padStart(2, '0')}`;
};

// Helper function to get month string (YYYY-MM format)
const getMonthString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

// Start a new Pomodoro session
export const startSession = async (
  userId: string,
  type: SessionType,
  duration: number, // in seconds
  presetUsed: string
): Promise<string> => {
  try {
    const sessionRef = doc(collection(db, `users/${userId}/sessions`));
    const now = new Date();
    
    const session: Omit<PomodoroSession, 'id'> = {
      type,
      startedAt: serverTimestamp() as Timestamp,
      endedAt: null,
      duration,
      actualDuration: 0,
      completed: false,
      presetUsed,
      date: getTodayString(),
      dayOfWeek: now.getDay(),
      week: getWeekString(now),
      month: getMonthString(now),
    };

    await setDoc(sessionRef, session);
    
    console.log('Session started:', sessionRef.id);
    return sessionRef.id;
  } catch (error) {
    console.error('Error starting session:', error);
    throw error;
  }
};

// Complete a session and update statistics
export const completeSession = async (
  userId: string,
  sessionId: string,
  actualDuration: number, // in seconds
  wasCompleted: boolean = true
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Update the session
    const sessionRef = doc(db, `users/${userId}/sessions`, sessionId);
    batch.update(sessionRef, {
      endedAt: serverTimestamp(),
      actualDuration,
      completed: wasCompleted,
    });

    // Get the session to know its type
    const sessionDoc = await getDocs(
      query(
        collection(db, `users/${userId}/sessions`),
        where('__name__', '==', sessionId),
        limit(1)
      )
    );

    if (!sessionDoc.empty) {
      const sessionData = sessionDoc.docs[0].data() as PomodoroSession;
      const today = getTodayString();
      
      // Update daily stats
      const dailyStatsRef = doc(db, `users/${userId}/dailyStats`, today);
      
      if (sessionData.type === 'work' && wasCompleted) {
        const focusMinutes = Math.round(actualDuration / 60);
        
        batch.set(dailyStatsRef, {
          date: today,
          workSessions: increment(1),
          completedSessions: increment(1),
          totalSessions: increment(1),
          totalFocusMinutes: increment(focusMinutes),
          updatedAt: serverTimestamp(),
        }, { merge: true });

        // Update user totals
        const userRef = doc(db, 'users', userId);
        batch.update(userRef, {
          totalSessions: increment(1),
          totalFocusMinutes: increment(focusMinutes),
          lastActiveAt: serverTimestamp(),
        });
      } else if (sessionData.type !== 'work') {
        // Track break sessions
        batch.set(dailyStatsRef, {
          date: today,
          breakSessions: increment(1),
          totalSessions: increment(1),
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
    }

    await batch.commit();
    console.log('Session completed and stats updated');
  } catch (error) {
    console.error('Error completing session:', error);
    throw error;
  }
};

// Get today's sessions for real-time display
export const getTodaySessions = (
  userId: string,
  callback: (sessions: PomodoroSession[]) => void
) => {
  const today = getTodayString();
  const sessionsRef = collection(db, `users/${userId}/sessions`);
  const q = query(
    sessionsRef,
    where('date', '==', today),
    orderBy('startedAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const sessions: PomodoroSession[] = [];
    snapshot.forEach((doc) => {
      sessions.push({
        id: doc.id,
        ...doc.data(),
      } as PomodoroSession);
    });
    callback(sessions);
  });
};

// Get today's stats
export const getTodayStats = (
  userId: string,
  callback: (stats: DailyStats | null) => void
) => {
  const today = getTodayString();
  const statsRef = doc(db, `users/${userId}/dailyStats`, today);

  return onSnapshot(statsRef, (doc) => {
    if (doc.exists()) {
      callback({
        ...doc.data(),
        date: today,
      } as DailyStats);
    } else {
      // Return default stats if no data exists for today
      callback({
        date: today,
        workSessions: 0,
        breakSessions: 0,
        totalFocusMinutes: 0,
        completedSessions: 0,
        totalSessions: 0,
        longestStreak: 0,
        hourlyBreakdown: {},
        updatedAt: Timestamp.now(),
      });
    }
  });
};

// Get weekly stats (last 7 days)
export const getWeeklyStats = async (userId: string): Promise<DailyStats[]> => {
  try {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const startDate = weekAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const statsRef = collection(db, `users/${userId}/dailyStats`);
    const q = query(
      statsRef,
      where('__name__', '>=', startDate),
      where('__name__', '<=', endDate),
      orderBy('__name__')
    );

    const snapshot = await getDocs(q);
    const weeklyStats: DailyStats[] = [];
    
    snapshot.forEach((doc) => {
      weeklyStats.push({
        ...doc.data(),
        date: doc.id,
      } as DailyStats);
    });

    return weeklyStats;
  } catch (error) {
    console.error('Error getting weekly stats:', error);
    throw error;
  }
};

// Cancel/abandon a session
export const cancelSession = async (
  userId: string,
  sessionId: string
): Promise<void> => {
  try {
    const sessionRef = doc(db, `users/${userId}/sessions`, sessionId);
    await updateDoc(sessionRef, {
      endedAt: serverTimestamp(),
      completed: false,
    });
    
    console.log('Session cancelled');
  } catch (error) {
    console.error('Error cancelling session:', error);
    throw error;
  }
};