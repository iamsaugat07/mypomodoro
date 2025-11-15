 import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { SessionType } from '../../../src/types';

interface TimerDisplayProps {
  timeLeft: number;
  sessionType: SessionType;
  totalWorkSessions: number;
  workSessionDuration: number; // Duration in minutes for one work session
  currentCycle: number;
  cycleSessionsCompleted: number;
  sessionsUntilLongBreak: number;
  isSmallScreen: boolean;
}

const TimerDisplay = ({
  timeLeft,
  sessionType,
  totalWorkSessions,
  workSessionDuration,
  currentCycle,
  cycleSessionsCompleted,
  sessionsUntilLongBreak,
  isSmallScreen
}: TimerDisplayProps) => {
  const { width } = useWindowDimensions();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTotalTime = (): string => {
    const totalMinutes = totalWorkSessions * workSessionDuration;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
      return `${minutes}min`;
    } else if (minutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${minutes}min`;
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

  // Responsive font sizes
  const fontSize = {
    sessionType: isSmallScreen ? 20 : 24,
    cycleInfo: isSmallScreen ? 16 : 18,
    totalSessions: isSmallScreen ? 12 : 14,
    timer: isSmallScreen ? Math.min(width * 0.18, 60) : Math.min(width * 0.18, 72),
  };

  return (
    <>
      <View style={styles.header}>
        <Text style={[styles.sessionType, { fontSize: fontSize.sessionType }]}>
          {getSessionDisplayName()}
        </Text>
        <Text style={[styles.cycleInfo, { fontSize: fontSize.cycleInfo }]}>
          Cycle {currentCycle} - Session {cycleSessionsCompleted}/{sessionsUntilLongBreak}
        </Text>
        <Text style={[styles.totalSessions, { fontSize: fontSize.totalSessions }]}>
          Total Time Worked: {formatTotalTime()}
        </Text>
      </View>

      <View style={[
        styles.timerContainer,
        {
          paddingVertical: isSmallScreen ? 30 : 40,
          paddingHorizontal: isSmallScreen ? 40 : 50,
        }
      ]}>
        <Text style={[styles.timer, { fontSize: fontSize.timer }]}>
          {formatTime(timeLeft)}
        </Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
  },
  sessionType: {
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 2,
    marginBottom: 10,
  },
  cycleInfo: {
    fontWeight: '600',
    color: 'white',
    opacity: 0.9,
    marginBottom: 5,
  },
  totalSessions: {
    color: 'white',
    opacity: 0.7,
  },
  timerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  timer: {
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
});

export default TimerDisplay;