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

  // Responsive spacing based on screen height
  const isSmallScreen = height < 700;
  const spacing = {
    topPadding: height * 0.12, // 12% of screen height
    contentGap: isSmallScreen ? height * 0.03 : height * 0.04, // 3-4% gaps
    bottomPadding: isSmallScreen ? 30 : 50,
  };

  return (
    <View style={[styles.container, { backgroundColor: sessionColor }]}>
      <StatusBar style="light" />
      <View style={[styles.statusBarBackground, { backgroundColor: sessionColor, height: insets.top }]} />

      <View style={[styles.content, { paddingTop: spacing.topPadding, gap: spacing.contentGap }]}>
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

      <View style={[styles.presetContainer, { paddingBottom: spacing.bottomPadding }]}>
        <PresetSelector
          presets={timerPresets}
          selectedPreset={selectedPreset}
          onPresetChange={changePreset}
          onCustomPreset={() => setShowCustomModal(true)}
          isSmallScreen={isSmallScreen}
        />
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
  statusBarBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  presetContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});