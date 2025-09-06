import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/providers/auth';
import { useStatistics } from '../../src/hooks/useStatistics';
import { useSubscription } from '../../src/providers/subscription';
import { StatisticsLockedCard, SessionHistoryLockedCard, DataExportLockedCard } from '../components/premium/FeatureLockedCard';
import { PremiumBadge } from '../components/premium/PremiumBadge';
import { statisticsManager } from '../../src/services/statisticsManager';

const { width } = Dimensions.get('window');

type TimeRange = 'today' | 'week' | 'month' | 'year' | 'all-time';

export default function Stats() {
  const { user } = useAuth();
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
          { text: 'Upgrade', onPress: () => {/* Will be handled by locked cards */} }
        ]
      );
      return;
    }
    
    setSelectedTimeRange(timeRange);
  };

  // Transform weekly stats for chart display
  const chartData = React.useMemo(() => {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    if (!statistics?.weeklyStats) {
      return dayNames.map(day => ({ day, pomodoros: 0 }));
    }

    return statistics.weeklyStats.map((dayStats) => {
      // Parse the date and get the correct day name
      const date = new Date(dayStats.date);
      const dayName = dayNames[date.getDay()]; // getDay() returns 0-6 (Sun-Sat)
      
      return {
        day: dayName,
        pomodoros: dayStats.workSessions || 0
      };
    });
  }, [statistics?.weeklyStats]);

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={{ marginTop: 16, color: '#666' }}>Loading your stats...</Text>
      </View>
    );
  }

  if (error && !statistics) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#e74c3c', marginBottom: 16 }}>Failed to load statistics</Text>
        <TouchableOpacity onPress={handleRefresh} style={{ padding: 12, backgroundColor: '#e74c3c', borderRadius: 8 }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const StatCard = ({ 
    title, 
    value, 
    subtitle, 
    color = '#e74c3c' 
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    color?: string;
  }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
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
      { key: 'all-time', label: 'All Time' }
    ];

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.timeRangeContainer}
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
                isLocked && styles.timeRangeButtonLocked
              ]}
              onPress={() => handleTimeRangeChange(range.key)}
              disabled={isLocked && !isSelected}
            >
              <Text style={[
                styles.timeRangeText,
                isSelected && styles.timeRangeTextActive,
                isLocked && styles.timeRangeTextLocked
              ]}>
                {range.label}
              </Text>
              {isLocked && (
                <Ionicons name="lock-closed" size={12} color="#999" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const WeeklyChart = () => {
    const maxPomodoros = Math.max(...chartData.map(d => d.pomodoros), 1); // Ensure minimum of 1
    const todayDay = new Date().toLocaleDateString('en', { weekday: 'short' });
    
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>This Week</Text>
        <View style={styles.chart}>
          {chartData.map((day, index) => {
            const height = Math.max((day.pomodoros / maxPomodoros) * 120, 4);
            const isToday = day.day === todayDay;
            
            return (
              <View key={index} style={styles.chartItem}>
                <View 
                  style={[
                    styles.chartBar, 
                    { 
                      height,
                      backgroundColor: isToday ? '#e74c3c' : '#ddd'
                    }
                  ]} 
                />
                <Text style={styles.chartLabel}>{day.day}</Text>
                <Text style={styles.chartValue}>{day.pomodoros}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Statistics</Text>
            {isPremium && <PremiumBadge variant="small" />}
          </View>
          <Text style={styles.headerSubtitle}>Track your productivity</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={{ padding: 8 }}>
          <Text style={{ color: '#e74c3c', fontWeight: '600' }}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Time Range Selector */}
      <View style={styles.section}>
        <TimeRangeSelector />
      </View>

      {/* Show locked cards for premium features */}
      {!isPremium && (selectedTimeRange === 'month' || selectedTimeRange === 'year' || selectedTimeRange === 'all-time') && (
        <View style={styles.section}>
          <StatisticsLockedCard 
            timeRange={selectedTimeRange.charAt(0).toUpperCase() + selectedTimeRange.slice(1)}
            style={{ marginBottom: 0 }}
          />
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Pomodoros"
            value={statistics?.todayStats?.workSessions || 0}
            subtitle="completed"
            color="#e74c3c"
          />
          <StatCard
            title="Focus Time"
            value={formatTime(statistics?.todayStats?.totalFocusMinutes || 0)}
            subtitle="total"
            color="#2ecc71"
          />
          <StatCard
            title="Breaks"
            value={statistics?.todayStats?.breakSessions || 0}
            subtitle="taken"
            color="#3498db"
          />
          <StatCard
            title="Current Streak"
            value={statistics?.currentStreak || 0}
            subtitle="days"
            color="#f39c12"
          />
        </View>
      </View>

      <View style={styles.section}>
        <WeeklyChart />
      </View>

      {/* Session History Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Session History</Text>
          {isPremium && (
            <TouchableOpacity 
              style={styles.exportButton}
              onPress={() => {
                // Data export functionality for premium users
                Alert.alert(
                  'Export Data', 
                  'This feature will export your session data to CSV format.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Export CSV', onPress: () => {/* Implement export */} }
                  ]
                );
              }}
            >
              <Ionicons name="download" size={16} color="#4CAF50" />
              <Text style={styles.exportButtonText}>Export</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {!isPremium ? (
          <SessionHistoryLockedCard style={{ marginTop: 10 }} />
        ) : (
          <Text style={styles.placeholderText}>Recent sessions will appear here</Text>
        )}
        
        {/* Data export locked card for free users */}
        {!isPremium && (
          <DataExportLockedCard style={{ marginTop: 15 }} />
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        {statistics?.achievements && statistics.achievements.length > 0 ? (
          statistics.achievements.map((achievement) => (
            <View key={achievement.id} style={styles.achievement}>
              <View style={styles.achievementIcon}>
                <Text style={styles.achievementEmoji}>{achievement.icon}</Text>
              </View>
              <View style={styles.achievementText}>
                <Text style={styles.achievementTitle}>{achievement.title}</Text>
                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.achievement}>
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
        <Text style={styles.footerText}>Keep up the great work! 🍅</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: 'white',
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  timeRangeContainer: {
    paddingVertical: 10,
  },
  timeRangeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#e74c3c',
  },
  timeRangeButtonLocked: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeRangeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  timeRangeTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  timeRangeTextLocked: {
    color: '#999',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  placeholderText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 20,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    flex: 1,
    minWidth: (width - 80) / 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  chartContainer: {
    marginTop: 8,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
  },
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 160,
    paddingBottom: 20,
  },
  chartItem: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    borderRadius: 4,
    marginBottom: 8,
  },
  chartLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  chartValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
  },
  achievement: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 12,
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  achievementEmoji: {
    fontSize: 24,
  },
  achievementText: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});