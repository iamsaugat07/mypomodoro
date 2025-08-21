import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../lib/context/AuthContext';
import { useTodayStats, useWeeklyStats } from '../../lib/hooks/useFirestore';

const { width } = Dimensions.get('window');

export default function Stats() {
  const { user } = useAuth();
  const { stats: todayStats, loading: todayLoading } = useTodayStats();
  const { weeklyStats, loading: weeklyLoading } = useWeeklyStats();

  // Transform weekly stats for chart display
  const chartData = React.useMemo(() => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const today = new Date();
    const chartStats = [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayData = weeklyStats.find(stat => stat.date === dateString);
      chartStats.push({
        day: days[date.getDay() === 0 ? 6 : date.getDay() - 1], // Adjust for Monday start
        pomodoros: dayData?.workSessions || 0
      });
    }

    return chartStats;
  }, [weeklyStats]);

  if (todayLoading && weeklyLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={{ marginTop: 16, color: '#666' }}>Loading your stats...</Text>
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
        <Text style={styles.headerTitle}>Statistics</Text>
        <Text style={styles.headerSubtitle}>Track your productivity</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Progress</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Pomodoros"
            value={todayStats?.workSessions || 0}
            subtitle="completed"
            color="#e74c3c"
          />
          <StatCard
            title="Focus Time"
            value={formatTime(todayStats?.totalFocusMinutes || 0)}
            subtitle="total"
            color="#2ecc71"
          />
          <StatCard
            title="Breaks"
            value={todayStats?.breakSessions || 0}
            subtitle="taken"
            color="#3498db"
          />
          <StatCard
            title="Best Streak"
            value={todayStats?.longestStreak || 0}
            subtitle="in a row"
            color="#f39c12"
          />
        </View>
      </View>

      <View style={styles.section}>
        <WeeklyChart />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievement}>
          <View style={styles.achievementIcon}>
            <Text style={styles.achievementEmoji}>🔥</Text>
          </View>
          <View style={styles.achievementText}>
            <Text style={styles.achievementTitle}>On Fire!</Text>
            <Text style={styles.achievementDescription}>
              Completed 5 pomodoros in a row
            </Text>
          </View>
        </View>
        
        <View style={styles.achievement}>
          <View style={styles.achievementIcon}>
            <Text style={styles.achievementEmoji}>⭐</Text>
          </View>
          <View style={styles.achievementText}>
            <Text style={styles.achievementTitle}>Daily Goal</Text>
            <Text style={styles.achievementDescription}>
              Reached your daily target of 8 pomodoros
            </Text>
          </View>
        </View>

        <View style={[styles.achievement, { opacity: 0.5 }]}>
          <View style={styles.achievementIcon}>
            <Text style={styles.achievementEmoji}>🏆</Text>
          </View>
          <View style={styles.achievementText}>
            <Text style={styles.achievementTitle}>Week Champion</Text>
            <Text style={styles.achievementDescription}>
              Complete 50 pomodoros this week (44/50)
            </Text>
          </View>
        </View>
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