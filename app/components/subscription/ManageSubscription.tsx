import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription, useSubscriptionStatus } from '../../../src/providers/subscription';
import { PaywallModal } from '../paywall/PaywallModal';
import { PremiumBadge } from '../premium/PremiumBadge';

interface ManageSubscriptionProps {
  style?: any;
  showTitle?: boolean;
}

export const ManageSubscription = ({
  style,
  showTitle = true
}: ManageSubscriptionProps) => {
  const [showPaywall, setShowPaywall] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { 
    subscriptionInfo, 
    showPurchaseFlow, 
    showRestoreFlow, 
    refreshSubscriptionStatus,
    getUpgradeCallToAction
  } = useSubscription();
  const { isPremium, isFree, isExpired, status } = useSubscriptionStatus();

  const handleUpgrade = () => {
    setShowPaywall(true);
  };

  const handleRestore = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const success = await showRestoreFlow();
      if (!success) {
        // The restore flow already shows appropriate alerts
      }
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await refreshSubscriptionStatus();
    } catch (error) {
      Alert.alert(
        'Refresh Failed',
        'Could not refresh subscription status. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatExpirationDate = (date?: Date) => {
    if (!date) return null;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = () => {
    if (isPremium) return '#4CAF50';
    if (isExpired) return '#FF4444';
    return '#666';
  };

  const getStatusText = () => {
    if (isPremium) return 'Active';
    if (isExpired) return 'Expired';
    return 'Free';
  };

  // Free user view
  if (isFree) {
    return (
      <>
        <View style={[styles.container, style]}>
          {showTitle && (
            <Text style={styles.title}>Subscription</Text>
          )}
          
          <View style={styles.freeUserCard}>
            <View style={styles.freeUserHeader}>
              <View style={styles.freeUserIcon}>
                <Ionicons name="diamond-outline" size={24} color="#999" />
              </View>
              <View style={styles.freeUserInfo}>
                <Text style={styles.freeUserTitle}>Free Plan</Text>
                <Text style={styles.freeUserSubtitle}>
                  Limited features • Upgrade for full access
                </Text>
              </View>
            </View>

            <View style={styles.freeUserLimits}>
              <View style={styles.limitItem}>
                <Ionicons name="timer" size={16} color="#666" />
                <Text style={styles.limitText}>2 custom timer presets</Text>
              </View>
              <View style={styles.limitItem}>
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.limitText}>7 days session history</Text>
              </View>
              <View style={styles.limitItem}>
                <Ionicons name="stats-chart" size={16} color="#666" />
                <Text style={styles.limitText}>Basic statistics only</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.upgradeButton} 
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <Text style={styles.upgradeButtonText}>
                {getUpgradeCallToAction()}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.restoreButton} 
              onPress={handleRestore}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FF9500" size="small" />
              ) : (
                <Text style={styles.restoreButtonText}>
                  Restore Previous Purchase
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
        />
      </>
    );
  }

  // Premium/Expired user view
  return (
    <View style={[styles.container, style]}>
      {showTitle && (
        <Text style={styles.title}>Subscription</Text>
      )}

      <View style={styles.subscriptionCard}>
        {/* Status Header */}
        <View style={styles.statusHeader}>
          <View style={styles.statusInfo}>
            <View style={styles.statusRow}>
              <Text style={styles.subscriptionTitle}>Premium Plan</Text>
              <PremiumBadge variant="small" />
            </View>
            <Text style={[styles.statusText, { color: getStatusColor() }]}>
              Status: {getStatusText()}
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#666" size="small" />
            ) : (
              <Ionicons name="refresh" size={20} color="#666" />
            )}
          </TouchableOpacity>
        </View>

        {/* Subscription Details */}
        <View style={styles.detailsSection}>
          {subscriptionInfo?.expiresAt && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                {isExpired ? 'Expired on' : 'Renews on'}
              </Text>
              <Text style={styles.detailValue}>
                {formatExpirationDate(subscriptionInfo.expiresAt)}
              </Text>
            </View>
          )}

          {subscriptionInfo?.productId && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Plan Type</Text>
              <Text style={styles.detailValue}>
                {subscriptionInfo.productId.includes('monthly') ? 'Monthly' : 'Annual'}
              </Text>
            </View>
          )}

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Platform</Text>
            <Text style={styles.detailValue}>
              {subscriptionInfo?.platform === 'android' ? 'Google Play' : 'App Store'}
            </Text>
          </View>
        </View>

        {/* Premium Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Premium Features:</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Unlimited custom presets</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Complete session history</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Extended analytics</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
              <Text style={styles.featureText}>Data export capability</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {isExpired && (
            <TouchableOpacity 
              style={styles.renewButton} 
              onPress={handleUpgrade}
              activeOpacity={0.8}
            >
              <Text style={styles.renewButtonText}>Renew Premium</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.manageButton}
            onPress={() => {
              Alert.alert(
                'Manage Subscription',
                'To cancel or modify your subscription, please visit the Google Play Store.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Open Play Store', 
                    onPress: () => {
                      // This would open the Play Store subscription management
                      // For now, just show an info alert
                      Alert.alert(
                        'Subscription Management',
                        'Visit Google Play Store > Account > Subscriptions to manage your Pomodoro Premium subscription.',
                        [{ text: 'OK' }]
                      );
                    }
                  }
                ]
              );
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.manageButtonText}>Manage Subscription</Text>
            <Ionicons name="arrow-forward" size={16} color="#FF9500" />
          </TouchableOpacity>
        </View>
      </View>

      {showPaywall && (
        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          title="Renew Premium"
          subtitle="Continue enjoying all premium features"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  
  // Free user styles
  freeUserCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  freeUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  freeUserIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  freeUserInfo: {
    flex: 1,
  },
  freeUserTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  freeUserSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  freeUserLimits: {
    marginBottom: 20,
  },
  limitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  limitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9500',
    borderRadius: 10,
    paddingVertical: 14,
    marginBottom: 10,
    gap: 8,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  restoreButtonText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
  },

  // Premium user styles
  subscriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8F5E8',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  statusInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 10,
  },
  subscriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  refreshButton: {
    padding: 5,
  },
  
  detailsSection: {
    marginBottom: 20,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },

  featuresSection: {
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },

  actionsSection: {
    gap: 10,
  },
  renewButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  renewButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF9500',
    borderRadius: 10,
    paddingVertical: 12,
    gap: 8,
  },
  manageButtonText: {
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '500',
  },
});

export default ManageSubscription;