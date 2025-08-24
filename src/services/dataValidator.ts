import { SessionData } from './sessionManager';
import { UserSettings } from '../types';
import { DailyStats, UserStatistics } from './statisticsManager';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  fixedData?: any;
}

export class DataValidator {
  
  // Validate session data
  validateSessionData(session: SessionData): ValidationResult {
    const errors: string[] = [];
    let fixedData = { ...session };
    
    // Required fields
    if (!session.sessionId) {
      errors.push('Session ID is missing');
    }
    
    if (!session.userId) {
      errors.push('User ID is missing');
    }
    
    if (!session.type || !['work', 'break', 'longBreak'].includes(session.type)) {
      errors.push('Invalid session type');
      fixedData.type = 'work'; // Default fallback
    }
    
    // Duration validation
    if (!session.plannedDuration || session.plannedDuration <= 0) {
      errors.push('Invalid planned duration');
      fixedData.plannedDuration = 25 * 60; // Default 25 minutes
    }
    
    if (session.actualDuration && session.actualDuration < 0) {
      errors.push('Invalid actual duration');
      fixedData.actualDuration = 0;
    }
    
    // Date validation
    if (!session.startTime) {
      errors.push('Start time is missing');
      fixedData.startTime = new Date();
    } else if (!(session.startTime instanceof Date) && typeof session.startTime !== 'string') {
      errors.push('Invalid start time format');
      fixedData.startTime = new Date();
    }
    
    // End time should be after start time if both exist
    if (session.endTime && session.startTime) {
      const startTime = new Date(session.startTime);
      const endTime = new Date(session.endTime);
      
      if (endTime < startTime) {
        errors.push('End time cannot be before start time');
        fixedData.endTime = new Date(startTime.getTime() + (session.plannedDuration * 1000));
      }
    }
    
    // Date string validation
    if (!session.date || !/^\d{4}-\d{2}-\d{2}$/.test(session.date)) {
      errors.push('Invalid date format');
      fixedData.date = new Date().toISOString().split('T')[0];
    }
    
    // Completed status validation
    if (typeof session.completed !== 'boolean') {
      fixedData.completed = false;
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      fixedData: errors.length > 0 ? fixedData : undefined
    };
  }
  
  // Validate user settings
  validateUserSettings(settings: UserSettings): ValidationResult {
    const errors: string[] = [];
    let fixedData = { ...settings };
    
    // Boolean validations
    if (typeof settings.notifications !== 'boolean') {
      errors.push('Invalid notifications setting');
      fixedData.notifications = true;
    }
    
    if (typeof settings.autoStartBreaks !== 'boolean') {
      errors.push('Invalid autoStartBreaks setting');
      fixedData.autoStartBreaks = false;
    }
    
    if (typeof settings.autoStartPomodoros !== 'boolean') {
      errors.push('Invalid autoStartPomodoros setting');
      fixedData.autoStartPomodoros = false;
    }
    
    // Duration validations with sensible ranges
    if (!this.isValidDuration(settings.defaultWorkDuration, 5, 180)) {
      errors.push('Invalid work duration (must be 5-180 minutes)');
      fixedData.defaultWorkDuration = 25;
    }
    
    if (!this.isValidDuration(settings.defaultBreakDuration, 1, 30)) {
      errors.push('Invalid break duration (must be 1-30 minutes)');
      fixedData.defaultBreakDuration = 5;
    }
    
    if (!this.isValidDuration(settings.defaultLongBreakDuration, 5, 60)) {
      errors.push('Invalid long break duration (must be 5-60 minutes)');
      fixedData.defaultLongBreakDuration = 15;
    }
    
    // Custom presets validation
    if (!settings.customPresets || typeof settings.customPresets !== 'object') {
      errors.push('Invalid custom presets');
      fixedData.customPresets = {};
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      fixedData: errors.length > 0 ? fixedData : undefined
    };
  }
  
  // Validate daily statistics
  validateDailyStats(stats: DailyStats): ValidationResult {
    const errors: string[] = [];
    let fixedData = { ...stats };
    
    if (!stats.date || !/^\d{4}-\d{2}-\d{2}$/.test(stats.date)) {
      errors.push('Invalid date format');
      fixedData.date = new Date().toISOString().split('T')[0];
    }
    
    // Ensure all numeric values are valid and non-negative
    const numericFields = [
      'workSessions', 
      'breakSessions', 
      'totalFocusMinutes', 
      'completedSessions', 
      'averageSessionLength'
    ];
    
    numericFields.forEach(field => {
      const value = (stats as any)[field];
      if (typeof value !== 'number' || value < 0 || !isFinite(value)) {
        errors.push(`Invalid ${field} value`);
        (fixedData as any)[field] = 0;
      }
    });
    
    // Logical validations
    if (fixedData.completedSessions < fixedData.workSessions + fixedData.breakSessions) {
      errors.push('Completed sessions cannot be less than total work + break sessions');
      fixedData.completedSessions = fixedData.workSessions + fixedData.breakSessions;
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      fixedData: errors.length > 0 ? fixedData : undefined
    };
  }
  
