import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserSettings, TimerPreset } from '../types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface CustomPreset extends TimerPreset {
  id: string;
  name: string;
  createdAt: Date;
  isDefault: boolean;
}

class SettingsManager {
  private cachedSettings: UserSettings | null = null;
  private offlineChanges: Partial<UserSettings>[] = [];

  // Default settings with validation
  private readonly DEFAULT_SETTINGS: UserSettings = {
    notifications: true,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    defaultWorkDuration: 25,
    defaultBreakDuration: 5,
    defaultLongBreakDuration: 15,
    customPresets: {}
  };

  // Load user settings
  async loadSettings(userId: string): Promise<UserSettings> {
    try {
      // Try cache first
      if (this.cachedSettings) {
        return this.cachedSettings;
      }

      // Try Firebase
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const settings = userData.settings || this.DEFAULT_SETTINGS;
        
        // Validate and merge with defaults
        const validatedSettings = this.validateAndMergeSettings(settings);
        this.cachedSettings = validatedSettings;
        
        // Cache locally
        await this.cacheSettingsLocally(validatedSettings);
        return validatedSettings;
      }

      return this.DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Error loading settings:', error);
      
      // Try local cache as fallback
      const cached = await this.getCachedSettings();
      return cached || this.DEFAULT_SETTINGS;
    }
  }

  // Save settings with validation
  async saveSettings(userId: string, settings: Partial<UserSettings>): Promise<ValidationError[]> {
    const errors = this.validateSettings(settings);
    if (errors.length > 0) {
      return errors;
    }

    try {
      const userRef = doc(db, 'users', userId);
      const currentSettings = this.cachedSettings || this.DEFAULT_SETTINGS;
      const updatedSettings = { ...currentSettings, ...settings };

      await updateDoc(userRef, {
        settings: updatedSettings,
        lastUpdated: new Date()
      });

      // Update cache
      this.cachedSettings = updatedSettings;
      await this.cacheSettingsLocally(updatedSettings);

      return []; // No errors
    } catch (error) {
      console.error('Error saving settings:', error);
      
      // Queue for offline
      await this.queueSettingsForOffline(settings);
      throw error;
    }
  }

  // Custom preset management
  async addCustomPreset(userId: string, preset: Omit<CustomPreset, 'id' | 'createdAt'>): Promise<string> {
    const errors = this.validatePreset(preset);
    if (errors.length > 0) {
      throw new Error(`Invalid preset: ${errors.map(e => e.message).join(', ')}`);
    }

    const presetId = `preset_${Date.now()}`;
    const customPreset: CustomPreset = {
      ...preset,
      id: presetId,
      createdAt: new Date(),
      isDefault: false
    };

    const currentSettings = this.cachedSettings || await this.loadSettings(userId);
    const updatedSettings: UserSettings = {
      ...currentSettings,
      customPresets: {
        ...currentSettings.customPresets,
        [presetId]: customPreset
      }
    };

    await this.saveSettings(userId, { customPresets: updatedSettings.customPresets });
    return presetId;
  }

  async removeCustomPreset(userId: string, presetId: string): Promise<void> {
    const currentSettings = this.cachedSettings || await this.loadSettings(userId);
    const { [presetId]: removed, ...remainingPresets } = currentSettings.customPresets;
    
    await this.saveSettings(userId, { customPresets: remainingPresets });
  }

  async updateCustomPreset(userId: string, presetId: string, updates: Partial<CustomPreset>): Promise<void> {
    const currentSettings = this.cachedSettings || await this.loadSettings(userId);
    const existingPreset = currentSettings.customPresets[presetId];
    
    if (!existingPreset) {
      throw new Error('Preset not found');
    }

    const errors = this.validatePreset({ ...existingPreset, ...updates });
    if (errors.length > 0) {
      throw new Error(`Invalid preset: ${errors.map(e => e.message).join(', ')}`);
    }

    const updatedPreset = { ...existingPreset, ...updates };
    const updatedSettings: UserSettings = {
      ...currentSettings,
      customPresets: {
        ...currentSettings.customPresets,
        [presetId]: updatedPreset
      }
    };

    await this.saveSettings(userId, { customPresets: updatedSettings.customPresets });
  }

  // Validation methods
  private validateSettings(settings: Partial<UserSettings>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (settings.defaultWorkDuration !== undefined) {
      if (settings.defaultWorkDuration < 1 || settings.defaultWorkDuration > 180) {
        errors.push({ field: 'defaultWorkDuration', message: 'Work duration must be between 1-180 minutes' });
      }
    }

    if (settings.defaultBreakDuration !== undefined) {
      if (settings.defaultBreakDuration < 1 || settings.defaultBreakDuration > 60) {
        errors.push({ field: 'defaultBreakDuration', message: 'Break duration must be between 1-60 minutes' });
      }
    }

    if (settings.defaultLongBreakDuration !== undefined) {
      if (settings.defaultLongBreakDuration < 1 || settings.defaultLongBreakDuration > 120) {
        errors.push({ field: 'defaultLongBreakDuration', message: 'Long break duration must be between 1-120 minutes' });
      }
    }

    return errors;
  }

  private validatePreset(preset: Partial<TimerPreset & { name?: string }>): ValidationError[] {
    const errors: ValidationError[] = [];

    if (preset.name !== undefined) {
      if (!preset.name.trim()) {
        errors.push({ field: 'name', message: 'Preset name cannot be empty' });
      } else if (preset.name.length > 50) {
        errors.push({ field: 'name', message: 'Preset name must be less than 50 characters' });
      }
    }

    if (preset.work !== undefined) {
      if (preset.work < 1 || preset.work > 180) {
        errors.push({ field: 'work', message: 'Work duration must be between 1-180 minutes' });
      }
    }

    if (preset.break !== undefined) {
      if (preset.break < 1 || preset.break > 60) {
        errors.push({ field: 'break', message: 'Break duration must be between 1-60 minutes' });
      }
    }

    if (preset.longBreak !== undefined) {
      if (preset.longBreak < 1 || preset.longBreak > 120) {
        errors.push({ field: 'longBreak', message: 'Long break duration must be between 1-120 minutes' });
      }
    }

    return errors;
  }

  private validateAndMergeSettings(settings: any): UserSettings {
    const validated: UserSettings = { ...this.DEFAULT_SETTINGS };

    // Validate each field and use default if invalid
    validated.notifications = typeof settings.notifications === 'boolean' 
      ? settings.notifications : this.DEFAULT_SETTINGS.notifications;

    validated.autoStartBreaks = typeof settings.autoStartBreaks === 'boolean'
      ? settings.autoStartBreaks : this.DEFAULT_SETTINGS.autoStartBreaks;

    validated.autoStartPomodoros = typeof settings.autoStartPomodoros === 'boolean'
      ? settings.autoStartPomodoros : this.DEFAULT_SETTINGS.autoStartPomodoros;

    validated.defaultWorkDuration = this.validateDuration(
      settings.defaultWorkDuration, 1, 180, this.DEFAULT_SETTINGS.defaultWorkDuration
    );

    validated.defaultBreakDuration = this.validateDuration(
      settings.defaultBreakDuration, 1, 60, this.DEFAULT_SETTINGS.defaultBreakDuration
    );

    validated.defaultLongBreakDuration = this.validateDuration(
      settings.defaultLongBreakDuration, 1, 120, this.DEFAULT_SETTINGS.defaultLongBreakDuration
    );

    validated.customPresets = settings.customPresets && typeof settings.customPresets === 'object'
      ? settings.customPresets : {};

    return validated;
  }

  private validateDuration(value: any, min: number, max: number, defaultValue: number): number {
    const num = Number(value);
    return !isNaN(num) && num >= min && num <= max ? num : defaultValue;
  }

  // Cache management
  private async cacheSettingsLocally(settings: UserSettings): Promise<void> {
    try {
      await AsyncStorage.setItem('userSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error caching settings:', error);
    }
  }

  private async getCachedSettings(): Promise<UserSettings | null> {
    try {
      const cached = await AsyncStorage.getItem('userSettings');
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Error getting cached settings:', error);
      return null;
    }
  }

  // Offline support
  private async queueSettingsForOffline(settings: Partial<UserSettings>): Promise<void> {
    try {
      this.offlineChanges.push(settings);
      await AsyncStorage.setItem('offlineSettingsChanges', JSON.stringify(this.offlineChanges));
    } catch (error) {
      console.error('Error queuing settings for offline:', error);
    }
  }

  async processOfflineChanges(userId: string): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('offlineSettingsChanges');
      if (stored) {
        const changes: Partial<UserSettings>[] = JSON.parse(stored);
        
        // Merge all changes
        const mergedChanges = changes.reduce((acc, change) => ({ ...acc, ...change }), {});
        
        // Save to Firebase
        await this.saveSettings(userId, mergedChanges);
        
        // Clear offline queue
        this.offlineChanges = [];
        await AsyncStorage.removeItem('offlineSettingsChanges');
        
        console.log(`Processed ${changes.length} offline settings changes`);
      }
    } catch (error) {
      console.error('Error processing offline settings changes:', error);
    }
  }

  // Reset to defaults
  async resetToDefaults(userId: string): Promise<void> {
    await this.saveSettings(userId, this.DEFAULT_SETTINGS);
  }

  // Clear cache
  clearCache(): void {
    this.cachedSettings = null;
  }
}

export const settingsManager = new SettingsManager();