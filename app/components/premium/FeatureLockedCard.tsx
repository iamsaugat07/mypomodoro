import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscription } from '../../../src/providers/subscription';
import { PaywallModal } from '../paywall/PaywallModal';

interface FeatureLockedCardProps {
  title: string;
  description: string;
  features?: string[];
  icon?: keyof typeof Ionicons.glyphMap;
  buttonText?: string;
  variant?: 'default' | 'compact' | 'banner' | 'modal';
  style?: any;
  onUpgrade?: () => void;
}

const { width } = Dimensions.get('window');

export const FeatureLockedCard = ({
  title,
  description,
  features = [],
  icon = 'lock-closed',
  buttonText,
  variant = 'default',
  style,
  onUpgrade
}: FeatureLockedCardProps) => {
  const [showPaywall, setShowPaywall] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { showPurchaseFlow, getUpgradeCallToAction } = useSubscription();

  const defaultButtonText = buttonText || getUpgradeCallToAction();

  const handleUpgrade = async () => {
    if (onUpgrade) {
      onUpgrade();
      return;
    }

    setShowPaywall(true);
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const success = await showPurchaseFlow();
      if (success) {
        setShowPaywall(false);
      }
    } catch (error) {
      console.error('Purchase error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCardStyle = () => {
    const baseStyle = [styles.card];
    
    switch (variant) {
      case 'compact':
        return [...baseStyle, styles.compactCard];
      case 'banner':
        return [...baseStyle, styles.bannerCard];
      case 'modal':
        return [...baseStyle, styles.modalCard];
      default:
        return baseStyle;
    }
  };

  const getContentLayout = () => {
    switch (variant) {
      case 'banner':
        return styles.bannerContent;
      case 'compact':
        return styles.compactContent;
      default:
        return styles.defaultContent;
    }
  };

  // Banner variant (minimal, horizontal layout)
  if (variant === 'banner') {
    return (
      <>
        <View style={[getCardStyle(), style]}>
          <View style={styles.bannerContent}>
            <View style={styles.bannerIcon}>
              <Ionicons name={icon} size={20} color="#FF9500" />
            </View>
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>{title}</Text>
              <Text style={styles.bannerDescription}>{description}</Text>
            </View>
            <TouchableOpacity 
              style={styles.bannerButton} 
              onPress={handleUpgrade}
              activeOpacity={0.7}
            >
              <Text style={styles.bannerButtonText}>Upgrade</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <PaywallModal
          visible={showPaywall}
          onClose={() => setShowPaywall(false)}
          title={title}
          subtitle={description}
          feature={title}
        />
      </>
    );
  }

  return (
    <>
      <View style={[getCardStyle(), style]}>
        <View style={getContentLayout()}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={variant === 'compact' ? 28 : 40} color="#FF9500" />
          </View>

          {/* Content */}
          <View style={styles.textContent}>
            <Text style={[
              styles.title,
              variant === 'compact' && styles.compactTitle
            ]}>
              {title}
            </Text>
            
            <Text style={[
              styles.description,
              variant === 'compact' && styles.compactDescription
            ]}>
              {description}
            </Text>

            {/* Features list (only for default variant) */}
            {variant === 'default' && features.length > 0 && (
              <View style={styles.featuresList}>
                {features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <Ionicons name="checkmark" size={16} color="#4CAF50" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Upgrade Button */}
        <TouchableOpacity 
          style={[
            styles.upgradeButton,
            variant === 'compact' && styles.compactButton,
            isLoading && styles.disabledButton
          ]} 
          onPress={handleUpgrade}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={[
              styles.upgradeButtonText,
              variant === 'compact' && styles.compactButtonText
            ]}>
              {defaultButtonText}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <PaywallModal
        visible={showPaywall}
        onClose={() => setShowPaywall(false)}
        title={title}
        subtitle={description}
        feature={title}
      />
    </>
  );
};

// Predefined common cards
export const CustomPresetsLockedCard = ({ 
  currentCount, 
  style 
}: { currentCount: number; style?: any }) => (
  <FeatureLockedCard
    title="Unlimited Custom Presets"
    description={`You've used ${currentCount}/2 free custom timer presets. Create unlimited presets with Premium!`}
    features={[
      "Unlimited custom timer configurations",
      "Save your favorite work/break combinations",
      "Quick access to all your presets"
    ]}
    icon="timer"
    style={style}
  />
);

export const SessionHistoryLockedCard = ({ style }: { style?: any }) => (
  <FeatureLockedCard
    title="Extended Session History"
    description="Access more than 7 days of session history with Premium. View all your past productivity sessions!"
    features={[
      "Unlimited session history access",
      "Track long-term progress",
      "Identify productivity patterns"
    ]}
    icon="time"
    variant="compact"
    style={style}
  />
);

export const StatisticsLockedCard = ({ 
  timeRange, 
  style 
}: { timeRange: string; style?: any }) => (
  <FeatureLockedCard
    title={`${timeRange} Statistics`}
    description={`${timeRange} analytics are available with Premium. Get insights into your productivity trends!`}
    features={[
      "Monthly, yearly, and all-time stats",
      "Advanced productivity analytics", 
      "Progress tracking over time"
    ]}
    icon="stats-chart"
    variant="compact"
    style={style}
  />
);

export const DataExportLockedCard = ({ style }: { style?: any }) => (
  <FeatureLockedCard
    title="Data Export"
    description="Export your sessions and statistics as CSV or JSON files with Premium!"
    features={[
      "Export all session data",
      "CSV and JSON format support",
      "Backup your productivity data"
    ]}
    icon="download"
    variant="banner"
    style={style}
  />
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#FFE6B3',
    backgroundColor: '#FFF9F0',
  },
  compactCard: {
    padding: 16,
    borderRadius: 12,
  },
  bannerCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#FFF3E0',
    borderColor: '#FFD54F',
  },
  modalCard: {
    borderWidth: 0,
    backgroundColor: '#F8F9FA',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  defaultContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  textContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  compactTitle: {
    fontSize: 16,
    textAlign: 'left',
    marginBottom: 4,
    marginLeft: 15,
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  compactDescription: {
    fontSize: 12,
    textAlign: 'left',
    marginLeft: 15,
    marginBottom: 0,
  },
  featuresList: {
    alignSelf: 'stretch',
    marginTop: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  upgradeButton: {
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  compactButton: {
    paddingVertical: 10,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  compactButtonText: {
    fontSize: 14,
  },
  // Banner specific styles
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  bannerText: {
    flex: 1,
    marginRight: 12,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  bannerDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  bannerButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bannerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default FeatureLockedCard;