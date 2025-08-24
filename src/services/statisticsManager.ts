import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit,
  Timestamp,
  startAt,
  endAt,
  onSnapshot,
  doc,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyStats {
  date: string;
  workSessions: number;
  breakSessions: number;
  totalFocusMinutes: number;
  completedSessions: number;
  averageSessionLength: number;
}

export interface WeeklyStats {
  weekStart: string;
  dailyStats: DailyStats[];
  totalSessions: number;
  totalFocusMinutes: number;
  streak: number;
}

export interface UserStatistics {
  totalSessions: number;
  totalFocusMinutes: number;
  currentStreak: number;
  longestStreak: number;
  averageSessionsPerDay: number;
  averageFocusPerDay: number;
  todayStats: DailyStats;
  weeklyStats: DailyStats[];
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  target?: number;
}

class StatisticsManager {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private listeners: Map<string, Unsubscribe> = new Map();
  private statisticsCallbacks: Map<string, (stats: UserStatistics) => void> = new Map();

  // Get today's statistics
  async getTodayStats(userId: string): Promise<DailyStats> {
    const cacheKey = `todayStats-${userId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const today = new Date().toISOString().split('T')[0];
      const stats = await this.getDailyStats(userId, today);
      
      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error getting today stats:', error);
      return this.getEmptyDailyStats(new Date().toISOString().split('T')[0]);
    }
  }

  // Get weekly statistics (last 7 days)
  async getWeeklyStats(userId: string): Promise<DailyStats[]> {
    const cacheKey = `weeklyStats-${userId}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const weeklyStats: DailyStats[] = [];
      const today = new Date();

      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        const dayStats = await this.getDailyStats(userId, dateString);
        weeklyStats.push(dayStats);
      }

