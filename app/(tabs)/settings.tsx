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
import { useAuth } from '../../src/providers/auth';

export default function Settings() {
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    // Initialize default settings
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
    // Simplified for now - you can implement Firebase update logic here
    setSettings(prev => ({ ...prev, [key]: value }));
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
    value
  }: {
    title: string;
    description: string;
    settingKey: string;
    value: boolean;
  }) => (
    <View style={styles.settingItem}>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => handleSettingChange(settingKey, newValue)}
        trackColor={{ false: '#e0e0e0', true: '#e74c3c' }}
        thumbColor={value ? '#ffffff' : '#f4f3f4'}
        disabled={false}
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
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          {user?.photoURL ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.displayName?.charAt(0).toUpperCase() || '👤'}
              </Text>
            </View>
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={24} color="#666" />
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user?.displayName || 'Anonymous'}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Customize your Pomodoro experience</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <SettingItem
          title="Enable Notifications"
          description="Get notified when sessions complete"
          settingKey="notifications"
          value={settings?.notifications ?? true}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Auto-Start</Text>
        
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
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        
        <TouchableOpacity style={[styles.button, styles.signOutButton]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="white" />
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Text style={styles.buttonText}>Reset All Settings</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Pomodoro Timer v1.0.0</Text>
        <Text style={styles.footerText}>Built with React Native & Expo + Firebase</Text>
        <Text style={styles.footerText}>User: {user?.uid?.slice(0, 8)}...</Text>
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
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingText: {
    flex: 1,
    marginRight: 16,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  button: {
    backgroundColor: '#e74c3c',
    marginHorizontal: 24,
    marginVertical: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  signOutButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 20,
  },
  footerText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 4,
  },
});