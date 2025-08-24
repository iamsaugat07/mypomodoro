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
import { useAuth } from '../../src/providers/auth';
import { useStatistics } from '../../src/hooks/useStatistics';

const { width } = Dimensions.get('window');

export default function Stats() {
  const { user } = useAuth();
  const { statistics, loading, error, refreshStatistics } = useStatistics();

  const handleRefresh = async () => {
    try {
      await refreshStatistics();
    } catch (err) {
      Alert.alert('Error', 'Failed to refresh statistics');
    }
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
          <Text style={styles.headerTitle}>Statistics</Text>
          <Text style={styles.headerSubtitle}>Track your productivity</Text>
        </View>
        <TouchableOpacity onPress={handleRefresh} style={{ padding: 8 }}>
          <Text style={{ color: '#e74c3c', fontWeight: '600' }}>Refresh</Text>
        </TouchableOpacity>
      </View>

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
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
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