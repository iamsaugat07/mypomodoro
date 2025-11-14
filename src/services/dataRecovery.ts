import { db, collection, query, where, getDocs, doc, getDoc, setDoc, writeBatch } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dataValidator } from './dataValidator';
import { SessionData } from './sessionManager';
import { UserSettings } from '../types';

export interface RecoveryReport {
  totalRecords: number;
  validRecords: number;
  fixedRecords: number;
  removedRecords: number;
  errors: string[];
}

export class DataRecoveryService {
  
  // Validate and fix all user sessions
  async validateAndFixUserSessions(userId: string): Promise<RecoveryReport> {
    const report: RecoveryReport = {
      totalRecords: 0,
      validRecords: 0,
      fixedRecords: 0,
      removedRecords: 0,
      errors: []
    };

    try {
      // Get all user sessions
      const sessionsCol = collection(db, 'sessions');
      const sessionsQuery = query(sessionsCol, where('userId', '==', userId));

      const snapshot = await getDocs(sessionsQuery);
      report.totalRecords = snapshot.size;

      if (snapshot.empty) {
        return report;
      }

      const batch = writeBatch(db);
      let batchOperations = 0;

      for (const docSnapshot of snapshot.docs) {
        const sessionData = docSnapshot.data() as SessionData;
        const validation = dataValidator.validateSessionData(sessionData);

        if (validation.isValid) {
          report.validRecords++;
        } else if (validation.fixedData) {
          // Fix the data
          batch.update(docSnapshot.ref, validation.fixedData);
          report.fixedRecords++;
          batchOperations++;

          report.errors.push(`Fixed session ${sessionData.sessionId}: ${validation.errors.join(', ')}`);
        } else {
          // Data is too corrupted, remove it
          batch.delete(docSnapshot.ref);
          report.removedRecords++;
          batchOperations++;

          report.errors.push(`Removed corrupted session ${sessionData.sessionId}`);
        }

        // Firestore batch limit is 500 operations
        if (batchOperations >= 450) {
          await batch.commit();
          batchOperations = 0;
        }
      }

      // Commit remaining operations
      if (batchOperations > 0) {
        await batch.commit();
      }

      console.log(`Session validation complete: ${report.fixedRecords} fixed, ${report.removedRecords} removed`);

    } catch (error) {
      console.error('Error validating user sessions:', error);
      report.errors.push(`Validation failed: ${error}`);
    }

    return report;
  }
  
