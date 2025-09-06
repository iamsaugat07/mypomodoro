import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { SessionType, TimerPreset } from '../types';
import { useSessionManager } from './useSessionManager';
import { useSettings } from './useSettings';

const TIMER_PRESETS: Record<string, TimerPreset> = {
  pomodoro: { work: 25, break: 5, longBreak: 15, sessionsUntilLongBreak: 4 },
  shortWork: { work: 15, break: 5, longBreak: 15, sessionsUntilLongBreak: 4 },
  longWork: { work: 50, break: 10, longBreak: 20, sessionsUntilLongBreak: 4 }
};

export const useTimerLogic = () => {
  const { settings } = useSettings();
  const {
    activeSession,
    isSessionActive,
    elapsedTime,
    startSession,
    completeSession,
    cancelSession,
    pauseSession,
    resumeSession,
    isPaused
  } = useSessionManager();

  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<string>('pomodoro');
  const [currentPreset, setCurrentPreset] = useState<TimerPreset>(TIMER_PRESETS.pomodoro);
  const [cycleSessionsCompleted, setCycleSessionsCompleted] = useState<number>(0);

  // Debug: Log timeLeft changes
  useEffect(() => {
    console.log('timeLeft changed to:', timeLeft, 'seconds');
  }, [timeLeft]);

  // Update time left based on elapsed time from session manager
  useEffect(() => {
    if (isSessionActive && activeSession) {
      const plannedDuration = activeSession.plannedDuration;
      const remaining = plannedDuration - Math.floor(elapsedTime / 1000);
      setTimeLeft(Math.max(0, remaining));
      
      if (remaining <= 0) {
        handleTimerComplete();
      }
    }
  }, [elapsedTime, isSessionActive, activeSession]);

  // Load settings defaults only on initial load, not when presets change
  useEffect(() => {
    console.log('Settings effect triggered:', { settings: !!settings, selectedPreset, sessionType, isSessionActive });
    if (settings && !isSessionActive && selectedPreset === 'pomodoro' && sessionType === 'work' && timeLeft === 25 * 60) {
      // Only apply settings defaults on initial load with default values
      console.log('Applying initial settings defaults');
      const presetData = getPresetData(selectedPreset);
      const duration = settings.defaultWorkDuration || presetData.work;
      console.log('Settings effect setting timeLeft to:', duration * 60);
      setTimeLeft(duration * 60);
    }
  }, [settings, selectedPreset, sessionType, isSessionActive, timeLeft]);

  const getPresetData = useCallback((preset: string) => {
    const presetData = TIMER_PRESETS[preset];
    if (!presetData) {
      return TIMER_PRESETS.pomodoro;
    }
    return presetData;
  }, []);

  const getSessionColor = useCallback((): string => {
    switch (sessionType) {
      case 'work': return '#e74c3c';
      case 'break': return '#2ecc71';
      case 'longBreak': return '#3498db';
      default: return '#e74c3c';
    }
  }, [sessionType]);

  const handleTimerComplete = useCallback(async (): Promise<void> => {
    try {
      await completeSession(true);
    } catch (error) {
      console.error('Error completing session:', error);
    }
    
    if (sessionType === 'work') {
      const newCycleSessionsCompleted = cycleSessionsCompleted + 1;
      const newTotalSessionsCompleted = sessionsCompleted + 1;
      setCycleSessionsCompleted(newCycleSessionsCompleted);
      setSessionsCompleted(newTotalSessionsCompleted);
      
      const sessionsUntilLongBreak = currentPreset.sessionsUntilLongBreak || 4;
      console.log(`Session completed: ${newCycleSessionsCompleted}/${sessionsUntilLongBreak}, checking for long break: ${newCycleSessionsCompleted % sessionsUntilLongBreak === 0}`);
      
      if (newCycleSessionsCompleted % sessionsUntilLongBreak === 0) {
        console.log(`Triggering long break after ${newCycleSessionsCompleted} sessions`);
        setSessionType('longBreak');
        setTimeLeft(currentPreset.longBreak * 60);
        Alert.alert(
          'Work Complete!', 
          `Time for a long break! You've completed ${newCycleSessionsCompleted} work sessions.`,
          [{ text: 'Start Break', onPress: () => startNextSession('longBreak') }]
        );
      } else {
        setSessionType('break');
        setTimeLeft(currentPreset.break * 60);
        Alert.alert(
          'Work Complete!', 
          'Time for a short break!',
          [{ text: 'Start Break', onPress: () => startNextSession('break') }]
        );
      }
    } else {
      // Break completed - check if it was a long break to reset cycle
      if (sessionType === 'longBreak') {
        setCycleSessionsCompleted(0); // Reset cycle after long break
        console.log('Long break completed, resetting cycle counter to 0');
      }
      
      setSessionType('work');
      setTimeLeft(currentPreset.work * 60);
      
      Alert.alert(
        'Break Complete!', 
        'Time to get back to work!',
        [{ text: 'Start Work', onPress: () => startNextSession('work') }]
      );
    }
  }, [sessionType, cycleSessionsCompleted, sessionsCompleted, currentPreset, completeSession]);

  const startNextSession = useCallback(async (type: SessionType): Promise<void> => {
    try {
      const duration = type === 'work' ? currentPreset.work * 60 :
                      type === 'break' ? currentPreset.break * 60 : 
                      currentPreset.longBreak * 60;
      
      await startSession(type, duration);
    } catch (error) {
      console.error('Error starting next session:', error);
      Alert.alert('Error', 'Failed to start session. Please try again.');
    }
  }, [currentPreset, startSession]);

  const toggleTimer = useCallback(async (): Promise<void> => {
    try {
      if (isSessionActive && !isPaused) {
        pauseSession();
      } else if (isSessionActive && isPaused) {
        resumeSession();
      } else {
        const duration = timeLeft;
        await startSession(
          sessionType === 'work' ? 'work' : 
          sessionType === 'break' ? 'break' : 'longBreak',
          duration
        );
      }
    } catch (error) {
      console.error('Error toggling timer:', error);
      Alert.alert('Error', 'Failed to start session. Please try again.');
    }
  }, [isSessionActive, isPaused, pauseSession, resumeSession, startSession, timeLeft, sessionType]);

  const resetTimer = useCallback(async (): Promise<void> => {
    try {
      if (isSessionActive) {
        await cancelSession();
      }
      
      const currentPreset = getPresetData(selectedPreset);
      const duration = sessionType === 'work' ? 
        (settings?.defaultWorkDuration || currentPreset.work) : 
        (sessionType === 'break' ? 
          (settings?.defaultBreakDuration || currentPreset.break) : 
          (settings?.defaultLongBreakDuration || currentPreset.longBreak));
      
      setTimeLeft(duration * 60);
    } catch (error) {
      console.error('Error resetting timer:', error);
    }
  }, [isSessionActive, cancelSession, selectedPreset, sessionType, settings, getPresetData]);

  const changePreset = useCallback(async (preset: string): Promise<void> => {
    console.log('changePreset called with:', preset);
    
    if (isSessionActive) {
      await cancelSession();
    }
    
    setSelectedPreset(preset);
    const presetData = getPresetData(preset);
    setCurrentPreset(presetData);
    
    setSessionType('work');
    setSessionsCompleted(0);
    setCycleSessionsCompleted(0);
    
    // Always use the preset's work duration for preset changes (not settings override)
    const duration = presetData.work;
    console.log('Setting timeLeft to preset duration:', duration * 60, 'seconds (', duration, 'minutes)');
    setTimeLeft(duration * 60);
  }, [isSessionActive, cancelSession, getPresetData]);

  const handleCustomTimer = useCallback(async (customTimes: TimerPreset): Promise<void> => {
    console.log('handleCustomTimer called with:', customTimes);
    
    if (!customTimes || !customTimes.work) {
      console.log('Invalid custom timer configuration');
      Alert.alert('Error', 'Invalid timer configuration');
      return;
    }
    
    try {
      if (isSessionActive) {
        console.log('Cancelling active session before setting custom timer');
        await cancelSession();
      }
      
      console.log('Setting custom preset and resetting state');
      setCurrentPreset(customTimes);
      setSelectedPreset('custom');
      
      setSessionType('work');
      setSessionsCompleted(0);
      setCycleSessionsCompleted(0);
      
      const newTimeLeft = customTimes.work * 60;
      console.log('Setting timeLeft to:', newTimeLeft, 'seconds (', customTimes.work, 'minutes)');
      setTimeLeft(newTimeLeft);
      
      Alert.alert(
        'Custom Timer Set!',
        `Work sessions: ${customTimes.work}min\n` +
        `Break sessions: ${customTimes.break}min\n` +
        `Long break: ${customTimes.longBreak}min\n` +
        `Long break after: ${customTimes.sessionsUntilLongBreak || 4} work sessions`
      );
    } catch (error) {
      console.error('Error setting custom timer:', error);
      Alert.alert('Error', 'Failed to set custom timer');
    }
  }, [isSessionActive, cancelSession]);

  return {
    // State
    timeLeft,
    sessionType,
    sessionsCompleted,
    selectedPreset,
    currentPreset,
    cycleSessionsCompleted,
    isSessionActive,
    isPaused,
    
    // Computed values
    sessionColor: getSessionColor(),
    timerPresets: TIMER_PRESETS,
    
    // Actions
    toggleTimer,
    resetTimer,
    changePreset,
    handleCustomTimer
  };
};