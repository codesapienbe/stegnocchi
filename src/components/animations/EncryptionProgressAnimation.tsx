/**
 * Encryption Progress Animation Component
 * Circular progress ring with floating particles
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAnimation } from './AnimationProvider';

interface EncryptionProgressAnimationProps {
  isActive: boolean;
  progress: number; // 0-100
  children?: React.ReactNode;
}

export const EncryptionProgressAnimation: React.FC<EncryptionProgressAnimationProps> = ({
  isActive,
  progress,
  children
}) => {
  const { reducedMotion } = useAnimation();
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const particleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Main rotation animation
  useEffect(() => {
    if (isActive && !reducedMotion) {
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Scale in animation
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();

      // Particle animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(particleAnim, {
            toValue: 1,
            duration: 1500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(particleAnim, {
            toValue: 0,
            duration: 1500,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      rotationAnim.stopAnimation();
      particleAnim.stopAnimation();
      pulseAnim.stopAnimation();
      
      if (!isActive) {
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.back(1.2)),
          useNativeDriver: true,
        }).start();
      }
    }
  }, [isActive, rotationAnim, scaleAnim, particleAnim, pulseAnim, reducedMotion]);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const particleOpacity = particleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const particleScale = particleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.2],
  });

  // Calculate progress circle
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.progressContainer,
          {
            transform: [
              { scale: scaleAnim },
              { rotate: spin },
            ],
          },
        ]}
      >
        {/* Background circle */}
        <View style={[styles.circle, styles.backgroundCircle]} />
        
        {/* Progress circle */}
        <View style={[styles.circle, styles.progressCircle]}>
          <View
            style={[
              styles.progressFill,
              {
                width: radius * 2,
                height: radius * 2,
                borderRadius: radius,
                borderWidth: 4,
                borderColor: 'transparent',
                borderTopColor: '#007AFF',
                transform: [{ rotate: `${-90 + (progress / 100) * 360}deg` }],
              },
            ]}
          />
        </View>

        {/* Center icon */}
        <View style={styles.centerIcon}>
          <Ionicons name="lock-closed" size={24} color="#007AFF" />
        </View>

        {/* Floating particles */}
        {!reducedMotion && (
          <>
            <Animated.View
              style={[
                styles.particle,
                styles.particle1,
                {
                  opacity: particleOpacity,
                  transform: [{ scale: particleScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.particle,
                styles.particle2,
                {
                  opacity: particleOpacity,
                  transform: [{ scale: particleScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.particle,
                styles.particle3,
                {
                  opacity: particleOpacity,
                  transform: [{ scale: particleScale }],
                },
              ]}
            />
          </>
        )}
      </Animated.View>

      {/* Progress text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        <Text style={styles.statusText}>Encrypting...</Text>
      </Animated.View>

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
  progressContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  backgroundCircle: {
    borderWidth: 4,
    borderColor: '#E1E1E1',
  },
  progressCircle: {
    borderWidth: 4,
    borderColor: 'transparent',
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  centerIcon: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  particle1: {
    top: -10,
    right: 10,
  },
  particle2: {
    bottom: 10,
    left: -10,
  },
  particle3: {
    top: 10,
    left: 10,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
}); 