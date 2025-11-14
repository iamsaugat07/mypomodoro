import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseAnalytics, db, serverTimestamp, collection, addDoc } from '../config/firebase';

export interface PerformanceMetric {
  eventName: string;
  duration: number;
  timestamp: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface UserInteraction {
  action: string;
  screen: string;
  timestamp: Date;
  userId?: string;
  context?: Record<string, any>;
}

export interface ErrorEvent {
  errorType: string;
  errorMessage: string;
  stack?: string;
  timestamp: Date;
  userId?: string;
  context?: Record<string, any>;
}

export interface SessionMetrics {
  sessionDuration: number;
  completionRate: number;
  pauseCount: number;
  averagePauseLength: number;
  interruptions: number;
  backgroundTime: number;
}

export class AnalyticsManager {
  private eventQueue: (PerformanceMetric | UserInteraction | ErrorEvent)[] = [];
  private sessionStartTime: Date | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly FLUSH_INTERVAL = 30000; // 30 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializePerformanceMonitoring();
    this.startAutoFlush();
  }

  // Initialize performance monitoring
  private initializePerformanceMonitoring(): void {
    try {
      // Monitor long tasks and performance entries
      if (typeof PerformanceObserver !== 'undefined') {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure' || entry.entryType === 'navigation') {
              this.trackPerformance(entry.name, entry.duration);
            }
          }
        });
        
        this.performanceObserver.observe({ entryTypes: ['measure', 'navigation'] });
      }
    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }
  }

  // Track performance metrics
  trackPerformance(eventName: string, duration: number, userId?: string, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      eventName,
      duration,
      timestamp: new Date(),
      userId,
      metadata
    };

    // Log to Firebase Analytics
    firebaseAnalytics.logEvent('performance_metric', {
      event_name: eventName,
      duration_ms: duration,
      user_id: userId,
      ...metadata
    });

    this.eventQueue.push(metric);
    this.checkFlushQueue();
  }

  // Track user interactions
  trackUserInteraction(action: string, screen: string, userId?: string, context?: Record<string, any>): void {
    const interaction: UserInteraction = {
      action,
      screen,
      timestamp: new Date(),
      userId,
      context
    };

    // Log to Firebase Analytics
    firebaseAnalytics.logEvent('user_interaction', {
      action,
      screen_name: screen,
      user_id: userId,
      ...context
    });

    this.eventQueue.push(interaction);
    this.checkFlushQueue();
  }

  // Track errors
  trackError(errorType: string, errorMessage: string, userId?: string, stack?: string, context?: Record<string, any>): void {
    const errorEvent: ErrorEvent = {
      errorType,
      errorMessage,
      stack,
      timestamp: new Date(),
      userId,
      context
    };

    // Log to Firebase Analytics
    firebaseAnalytics.logEvent('app_error', {
      error_type: errorType,
      error_message: errorMessage.substring(0, 100), // Limit length
      user_id: userId,
      has_stack: !!stack,
      ...context
    });

    this.eventQueue.push(errorEvent);

    // Flush errors immediately for critical issues
    if (errorType === 'crash' || errorType === 'critical') {
      this.flushEvents();
    } else {
      this.checkFlushQueue();
    }
  }

  // Track session metrics
  trackSessionMetrics(metrics: SessionMetrics, userId?: string): void {
    this.trackPerformance('session_completed', metrics.sessionDuration, userId, {
      completionRate: metrics.completionRate,
      pauseCount: metrics.pauseCount,
      averagePauseLength: metrics.averagePauseLength,
      interruptions: metrics.interruptions,
      backgroundTime: metrics.backgroundTime
    });
  }

  // Start session tracking
  startSession(userId?: string): void {
    this.sessionStartTime = new Date();
    this.trackUserInteraction('session_start', 'timer', userId);
  }

  // End session tracking
  endSession(userId?: string, completed: boolean = true): void {
    if (this.sessionStartTime) {
      const duration = new Date().getTime() - this.sessionStartTime.getTime();
      this.trackPerformance('session_end', duration, userId, { completed });
      this.sessionStartTime = null;
    }
  }

  // Track app launch performance
  trackAppLaunch(userId?: string): void {
    const startTime = Date.now();
    
    // Measure time to interactive
    requestAnimationFrame(() => {
      const timeToInteractive = Date.now() - startTime;
      this.trackPerformance('app_launch', timeToInteractive, userId);
    });
  }

  // Track Firebase operation performance
  trackFirebaseOperation(operation: string, duration: number, success: boolean, userId?: string): void {
    this.trackPerformance(`firebase_${operation}`, duration, userId, {
      success,
      timestamp: new Date().toISOString()
    });
  }

  // Track memory usage
  trackMemoryUsage(userId?: string): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.trackPerformance('memory_usage', memory.usedJSHeapSize, userId, {
        totalHeapSize: memory.totalJSHeapSize,
        heapSizeLimit: memory.jsHeapSizeLimit
      });
    }
  }

  // Track network status
  trackNetworkStatus(isOnline: boolean, userId?: string): void {
    this.trackUserInteraction(
      isOnline ? 'network_online' : 'network_offline',
      'system',
      userId,
      { timestamp: new Date().toISOString() }
    );
  }

  // Check if queue needs flushing
  private checkFlushQueue(): void {
    if (this.eventQueue.length >= this.BATCH_SIZE) {
      this.flushEvents();
    }
  }

  // Start auto-flush timer
  private startAutoFlush(): void {
    this.flushTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, this.FLUSH_INTERVAL);
  }

  // Flush events to storage
  private async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Try to send to Firebase first
      await this.sendToFirebase(eventsToFlush);
    } catch (error) {
      console.warn('Failed to send analytics to Firebase, storing locally:', error);
      
      // Store locally if Firebase fails
      await this.storeLocally(eventsToFlush);
    }
  }

  // Send events to Firebase
  private async sendToFirebase(events: (PerformanceMetric | UserInteraction | ErrorEvent)[]): Promise<void> {
    const batch = events.map(event => ({
      ...event,
      serverTimestamp: serverTimestamp(),
      platform: 'react-native'
    }));

    const analyticsRef = collection(db, 'analytics');
    await addDoc(analyticsRef, {
      events: batch,
      timestamp: serverTimestamp()
    });
  }

  // Store events locally
  private async storeLocally(events: (PerformanceMetric | UserInteraction | ErrorEvent)[]): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('analyticsQueue');
      const existingEvents = stored ? JSON.parse(stored) : [];
      
      const updatedEvents = [...existingEvents, ...events];
      
      // Keep only last 1000 events to prevent storage bloat
      const recentEvents = updatedEvents.slice(-1000);
      
      await AsyncStorage.setItem('analyticsQueue', JSON.stringify(recentEvents));
    } catch (error) {
      console.error('Failed to store analytics locally:', error);
    }
  }

  // Process local queue when back online
  async processLocalQueue(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('analyticsQueue');
      if (!stored) return;

      const events = JSON.parse(stored);
      if (events.length === 0) return;

      console.log(`Processing ${events.length} queued analytics events`);
      
      // Send in batches to avoid overwhelming Firebase
      const batchSize = 50;
      for (let i = 0; i < events.length; i += batchSize) {
        const batch = events.slice(i, i + batchSize);
        
        try {
          await this.sendToFirebase(batch);
        } catch (error) {
          console.error(`Failed to send analytics batch ${i}-${i + batchSize}:`, error);
          break; // Stop processing if Firebase is still unavailable
        }
      }

      // Clear processed events
      await AsyncStorage.removeItem('analyticsQueue');
      console.log('Analytics queue processed successfully');
      
    } catch (error) {
      console.error('Error processing analytics queue:', error);
    }
  }

  // Get performance summary
  async getPerformanceSummary(): Promise<any> {
    try {
      const stored = await AsyncStorage.getItem('analyticsQueue');
      if (!stored) return null;

      const events = JSON.parse(stored);
      const performanceEvents = events.filter((e: any) => 'duration' in e);
      
      if (performanceEvents.length === 0) return null;

      const summary = {
        totalEvents: performanceEvents.length,
        averageDuration: performanceEvents.reduce((sum: number, e: any) => sum + e.duration, 0) / performanceEvents.length,
        eventTypes: {} as Record<string, number>,
        slowestOperations: performanceEvents
          .sort((a: any, b: any) => b.duration - a.duration)
          .slice(0, 10)
      };

      // Count event types
      performanceEvents.forEach((e: any) => {
        summary.eventTypes[e.eventName] = (summary.eventTypes[e.eventName] || 0) + 1;
      });

      return summary;
    } catch (error) {
      console.error('Error getting performance summary:', error);
      return null;
    }
  }

  // Set user ID for all future events
  setUserId(userId: string): void {
    // Set user ID in Firebase Analytics
    firebaseAnalytics.setUserId(userId);
    this.trackUserInteraction('user_identified', 'system', userId);
  }

  // Clear user session
  clearUserSession(): void {
    // Clear user ID in Firebase Analytics
    firebaseAnalytics.setUserId(null);
    this.trackUserInteraction('user_logged_out', 'system');
  }

  // Cleanup
  cleanup(): void {
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }
    
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Flush remaining events
    this.flushEvents();
  }
}

export const analyticsManager = new AnalyticsManager();