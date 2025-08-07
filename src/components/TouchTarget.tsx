import React from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle, TouchableOpacityProps } from 'react-native';
import { useAccessibility } from '../hooks/useAccessibility';

export interface TouchTargetProps extends TouchableOpacityProps {
  children: React.ReactNode;
  minSize?: number;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'link' | 'tab' | 'menuitem' | 'checkbox' | 'radio';
}

/**
 * TouchTarget component ensures minimum 44px touch targets for accessibility
 */
export const TouchTarget: React.FC<TouchTargetProps> = ({
  children,
  minSize = 44,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button',
  ...props
}) => {
  const { reducedMotion } = useAccessibility();

  const touchTargetStyle: ViewStyle = {
    minWidth: minSize,
    minHeight: minSize,
    justifyContent: 'center',
    alignItems: 'center',
    ...style,
  };

  return (
    <TouchableOpacity
      style={[styles.touchTarget, touchTargetStyle]}
      activeOpacity={reducedMotion ? 1 : 0.7}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ disabled: props.disabled }}
      {...props}
    >
      <View style={styles.content}>{children}</View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchTarget: {
    borderRadius: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 