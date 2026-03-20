import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/providers/auth';
import { useStatistics } from '../../src/hooks/useStatistics';
import { useSubscription } from '../../src/providers/subscription';
import { StatisticsLockedCard, SessionHistoryLockedCard, DataExportLockedCard } from '../components/premium/FeatureLockedCard';
import { PremiumBadge } from '../components/premium/PremiumBadge';
import { statisticsManager } from '../../src/services/statisticsManager';

type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all-time';

export default function Stats() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { statistics, loading, error, refreshStatistics } = useStatistics();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('week');
  const { isPremium, canAccessStatistics } = useSubscription();

  const handleRefresh = async () => {
    try {
      await refreshStatistics();
    } catch (err) {
      Alert.alert('Error', 'Failed to refresh statistics');
    }
  };

  const handleTimeRangeChange = (timeRange: TimeRange) => {
    const canAccess = statisticsManager.canAccessTimeRange(timeRange);
    if (!canAccess.canAccess) {
      Alert.alert(
        'Premium Required',
        canAccess.upgradeMessage || `${timeRange} statistics require Premium`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => {} }
        ]
      );
      return;
    }
    setSelectedTimeRange(timeRange);
  };

  const chartData = React.useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    if (!statistics?.weeklyStats) {
      return dayNames.map(day => ({ day, pomodoros: 0 }));
    }
    return statistics.weeklyStats.map((dayStats) => {
      const date = new Date(dayStats.date);
      return { day: dayNames[date.getDay()], pomodoros: dayStats.workSessions || 0 };
    });
  }, [statistics?.weeklyStats]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={styles.loadingText}>Loading your stats...</Text>
      </View>
    );
  }

  if (error && !statistics) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.errorText}>Failed to load statistics</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const StatCard = ({
    title,
    value,
    subtitle,
    color = '#e74c3c',
    icon,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
    icon: string;
  }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconWrap, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );

  const TimeRangeSelector = () => {
    const timeRanges: { key: TimeRange; label: string }[] = [
      { key: 'today', label: 'Today' },
      { key: 'week', label: 'Week' },
      { key: 'month', label: 'Month' },
      { key: 'year', label: 'Year' },
      { key: 'all-time', label: 'All Time' },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.timeRangeContent}
      >
        {timeRanges.map((range) => {
          const canAccess = statisticsManager.canAccessTimeRange(range.key);
          const isSelected = selectedTimeRange === range.key;
          const isLocked = !canAccess.canAccess;

          return (
            <TouchableOpacity
              key={range.key}
              style={[
                styles.timeRangeButton,
                isSelected && styles.timeRangeButtonActive,
              ]}
              onPress={() => handleTimeRangeChange(range.key)}
            >
              <Text style={[styles.timeRangeText, isSelected && styles.timeRangeTextActive]}>
                {range.label}
              </Text>
              {isLocked && (
                <Ionicons name="lock-closed" size={10} color={isSelected ? 'white' : '#C7C7CC'} style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const WeeklyChart = () => {
    const maxPomodoros = Math.max(...chartData.map(d => d.pomodoros), 1);
    const todayDay = new Date().toLocaleDateString('en', { weekday: 'short' });
    const BAR_MAX_HEIGHT = 100;

    return (
      <View>
        <View style={styles.chartBars}>
          {chartData.map((day, index) => {
            const isToday = day.day === todayDay;
            const barHeight = Math.max((day.pomodoros / maxPomodoros) * BAR_MAX_HEIGHT, 4);

            return (
              <View key={index} style={styles.chartItem}>
                <Text style={styles.chartValue}>{day.pomodoros > 0 ? day.pomodoros : ''}</Text>
                <View style={styles.chartBarTrack}>
                  <View
                    style={[
                      styles.chartBar,
                      {
                        height: barHeight,
                        backgroundColor: isToday ? '#e74c3c' : '#E5E5EA',
                        borderRadius: 6,
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.chartLabel, isToday && styles.chartLabelToday]}>
                  {day.day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Statistics</Text>
            {isPremium && <PremiumBadge variant="small" />}
          </View>
          <Text style={styles.headerSubtitle}>Track your productivity</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh-outline" size={20} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {/* Time Range */}
      <View style={styles.timeRangeWrapper}>
        <TimeRangeSelector />
      </View>

      {/* Locked state */}
      {!isPremium && (selectedTimeRange === 'month' || selectedTimeRange === 'year' || selectedTimeRange === 'all-time') && (
        <View style={styles.lockedWrapper}>
          <StatisticsLockedCard
            timeRange={selectedTimeRange.charAt(0).toUpperCase() + selectedTimeRange.slice(1)}
            style={{ marginBottom: 0 }}
          />
        </View>
      )}

      {/* Today's Progress */}
      <Text style={styles.sectionLabel}>TODAY'S PROGRESS</Text>
      <View style={styles.statsGrid}>
        <StatCard
          title="Pomodoros"
          value={statistics?.todayStats?.workSessions || 0}
          subtitle="completed"
          color="#e74c3c"
          icon="timer-outline"
        />
        <StatCard
          title="Focus Time"
          value={formatTime(statistics?.todayStats?.totalFocusMinutes || 0)}
          subtitle="total"
          color="#2ecc71"
          icon="time-outline"
        />
        <StatCard
          title="Breaks"
          value={statistics?.todayStats?.breakSessions || 0}
          subtitle="taken"
          color="#3498db"
          icon="cafe-outline"
        />
        <StatCard
          title="Streak"
          value={statistics?.currentStreak || 0}
          subtitle="days"
          color="#f39c12"
          icon="flame-outline"
        />
      </View>

      {/* Weekly Chart */}
      <Text style={styles.sectionLabel}>THIS WEEK</Text>
      <View style={styles.card}>
        <WeeklyChart />
      </View>

      {/* Session History */}
      <Text style={styles.sectionLabel}>SESSION HISTORY</Text>
      <View style={styles.card}>
        {!isPremium ? (
          <SessionHistoryLockedCard />
        ) : (
          <View style={styles.sectionHeader}>
            <Text style={styles.placeholderText}>Recent sessions will appear here</Text>
            <TouchableOpacity
              style={styles.exportButton}
              onPress={() => {
                Alert.alert(
                  'Export Data',
                  'This feature will export your session data to CSV format.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Export CSV', onPress: () => {} }
                  ]
                );
              }}
            >
              <Ionicons name="download-outline" size={15} color="#4CAF50" />
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!isPremium && (
        <>
          <Text style={styles.sectionLabel}>DATA EXPORT</Text>
          <View style={styles.lockedWrapper}>
            <DataExportLockedCard />
          </View>
        </>
      )}

      {/* Achievements */}
      <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
      <View style={styles.card}>
        {statistics?.achievements && statistics.achievements.length > 0 ? (
          statistics.achievements.map((achievement, index) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementRow,
                index < statistics.achievements.length - 1 && styles.achievementDivider,
              ]}
            >
              <View style={styles.achievementIcon}>
                <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
              </View>
              <View style={styles.achievementText}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>{achievement.description}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.achievementRow}>
            <View style={styles.achievementIcon}>
              <Text style={styles.achievementEmoji}>🎯</Text>
            </View>
            <View style={styles.achievementText}>
              <Text style={styles.achievementTitle}>Getting Started</Text>
              <Text style={styles.achievementDescription}>
                Complete your first session to unlock achievements!
              </Text>
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Keep up the great work 🍅</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    color: '#8E8E93',
    fontSize: 15,
  },
  errorText: {
    color: '#e74c3c',
    marginBottom: 16,
    fontSize: 15,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: '#e74c3c',
    borderRadius: 10,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },

  // Header
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 3,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
  },

  // Time Range
  timeRangeWrapper: {
    paddingVertical: 4,
    marginBottom: 4,
  },
  timeRangeContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#e74c3c',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#3C3C43',
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: 'white',
    fontWeight: '600',
  },

  // Section labels
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.8,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 8,
  },

  // Generic card
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 20,
    overflow: 'hidden',
  },

  lockedWrapper: {
    marginHorizontal: 16,
  },

  // Stat grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginHorizontal: 16,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flex: 1,
    minWidth: '44%',
    gap: 4,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '700',
  },
  statTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C43',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#C7C7CC',
  },

  // Chart
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
  },
  chartItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  chartBarTrack: {
    height: 100,
    justifyContent: 'flex-end',
    width: '100%',
    alignItems: 'center',
  },
  chartBar: {
    width: 22,
  },
  chartLabel: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 6,
    fontWeight: '500',
  },
  chartLabelToday: {
    color: '#e74c3c',
    fontWeight: '700',
  },
  chartValue: {
    fontSize: 11,
    color: '#3C3C43',
    fontWeight: '600',
    height: 16,
  },

  // Session history
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholderText: {
    fontSize: 14,
    color: '#8E8E93',
    fontStyle: 'italic',
    flex: 1,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#E8F5E8',
    gap: 4,
  },
  exportButtonText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '600',
  },

  // Achievements
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  achievementDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
    marginBottom: 12,
    paddingBottom: 12,
  },
  achievementIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  achievementEmoji: {
    fontSize: 22,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  achievementDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },

  // Footer
  footer: {
    alignItems: 'center',
    paddingTop: 28,
  },
  footerText: {
    fontSize: 14,
    color: '#C7C7CC',
  },
});
