import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert,
  Platform
} from 'react-native';
import CustomTimerModal from '../components/CustomTimerModal';
import { useAuth } from '../../lib/context/AuthContext';
import { usePomodoroSession, useUserSettings } from '../../lib/hooks/useFirestore';
import { TimerPreset, SessionType } from '../../lib/types';

const TIMER_PRESETS: Record<string, TimerPreset> = {
  pomodoro: { work: 25, break: 5, longBreak: 15 },
  shortWork: { work: 15, break: 5, longBreak: 15 },
  longWork: { work: 50, break: 10, longBreak: 20 }
};

export default function App() {
  const { user } = useAuth();
  const { settings, updateSettings } = useUserSettings();
  const { currentSessionId, start, complete, cancel } = usePomodoroSession();
  
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [sessionType, setSessionType] = useState<SessionType>('work');
  const [sessionsCompleted, setSessionsCompleted] = useState<number>(0);
  const [selectedPreset, setSelectedPreset] = useState<string>('pomodoro');
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive && !isPaused && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(time => time - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    if (timeLeft === 0) {
      handleTimerComplete();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, timeLeft]);

  const handleTimerComplete = async (): Promise<void> => {
    setIsActive(false);
    setIsPaused(false);
    
    // Complete the current session in Firebase
    if (currentSessionId) {
      try {
        const actualDuration = sessionStartTime > 0 ? Math.floor((Date.now() - sessionStartTime) / 1000) : timeLeft;
        await complete(currentSessionId, actualDuration, true);
      } catch (error) {
        console.error('Error completing session:', error);
      }
    }
    
    if (sessionType === 'work') {
      const newSessionsCompleted = sessionsCompleted + 1;
      setSessionsCompleted(newSessionsCompleted);
      
      const currentPreset = getPresetData(selectedPreset);
      if (newSessionsCompleted % 4 === 0) {
        setSessionType('longBreak');
        setTimeLeft(currentPreset.longBreak * 60);
        Alert.alert('Work Complete!', 'Time for a long break!');
      } else {
        setSessionType('break');
        setTimeLeft(currentPreset.break * 60);
        Alert.alert('Work Complete!', 'Time for a short break!');
      }
    } else {
      setSessionType('work');
      const currentPreset = getPresetData(selectedPreset);
      setTimeLeft(currentPreset.work * 60);
      Alert.alert('Break Complete!', 'Time to get back to work!');
    }
  };

  const toggleTimer = async (): Promise<void> => {
    if (isActive && !isPaused) {
      // Pause the timer
      setIsPaused(true);
    } else {
      // Start or resume the timer
      if (!isActive && !currentSessionId) {
        // Starting a new session - create in Firebase
        try {
          const sessionId = await start(sessionType, timeLeft, selectedPreset);
          if (sessionId) {
            setSessionStartTime(Date.now());
          }
        } catch (error) {
          console.error('Error starting session:', error);
          Alert.alert('Error', 'Failed to start session. Please try again.');
          return;
        }
      }
      
      setIsActive(true);
      setIsPaused(false);
    }
  };

  const resetTimer = async (): Promise<void> => {
    // Cancel current session if active
    if (currentSessionId) {
      try {
        await cancel(currentSessionId);
      } catch (error) {
        console.error('Error cancelling session:', error);
      }
    }
    
    setIsActive(false);
    setIsPaused(false);
    setSessionStartTime(0);
    
    const currentPreset = getPresetData(selectedPreset);
    const duration = sessionType === 'work' ? 
      currentPreset.work : 
      (sessionType === 'break' ? currentPreset.break : currentPreset.longBreak);
    setTimeLeft(duration * 60);
  };

  const changePreset = (preset: string): void => {
    setSelectedPreset(preset);
    setIsActive(false);
    setIsPaused(false);
    setSessionType('work');
    setSessionsCompleted(0);
    const presetData = getPresetData(preset);
    setTimeLeft(presetData.work * 60);
  };

  const handleCustomTimer = async (customTimes: TimerPreset): Promise<void> => {
    if (!customTimes || !customTimes.work) {
      Alert.alert('Error', 'Invalid timer configuration');
      return;
    }
    
    try {
      const customKey = `custom_${Date.now()}`;
      const customPreset = {
        ...customTimes,
        name: `Custom ${customTimes.work}/${customTimes.break}`,
        createdAt: new Date() as any, // Will be converted to Timestamp by Firebase
      };
      
      // Save to Firebase
      const updatedSettings = {
        ...settings,
        customPresets: {
          ...settings?.customPresets,
          [customKey]: customPreset
        }
      };
      
      await updateSettings(updatedSettings);
      
      // Use the custom timer immediately
      setSelectedPreset(customKey);
      setIsActive(false);
      setIsPaused(false);
      setSessionType('work');
      setSessionsCompleted(0);
      setTimeLeft(customTimes.work * 60);
    } catch (error) {
      console.error('Error saving custom timer:', error);
      Alert.alert('Error', 'Failed to save custom timer');
    }
  };

  const getPresetData = (preset: string): TimerPreset => {
    const presetData = TIMER_PRESETS[preset] || settings?.customPresets?.[preset];
    if (!presetData) {
      // Fallback to default pomodoro preset if preset not found
      return TIMER_PRESETS.pomodoro;
    }
    return presetData;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionColor = (): string => {
    switch (sessionType) {
      case 'work': return '#e74c3c';
      case 'break': return '#2ecc71';
      case 'longBreak': return '#3498db';
      default: return '#e74c3c';
    }
  };

  const getPresetDisplayName = (preset: string): string => {
    switch (preset) {
      case 'pomodoro': return 'Classic';
      case 'shortWork': return 'Short';
      case 'longWork': return 'Long';
      default: return 'Custom';
    }
  };

  const getSessionDisplayName = (): string => {
    switch (sessionType) {
      case 'work': return 'WORK TIME';
      case 'break': return 'SHORT BREAK';
      case 'longBreak': return 'LONG BREAK';
      default: return 'WORK TIME';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getSessionColor() }]}>
      <StatusBar style="light" />
      
      <View style={styles.header}>
        <Text style={styles.sessionType}>
          {getSessionDisplayName()}
        </Text>
        <Text style={styles.sessionCount}>
          Sessions: {sessionsCompleted}
        </Text>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity 
          style={[styles.button, styles.primaryButton]} 
          onPress={toggleTimer}
        >
          <Text style={styles.buttonText}>
            {isActive && !isPaused ? 'PAUSE' : 'START'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.secondaryButton]} 
          onPress={resetTimer}
        >
          <Text style={styles.secondaryButtonText}>RESET</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.presets}>
        <Text style={styles.presetsTitle}>Timer Presets</Text>
        <View style={styles.presetButtons}>
          {Object.keys(TIMER_PRESETS).map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[
                styles.presetButton,
                selectedPreset === preset && styles.activePresetButton
              ]}
              onPress={() => changePreset(preset)}
            >
              <Text style={[
                styles.presetButtonText,
                selectedPreset === preset && styles.activePresetButtonText
              ]}>
                {getPresetDisplayName(preset)}
              </Text>
              <Text style={[
                styles.presetTimeText,
                selectedPreset === preset && styles.activePresetButtonText
              ]}>
                {TIMER_PRESETS[preset].work}min
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[styles.presetButton, styles.customButton]}
            onPress={() => setShowCustomModal(true)}
          >
            <Text style={styles.presetButtonText}>Custom</Text>
            <Text style={styles.presetTimeText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <CustomTimerModal
        visible={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSetCustomTimer={handleCustomTimer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  sessionType: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
    marginBottom: 10,
  },
  sessionCount: {
    fontSize: 16,
    color: 'white',
    opacity: 0.8,
  },
  timerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingVertical: 40,
    paddingHorizontal: 50,
    marginBottom: 50,
  },
  timer: {
    fontSize: 72,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  controls: {
    flexDirection: 'row',
    marginBottom: 50,
    gap: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    minWidth: 100,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: 'white',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'white',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  presets: {
    alignItems: 'center',
    position: 'absolute',
    bottom: 50,
    left: 20,
    right: 20,
  },
  presetsTitle: {
    fontSize: 16,
    color: 'white',
    marginBottom: 15,
    opacity: 0.8,
  },
  presetButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  presetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 70,
  },
  activePresetButton: {
    backgroundColor: 'white',
  },
  presetButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  presetTimeText: {
    fontSize: 10,
    color: 'white',
    opacity: 0.8,
  },
  activePresetButtonText: {
    color: '#333',
  },
  customButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
});