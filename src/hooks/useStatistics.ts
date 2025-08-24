import { useState, useEffect } from 'react';
import { statisticsManager, UserStatistics } from '../services/statisticsManager';
import { useAuth } from '../providers/auth';

export interface UseStatisticsReturn {
  statistics: UserStatistics | null;
  loading: boolean;
  error: string | null;
  refreshStatistics: () => Promise<void>;
}

export const useStatistics = (): UseStatisticsReturn => {
  const { user } = useAuth();
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load statistics when user changes
  useEffect(() => {
    if (user) {
      loadStatistics();
      
      // Subscribe to real-time updates
      const unsubscribe = statisticsManager.subscribeToStatistics(
        user.uid,
        (stats) => {
          setStatistics(stats);
          setLoading(false);
          setError(null);
        }
      );
      
      return () => {
        unsubscribe();
      };
    } else {
      setStatistics(null);
      setLoading(false);
    }
  }, [user]);

  const loadStatistics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const userStats = await statisticsManager.getUserStatistics(user.uid);
      setStatistics(userStats);
    } catch (err) {
      console.error('Error loading statistics:', err);
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const refreshStatistics = async (): Promise<void> => {
    if (!user) return;
    
    try {
      setError(null);
      await statisticsManager.refreshStatistics(user.uid);
    } catch (err) {
      console.error('Error refreshing statistics:', err);
      setError('Failed to refresh statistics');
    }
  };

  return {
    statistics,
    loading,
    error,
    refreshStatistics
  };
};