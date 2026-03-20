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

  const cardWidth = Math.min((width - 60) / 4.2, 82);
  const nameFontSize = isSmallScreen ? 12 : 13;
  const subFontSize = isSmallScreen ? 10 : 11;

  return (
    <View style={styles.presets}>
      <Text style={[styles.presetsTitle, { fontSize: isSmallScreen ? 11 : 12 }]}>
        TIMER PRESETS
      </Text>
      <View style={[styles.presetButtons, { gap: isSmallScreen ? 8 : 10 }]}>
        {Object.keys(presets).map((preset) => {
          const isActive = selectedPreset === preset;
          return (
            <TouchableOpacity
              key={preset}
              style={[
                styles.presetButton,
                isActive && styles.activePresetButton,
                { width: cardWidth },
              ]}
              onPress={() => onPresetChange(preset)}
              activeOpacity={0.75}
            >
              <Text style={[
                styles.presetName,
                isActive && styles.activeText,
                { fontSize: nameFontSize },
              ]}>
                {getPresetDisplayName(preset)}
              </Text>
              <Text style={[
                styles.presetSub,
                isActive && styles.activeSubText,
                { fontSize: subFontSize },
              ]}>
                {presets[preset].work}m work
              </Text>
              <Text style={[
                styles.presetSub,
                isActive && styles.activeSubText,
                { fontSize: subFontSize },
              ]}>
                {presets[preset].sessionsUntilLongBreak || 4} sessions
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity
          style={[styles.presetButton, styles.customButton, { width: cardWidth }]}
          onPress={onCustomPreset}
          activeOpacity={0.75}
        >
          <Text style={[styles.presetName, { fontSize: nameFontSize }]}>Custom</Text>
          <Text style={[styles.presetSub, { fontSize: nameFontSize + 2 }]}>+</Text>
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
    letterSpacing: 2,
    opacity: 0.6,
    marginBottom: 12,
    fontWeight: '600',
  },
  presetButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  presetButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 3,
  },
  activePresetButton: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  customButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderStyle: 'dashed',
  },
  presetName: {
    fontWeight: '700',
    color: 'white',
  },
  presetSub: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeText: {
    color: '#333',
  },
  activeSubText: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
});

export default PresetSelector;