  // Validate user statistics
  validateUserStatistics(stats: UserStatistics): ValidationResult {
    const errors: string[] = [];
    let fixedData = { ...stats };
    
    // Validate numeric fields
    const numericFields = [
      'totalSessions',
      'totalFocusMinutes', 
      'currentStreak',
      'longestStreak',
      'averageSessionsPerDay',
      'averageFocusPerDay'
    ];
    
    numericFields.forEach(field => {
      const value = (stats as any)[field];
      if (typeof value !== 'number' || value < 0 || !isFinite(value)) {
        errors.push(`Invalid ${field} value`);
        (fixedData as any)[field] = 0;
      }
    });
    
    // Logical validations
    if (fixedData.currentStreak > fixedData.longestStreak) {
      errors.push('Current streak cannot be longer than longest streak');
      fixedData.longestStreak = fixedData.currentStreak;
    }
    
    // Validate today stats
    if (stats.todayStats) {
      const todayValidation = this.validateDailyStats(stats.todayStats);
      if (!todayValidation.isValid) {
        errors.push(...todayValidation.errors.map(e => `Today stats: ${e}`));
        if (todayValidation.fixedData) {
          fixedData.todayStats = todayValidation.fixedData;
        }
      }
    }
    
    // Validate weekly stats array
    if (!Array.isArray(stats.weeklyStats)) {
      errors.push('Weekly stats must be an array');
      fixedData.weeklyStats = [];
    } else {
      const validWeeklyStats = [];
      for (const dayStat of stats.weeklyStats) {
        const dayValidation = this.validateDailyStats(dayStat);
        if (dayValidation.isValid) {
          validWeeklyStats.push(dayStat);
        } else if (dayValidation.fixedData) {
          validWeeklyStats.push(dayValidation.fixedData);
          errors.push(...dayValidation.errors.map(e => `Weekly stats: ${e}`));
        }
      }
      fixedData.weeklyStats = validWeeklyStats;
    }
    
    // Validate achievements
    if (!Array.isArray(stats.achievements)) {
      errors.push('Achievements must be an array');
      fixedData.achievements = [];
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      fixedData: errors.length > 0 ? fixedData : undefined
    };
  }
  
  // Helper method to validate duration values
  private isValidDuration(value: any, min: number, max: number): boolean {
    return typeof value === 'number' && 
           value >= min && 
           value <= max && 
           Number.isInteger(value);
  }
  
  // Sanitize data by removing potentially harmful or invalid fields
  sanitizeData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }
    
    if (typeof data !== 'object') {
      return data;
    }
    
    const sanitized = Array.isArray(data) ? [] : {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip functions and undefined values
      if (typeof value === 'function' || value === undefined) {
        continue;
      }
      
      // Recursively sanitize nested objects
      if (typeof value === 'object' && value !== null) {
        (sanitized as any)[key] = this.sanitizeData(value);
      } else {
        (sanitized as any)[key] = value;
      }
    }
    
    return sanitized;
  }
  
  // Recover corrupted data with fallback defaults
  recoverSessionData(corruptedSession: any): SessionData {
    const defaultSession: SessionData = {
      sessionId: `recovery_${Date.now()}`,
      userId: '',
      type: 'work',
      plannedDuration: 25 * 60,
      actualDuration: 0,
      completed: false,
      startTime: new Date(),
      date: new Date().toISOString().split('T')[0]
    };
    
    // Merge valid fields from corrupted data
    const recovered = { ...defaultSession };
    
    if (corruptedSession.sessionId && typeof corruptedSession.sessionId === 'string') {
      recovered.sessionId = corruptedSession.sessionId;
    }
    
    if (corruptedSession.userId && typeof corruptedSession.userId === 'string') {
      recovered.userId = corruptedSession.userId;
    }
    
    if (['work', 'break', 'longBreak'].includes(corruptedSession.type)) {
      recovered.type = corruptedSession.type;
    }
    
    if (typeof corruptedSession.plannedDuration === 'number' && corruptedSession.plannedDuration > 0) {
      recovered.plannedDuration = corruptedSession.plannedDuration;
    }
    
    if (typeof corruptedSession.completed === 'boolean') {
      recovered.completed = corruptedSession.completed;
    }
    
    return recovered;
  }
}

export const dataValidator = new DataValidator();