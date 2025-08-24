import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { TimerPreset } from '../../../src/types';

interface PresetSelectorProps {
  presets: Record<string, TimerPreset>;
  selectedPreset: string;
  onPresetChange: (preset: string) => void;
  onCustomPreset: () => void;
}

const PresetSelector: React.FC<PresetSelectorProps> = ({
  presets,
  selectedPreset,
  onPresetChange,
  onCustomPreset
}) => {
  const getPresetDisplayName = (preset: string): string => {
    switch (preset) {
      case 'pomodoro': return 'Classic';
      case 'shortWork': return 'Short';
      case 'longWork': return 'Long';
      default: return 'Custom';
    }
  };

  return (
    <View style={styles.presets}>
      <Text style={styles.presetsTitle}>Timer Presets</Text>
      <View style={styles.presetButtons}>
        {Object.keys(presets).map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[
              styles.presetButton,
              selectedPreset === preset && styles.activePresetButton
            ]}
            onPress={() => onPresetChange(preset)}
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
              {presets[preset].work}min
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.presetButton, styles.customButton]}
          onPress={onCustomPreset}
        >
          <Text style={styles.presetButtonText}>Custom</Text>
          <Text style={styles.presetTimeText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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

export default PresetSelector;