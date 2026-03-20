import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/providers/auth';
import { ManageSubscription } from '../components/subscription/ManageSubscription';
import { UserSettings } from '../../src/types';

export default function Settings() {
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setSettings({
      notifications: true,
      autoStartBreaks: false,
      autoStartPomodoros: false,
      defaultWorkDuration: 25,
      defaultBreakDuration: 5,
      defaultLongBreakDuration: 15,
      customPresets: {}
    });
  }, []);

  const handleSettingChange = async (key: string, value: boolean) => {
    setSettings(prev => prev ? { ...prev, [key]: value } : null);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out');
            }
          },
        },
      ]
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setSettings({
              notifications: true,
              autoStartBreaks: false,
              autoStartPomodoros: false,
              defaultWorkDuration: 25,
              defaultBreakDuration: 5,
              defaultLongBreakDuration: 15,
              customPresets: {}
            });
            Alert.alert('Settings Reset', 'All settings have been reset to default values.');
          },
        },
      ]
    );
  };

  const SettingItem = ({
    title,
    description,
    settingKey,
    value,
    isLast = false,
  }: {
    title: string;
    description: string;
    settingKey: string;
    value: boolean;
    isLast?: boolean;
  }) => (
    <View style={[styles.settingItem, isLast && styles.settingItemLast]}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => handleSettingChange(settingKey, newValue)}
        trackColor={{ false: '#e0e0e0', true: '#e74c3c' }}
        thumbColor="#ffffff"
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#e74c3c" />
        <Text style={{ marginTop: 16, color: '#666' }}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            {user?.displayName ? (
              <Text style={styles.avatarText}>
                {user.displayName.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person" size={26} color="#999" />
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.displayName || 'Anonymous'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>

        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize your Pomodoro experience</Text>
      </View>

      {/* Notifications */}
      <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
      <View style={styles.card}>
        <SettingItem
          title="Enable Notifications"
          description="Get notified when sessions complete"
          settingKey="notifications"
          value={settings?.notifications ?? true}
          isLast
        />
      </View>

      {/* Subscription */}
      <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
      <ManageSubscription showTitle={false} style={styles.subscriptionCard} />

      {/* Auto-Start */}
      <Text style={styles.sectionLabel}>AUTO-START</Text>
      <View style={styles.card}>
        <SettingItem
          title="Auto-start Breaks"
          description="Automatically start break timers"
          settingKey="autoStartBreaks"
          value={settings?.autoStartBreaks ?? false}
        />
        <SettingItem
          title="Auto-start Pomodoros"
          description="Automatically start work sessions after breaks"
          settingKey="autoStartPomodoros"
          value={settings?.autoStartPomodoros ?? false}
          isLast
        />
      </View>

      {/* Account */}
      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.card}>
        <TouchableOpacity style={styles.actionRow} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
          <Text style={[styles.actionText, { color: '#e74c3c' }]}>Sign Out</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.actionRow} onPress={handleReset}>
          <Ionicons name="refresh-outline" size={20} color="#999" />
          <Text style={[styles.actionText, { color: '#999' }]}>Reset All Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Pomodoro Timer · v1.0.0</Text>
        <Text style={styles.footerText}>Built with React Native & Expo</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
    marginBottom: 8,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#e74c3c',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 14,
    color: '#8E8E93',
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 3,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.8,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  subscriptionCard: {
    marginHorizontal: 0,
    paddingHorizontal: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingText: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 13,
    color: '#8E8E93',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 15,
    gap: 12,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5EA',
    marginLeft: 48,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 32,
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: '#C7C7CC',
  },
});
