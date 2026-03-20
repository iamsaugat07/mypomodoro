import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { SessionType } from '../../../src/types';

interface TimerDisplayProps {
  timeLeft: number;
  sessionType: SessionType;
  totalWorkSessions: number;
  workSessionDuration: number;
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
    if (hours === 0) return `${minutes}min`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}min`;
  };

  const getSessionDisplayName = (): string => {
    switch (sessionType) {
      case 'work': return 'WORK TIME';
      case 'break': return 'SHORT BREAK';
      case 'longBreak': return 'LONG BREAK';
      default: return 'WORK TIME';
    }
  };

  const timerFontSize = isSmallScreen
    ? Math.min(width * 0.20, 70)
    : Math.min(width * 0.22, 82);

  return (
    <>
      <View style={styles.header}>
        <Text style={[styles.sessionType, { fontSize: isSmallScreen ? 13 : 14 }]}>
          {getSessionDisplayName()}
        </Text>
        <Text style={[styles.cycleInfo, { fontSize: isSmallScreen ? 22 : 26 }]}>
          Cycle {currentCycle} · Session {cycleSessionsCompleted}/{sessionsUntilLongBreak}
        </Text>
        <View style={styles.dotsRow}>
          {Array.from({ length: sessionsUntilLongBreak }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < cycleSessionsCompleted ? styles.dotFilled : styles.dotEmpty]}
            />
          ))}
        </View>
        <Text style={[styles.totalSessions, { fontSize: isSmallScreen ? 12 : 13 }]}>
          Total worked: {formatTotalTime()}
        </Text>
      </View>

      <View style={[
        styles.timerContainer,
        {
          paddingVertical: isSmallScreen ? 22 : 28,
          paddingHorizontal: isSmallScreen ? 36 : 48,
        }
      ]}>
        <Text style={[styles.timer, { fontSize: timerFontSize }]}>
          {formatTime(timeLeft)}
        </Text>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    gap: 6,
  },
  sessionType: {
    fontWeight: '700',
    color: 'white',
    letterSpacing: 3,
    opacity: 0.75,
    textTransform: 'uppercase',
  },
  cycleInfo: {
    fontWeight: '700',
    color: 'white',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  dotFilled: {
    backgroundColor: 'white',
  },
  dotEmpty: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.55)',
  },
  totalSessions: {
    color: 'white',
    opacity: 0.6,
    marginTop: 2,
  },
  timerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  timer: {
    fontWeight: '700',
    color: 'white',
    textAlign: 'center',
    letterSpacing: 2,
  },
});

export default TimerDisplay;
