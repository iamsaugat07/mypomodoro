import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import subscriptionManager, { SubscriptionInfo, SubscriptionStatus } from '../services/subscriptionManager';
import premiumGate, { PremiumFeature, FeatureLimit } from '../services/premiumGate';

interface SubscriptionContextType {
  // Subscription state
  subscriptionInfo: SubscriptionInfo | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Quick access methods
  isPremium: boolean;
  isFree: boolean;
  isExpired: boolean;

  // Feature access helpers
  canCreateCustomPreset: (currentCount: number) => PremiumFeature;
  canAccessSessionHistory: (daysBack: number) => PremiumFeature;
  canAccessStatistics: (timeRange: 'today' | 'week' | 'month' | 'year' | 'all-time') => PremiumFeature;
  canExportData: () => PremiumFeature;

  // Limitation checkers
  checkCustomPresetLimit: (currentCount: number) => FeatureLimit;
  checkSessionHistoryLimit: (daysBack?: number) => FeatureLimit;
  checkStatisticsLimit: (timeRange: 'today' | 'week' | 'month' | 'year' | 'all-time') => FeatureLimit;

  // Purchase actions
  showPurchaseFlow: () => Promise<boolean>;
  showRestoreFlow: () => Promise<boolean>;
  refreshSubscriptionStatus: () => Promise<void>;

  // UI helpers
  shouldShowUpgradePrompts: boolean;
  getUpgradeCallToAction: () => string;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
  children: ReactNode;
  revenueCatApiKey: string;
}

export const SubscriptionProvider = ({
  children,
  revenueCatApiKey
}: SubscriptionProviderProps) => {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    initializeSubscription();
  }, [revenueCatApiKey]);

  const initializeSubscription = async () => {
    try {
      setIsLoading(true);
      
      // Initialize Revenue Cat
      await subscriptionManager.initialize(revenueCatApiKey);
      
      // Set up subscription listener
      const unsubscribe = subscriptionManager.addListener((info: SubscriptionInfo) => {
        setSubscriptionInfo(info);
        setIsLoading(false);
      });

      // Get initial subscription status
      const initialInfo = await subscriptionManager.refreshSubscriptionStatus();
      setSubscriptionInfo(initialInfo);
      setIsInitialized(true);
      setIsLoading(false);

      // Cleanup listener on unmount
      return unsubscribe;
    } catch (error) {
      console.error('Failed to initialize subscription provider:', error);
      
      // Set default free state if initialization fails
      const defaultInfo: SubscriptionInfo = { status: 'free', platform: 'android' };
      setSubscriptionInfo(defaultInfo);
      setIsInitialized(true);
      setIsLoading(false);
    }
  };

  const refreshSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      const info = await subscriptionManager.refreshSubscriptionStatus();
      setSubscriptionInfo(info);
    } catch (error) {
      console.error('Failed to refresh subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const showPurchaseFlow = async (): Promise<boolean> => {
    const success = await subscriptionManager.showPurchaseFlow();
    if (success) {
      // Refresh subscription status after successful purchase
      await refreshSubscriptionStatus();
    }
    return success;
  };

  const showRestoreFlow = async (): Promise<boolean> => {
    const success = await subscriptionManager.showRestoreFlow();
    if (success) {
      // Refresh subscription status after successful restore
      await refreshSubscriptionStatus();
    }
    return success;
  };

  // Derived values
  const isPremium = subscriptionInfo?.status === 'premium';
  const isFree = subscriptionInfo?.status === 'free';
  const isExpired = subscriptionInfo?.status === 'expired';
  const shouldShowUpgradePrompts = premiumGate.shouldShowUpgradePrompts();

  const contextValue: SubscriptionContextType = {
    // State
    subscriptionInfo,
    isLoading,
    isInitialized,

    // Quick access
    isPremium,
    isFree,
    isExpired,

    // Feature access helpers
    canCreateCustomPreset: premiumGate.canCreateCustomPreset.bind(premiumGate),
    canAccessSessionHistory: premiumGate.canAccessSessionHistory.bind(premiumGate),
    canAccessStatistics: premiumGate.canAccessStatistics.bind(premiumGate),
    canExportData: premiumGate.canExportData.bind(premiumGate),

    // Limitation checkers
    checkCustomPresetLimit: premiumGate.checkCustomPresetLimit.bind(premiumGate),
    checkSessionHistoryLimit: premiumGate.checkSessionHistoryLimit.bind(premiumGate),
    checkStatisticsLimit: premiumGate.checkStatisticsLimit.bind(premiumGate),

    // Actions
    showPurchaseFlow,
    showRestoreFlow,
    refreshSubscriptionStatus,

    // UI helpers
    shouldShowUpgradePrompts,
    getUpgradeCallToAction: premiumGate.getUpgradeCallToAction.bind(premiumGate),
  };

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Hook for easy subscription status checking
export const useSubscriptionStatus = (): {
  isPremium: boolean;
  isFree: boolean;
  isExpired: boolean;
  isLoading: boolean;
  status: SubscriptionStatus | null;
} => {
  const { isPremium, isFree, isExpired, isLoading, subscriptionInfo } = useSubscription();
  
  return {
    isPremium,
    isFree,
    isExpired,
    isLoading,
    status: subscriptionInfo?.status || null
  };
};

// Hook for feature access checking with loading states
export const useFeatureAccess = () => {
  const subscription = useSubscription();
  
  return {
    // Custom presets
    canCreatePreset: (count: number) => subscription.canCreateCustomPreset(count),
    presetLimit: (count: number) => subscription.checkCustomPresetLimit(count),
    
    // Session history
    canAccessHistory: (days: number) => subscription.canAccessSessionHistory(days),
    historyLimit: (days?: number) => subscription.checkSessionHistoryLimit(days),
    
    // Statistics
    canAccessStats: (range: 'today' | 'week' | 'month' | 'year' | 'all-time') => 
      subscription.canAccessStatistics(range),
    statsLimit: (range: 'today' | 'week' | 'month' | 'year' | 'all-time') => 
      subscription.checkStatisticsLimit(range),
    
    // Data export
    canExport: () => subscription.canExportData(),
    
    // Subscription info
    isLoading: subscription.isLoading,
    isPremium: subscription.isPremium,
  };
};

export default SubscriptionProvider;