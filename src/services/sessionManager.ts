import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  serverTimestamp,
  increment,
  runTransaction,
  writeBatch,
  Timestamp,
  query,
  where,
  limit,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SessionData {
  id?: string;
  sessionId?: string;
  userId: string;
  type: 'work' | 'break' | 'longBreak';
  plannedDuration: number; // in seconds
  actualDuration?: number;
  startTime: Timestamp;
  endTime?: Timestamp;
  completed: boolean;
  interrupted: boolean;
  cancelled: boolean;
  date: string; // YYYY-MM-DD
  deviceInfo?: {
    platform: string;
    appVersion: string;
  };
}

export interface ActiveSession {
  sessionId: string;
  userId: string;
  type: 'work' | 'break' | 'longBreak';
  startTime: number; // timestamp
  plannedDuration: number;
  pausedTime?: number;
  totalPausedDuration: number;
}

class SessionManager {
  private activeSession: ActiveSession | null = null;
  private offlineQueue: SessionData[] = [];

  // Start a new session
  async startSession(
    userId: string, 
    type: 'work' | 'break' | 'longBreak', 
    duration: number
  ): Promise<string> {
    const sessionData: Omit<SessionData, 'id'> = {
      userId,
      type,
      plannedDuration: duration,
      startTime: Timestamp.now(),
      completed: false,
      interrupted: false,
      cancelled: false,
      date: new Date().toISOString().split('T')[0],
      deviceInfo: {
        platform: 'mobile',
        appVersion: '1.0.0'
      }
    };

    try {
      const docRef = await addDoc(collection(db, 'sessions'), sessionData);
      
      // Store active session locally
      this.activeSession = {
        sessionId: docRef.id,
        userId,
        type,
        startTime: Date.now(),
        plannedDuration: duration,
        totalPausedDuration: 0
      };

      await this.saveActiveSessionToStorage();
      return docRef.id;

    } catch (error) {
      console.error('Error starting session:', error);
      // Queue for offline if network error
      await this.queueSessionForOffline(sessionData);
      throw error;
    }
  }

