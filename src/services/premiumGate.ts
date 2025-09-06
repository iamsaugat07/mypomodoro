import subscriptionManager from './subscriptionManager';

export interface FeatureLimit {
  isLimited: boolean;
  currentUsage?: number;
  maxAllowed?: number;
  upgradeMessage: string;
}

export interface PremiumFeature {
  canAccess: boolean;
  reason?: 'premium_required' | 'limit_exceeded' | 'free_tier';
  upgradeMessage?: string;
}

class PremiumGate {
  private static instance: PremiumGate;

  private constructor() {}

  static getInstance(): PremiumGate {
    if (!PremiumGate.instance) {
      PremiumGate.instance = new PremiumGate();
    }
    return PremiumGate.instance;
  }

  // Custom Timer Presets Limitation
  checkCustomPresetLimit(currentPresetCount: number): FeatureLimit {
    const isPremium = subscriptionManager.isPremium();
    
    if (isPremium) {
      return {
        isLimited: false,
        upgradeMessage: ''
      };
    }

    const MAX_FREE_PRESETS = 2;
    const isLimited = currentPresetCount >= MAX_FREE_PRESETS;

    return {
      isLimited,
      currentUsage: currentPresetCount,
      maxAllowed: MAX_FREE_PRESETS,
      upgradeMessage: isLimited 
        ? `You've reached the limit of ${MAX_FREE_PRESETS} custom timer presets. Upgrade to Premium for unlimited presets!`
        : `${currentPresetCount}/${MAX_FREE_PRESETS} custom presets used. Upgrade to Premium for unlimited presets!`
    };
  }

  canCreateCustomPreset(currentPresetCount: number): PremiumFeature {
    const isPremium = subscriptionManager.isPremium();
    
    if (isPremium) {
      return { canAccess: true };
    }

    const MAX_FREE_PRESETS = 2;
    const canCreate = currentPresetCount < MAX_FREE_PRESETS;

    return {
      canAccess: canCreate,
      reason: canCreate ? undefined : 'limit_exceeded',
      upgradeMessage: canCreate 
        ? undefined 
        : `You can only have ${MAX_FREE_PRESETS} custom timer presets on the free plan. Upgrade to Premium for unlimited presets!`
    };
  }

  // Session History Limitation (7 days for free users)
  checkSessionHistoryLimit(requestedDaysBack: number = 7): FeatureLimit {
    const isPremium = subscriptionManager.isPremium();
    
    if (isPremium) {
      return {
        isLimited: false,
        upgradeMessage: ''
      };
    }

    const MAX_FREE_HISTORY_DAYS = 7;
    const isLimited = requestedDaysBack > MAX_FREE_HISTORY_DAYS;

    return {
      isLimited,
      currentUsage: requestedDaysBack,
      maxAllowed: MAX_FREE_HISTORY_DAYS,
      upgradeMessage: isLimited
        ? `Free users can only view the last ${MAX_FREE_HISTORY_DAYS} days of session history. Upgrade to Premium for unlimited history access!`
        : `You have access to the last ${MAX_FREE_HISTORY_DAYS} days. Upgrade to Premium for unlimited history!`
    };
  }

  canAccessSessionHistory(daysBack: number): PremiumFeature {
    const isPremium = subscriptionManager.isPremium();
    
    if (isPremium) {
      return { canAccess: true };
    }

    const MAX_FREE_HISTORY_DAYS = 7;
    const canAccess = daysBack <= MAX_FREE_HISTORY_DAYS;

    return {
      canAccess,
      reason: canAccess ? undefined : 'premium_required',
      upgradeMessage: canAccess 
        ? undefined 
        : `This feature requires Premium. Free users can only access the last ${MAX_FREE_HISTORY_DAYS} days of history.`
    };
  }

  // Statistics Limitation (current week only for free)
  checkStatisticsLimit(timeRange: 'today' | 'week' | 'month' | 'year' | 'all-time'): FeatureLimit {
    const isPremium = subscriptionManager.isPremium();
    
    if (isPremium) {
      return {
        isLimited: false,
        upgradeMessage: ''
      };
    }

    const allowedRanges = ['today', 'week'];
    const isLimited = !allowedRanges.includes(timeRange);

    const restrictedRanges = {
      'month': 'Monthly',
      'year': 'Yearly', 
      'all-time': 'All-time'
    };

    return {
      isLimited,
      upgradeMessage: isLimited
        ? `${restrictedRanges[timeRange as keyof typeof restrictedRanges]} statistics require Premium. Free users can view Today and This Week only.`
        : 'Upgrade to Premium for Monthly, Yearly, and All-time statistics!'
    };
  }

