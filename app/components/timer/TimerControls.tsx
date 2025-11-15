import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TimerControlsProps {
  isSessionActive: boolean;
  isPaused: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
  onStopTimer?: () => void; // Optional stop button (shown after cycle completion)
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

  // Responsive button sizing
  const buttonSize = {
    paddingVertical: isSmallScreen ? 12 : 15,
    paddingHorizontal: isSmallScreen ? 25 : 30,
    fontSize: isSmallScreen ? 16 : 18,
  };

  return (
    <View style={[styles.controls, { gap: isSmallScreen ? 15 : 20 }]}>
      <TouchableOpacity
        style={[
          styles.button,
          styles.primaryButton,
          {
            paddingVertical: buttonSize.paddingVertical,
            paddingHorizontal: buttonSize.paddingHorizontal,
          }
        ]}
        onPress={onToggleTimer}
      >
        <Text style={[styles.buttonText, { fontSize: buttonSize.fontSize }]}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>

      {onStopTimer ? (
        <TouchableOpacity
          style={[
            styles.button,
            styles.stopButton,
            {
              paddingVertical: buttonSize.paddingVertical,
              paddingHorizontal: buttonSize.paddingHorizontal,
            }
          ]}
          onPress={onStopTimer}
        >
          <Text style={[styles.secondaryButtonText, { fontSize: buttonSize.fontSize }]}>
            STOP
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            {
              paddingVertical: buttonSize.paddingVertical,
              paddingHorizontal: buttonSize.paddingHorizontal,
            }
          ]}
          onPress={onResetTimer}
        >
          <Text style={[styles.secondaryButtonText, { fontSize: buttonSize.fontSize }]}>
            RESET
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  controls: {
    flexDirection: 'row',
  },
  button: {
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
  stopButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.7)',
  },
  buttonText: {
    fontWeight: 'bold',
    color: '#333',
  },
  secondaryButtonText: {
    fontWeight: 'bold',
    color: 'white',
  },
});

export default TimerControls;