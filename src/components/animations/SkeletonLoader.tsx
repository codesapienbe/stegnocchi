/**
 * Skeleton Loader Component
 * Placeholder for content loading
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useAnimation } from './AnimationProvider';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
  children?: React.ReactNode;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  children
}) => {
  const { reducedMotion } = useAnimation();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!reducedMotion) {
      Animated.loop(
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: false,
        })
      ).start();
    }
  }, [shimmerAnim, reducedMotion]);

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.7, 0.3],
  });

  return (
    <View style={[styles.container, { width, height, borderRadius }, style]}>
      <Animated.View
        style={[
          styles.shimmer,
          {
            opacity: shimmerOpacity,
            borderRadius,
          },
        ]}
      />
      {children}
    </View>
  );
};

// Predefined skeleton components
export const SkeletonText: React.FC<{ lines?: number; width?: number | string }> = ({
  lines = 1,
  width = '100%'
}) => (
  <View style={styles.textContainer}>
    {Array.from({ length: lines }).map((_, index) => (
      <SkeletonLoader
        key={index}
        width={index === lines - 1 ? width : '100%'}
        height={16}
        style={styles.textLine}
      />
    ))}
  </View>
);

export const SkeletonCard: React.FC = () => (
  <View style={styles.cardContainer}>
    <SkeletonLoader width="100%" height={120} borderRadius={8} style={styles.cardImage} />
    <View style={styles.cardContent}>
      <SkeletonLoader width="60%" height={20} style={styles.cardTitle} />
      <SkeletonLoader width="100%" height={16} style={styles.cardSubtitle} />
      <SkeletonLoader width="40%" height={16} style={styles.cardSubtitle} />
    </View>
  </View>
);

export const SkeletonButton: React.FC<{ width?: number | string }> = ({ width = 120 }) => (
  <SkeletonLoader width={width} height={48} borderRadius={24} />
);

export const SkeletonAvatar: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <SkeletonLoader width={size} height={size} borderRadius={size / 2} />
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#E1E1E1',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  textContainer: {
    gap: 8,
  },
  textLine: {
    marginBottom: 4,
  },
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    marginBottom: 12,
  },
  cardContent: {
    gap: 8,
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardSubtitle: {
    marginBottom: 2,
  },
}); 