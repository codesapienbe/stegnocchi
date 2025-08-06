/**
 * Mobile Layout Component
 * Mobile-first layout using View instead of div
 */

import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';

interface MobileLayoutProps {
  children: React.ReactNode;
  backgroundColor?: string;
  paddingHorizontal?: number;
  paddingVertical?: number;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  backgroundColor = '#f8f9fa',
  paddingHorizontal = 20,
  paddingVertical = 0,
}) => {
  const { width, height } = Dimensions.get('window');
  const isSmallScreen = width < 375;
  const isMediumScreen = width >= 375 && width < 768;
  const isLargeScreen = width >= 768;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={backgroundColor}
        translucent={Platform.OS === 'android'}
      />
      <View
        style={[
          styles.content,
          {
            paddingHorizontal: isSmallScreen ? 16 : paddingHorizontal,
            paddingVertical,
          },
        ]}
      >
        {children}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
}); 