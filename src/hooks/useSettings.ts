import { useState, useEffect } from 'react';
import { settingsManager, ValidationError, CustomPreset } from '../services/settingsManager';
import { UserSettings } from '../types';
import { useAuth } from '../providers/auth';

export interface UseSettingsReturn {
  settings: UserSettings | null;
  loading: boolean;
  error: string | null;
  updateSettings: (updates: Partial<UserSettings>) => Promise<ValidationError[]>;
  addCustomPreset: (preset: Omit<CustomPreset, 'id' | 'createdAt'>) => Promise<string>;
  removeCustomPreset: (presetId: string) => Promise<void>;
  updateCustomPreset: (presetId: string, updates: Partial<CustomPreset>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const useSettings = (): UseSettingsReturn => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load settings when user changes
  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const userSettings = await settingsManager.loadSettings(user.uid);
      setSettings(userSettings);
    } catch (err) {
      console.error('Error loading settings:', err);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<UserSettings>): Promise<ValidationError[]> => {
    if (!user) return [{ field: 'user', message: 'User not authenticated' }];

    try {
      setError(null);
      
      const validationErrors = await settingsManager.saveSettings(user.uid, updates);
      
      if (validationErrors.length === 0) {
        // Update local state with successful changes
        setSettings(current => current ? { ...current, ...updates } : null);
      }
      
      return validationErrors;
    } catch (err) {
      console.error('Error updating settings:', err);
      setError('Failed to update settings');
      return [{ field: 'general', message: 'Failed to save settings' }];
    }
  };

  const addCustomPreset = async (preset: Omit<CustomPreset, 'id' | 'createdAt'>): Promise<string> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      
      const presetId = await settingsManager.addCustomPreset(user.uid, preset);
      
      // Refresh settings to get updated presets
      await loadSettings();
      
      return presetId;
    } catch (err) {
      console.error('Error adding custom preset:', err);
      setError('Failed to add custom preset');
      throw err;
    }
  };

  const removeCustomPreset = async (presetId: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      
      await settingsManager.removeCustomPreset(user.uid, presetId);
      
      // Update local state
      setSettings(current => {
        if (!current) return null;
        
        const { [presetId]: removed, ...remainingPresets } = current.customPresets;
        return {
          ...current,
          customPresets: remainingPresets
        };
      });
    } catch (err) {
      console.error('Error removing custom preset:', err);
      setError('Failed to remove custom preset');
      throw err;
    }
  };

  const updateCustomPreset = async (presetId: string, updates: Partial<CustomPreset>): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      
      await settingsManager.updateCustomPreset(user.uid, presetId, updates);
      
      // Update local state
      setSettings(current => {
        if (!current || !current.customPresets[presetId]) return current;
        
        return {
          ...current,
          customPresets: {
            ...current.customPresets,
            [presetId]: {
              ...current.customPresets[presetId],
              ...updates
            }
          }
        };
      });
    } catch (err) {
      console.error('Error updating custom preset:', err);
      setError('Failed to update custom preset');
      throw err;
    }
  };

  const resetToDefaults = async (): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      
      await settingsManager.resetToDefaults(user.uid);
      await loadSettings(); // Reload to get fresh defaults
    } catch (err) {
      console.error('Error resetting to defaults:', err);
      setError('Failed to reset settings');
      throw err;
    }
  };

  const refresh = async (): Promise<void> => {
    settingsManager.clearCache();
    await loadSettings();
  };

  return {
    settings,
    loading,
    error,
    updateSettings,
    addCustomPreset,
    removeCustomPreset,
    updateCustomPreset,
    resetToDefaults,
    refresh
  };
};