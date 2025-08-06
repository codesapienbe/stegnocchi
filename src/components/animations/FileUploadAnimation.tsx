/**
 * File Upload Animation Component
 * Elastic/bounce effect for file upload animations
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAnimation } from './AnimationProvider';

interface FileUploadAnimationProps {
  isUploading: boolean;
  isComplete: boolean;
  hasError: boolean;
  children?: React.ReactNode;
}

export const FileUploadAnimation: React.FC<FileUploadAnimationProps> = ({
  isUploading,
  isComplete,
  hasError,
  children
}) => {
  const { reducedMotion } = useAnimation();
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Elastic bounce animation for file selection
  useEffect(() => {
    if (isUploading && !reducedMotion) {
      // Elastic bounce effect
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();

      // Rotation animation during upload
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotationAnim.stopAnimation();
      rotationAnim.setValue(0);
    }
  }, [isUploading, scaleAnim, rotationAnim, reducedMotion]);

  // Success bounce animation
  useEffect(() => {
    if (isComplete && !reducedMotion) {
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isComplete, bounceAnim, reducedMotion]);

  // Error pulse animation
  useEffect(() => {
    if (hasError && !reducedMotion) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [hasError, pulseAnim, reducedMotion]);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const bounceScale = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const getIconName = (): string => {
    if (hasError) return 'close-circle';
    if (isComplete) return 'checkmark-circle';
    if (isUploading) return 'cloud-upload';
    return 'cloud-upload-outline';
  };

  const getIconColor = (): string => {
    if (hasError) return '#FF3B30';
    if (isComplete) return '#34C759';
    if (isUploading) return '#007AFF';
    return '#007AFF';
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [
              { scale: Animated.multiply(scaleAnim, pulseAnim) },
              { rotate: spin },
            ],
          },
        ]}
      >
        <Ionicons
          name={getIconName()}
          size={48}
          color={getIconColor()}
        />
      </Animated.View>

      {isComplete && (
        <Animated.View
          style={[
            styles.successIndicator,
            {
              transform: [{ scale: bounceScale }],
              opacity: bounceAnim,
            },
          ]}
        >
          <Ionicons name="checkmark" size={24} color="white" />
        </Animated.View>
      )}

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  successIndicator: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#34C759',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
}); 