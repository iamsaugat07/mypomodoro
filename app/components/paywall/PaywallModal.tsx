import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../../src/providers/subscription';

interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  feature?: string;
  autoShow?: boolean;
}

const { width } = Dimensions.get('window');

export const PaywallModal = ({
  visible,
  onClose,
  title = "Upgrade to Premium",
  subtitle = "Unlock all features and get the most out of your Pomodoro sessions",
  feature,
  autoShow = false
}: PaywallModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'annual'>('monthly');
  const { showPurchaseFlow, showRestoreFlow } = useSubscription();

  const plans = {
    monthly: {
      id: 'premium_monthly',
      price: '$2.99',
      period: 'month',
      pricePerMonth: '$2.99/month',
      savings: null
    },
    annual: {
      id: 'premium_annual', 
      price: '$29.99',
      period: 'year',
      pricePerMonth: '$2.50/month',
      savings: '16% OFF'
    }
  };

  const premiumFeatures = [
    {
      icon: 'infinite',
      title: 'Unlimited Custom Presets',
      description: 'Create as many timer configurations as you need'
    },
    {
      icon: 'time',
      title: 'Unlimited Session History', 
      description: 'Access all your past sessions anytime'
    },
    {
      icon: 'stats-chart',
      title: 'Extended Analytics',
      description: 'Monthly, yearly, and all-time statistics'
    },
    {
      icon: 'download',
      title: 'Data Export',
      description: 'Export your sessions and statistics as CSV/JSON'
    },
    {
      icon: 'notifications',
      title: 'Advanced Notifications',
      description: 'Custom sounds and motivational messages'
    },
    {
      icon: 'cloud',
      title: 'Enhanced Cloud Backup',
      description: 'Verified cloud backup with priority sync'
    }
  ];

  const handlePurchase = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const success = await showPurchaseFlow();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const success = await showRestoreFlow();
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Restore error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const PlanCard = ({ planType, isSelected, onSelect }: {
    planType: 'monthly' | 'annual';
    isSelected: boolean;
    onSelect: () => void;
  }) => {
    const plan = plans[planType];
    
    return (
      <TouchableOpacity
        style={[styles.planCard, isSelected && styles.selectedPlanCard]}
        onPress={onSelect}
        activeOpacity={0.8}
      >
        <View style={styles.planHeader}>
          <View style={styles.planTitleRow}>
            <Text style={[styles.planTitle, isSelected && styles.selectedText]}>
              {planType === 'monthly' ? 'Monthly' : 'Annual'}
            </Text>
            {plan.savings && (
              <View style={styles.savingsBadge}>
                <Text style={styles.savingsText}>{plan.savings}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.planPrice, isSelected && styles.selectedText]}>
            {plan.price}
          </Text>
        </View>
        <Text style={[styles.planSubtext, isSelected && styles.selectedSubtext]}>
          {plan.pricePerMonth}
        </Text>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium</Text>
          <View style={styles.placeholderButton} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Section */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            {feature && (
              <View style={styles.featureCallout}>
                <Ionicons name="lock-closed" size={16} color="#FF9500" />
                <Text style={styles.featureText}>
                  {feature} requires Premium
                </Text>
              </View>
            )}
          </View>

          {/* Features List */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>What's Included:</Text>
            {premiumFeatures.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <Ionicons name={feature.icon as any} size={20} color="#4CAF50" />
                </View>
                <View style={styles.featureContent}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Pricing Plans */}
          <View style={styles.plansSection}>
            <Text style={styles.sectionTitle}>Choose Your Plan:</Text>
            <View style={styles.plansContainer}>
              <PlanCard
                planType="monthly"
                isSelected={selectedPlan === 'monthly'}
                onSelect={() => setSelectedPlan('monthly')}
              />
              <PlanCard
                planType="annual"
                isSelected={selectedPlan === 'annual'}
                onSelect={() => setSelectedPlan('annual')}
              />
            </View>
          </View>

          {/* Purchase Button */}
          <TouchableOpacity
            style={[styles.purchaseButton, isLoading && styles.disabledButton]}
            onPress={handlePurchase}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.purchaseButtonText}>
                Start Premium - {plans[selectedPlan].price}
              </Text>
            )}
          </TouchableOpacity>

          {/* Restore Button */}
          <TouchableOpacity
            style={styles.restoreButton}
            onPress={handleRestore}
            disabled={isLoading}
          >
            <Text style={styles.restoreButtonText}>
              Restore Previous Purchase
            </Text>
          </TouchableOpacity>

          {/* Terms */}
          <Text style={styles.termsText}>
            Payment will be charged to your Google Play account. Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period. 
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholderButton: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  titleSection: {
    paddingTop: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 15,
  },
  featureCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 10,
  },
  featureText: {
    fontSize: 14,
    color: '#FF9500',
    marginLeft: 6,
    fontWeight: '500',
  },
  featuresSection: {
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  plansSection: {
    paddingVertical: 20,
  },
  plansContainer: {
    gap: 15,
  },
  planCard: {
    borderWidth: 2,
    borderColor: '#E5E5E5',
    borderRadius: 15,
    padding: 20,
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },
  selectedPlanCard: {
    borderColor: '#4CAF50',
    backgroundColor: '#F8FFF8',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  selectedText: {
    color: '#4CAF50',
  },
  savingsBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  planSubtext: {
    fontSize: 14,
    color: '#666',
  },
  selectedSubtext: {
    color: '#4CAF50',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  purchaseButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 15,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  purchaseButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  restoreButton: {
    paddingVertical: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  restoreButtonText: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
    marginBottom: 30,
  },
});

export default PaywallModal;