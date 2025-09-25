import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTimerModal from '../CustomTimerModal';
import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';
import PresetSelector from './PresetSelector';
import { useTimerLogic } from '../../../src/hooks/useTimerLogic';

export default function TimerScreen() {
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  
  const {
    timeLeft,
    sessionType,
    sessionsCompleted,
    selectedPreset,
    currentPreset,
    cycleSessionsCompleted,
    isSessionActive,
    isPaused,
    sessionColor,
    timerPresets,
    toggleTimer,
    resetTimer,
    changePreset,
    handleCustomTimer
  } = useTimerLogic();

  return (
    <View style={[styles.container, { backgroundColor: sessionColor }]}>
      <StatusBar style="light" />
      <View style={[styles.statusBarBackground, { backgroundColor: sessionColor, height: insets.top }]} />
      
      <TimerDisplay
        timeLeft={timeLeft}
        sessionType={sessionType}
        sessionsCompleted={sessionsCompleted}
        cycleSessionsCompleted={cycleSessionsCompleted}
        sessionsUntilLongBreak={currentPreset.sessionsUntilLongBreak || 4}
      />

      <TimerControls
        isSessionActive={isSessionActive}
        isPaused={isPaused}
        onToggleTimer={toggleTimer}
        onResetTimer={resetTimer}
      />

      <PresetSelector
        presets={timerPresets}
        selectedPreset={selectedPreset}
        onPresetChange={changePreset}
        onCustomPreset={() => setShowCustomModal(true)}
      />
      
      <CustomTimerModal
        visible={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSetCustomTimer={handleCustomTimer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});