  canAccessStatistics(timeRange: 'today' | 'week' | 'month' | 'year' | 'all-time'): PremiumFeature {
    const isPremium = subscriptionManager.isPremium();
    
    if (isPremium) {
      return { canAccess: true };
    }

    const allowedRanges = ['today', 'week'];
    const canAccess = allowedRanges.includes(timeRange);

    return {
      canAccess,
      reason: canAccess ? 'free_tier' : 'premium_required',
      upgradeMessage: canAccess 
        ? undefined 
        : `${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)} statistics require Premium. Upgrade to access extended analytics!`
    };
  }

  // Data Export Feature (Premium only)
  canExportData(): PremiumFeature {
    const isPremium = subscriptionManager.isPremium();
    
    return {
      canAccess: isPremium,
      reason: isPremium ? undefined : 'premium_required',
      upgradeMessage: isPremium 
        ? undefined 
        : 'Data export is a Premium feature. Export your sessions, statistics, and settings with Premium!'
    };
  }

  // Advanced Notifications (Premium only)
  canAccessAdvancedNotifications(): PremiumFeature {
    const isPremium = subscriptionManager.isPremium();
    
    return {
      canAccess: isPremium,
      reason: isPremium ? undefined : 'premium_required',
      upgradeMessage: isPremium 
        ? undefined 
        : 'Advanced notifications (custom sounds, motivational messages) require Premium!'
    };
  }

  // Dark Mode Themes (Premium only)
  canAccessPremiumThemes(): PremiumFeature {
    const isPremium = subscriptionManager.isPremium();
    
    return {
      canAccess: isPremium,
      reason: isPremium ? undefined : 'premium_required',
      upgradeMessage: isPremium 
        ? undefined 
        : 'Multiple dark mode themes are available with Premium!'
    };
  }

  // Cloud Backup Verification (Premium only)
  canAccessCloudBackup(): PremiumFeature {
    const isPremium = subscriptionManager.isPremium();
    
    return {
      canAccess: isPremium,
      reason: isPremium ? undefined : 'premium_required',
      upgradeMessage: isPremium 
        ? undefined 
        : 'Enhanced cloud backup with verification is available with Premium!'
    };
  }

  // Helper method to get all current limitations for UI display
  getCurrentLimitations(): {
    customPresets: FeatureLimit;
    sessionHistory: FeatureLimit;
    statistics: FeatureLimit;
    dataExport: PremiumFeature;
    advancedNotifications: PremiumFeature;
    premiumThemes: PremiumFeature;
    cloudBackup: PremiumFeature;
  } {
    return {
      customPresets: this.checkCustomPresetLimit(0), // Will be updated with actual count
      sessionHistory: this.checkSessionHistoryLimit(7),
      statistics: this.checkStatisticsLimit('month'),
      dataExport: this.canExportData(),
      advancedNotifications: this.canAccessAdvancedNotifications(),
      premiumThemes: this.canAccessPremiumThemes(),
      cloudBackup: this.canAccessCloudBackup()
    };
  }

  // Helper to determine if user should see upgrade prompts
  shouldShowUpgradePrompts(): boolean {
    return subscriptionManager.isFree() || subscriptionManager.isExpired();
  }

  // Get the appropriate call-to-action message based on subscription status
  getUpgradeCallToAction(): string {
    const subscriptionInfo = subscriptionManager.getSubscriptionInfo();
    
    if (subscriptionInfo?.status === 'expired') {
      return 'Renew Premium to restore all features';
    }
    
    return 'Upgrade to Premium';
  }

  // Helper to format limitations for display
  formatLimitationMessage(limit: FeatureLimit): string {
    if (!limit.isLimited) {
      return limit.upgradeMessage || '';
    }

    if (limit.currentUsage !== undefined && limit.maxAllowed !== undefined) {
      return `${limit.currentUsage}/${limit.maxAllowed} - ${limit.upgradeMessage}`;
    }

    return limit.upgradeMessage;
  }
}

export default PremiumGate.getInstance();