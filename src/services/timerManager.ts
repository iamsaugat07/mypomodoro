import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { sessionManager } from './sessionManager';
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

export interface TimerState {
  isActive: boolean;
  isPaused: boolean;
  startTime: Date | null;
  pausedTime: Date | null;
  elapsedTime: number;
  sessionId: string | null;
  plannedDuration: number;
}

export interface TimerNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: Date;
  sessionId: string;
}

const BACKGROUND_TASK_NAME = 'pomodoroBackgroundUpdate';

export class TimerManager {
  private timerState: TimerState;
  private backgroundInterval: NodeJS.Timeout | null = null;
  private notificationIds: string[] = [];
  private appStateListener: any = null;

  constructor() {
    this.timerState = {
      isActive: false,
      isPaused: false,
      startTime: null,
      pausedTime: null,
      elapsedTime: 0,
      sessionId: null,
      plannedDuration: 0
    };
    
    this.initializeBackgroundTask();
    this.setupAppStateListener();
  }

  // Initialize background task
  private async initializeBackgroundTask(): Promise<void> {
    try {
      // Define the background task
      TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
        try {
          await this.handleBackgroundUpdate();
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('Background task error:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register the background fetch task
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
      if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
          minimumInterval: 15 * 1000, // 15 seconds minimum
          stopOnTerminate: false,
          startOnBoot: true
        });
      }
    } catch (error) {
      console.error('Failed to initialize background task:', error);
    }
  }

  // Handle background updates
  private async handleBackgroundUpdate(): Promise<void> {
    const state = await this.loadTimerState();
    if (state && state.isActive && !state.isPaused) {
      const now = new Date();
      const startTime = new Date(state.startTime!);
      const elapsedMs = now.getTime() - startTime.getTime();
      const remainingMs = (state.plannedDuration * 1000) - elapsedMs;

      // If timer completed
      if (remainingMs <= 0 && state.sessionId) {
        await this.handleTimerComplete(state.sessionId);
      }
    }
  }

  // Setup app state listener for system interruptions
  private setupAppStateListener(): void {
    this.appStateListener = AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  // Handle app state changes (foreground/background/inactive)
  private async handleAppStateChange(nextAppState: AppStateStatus): Promise<void> {
    const currentState = await this.loadTimerState();
    
    if (!currentState || !currentState.isActive) return;

    switch (nextAppState) {
      case 'background':
      case 'inactive':
        // App going to background - ensure timer continues
        await this.saveTimerState();
        await this.scheduleBackgroundNotifications();
        break;
        
      case 'active':
        // App coming to foreground - sync timer state
        await this.syncTimerOnForeground();
        await this.cancelPendingNotifications();
        break;
    }
  }

  // Sync timer state when app comes to foreground
  private async syncTimerOnForeground(): Promise<void> {
    const savedState = await this.loadTimerState();
    if (!savedState || !savedState.isActive) return;

    const now = new Date();
    let elapsedTime = 0;

    if (savedState.isPaused && savedState.pausedTime) {
      // Timer was paused - calculate elapsed time up to pause
      const pausedTime = new Date(savedState.pausedTime);
      const startTime = new Date(savedState.startTime!);
      elapsedTime = pausedTime.getTime() - startTime.getTime();
    } else if (!savedState.isPaused && savedState.startTime) {
      // Timer was running - calculate total elapsed time
      const startTime = new Date(savedState.startTime);
      elapsedTime = now.getTime() - startTime.getTime();
    }

    // Update timer state
    this.timerState = {
      ...savedState,
      elapsedTime: Math.floor(elapsedTime / 1000)
    };

    // Check if timer completed while in background
    const remainingMs = (savedState.plannedDuration * 1000) - elapsedTime;
    if (remainingMs <= 0 && savedState.sessionId && !savedState.isPaused) {
      await this.handleTimerComplete(savedState.sessionId);
    }
  }

  // Start timer
  async startTimer(sessionId: string, plannedDuration: number): Promise<void> {
    const now = new Date();
    
    this.timerState = {
      isActive: true,
      isPaused: false,
      startTime: now,
      pausedTime: null,
      elapsedTime: 0,
      sessionId,
      plannedDuration
    };

    await this.saveTimerState();
    await this.scheduleCompletionNotification();
  }

  // Pause timer
  async pauseTimer(): Promise<void> {
    if (!this.timerState.isActive || this.timerState.isPaused) return;

    const now = new Date();
    this.timerState.isPaused = true;
    this.timerState.pausedTime = now;
    
    if (this.timerState.startTime) {
      this.timerState.elapsedTime = Math.floor(
        (now.getTime() - this.timerState.startTime.getTime()) / 1000
      );
    }

    await this.saveTimerState();
    await this.cancelPendingNotifications();
  }

  // Resume timer
  async resumeTimer(): Promise<void> {
    if (!this.timerState.isActive || !this.timerState.isPaused) return;

    const now = new Date();
    
    // Adjust start time to account for paused duration
    if (this.timerState.startTime && this.timerState.pausedTime) {
      const pauseDuration = now.getTime() - this.timerState.pausedTime.getTime();
      this.timerState.startTime = new Date(this.timerState.startTime.getTime() + pauseDuration);
    }

    this.timerState.isPaused = false;
    this.timerState.pausedTime = null;

    await this.saveTimerState();
    await this.scheduleCompletionNotification();
  }

  // Stop timer
  async stopTimer(): Promise<void> {
    this.timerState = {
      isActive: false,
      isPaused: false,
      startTime: null,
      pausedTime: null,
      elapsedTime: 0,
      sessionId: null,
      plannedDuration: 0
    };

    await this.clearTimerState();
    await this.cancelPendingNotifications();
  }

  // Handle timer completion
  private async handleTimerComplete(sessionId: string): Promise<void> {
    try {
      if (this.timerState.sessionId === sessionId) {
        await sessionManager.completeSession(sessionId, this.timerState.elapsedTime, true);
        await this.showCompletionNotification();
        await this.stopTimer();
      }
    } catch (error) {
      console.error('Error handling timer completion:', error);
    }
  }

  // Schedule completion notification
  private async scheduleCompletionNotification(): Promise<void> {
    if (!this.timerState.isActive || this.timerState.isPaused || !this.timerState.startTime) {
      return;
    }

    try {
      const completionTime = new Date(
        this.timerState.startTime.getTime() + (this.timerState.plannedDuration * 1000)
      );

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Pomodoro Complete!',
          body: 'Your focus session has ended. Time for a break!',
          sound: true,
        },
        trigger: { date: completionTime },
      });

      this.notificationIds.push(notificationId);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  // Schedule background notifications for longer sessions
  private async scheduleBackgroundNotifications(): Promise<void> {
    if (!this.timerState.isActive || this.timerState.isPaused || !this.timerState.startTime) {
      return;
    }

    try {
      const remainingTime = this.timerState.plannedDuration - this.timerState.elapsedTime;
      const now = new Date();

      // Schedule reminder notifications every 5 minutes for longer sessions
      if (remainingTime > 300) { // More than 5 minutes remaining
        const intervals = [300, 600, 900]; // 5, 10, 15 minutes
        
        for (const interval of intervals) {
          if (interval < remainingTime) {
            const notificationTime = new Date(now.getTime() + (remainingTime - interval) * 1000);
            
            const notificationId = await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Pomodoro In Progress',
                body: `${Math.floor(interval / 60)} minutes remaining in your focus session`,
                sound: false,
              },
              trigger: { date: notificationTime },
            });

            this.notificationIds.push(notificationId);
          }
        }
      }
    } catch (error) {
      console.error('Error scheduling background notifications:', error);
    }
  }

  // Show completion notification
  private async showCompletionNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Session Complete!',
          body: 'Great job! Your Pomodoro session is finished.',
          sound: true,
        },
        trigger: null, // Show immediately
      });
    } catch (error) {
      console.error('Error showing completion notification:', error);
    }
  }

  // Cancel all pending notifications
  private async cancelPendingNotifications(): Promise<void> {
    try {
      for (const id of this.notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(id);
      }
      this.notificationIds = [];
    } catch (error) {
      console.error('Error cancelling notifications:', error);
    }
  }

  // Get current timer state
  getTimerState(): TimerState {
    return { ...this.timerState };
  }

  // Calculate current elapsed time
  getCurrentElapsedTime(): number {
    if (!this.timerState.isActive) return 0;
    
    if (this.timerState.isPaused) {
      return this.timerState.elapsedTime;
    }

    if (this.timerState.startTime) {
      const now = new Date();
      return Math.floor((now.getTime() - this.timerState.startTime.getTime()) / 1000);
    }

    return 0;
  }

  // Save timer state to persistent storage
  private async saveTimerState(): Promise<void> {
    try {
      await AsyncStorage.setItem('timerState', JSON.stringify(this.timerState));
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  }

  // Load timer state from persistent storage
  private async loadTimerState(): Promise<TimerState | null> {
    try {
      const saved = await AsyncStorage.getItem('timerState');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.error('Error loading timer state:', error);
      return null;
    }
  }

  // Clear timer state from storage
  private async clearTimerState(): Promise<void> {
    try {
      await AsyncStorage.removeItem('timerState');
    } catch (error) {
      console.error('Error clearing timer state:', error);
    }
  }

  // Cleanup
  async cleanup(): Promise<void> {
    if (this.appStateListener) {
      this.appStateListener.remove();
    }
    
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
    }

    await this.cancelPendingNotifications();
    
    try {
      await TaskManager.unregisterTaskAsync(BACKGROUND_TASK_NAME);
    } catch (error) {
      console.error('Error unregistering background task:', error);
    }
  }

  // Handle system interruptions (calls, low battery, etc.)
  async handleSystemInterruption(type: 'call' | 'lowBattery' | 'other'): Promise<void> {
    if (!this.timerState.isActive) return;

    console.log(`System interruption detected: ${type}`);
    
    // Auto-pause timer during interruptions
    if (!this.timerState.isPaused) {
      await this.pauseTimer();
      
      // Save interruption info for recovery
      const interruptionData = {
        type,
        timestamp: new Date().toISOString(),
        sessionId: this.timerState.sessionId,
        elapsedTime: this.timerState.elapsedTime
      };
      
      await AsyncStorage.setItem('lastInterruption', JSON.stringify(interruptionData));
    }
  }

  // Recover from system interruption
  async recoverFromInterruption(): Promise<boolean> {
    try {
      const interruptionData = await AsyncStorage.getItem('lastInterruption');
      if (!interruptionData) return false;

      const interruption = JSON.parse(interruptionData);
      const interruptionTime = new Date(interruption.timestamp);
      const now = new Date();
      const timeSinceInterruption = now.getTime() - interruptionTime.getTime();

      // If interruption was less than 1 hour ago, offer to resume
      if (timeSinceInterruption < 3600000) { // 1 hour in milliseconds
        console.log(`Recovered from ${interruption.type} interruption after ${Math.floor(timeSinceInterruption / 1000)}s`);
        
        // Clear interruption data
        await AsyncStorage.removeItem('lastInterruption');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error recovering from interruption:', error);
      return false;
    }
  }
}

export const timerManager = new TimerManager();