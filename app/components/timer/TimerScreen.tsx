import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomTimerModal from '../CustomTimerModal';
import TimerDisplay from './TimerDisplay';
import TimerControls from './TimerControls';
import PresetSelector from './PresetSelector';
import { useTimerLogic } from '../../../src/hooks/useTimerLogic';

export default function TimerScreen() {
  const [showCustomModal, setShowCustomModal] = useState<boolean>(false);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const {
    timeLeft,
    sessionType,
    totalWorkSessions,
    currentCycle,
    selectedPreset,
    currentPreset,
    cycleSessionsCompleted,
    isSessionActive,
    isPaused,
    cycleJustCompleted,
    sessionColor,
    timerPresets,
    toggleTimer,
    resetTimer,
    stopTimer,
    changePreset,
    handleCustomTimer
  } = useTimerLogic();

  const isSmallScreen = height < 700;

  return (
    <View style={[styles.container, { backgroundColor: sessionColor }]}>
      <StatusBar style="light" />

      <View style={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 72 }]}>
        <View style={[styles.timerGroup, { gap: isSmallScreen ? 24 : 32 }]}>
          <TimerDisplay
            timeLeft={timeLeft}
            sessionType={sessionType}
            totalWorkSessions={totalWorkSessions}
            workSessionDuration={currentPreset.work}
            currentCycle={currentCycle}
            cycleSessionsCompleted={cycleSessionsCompleted}
            sessionsUntilLongBreak={currentPreset.sessionsUntilLongBreak || 4}
            isSmallScreen={isSmallScreen}
          />

          <TimerControls
            isSessionActive={isSessionActive}
            isPaused={isPaused}
            onToggleTimer={toggleTimer}
            onResetTimer={resetTimer}
            onStopTimer={cycleJustCompleted ? stopTimer : undefined}
            isSmallScreen={isSmallScreen}
          />
        </View>

        <View style={styles.presetContainer}>
          <PresetSelector
            presets={timerPresets}
            selectedPreset={selectedPreset}
            onPresetChange={changePreset}
            onCustomPreset={() => setShowCustomModal(true)}
            isSmallScreen={isSmallScreen}
          />
        </View>
      </View>

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
  },
  content: {
    flex: 1,
    justifyContent: 'space-evenly',
    paddingHorizontal: 20,
  },
  timerGroup: {
    alignItems: 'center',
  },
  presetContainer: {
    alignItems: 'center',
  },
});
