import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface TimerControlsProps {
  isSessionActive: boolean;
  isPaused: boolean;
  onToggleTimer: () => void;
  onResetTimer: () => void;
}

const TimerControls: React.FC<TimerControlsProps> = ({
  isSessionActive,
  isPaused,
  onToggleTimer,
  onResetTimer
}) => {
  const getButtonText = (): string => {
    if (isSessionActive && !isPaused) return 'PAUSE';
    if (isSessionActive && isPaused) return 'RESUME';
    return 'START';
  };

  return (
    <View style={styles.controls}>
      <TouchableOpacity 
        style={[styles.button, styles.primaryButton]} 
        onPress={onToggleTimer}
      >
        <Text style={styles.buttonText}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, styles.secondaryButton]} 
        onPress={onResetTimer}
      >
        <Text style={styles.secondaryButtonText}>RESET</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default TimerControls;