import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SessionType } from '../../../src/types';

interface TimerDisplayProps {
  timeLeft: number;
  sessionType: SessionType;
  sessionsCompleted: number;
  cycleSessionsCompleted: number;
  sessionsUntilLongBreak: number;
}

const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeLeft,
  sessionType,
  sessionsCompleted,
  cycleSessionsCompleted,
  sessionsUntilLongBreak
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    <>
      <View style={styles.header}>
        <Text style={styles.sessionType}>
          {getSessionDisplayName()}
        </Text>
        <Text style={styles.sessionCount}>
          Sessions: {sessionsCompleted} | Cycle: {cycleSessionsCompleted}/{sessionsUntilLongBreak}
        </Text>
      </View>

      <View style={styles.timerContainer}>
        <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
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
});

export default TimerDisplay;