import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';

interface TimerPreset {
  work: number;
  break: number;
  longBreak: number;
}

interface CustomTimerModalProps {
  visible: boolean;
  onClose: () => void;
  onSetCustomTimer: (customTimes: TimerPreset) => void;
}

export default function CustomTimerModal({ 
  visible, 
  onClose, 
  onSetCustomTimer 
}: CustomTimerModalProps) {
  const [workMinutes, setWorkMinutes] = useState<string>('');
  const [breakMinutes, setBreakMinutes] = useState<string>('');
  const [longBreakMinutes, setLongBreakMinutes] = useState<string>('');

  const handleSetTimer = (): void => {
    const work = parseInt(workMinutes.trim());
    const breakTime = parseInt(breakMinutes.trim());
    const longBreak = parseInt(longBreakMinutes.trim());

    // Check for empty inputs
    if (!workMinutes.trim()) {
      Alert.alert('Invalid Input', 'Please enter work time');
      return;
    }

    if (!breakMinutes.trim()) {
      Alert.alert('Invalid Input', 'Please enter break time');
      return;
    }

    if (!longBreakMinutes.trim()) {
      Alert.alert('Invalid Input', 'Please enter long break time');
      return;
    }

    // Check for valid numbers
    if (isNaN(work) || work <= 0 || work > 120) {
      Alert.alert('Invalid Input', 'Work time must be between 1-120 minutes');
      return;
    }

    if (isNaN(breakTime) || breakTime <= 0 || breakTime > 60) {
      Alert.alert('Invalid Input', 'Break time must be between 1-60 minutes');
      return;
    }

    if (isNaN(longBreak) || longBreak <= 0 || longBreak > 60) {
      Alert.alert('Invalid Input', 'Long break time must be between 1-60 minutes');
      return;
    }

    // Create the timer object
    const customTimer: TimerPreset = {
      work,
      break: breakTime,
      longBreak
    };

    console.log('Setting custom timer:', customTimer); // Debug log

    onSetCustomTimer(customTimer);

    setWorkMinutes('');
    setBreakMinutes('');
    setLongBreakMinutes('');
    onClose();
  };

  const handleCancel = (): void => {
    setWorkMinutes('');
    setBreakMinutes('');
    setLongBreakMinutes('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Custom Timer</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Work Time (minutes)</Text>
            <TextInput
              style={styles.input}
              value={workMinutes}
              onChangeText={setWorkMinutes}
              placeholder="25"
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Short Break (minutes)</Text>
            <TextInput
              style={styles.input}
              value={breakMinutes}
              onChangeText={setBreakMinutes}
              placeholder="5"
              keyboardType="numeric"
              maxLength={2}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Long Break (minutes)</Text>
            <TextInput
              style={styles.input}
              value={longBreakMinutes}
              onChangeText={setLongBreakMinutes}
              placeholder="15"
              keyboardType="numeric"
              maxLength={2}
            />
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.setButton]}
              onPress={handleSetTimer}
            >
              <Text style={styles.setButtonText}>Set Timer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  setButton: {
    backgroundColor: '#e74c3c',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  setButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});