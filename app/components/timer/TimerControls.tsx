import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TimerControlsProps {
  isSessionActive: boolean;
  isPaused: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onStopTimer?: () => void;
  isSmallScreen: boolean;
}

const TimerControls = ({
  isSessionActive,
  isPaused,
  onToggleTimer,
  onResetTimer,
  onStopTimer,
  isSmallScreen
}: TimerControlsProps) => {
  const getButtonText = (): string => {
    if (isSessionActive && !isPaused) return 'PAUSE';
    if (isSessionActive && isPaused) return 'RESUME';
    return 'START';
  };

  const fontSize = isSmallScreen ? 16 : 17;
  const paddingV = isSmallScreen ? 14 : 16;

  return (
    <View style={[styles.controls, { gap: isSmallScreen ? 14 : 16 }]}>
      <TouchableOpacity
        style={[styles.primaryButton, { paddingVertical: paddingV }]}
        onPress={onToggleTimer}
        activeOpacity={0.85}
      >
        <Text style={[styles.primaryText, { fontSize }]}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>

      {onStopTimer ? (
        <TouchableOpacity
          style={[styles.secondaryButton, { paddingVertical: paddingV }]}
          onPress={onStopTimer}
          activeOpacity={0.85}
        >
          <Text style={[styles.secondaryText, { fontSize }]}>STOP</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.secondaryButton, { paddingVertical: paddingV }]}
          onPress={onResetTimer}
          activeOpacity={0.85}
        >
          <Text style={[styles.secondaryText, { fontSize }]}>RESET</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: 'white',
    borderRadius: 32,
    minWidth: 148,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  primaryText: {
    fontWeight: '700',
    color: '#333',
    letterSpacing: 1,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 32,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    minWidth: 112,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  secondaryText: {
    fontWeight: '700',
    color: 'white',
    letterSpacing: 1,
  },
});

export default TimerControls;