  // Backup user data locally before recovery
  async backupUserData(userId: string): Promise<boolean> {
    try {
      const timestamp = new Date().toISOString();

      // Backup sessions
      const sessionsCol = collection(db, 'sessions');
      const sessionsQuery = query(sessionsCol, where('userId', '==', userId));

      const sessionsSnapshot = await getDocs(sessionsQuery);
      const sessions = sessionsSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      }));

      // Backup user profile
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userRef);
      const userProfile = userSnapshot.exists() ? userSnapshot.data() : null;

      const backupData = {
        timestamp,
        userId,
        sessions,
        userProfile
      };

      await AsyncStorage.setItem(`backup_${userId}_${timestamp}`, JSON.stringify(backupData));

      console.log(`User data backed up: ${sessions.length} sessions`);
      return true;
    } catch (error) {
      console.error('Error backing up user data:', error);
      return false;
    }
  }
  
  // Restore user data from backup
  async restoreUserData(userId: string, backupTimestamp: string): Promise<boolean> {
    try {
      const backupKey = `backup_${userId}_${backupTimestamp}`;
      const backupData = await AsyncStorage.getItem(backupKey);

      if (!backupData) {
        console.error('Backup not found');
        return false;
      }

      const backup = JSON.parse(backupData);

      // Restore sessions
      if (backup.sessions && backup.sessions.length > 0) {
        const batch = writeBatch(db);

        for (const session of backup.sessions) {
          const { id, ...sessionData } = session;
          const docRef = doc(db, 'sessions', id);
          batch.set(docRef, sessionData);
        }

        await batch.commit();
        console.log(`Restored ${backup.sessions.length} sessions`);
      }

      // Restore user profile
      if (backup.userProfile) {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, backup.userProfile);
        console.log('User profile restored');
      }

      return true;
    } catch (error) {
      console.error('Error restoring user data:', error);
      return false;
    }
  }
  
  // List available backups for a user
  async listBackups(userId: string): Promise<string[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const backupKeys = keys.filter(key => key.startsWith(`backup_${userId}_`));
      
      return backupKeys.map(key => {
        const timestamp = key.replace(`backup_${userId}_`, '');
        return timestamp;
      }).sort().reverse(); // Most recent first
    } catch (error) {
      console.error('Error listing backups:', error);
      return [];
    }
  }
  
  // Clean old backups (keep last 5)
  async cleanOldBackups(userId: string): Promise<void> {
    try {
      const backups = await this.listBackups(userId);
      
      if (backups.length > 5) {
        const toDelete = backups.slice(5);
        
        for (const timestamp of toDelete) {
          const backupKey = `backup_${userId}_${timestamp}`;
          await AsyncStorage.removeItem(backupKey);
        }
        
        console.log(`Cleaned ${toDelete.length} old backups`);
      }
    } catch (error) {
      console.error('Error cleaning old backups:', error);
    }
  }
  
  // Validate and fix offline data integrity
  async validateOfflineData(): Promise<RecoveryReport> {
    const report: RecoveryReport = {
      totalRecords: 0,
      validRecords: 0,
      fixedRecords: 0,
      removedRecords: 0,
      errors: []
    };
    
    try {
      // Check offline session queue
      const offlineQueue = await AsyncStorage.getItem('offlineQueue');
      if (offlineQueue) {
        const sessions: SessionData[] = JSON.parse(offlineQueue);
        report.totalRecords = sessions.length;
        
        const validSessions: SessionData[] = [];
        
        for (const session of sessions) {
          const validation = dataValidator.validateSessionData(session);
          
          if (validation.isValid) {
            validSessions.push(session);
            report.validRecords++;
          } else if (validation.fixedData) {
            validSessions.push(validation.fixedData);
            report.fixedRecords++;
            report.errors.push(`Fixed offline session: ${validation.errors.join(', ')}`);
          } else {
            report.removedRecords++;
            report.errors.push(`Removed corrupted offline session: ${session.sessionId}`);
          }
        }
        
        // Save cleaned queue
        await AsyncStorage.setItem('offlineQueue', JSON.stringify(validSessions));
      }
      
      // Check cached settings
      const cachedSettings = await AsyncStorage.getItem('userSettings');
      if (cachedSettings) {
        const settings: UserSettings = JSON.parse(cachedSettings);
        const validation = dataValidator.validateUserSettings(settings);
        
        if (!validation.isValid && validation.fixedData) {
          await AsyncStorage.setItem('userSettings', JSON.stringify(validation.fixedData));
          report.errors.push(`Fixed cached settings: ${validation.errors.join(', ')}`);
        }
      }
      
    } catch (error) {
      console.error('Error validating offline data:', error);
      report.errors.push(`Offline validation failed: ${error}`);
    }
    
    return report;
  }
  
  // Emergency data recovery - attempt to recover from all possible sources
  async emergencyDataRecovery(userId: string): Promise<RecoveryReport> {
    console.log('Starting emergency data recovery...');
    
    const report: RecoveryReport = {
      totalRecords: 0,
      validRecords: 0,
      fixedRecords: 0,
      removedRecords: 0,
      errors: []
    };
    
    try {
      // 1. Backup existing data first
      const backupSuccessful = await this.backupUserData(userId);
      if (!backupSuccessful) {
        report.errors.push('Failed to create backup before recovery');
      }
      
      // 2. Validate and fix online data
      const onlineReport = await this.validateAndFixUserSessions(userId);
      report.totalRecords += onlineReport.totalRecords;
      report.validRecords += onlineReport.validRecords;
      report.fixedRecords += onlineReport.fixedRecords;
      report.removedRecords += onlineReport.removedRecords;
      report.errors.push(...onlineReport.errors);
      
      // 3. Validate and fix offline data
      const offlineReport = await this.validateOfflineData();
      report.totalRecords += offlineReport.totalRecords;
      report.validRecords += offlineReport.validRecords;
      report.fixedRecords += offlineReport.fixedRecords;
      report.removedRecords += offlineReport.removedRecords;
      report.errors.push(...offlineReport.errors);
      
      // 4. Clean old backups
      await this.cleanOldBackups(userId);
      
      console.log('Emergency data recovery completed:', report);
      
    } catch (error) {
      console.error('Emergency recovery failed:', error);
      report.errors.push(`Emergency recovery failed: ${error}`);
    }
    
    return report;
  }
}

export const dataRecoveryService = new DataRecoveryService();