  // Complete a session
  async completeSession(sessionId: string, actualDuration: number, wasCompleted: boolean = true): Promise<void> {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      
      await runTransaction(db, async (transaction) => {
        // Update session
        transaction.update(sessionRef, {
          actualDuration,
          endTime: serverTimestamp(),
          completed: wasCompleted,
          interrupted: !wasCompleted
        });

        // Update user stats if completed
        if (wasCompleted && this.activeSession) {
          const userRef = doc(db, 'users', this.activeSession.userId);
          const focusMinutes = Math.floor(actualDuration / 60);
          
          transaction.update(userRef, {
            totalSessions: increment(1),
            totalFocusMinutes: increment(focusMinutes),
            lastActiveAt: serverTimestamp()
          });
        }
      });

      // Update streak if work session completed
      if (wasCompleted && this.activeSession?.type === 'work') {
        await this.updateUserStreak(this.activeSession.userId);
      }

      await this.clearActiveSession();

    } catch (error) {
      console.error('Error completing session:', error);
      throw error;
    }
  }

  // Cancel a session
  async cancelSession(sessionId: string): Promise<void> {
    try {
      const sessionRef = doc(db, 'sessions', sessionId);
      await updateDoc(sessionRef, {
        cancelled: true,
        endTime: serverTimestamp()
      });

      await this.clearActiveSession();
    } catch (error) {
      console.error('Error cancelling session:', error);
      throw error;
    }
  }

  // Pause session
  pauseSession(): void {
    if (this.activeSession && !this.activeSession.pausedTime) {
      this.activeSession.pausedTime = Date.now();
      this.saveActiveSessionToStorage();
    }
  }

  // Resume session
  resumeSession(): void {
    if (this.activeSession && this.activeSession.pausedTime) {
      const pauseDuration = Date.now() - this.activeSession.pausedTime;
      this.activeSession.totalPausedDuration += pauseDuration;
      this.activeSession.pausedTime = undefined;
      this.saveActiveSessionToStorage();
    }
  }

  // Get active session
  getActiveSession(): ActiveSession | null {
    return this.activeSession;
  }

  // Recovery: Load active session from storage
  async recoverActiveSession(): Promise<ActiveSession | null> {
    try {
      const stored = await AsyncStorage.getItem('activeSession');
      if (stored) {
        this.activeSession = JSON.parse(stored);
        return this.activeSession;
      }
    } catch (error) {
      console.error('Error recovering active session:', error);
    }
    return null;
  }

  // Calculate actual running time (excluding pauses)
  getElapsedTime(): number {
    if (!this.activeSession) return 0;
    
    const now = Date.now();
    const totalTime = now - this.activeSession.startTime;
    const pauseTime = this.activeSession.totalPausedDuration + 
      (this.activeSession.pausedTime ? now - this.activeSession.pausedTime : 0);
    
    return Math.max(0, totalTime - pauseTime);
  }

  // Private methods
  private async saveActiveSessionToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem('activeSession', JSON.stringify(this.activeSession));
    } catch (error) {
      console.error('Error saving active session:', error);
    }
  }

  private async clearActiveSession(): Promise<void> {
    this.activeSession = null;
    try {
      await AsyncStorage.removeItem('activeSession');
    } catch (error) {
      console.error('Error clearing active session:', error);
    }
  }

  private async updateUserStreak(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const today = new Date().toISOString().split('T')[0];
      
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.data();
        
        if (!userData) return;

        const lastActiveDate = userData.lastSessionDate;
        const currentStreak = userData.currentStreak || 0;
        const longestStreak = userData.longestStreak || 0;

        let newCurrentStreak = currentStreak;
        let newLongestStreak = longestStreak;

        // Check if this is a new day
        if (lastActiveDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastActiveDate === yesterdayStr) {
            // Consecutive day - increase streak
            newCurrentStreak = currentStreak + 1;
          } else {
            // Gap in days - reset streak
            newCurrentStreak = 1;
          }

          // Update longest streak if current is higher
          if (newCurrentStreak > longestStreak) {
            newLongestStreak = newCurrentStreak;
          }

          transaction.update(userRef, {
            currentStreak: newCurrentStreak,
            longestStreak: newLongestStreak,
            lastSessionDate: today
          });
        }
      });
    } catch (error) {
      console.error('Error updating user streak:', error);
    }
  }

  private async queueSessionForOffline(sessionData: Omit<SessionData, 'id'>): Promise<void> {
    try {
      this.offlineQueue.push(sessionData as SessionData);
      await AsyncStorage.setItem('offlineQueue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Error queuing session for offline:', error);
    }
  }

  // Enhanced offline queue processing with conflict resolution
  async processOfflineQueue(userId?: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('offlineQueue');
      if (stored) {
        const queue: SessionData[] = JSON.parse(stored);
        
        console.log(`Processing ${queue.length} queued offline sessions`);
        
        const processedSessions: SessionData[] = [];
        const failedSessions: SessionData[] = [];
        
        for (const session of queue) {
          try {
            // Check for duplicate sessions based on sessionId
            const existingQuery = query(
              collection(db, 'sessions'),
              where('sessionId', '==', session.sessionId),
              limit(1)
            );
            
            const existingSnapshot = await getDocs(existingQuery);
            
            if (existingSnapshot.empty) {
              // Session doesn't exist, safe to add
              const docRef = doc(collection(db, 'sessions'));
              await setDoc(docRef, session);
              processedSessions.push(session);
              console.log(`Synced offline session: ${session.sessionId}`);
            } else {
              // Handle potential conflict - compare timestamps and data quality
              const existingSession = existingSnapshot.docs[0].data() as SessionData;
              
              if (session.endTime && existingSession.endTime) {
                // Both sessions are complete, merge the better data
                const shouldUpdate = (session.actualDuration || 0) > (existingSession.actualDuration || 0);
                
                if (shouldUpdate) {
                  await updateDoc(existingSnapshot.docs[0].ref, {
                    actualDuration: session.actualDuration,
                    completed: session.completed,
                    endTime: session.endTime
                  });
                  console.log(`Updated existing session with better data: ${session.sessionId}`);
                }
              }
              processedSessions.push(session);
            }
          } catch (error) {
            console.error(`Failed to sync session ${session.sessionId}:`, error);
            failedSessions.push(session);
          }
        }
        
        // Update the queue with only failed sessions
        if (failedSessions.length > 0) {
          await AsyncStorage.setItem('offlineQueue', JSON.stringify(failedSessions));
          this.offlineQueue = failedSessions;
          console.log(`${failedSessions.length} sessions remain in offline queue`);
        } else {
          await AsyncStorage.removeItem('offlineQueue');
          this.offlineQueue = [];
          console.log('All offline sessions processed successfully');
        }
        
        // Update user statistics after successful processing
        if (processedSessions.length > 0 && userId) {
          await this.updateUserSessionStats(userId, processedSessions);
        }
      }
    } catch (error) {
      console.error('Error processing offline session queue:', error);
    }
  }
  
  // Update user statistics with processed sessions
  private async updateUserSessionStats(userId: string, sessions: SessionData[]): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const completedSessions = sessions.filter(s => s.completed);
      
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        const userData = userDoc.data() || {};
        
        const totalSessions = (userData.totalSessions || 0) + completedSessions.length;
        const totalFocusMinutes = (userData.totalFocusMinutes || 0) + 
          completedSessions
            .filter(s => s.type === 'work')
            .reduce((sum, s) => sum + Math.floor((s.actualDuration || s.plannedDuration) / 60), 0);
        
        transaction.update(userRef, {
          totalSessions,
          totalFocusMinutes,
          lastUpdated: new Date()
        });
      });
      
      console.log(`Updated user stats for ${completedSessions.length} processed sessions`);
    } catch (error) {
      console.error('Error updating user session stats:', error);
    }
  }
}

export const sessionManager = new SessionManager();