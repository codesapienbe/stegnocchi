/**
 * Message Input Animation Component
 * Slide up from bottom animation for message input
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Keyboard,
  Platform,
} from 'react-native';
import { useAnimation } from './AnimationProvider';

interface MessageInputAnimationProps {
  isVisible: boolean;
  children: React.ReactNode;
  onAnimationComplete?: () => void;
}

export const MessageInputAnimation: React.FC<MessageInputAnimationProps> = ({
  isVisible,
  children,
  onAnimationComplete
}) => {
  const { reducedMotion } = useAnimation();
  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (isVisible && !reducedMotion) {
      // Slide up from bottom with fade and scale
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]).start(() => {
        onAnimationComplete?.();
      });
    } else if (!isVisible && !reducedMotion) {
      // Slide down to bottom with fade and scale
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 280,
          easing: Easing.in(Easing.back(1.1)),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Instant show/hide for reduced motion
      slideAnim.setValue(isVisible ? 1 : 0);
      opacityAnim.setValue(isVisible ? 1 : 0);
      scaleAnim.setValue(isVisible ? 1 : 0.8);
      if (isVisible) {
        onAnimationComplete?.();
      }
    }
  }, [isVisible, slideAnim, opacityAnim, scaleAnim, reducedMotion, onAnimationComplete]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  const transform = [
    { translateY },
    { scale: scaleAnim },
  ];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: opacityAnim,
          transform,
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20, // Account for safe area
    paddingHorizontal: 20,
  },
}); 