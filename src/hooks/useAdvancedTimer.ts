import { useState, useEffect, useCallback } from 'react';
import { AppState, Alert } from 'react-native';
import { timerManager, TimerState } from '../services/timerManager';

export interface UseAdvancedTimerReturn {
  timerState: TimerState;
  currentElapsedTime: number;
  remainingTime: number;
  isTimerCompleted: boolean;
  startAdvancedTimer: (sessionId: string, duration: number) => Promise<void>;
  pauseAdvancedTimer: () => Promise<void>;
  resumeAdvancedTimer: () => Promise<void>;
  stopAdvancedTimer: () => Promise<void>;
  handleInterruption: (type: 'call' | 'lowBattery' | 'other') => Promise<void>;
  offerInterruptionRecovery: () => Promise<boolean>;
}

export const useAdvancedTimer = (): UseAdvancedTimerReturn => {
  const [timerState, setTimerState] = useState<TimerState>(timerManager.getTimerState());
  const [currentElapsedTime, setCurrentElapsedTime] = useState(0);
  //const { activeSession } = useSessionManager();

  // Update elapsed time every second
  useEffect(() => {
    if (!timerState.isActive) return;

    const interval = setInterval(() => {
      const elapsed = timerManager.getCurrentElapsedTime();
      setCurrentElapsedTime(elapsed);
      
      // Check if timer is completed
      const remaining = timerState.plannedDuration - elapsed;
      if (remaining <= 0 && !timerState.isPaused) {
        handleTimerCompletion();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timerState.isActive, timerState.isPaused, timerState.plannedDuration]);

  // Initialize timer state and check for interruption recovery
  useEffect(() => {
    const initializeTimer = async () => {
      // Check if we need to recover from an interruption
      const canRecover = await timerManager.recoverFromInterruption();
      if (canRecover) {
        Alert.alert(
          'Session Interrupted',
          'It looks like your previous session was interrupted. Would you like to continue where you left off?',
          [
            { text: 'Start Fresh', onPress: () => {}, style: 'cancel' },
            { text: 'Resume', onPress: () => handleResumption() }
          ]
        );
      }

      // Update timer state
      setTimerState(timerManager.getTimerState());
      setCurrentElapsedTime(timerManager.getCurrentElapsedTime());
    };

    initializeTimer();
  }, []);

  // Handle app state changes for interruption detection
  useEffect(() => {
    const handleAppStateChange = async (nextAppState: string) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        // Potential interruption - let timer manager handle it
        if (timerState.isActive && !timerState.isPaused) {
          // Don't auto-pause here, let system interruptions be handled separately
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [timerState]);

  // Handle timer completion
  const handleTimerCompletion = useCallback(async () => {
    if (timerState.sessionId) {
      Alert.alert(
        '🎉 Session Complete!',
        'Congratulations! You\'ve completed your focus session.',
        [{ text: 'OK', onPress: () => stopAdvancedTimer() }]
      );
    }
  }, [timerState.sessionId]);

  // Handle resumption from interruption
  const handleResumption = useCallback(async () => {
    try {
      await timerManager.resumeTimer();
      setTimerState(timerManager.getTimerState());
    } catch (error) {
      console.error('Error resuming timer:', error);
    }
  }, []);

  // Start advanced timer
  const startAdvancedTimer = useCallback(async (sessionId: string, duration: number): Promise<void> => {
    try {
      await timerManager.startTimer(sessionId, duration);
      setTimerState(timerManager.getTimerState());
      setCurrentElapsedTime(0);
    } catch (error) {
      console.error('Error starting advanced timer:', error);
      throw error;
    }
  }, []);

  // Pause advanced timer
  const pauseAdvancedTimer = useCallback(async (): Promise<void> => {
    try {
      await timerManager.pauseTimer();
      setTimerState(timerManager.getTimerState());
    } catch (error) {
      console.error('Error pausing advanced timer:', error);
      throw error;
    }
  }, []);

  // Resume advanced timer
  const resumeAdvancedTimer = useCallback(async (): Promise<void> => {
    try {
      await timerManager.resumeTimer();
      setTimerState(timerManager.getTimerState());
    } catch (error) {
      console.error('Error resuming advanced timer:', error);
      throw error;
    }
  }, []);

  // Stop advanced timer
  const stopAdvancedTimer = useCallback(async (): Promise<void> => {
    try {
      await timerManager.stopTimer();
      setTimerState(timerManager.getTimerState());
      setCurrentElapsedTime(0);
    } catch (error) {
      console.error('Error stopping advanced timer:', error);
      throw error;
    }
  }, []);

  // Handle system interruption
  const handleInterruption = useCallback(async (type: 'call' | 'lowBattery' | 'other'): Promise<void> => {
    try {
      await timerManager.handleSystemInterruption(type);
      setTimerState(timerManager.getTimerState());
      
      Alert.alert(
        'Session Paused',
        `Your session has been paused due to a system ${type === 'call' ? 'call' : type === 'lowBattery' ? 'low battery' : 'interruption'}. Resume when ready.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error handling interruption:', error);
    }
  }, []);

  // Offer interruption recovery
  const offerInterruptionRecovery = useCallback(async (): Promise<boolean> => {
    try {
      return await timerManager.recoverFromInterruption();
    } catch (error) {
      console.error('Error offering interruption recovery:', error);
      return false;
    }
  }, []);

  // Calculate remaining time
  const remainingTime = Math.max(0, timerState.plannedDuration - currentElapsedTime);
  const isTimerCompleted = remainingTime <= 0 && timerState.isActive;

  return {
    timerState,
    currentElapsedTime,
    remainingTime,
    isTimerCompleted,
    startAdvancedTimer,
    pauseAdvancedTimer,
    resumeAdvancedTimer,
    stopAdvancedTimer,
    handleInterruption,
    offerInterruptionRecovery
  };
};