/**
 * Mobile ScrollView Component
 * Content scrolling using ScrollView for mobile compatibility
 */

import React from 'react';
import {
  ScrollView,
  StyleSheet,
  RefreshControl,
  ViewStyle,
  Platform,
} from 'react-native';

interface MobileScrollViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  refreshControl?: React.ReactElement;
  onRefresh?: () => void;
  refreshing?: boolean;
  bounces?: boolean;
  alwaysBounceVertical?: boolean;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}

export const MobileScrollView: React.FC<MobileScrollViewProps> = ({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  showsHorizontalScrollIndicator = false,
  refreshControl,
  onRefresh,
  refreshing = false,
  bounces = true,
  alwaysBounceVertical = false,
  keyboardShouldPersistTaps = 'handled',
}) => {
  const defaultRefreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#007AFF"
      colors={['#007AFF']}
      progressBackgroundColor="#f8f9fa"
    />
  ) : undefined;

  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      refreshControl={refreshControl || defaultRefreshControl}
      bounces={bounces}
      alwaysBounceVertical={alwaysBounceVertical}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      // Platform-specific optimizations
      scrollEventThrottle={16}
      decelerationRate={Platform.OS === 'ios' ? 'normal' : 0.998}
      // Accessibility
      accessibilityRole="scroll"
      accessibilityLabel="Scrollable content"
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
}); 