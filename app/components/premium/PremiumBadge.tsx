import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSubscriptionStatus } from '../../../src/providers/subscription';

interface PremiumBadgeProps {
  variant?: 'default' | 'small' | 'large' | 'minimal';
  showIcon?: boolean;
  showText?: boolean;
  style?: any;
}

export const PremiumBadge = ({
  variant = 'default',
  showIcon = true,
  showText = true,
  style
}: PremiumBadgeProps) => {
  const { isPremium, isExpired, isLoading } = useSubscriptionStatus();

  // Don't show badge if user is not premium or if we're still loading
  if (!isPremium && !isExpired) {
    return null;
  }

  // Don't show while loading
  if (isLoading) {
    return null;
  }

  const getBadgeStyle = () => {
    const baseStyle = [styles.badge];
    
    switch (variant) {
      case 'small':
        return [...baseStyle, styles.smallBadge];
      case 'large':
        return [...baseStyle, styles.largeBadge];
      case 'minimal':
        return [...baseStyle, styles.minimalBadge];
      default:
        return baseStyle;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'small':
        return styles.smallText;
      case 'large':
        return styles.largeText;
      case 'minimal':
        return styles.minimalText;
      default:
        return styles.defaultText;
    }
  };

  const getIconSize = () => {
    switch (variant) {
      case 'small':
        return 12;
      case 'large':
        return 20;
      case 'minimal':
        return 14;
      default:
        return 16;
    }
  };

  const getBadgeColor = () => {
    if (isExpired) {
      return {
        backgroundColor: '#FFE6E6',
        borderColor: '#FF4444',
        iconColor: '#FF4444',
        textColor: '#FF4444'
      };
    }
    
    return {
      backgroundColor: '#E8F5E8',
      borderColor: '#4CAF50',
      iconColor: '#4CAF50',
      textColor: '#4CAF50'
    };
  };

  const colors = getBadgeColor();
  const badgeText = isExpired ? 'Expired' : 'Premium';

  return (
    <View 
      style={[
        getBadgeStyle(),
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
        },
        style
      ]}
    >
      {showIcon && (
        <Ionicons 
          name={isExpired ? "warning" : "diamond"} 
          size={getIconSize()} 
          color={colors.iconColor}
          style={showText ? { marginRight: 4 } : undefined}
        />
      )}
      {showText && (
        <Text 
          style={[
            getTextStyle(),
            { color: colors.textColor }
          ]}
        >
          {badgeText}
        </Text>
      )}
    </View>
  );
};

// Specific badge variants for common use cases
export const HeaderPremiumBadge = ({ style }: { style?: any }) => (
  <PremiumBadge variant="small" style={style} />
);

export const SettingsPremiumBadge = ({ style }: { style?: any }) => (
  <PremiumBadge variant="default" style={style} />
);

export const FeaturePremiumBadge = ({ style }: { style?: any }) => (
  <PremiumBadge variant="minimal" showIcon={false} style={style} />
);

export const LargePremiumBadge = ({ style }: { style?: any }) => (
  <PremiumBadge variant="large" style={style} />
);

// Premium status indicator (just icon, no text)
export const PremiumStatusIcon = ({ 
  size = 16, 
  style 
}: { size?: number; style?: any }) => {
  const { isPremium, isExpired, isLoading } = useSubscriptionStatus();

  if (!isPremium && !isExpired || isLoading) {
    return null;
  }

  return (
    <Ionicons 
      name={isExpired ? "warning" : "diamond"} 
      size={size} 
      color={isExpired ? "#FF4444" : "#4CAF50"}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  smallBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  largeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  minimalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  defaultText: {
    fontSize: 12,
    fontWeight: '600',
  },
  smallText: {
    fontSize: 10,
    fontWeight: '600',
  },
  largeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  minimalText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default PremiumBadge;