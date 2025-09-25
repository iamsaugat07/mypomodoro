import Purchases, { 
  PurchasesOffering, 
  CustomerInfo, 
  PurchasesPackage
} from 'react-native-purchases';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SubscriptionStatus = 'free' | 'premium' | 'expired';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  expiresAt?: Date;
  productId?: string;
  platform: 'android';
}

class SubscriptionManager {
  private static instance: SubscriptionManager;
  private currentSubscription: SubscriptionInfo | null = null;
  private listeners: ((info: SubscriptionInfo) => void)[] = [];
  private isInitialized: boolean = false;

  private constructor() {}

  static getInstance(): SubscriptionManager {
    if (!SubscriptionManager.instance) {
      SubscriptionManager.instance = new SubscriptionManager();
    }
    return SubscriptionManager.instance;
  }

  async initialize(revenueCatApiKey: string): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ Revenue Cat already initialized, skipping...');
      return;
    }

    try {
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
      await Purchases.configure({ apiKey: revenueCatApiKey });

      // Get initial customer info
      await this.refreshSubscriptionStatus();

      // Listen for updates
      Purchases.addCustomerInfoUpdateListener(this.handleCustomerInfoUpdate.bind(this));

      this.isInitialized = true;
      console.log('✅ Revenue Cat initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Revenue Cat:', error);
      throw error;
    }
  }

  async refreshSubscriptionStatus(): Promise<SubscriptionInfo> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const subscriptionInfo = this.parseCustomerInfo(customerInfo);
      
      this.currentSubscription = subscriptionInfo;
      this.notifyListeners(subscriptionInfo);
      
      // Cache subscription status locally
      await AsyncStorage.setItem('subscription_status', JSON.stringify(subscriptionInfo));
      
      return subscriptionInfo;
    } catch (error) {
      console.error('❌ Failed to refresh subscription status:', error);
      
      // Fallback to cached status
      const cached = await this.getCachedSubscriptionStatus();
      if (cached) {
        this.currentSubscription = cached;
        return cached;
      }
      
      // Default to free if no cache
      const defaultInfo: SubscriptionInfo = { status: 'free', platform: 'android' };
      this.currentSubscription = defaultInfo;
      return defaultInfo;
    }
  }

  private async getCachedSubscriptionStatus(): Promise<SubscriptionInfo | null> {
    try {
      const cached = await AsyncStorage.getItem('subscription_status');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Check if cached subscription is expired
        if (parsed.expiresAt && new Date(parsed.expiresAt) < new Date()) {
          return { ...parsed, status: 'expired' as SubscriptionStatus };
        }
        return parsed;
      }
    } catch (error) {
      console.error('Failed to get cached subscription:', error);
    }
    return null;
  }

  private parseCustomerInfo(customerInfo: CustomerInfo): SubscriptionInfo {
    const premiumEntitlement = customerInfo.entitlements.active['premium_access'];
    
    if (premiumEntitlement && premiumEntitlement.isActive) {
      return {
        status: 'premium',
        expiresAt: premiumEntitlement.expirationDate ? new Date(premiumEntitlement.expirationDate) : undefined,
        productId: premiumEntitlement.productIdentifier,
        platform: 'android'
      };
    }

    // Check if there's an expired premium subscription
    const allEntitlements = customerInfo.entitlements.all['premium_access'];
    if (allEntitlements && !allEntitlements.isActive) {
      return {
        status: 'expired',
        expiresAt: allEntitlements.expirationDate ? new Date(allEntitlements.expirationDate) : undefined,
        productId: allEntitlements.productIdentifier,
        platform: 'android'
      };
    }

    return {
      status: 'free',
      platform: 'android'
    };
  }

  private handleCustomerInfoUpdate = (customerInfo: CustomerInfo) => {
    const subscriptionInfo = this.parseCustomerInfo(customerInfo);
    this.currentSubscription = subscriptionInfo;
    this.notifyListeners(subscriptionInfo);
    
    // Update cached status
    AsyncStorage.setItem('subscription_status', JSON.stringify(subscriptionInfo));
  };

  async getOfferings(): Promise<PurchasesOffering[]> {
    try {
      const offerings = await Purchases.getOfferings();
      return Object.values(offerings.all);
    } catch (error) {
      console.error('❌ Failed to get offerings:', error);
      throw error;
    }
  }

  async purchasePackage(purchasePackage: PurchasesPackage): Promise<CustomerInfo> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(purchasePackage);
      
      // Update local subscription info
      const subscriptionInfo = this.parseCustomerInfo(customerInfo);
      this.currentSubscription = subscriptionInfo;
      this.notifyListeners(subscriptionInfo);
      
      return customerInfo;
    } catch (error: any) {
      if (error.userCancelled) {
        throw new Error('Purchase cancelled by user');
      }
      
      console.error('❌ Purchase failed:', error);
      throw new Error(`Purchase failed: ${error.message}`);
    }
  }

  async restorePurchases(): Promise<CustomerInfo> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      
      // Update local subscription info
      const subscriptionInfo = this.parseCustomerInfo(customerInfo);
      this.currentSubscription = subscriptionInfo;
      this.notifyListeners(subscriptionInfo);
      
      return customerInfo;
    } catch (error: any) {
      console.error('❌ Failed to restore purchases:', error);
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  isPremium(): boolean {
    return this.currentSubscription?.status === 'premium';
  }

  isFree(): boolean {
    return this.currentSubscription?.status === 'free';
  }

  isExpired(): boolean {
    return this.currentSubscription?.status === 'expired';
  }

  getSubscriptionInfo(): SubscriptionInfo | null {
    return this.currentSubscription;
  }

  // Listener management
  addListener(callback: (info: SubscriptionInfo) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners(info: SubscriptionInfo) {
    this.listeners.forEach(listener => {
      try {
        listener(info);
      } catch (error) {
        console.error('Error in subscription listener:', error);
      }
    });
  }

  // Helper method to show purchase flow with error handling
  async showPurchaseFlow(): Promise<boolean> {
    try {
      const offerings = await this.getOfferings();
      
      if (offerings.length === 0) {
        Alert.alert('Error', 'No subscription plans available at the moment. Please try again later.');
        return false;
      }

      const currentOffering = offerings[0]; // Use first available offering
      if (!currentOffering.availablePackages.length) {
        Alert.alert('Error', 'No packages available for purchase.');
        return false;
      }

      // For now, we'll use the first package (monthly/annual)
      const packageToPurchase = currentOffering.availablePackages[0];
      
      await this.purchasePackage(packageToPurchase);
      
      Alert.alert(
        'Success! 🎉',
        'Welcome to Premium! You now have access to all premium features.',
        [{ text: 'Great!', style: 'default' }]
      );
      
      return true;
    } catch (error: any) {
      if (error.message !== 'Purchase cancelled by user') {
        Alert.alert(
          'Purchase Failed',
          'Something went wrong with your purchase. Please try again or contact support if the issue persists.',
          [{ text: 'OK', style: 'default' }]
        );
      }
      return false;
    }
  }

  async showRestoreFlow(): Promise<boolean> {
    try {
      const customerInfo = await this.restorePurchases();
      const subscriptionInfo = this.parseCustomerInfo(customerInfo);
      
      if (subscriptionInfo.status === 'premium') {
        Alert.alert(
          'Restored! 🎉',
          'Your premium subscription has been restored successfully.',
          [{ text: 'Great!', style: 'default' }]
        );
        return true;
      } else {
        Alert.alert(
          'No Purchases Found',
          'We could not find any previous purchases to restore. If you believe this is an error, please contact support.',
          [{ text: 'OK', style: 'default' }]
        );
        return false;
      }
    } catch (error: any) {
      Alert.alert(
        'Restore Failed',
        'We could not restore your purchases. Please check your internet connection and try again.',
        [{ text: 'OK', style: 'default' }]
      );
      return false;
    }
  }
}

export default SubscriptionManager.getInstance();