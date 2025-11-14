import { db, serverTimestamp, FirebaseTimestamp, collection, addDoc, doc, updateDoc, query, where, orderBy, limit, getDocs } from '../config/firebase';
import { PomodoroSession } from '../types';

export const createSession = async (
  userId: string,
  type: 'work' | 'short_break' | 'long_break',
  plannedDuration: number
): Promise<string> => {
  try {
    const sessionData = {
      userId,
      type,
      plannedDuration,
      startedAt: serverTimestamp(),
      completed: false,
      interrupted: false,
      date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
    };

    const sessionsRef = collection(db, 'sessions');
    const docRef = await addDoc(sessionsRef, sessionData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const completeSession = async (
  sessionId: string,
  actualDuration: number,
  completed: boolean = true
): Promise<void> => {
  try {
    const sessionRef = doc(db, 'sessions', sessionId);
    await updateDoc(sessionRef, {
      actualDuration,
      completed,
      completedAt: serverTimestamp(),
      interrupted: !completed
    });
  } catch (error) {
    console.error('Error completing session:', error);
    throw error;
  }
};

export const getUserSessions = async (
  userId: string,
  limitCount: number = 50
): Promise<PomodoroSession[]> => {
  try {
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('userId', '==', userId),
      orderBy('startedAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    const sessions: PomodoroSession[] = [];

    querySnapshot.forEach((doc: any) => {
      const data = doc.data();
      sessions.push({
        id: doc.id,
        userId: data.userId,
        type: data.type,
        duration: data.actualDuration || data.plannedDuration || 0,
        completedAt: data.completedAt || FirebaseTimestamp.now(),
        interrupted: data.interrupted || false,
        date: data.date
      });
    });

    return sessions;
  } catch (error) {
    console.error('Error getting user sessions:', error);
    throw error;
  }
};