 import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SessionType } from '../../../src/types';

interface TimerDisplayProps {
  timeLeft: number;
  sessionType: SessionType;
  totalWorkSessions: number;
  workSessionDuration: number; // Duration in minutes for one work session
  currentCycle: number;
  cycleSessionsCompleted: number;
  sessionsUntilLongBreak: number;
}

const TimerDisplay = ({
  timeLeft,
  sessionType,
  totalWorkSessions,
  workSessionDuration,
  currentCycle,
  cycleSessionsCompleted,
  sessionsUntilLongBreak
}: TimerDisplayProps) => {
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

  return (
    <>
      <View style={styles.header}>
        <Text style={styles.sessionType}>
          {getSessionDisplayName()}
        </Text>
        <Text style={styles.cycleInfo}>
          Cycle {currentCycle} - Session {cycleSessionsCompleted}/{sessionsUntilLongBreak}
        </Text>
        <Text style={styles.totalSessions}>
          Total Time Worked: {formatTotalTime()}
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
  cycleInfo: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    opacity: 0.9,
    marginBottom: 5,
  },
  totalSessions: {
    fontSize: 14,
    color: 'white',
    opacity: 0.7,
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