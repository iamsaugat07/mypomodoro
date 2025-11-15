import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { TimerPreset } from '../../../src/types';

interface PresetSelectorProps {
  presets: Record<string, TimerPreset>;
  selectedPreset: string;
  onPresetChange: (preset: string) => void;
  onCustomPreset: () => void;
  isSmallScreen: boolean;
}

const PresetSelector = ({
  presets,
  selectedPreset,
  onPresetChange,
  onCustomPreset,
  isSmallScreen
}: PresetSelectorProps) => {
  const { width } = useWindowDimensions();

  const getPresetDisplayName = (preset: string): string => {
    switch (preset) {
      case 'pomodoro': return 'Classic';
      case 'shortWork': return 'Short';
      case 'longWork': return 'Long';
      default: return 'Custom';
    }
  };

  // Responsive sizing for preset buttons
  const presetSize = {
    buttonPadding: isSmallScreen ? 10 : 12,
    titleFontSize: isSmallScreen ? 14 : 16,
    nameFontSize: isSmallScreen ? 11 : 12,
    timeFontSize: isSmallScreen ? 10 : 11,
    cycleFontSize: isSmallScreen ? 8 : 9,
    gap: isSmallScreen ? 8 : 10,
    minWidth: Math.min((width - 60) / 4.5, 80), // Responsive button width
  };

  return (
    <View style={styles.presets}>
      <Text style={[styles.presetsTitle, { fontSize: presetSize.titleFontSize }]}>
        Timer Presets
      </Text>
      <View style={[styles.presetButtons, { gap: presetSize.gap }]}>
        {Object.keys(presets).map((preset) => (
          <TouchableOpacity
            key={preset}
            style={[
              styles.presetButton,
              selectedPreset === preset && styles.activePresetButton,
              {
                paddingVertical: presetSize.buttonPadding,
                paddingHorizontal: presetSize.buttonPadding,
                minWidth: presetSize.minWidth,
              }
            ]}
            onPress={() => onPresetChange(preset)}
          >
            <Text style={[
              styles.presetButtonText,
              selectedPreset === preset && styles.activePresetButtonText,
              { fontSize: presetSize.nameFontSize }
            ]}>
              {getPresetDisplayName(preset)}
            </Text>
            <Text style={[
              styles.presetTimeText,
              selectedPreset === preset && styles.activePresetButtonText,
              { fontSize: presetSize.timeFontSize }
            ]}>
              {presets[preset].work}m work
            </Text>
            <Text style={[
              styles.presetCycleText,
              selectedPreset === preset && styles.activePresetButtonText,
              { fontSize: presetSize.cycleFontSize }
            ]}>
              {presets[preset].sessionsUntilLongBreak || 4} sessions
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            styles.presetButton,
            styles.customButton,
            {
              paddingVertical: presetSize.buttonPadding,
              paddingHorizontal: presetSize.buttonPadding,
              minWidth: presetSize.minWidth,
            }
          ]}
          onPress={onCustomPreset}
        >
          <Text style={[styles.presetButtonText, { fontSize: presetSize.nameFontSize }]}>
            Custom
          </Text>
          <Text style={[styles.presetTimeText, { fontSize: presetSize.timeFontSize }]}>
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  presets: {
    alignItems: 'center',
    width: '100%',
  },
  presetsTitle: {
    color: 'white',
    marginBottom: 15,
    opacity: 0.8,
  },
  presetButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  presetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    alignItems: 'center',
  },
  activePresetButton: {
    backgroundColor: 'white',
  },
  presetButtonText: {
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 2,
  },
  presetTimeText: {
    color: 'white',
    opacity: 0.8,
    marginBottom: 2,
  },
  presetCycleText: {
    color: 'white',
    opacity: 0.7,
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