      this.setCache(cacheKey, weeklyStats);
      return weeklyStats;
    } catch (error) {
      console.error('Error getting weekly stats:', error);
      return [];
    }
  }

  // Get comprehensive user statistics
  async getUserStatistics(userId: string): Promise<UserStatistics> {
    try {
      const [todayStats, weeklyStats, userProfile] = await Promise.all([
        this.getTodayStats(userId),
        this.getWeeklyStats(userId),
        this.getUserProfile(userId)
      ]);

      const achievements = await this.calculateAchievements(userId, userProfile);

      return {
        totalSessions: userProfile.totalSessions || 0,
        totalFocusMinutes: userProfile.totalFocusMinutes || 0,
        currentStreak: userProfile.currentStreak || 0,
        longestStreak: userProfile.longestStreak || 0,
        averageSessionsPerDay: this.calculateAverageSessionsPerDay(weeklyStats),
        averageFocusPerDay: this.calculateAverageFocusPerDay(weeklyStats),
        todayStats,
        weeklyStats,
        achievements
      };
    } catch (error) {
      console.error('Error getting user statistics:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getDailyStats(userId: string, date: string): Promise<DailyStats> {
    try {
      // Query sessions for the specific date
      const sessionsQuery = query(
        collection(db, 'sessions'),
        where('userId', '==', userId),
        where('date', '==', date)
      );

      const querySnapshot = await getDocs(sessionsQuery);
      const sessions = querySnapshot.docs.map(doc => doc.data());

      // Calculate statistics
      const workSessions = sessions.filter(s => s.type === 'work' && s.completed).length;
      const breakSessions = sessions.filter(s => s.type !== 'work' && s.completed).length;
      const completedSessions = sessions.filter(s => s.completed).length;
      
      const totalFocusMinutes = sessions
        .filter(s => s.type === 'work' && s.completed)
        .reduce((total, session) => {
          const duration = session.actualDuration || session.plannedDuration || 0;
          return total + Math.floor(duration / 60);
        }, 0);

      const averageSessionLength = completedSessions > 0 
        ? sessions
            .filter(s => s.completed)
            .reduce((total, session) => {
              const duration = session.actualDuration || session.plannedDuration || 0;
              return total + duration;
            }, 0) / completedSessions / 60
        : 0;

      return {
        date,
        workSessions,
        breakSessions,
        totalFocusMinutes,
        completedSessions,
        averageSessionLength: Math.round(averageSessionLength)
      };
    } catch (error) {
      console.error('Error getting daily stats:', error);
      return this.getEmptyDailyStats(date);
    }
  }

  private async getUserProfile(userId: string): Promise<any> {
    try {
      const userDoc = await getDocs(
        query(collection(db, 'users'), where('__name__', '==', userId), limit(1))
      );
      
      if (!userDoc.empty) {
        return userDoc.docs[0].data();
      }
      
      return {};
    } catch (error) {
      console.error('Error getting user profile:', error);
      return {};
    }
  }

  private async calculateAchievements(userId: string, userProfile: any): Promise<Achievement[]> {
    const achievements: Achievement[] = [];
    const totalSessions = userProfile.totalSessions || 0;
    const currentStreak = userProfile.currentStreak || 0;
    const longestStreak = userProfile.longestStreak || 0;
    const totalFocusMinutes = userProfile.totalFocusMinutes || 0;

    // First Session
    if (totalSessions >= 1) {
      achievements.push({
        id: 'first_session',
        title: 'Getting Started',
        description: 'Complete your first Pomodoro session',
        icon: '🎯',
        unlockedAt: new Date()
      });
    }

    // Streak achievements
    if (currentStreak >= 3) {
      achievements.push({
        id: 'streak_3',
        title: 'On Fire!',
        description: 'Maintain a 3-day streak',
        icon: '🔥',
        unlockedAt: new Date()
      });
    }

    if (longestStreak >= 7) {
      achievements.push({
        id: 'streak_7',
        title: 'Week Warrior',
        description: 'Achieve a 7-day streak',
        icon: '⚡',
        unlockedAt: new Date()
      });
    }

    // Session milestones
    if (totalSessions >= 25) {
      achievements.push({
        id: 'sessions_25',
        title: 'Quarter Century',
        description: 'Complete 25 Pomodoro sessions',
        icon: '🏆',
        unlockedAt: new Date()
      });
    }

    if (totalSessions >= 100) {
      achievements.push({
        id: 'sessions_100',
        title: 'Centurion',
        description: 'Complete 100 Pomodoro sessions',
        icon: '👑',
        unlockedAt: new Date()
      });
    }

    // Focus time achievements
    const focusHours = Math.floor(totalFocusMinutes / 60);
    if (focusHours >= 10) {
      achievements.push({
        id: 'focus_10h',
        title: 'Focused Mind',
        description: 'Accumulate 10 hours of focus time',
        icon: '🧠',
        unlockedAt: new Date()
      });
    }

    if (focusHours >= 50) {
      achievements.push({
        id: 'focus_50h',
        title: 'Deep Focus Master',
        description: 'Accumulate 50 hours of focus time',
        icon: '🎓',
        unlockedAt: new Date()
      });
    }

    return achievements;
  }

  private calculateAverageSessionsPerDay(weeklyStats: DailyStats[]): number {
    if (weeklyStats.length === 0) return 0;
    
    const totalSessions = weeklyStats.reduce((sum, day) => sum + day.workSessions, 0);
    return Math.round((totalSessions / weeklyStats.length) * 10) / 10;
  }

  private calculateAverageFocusPerDay(weeklyStats: DailyStats[]): number {
    if (weeklyStats.length === 0) return 0;
    
    const totalFocus = weeklyStats.reduce((sum, day) => sum + day.totalFocusMinutes, 0);
    return Math.round((totalFocus / weeklyStats.length) * 10) / 10;
  }

  private getEmptyDailyStats(date: string): DailyStats {
    return {
      date,
      workSessions: 0,
      breakSessions: 0,
      totalFocusMinutes: 0,
      completedSessions: 0,
      averageSessionLength: 0
    };
  }

  // Cache management
  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Real-time statistics subscription
  subscribeToStatistics(userId: string, callback: (stats: UserStatistics) => void): () => void {
    this.statisticsCallbacks.set(userId, callback);
    
    // Subscribe to sessions changes
    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('userId', '==', userId)
    );
    
    const unsubscribeSessions = onSnapshot(sessionsQuery, async () => {
      try {
        const stats = await this.getUserStatistics(userId);
        callback(stats);
      } catch (error) {
        console.error('Error updating real-time statistics:', error);
      }
    });
    
    // Subscribe to user profile changes
    const userDoc = doc(db, 'users', userId);
    const unsubscribeUser = onSnapshot(userDoc, async () => {
      try {
        const stats = await this.getUserStatistics(userId);
        callback(stats);
      } catch (error) {
        console.error('Error updating user statistics:', error);
      }
    });
    
    this.listeners.set(`${userId}-sessions`, unsubscribeSessions);
    this.listeners.set(`${userId}-user`, unsubscribeUser);
    
    // Return unsubscribe function
    return () => {
      this.unsubscribeFromStatistics(userId);
    };
  }
  
  // Unsubscribe from real-time updates
  unsubscribeFromStatistics(userId: string): void {
    const sessionListener = this.listeners.get(`${userId}-sessions`);
    const userListener = this.listeners.get(`${userId}-user`);
    
    if (sessionListener) {
      sessionListener();
      this.listeners.delete(`${userId}-sessions`);
    }
    
    if (userListener) {
      userListener();
      this.listeners.delete(`${userId}-user`);
    }
    
    this.statisticsCallbacks.delete(userId);
  }
  
  // Refresh statistics
  async refreshStatistics(userId: string): Promise<void> {
    this.clearCache();
    await this.getUserStatistics(userId);
  }

  // Cleanup all listeners
  cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    this.statisticsCallbacks.clear();
    this.clearCache();
  }
}

export const statisticsManager = new StatisticsManager();