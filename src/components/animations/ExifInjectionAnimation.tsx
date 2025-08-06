/**
 * EXIF Injection Animation Component
 * Visual "data stream" effect for EXIF injection
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

interface ExifInjectionAnimationProps {
  isActive: boolean;
  fieldName: string;
  progress: number; // 0-100
  children?: React.ReactNode;
}

export const ExifInjectionAnimation: React.FC<ExifInjectionAnimationProps> = ({
  isActive,
  fieldName,
  progress,
  children
}) => {
  const { reducedMotion } = useAnimation();
  const streamAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dataParticles = useRef(new Animated.Value(0)).current;
  const fieldGlowAnim = useRef(new Animated.Value(0)).current;

  // Data stream animation
  useEffect(() => {
    if (isActive && !reducedMotion) {
      // Continuous data stream
      Animated.loop(
        Animated.timing(streamAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Data particles animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(dataParticles, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(dataParticles, {
            toValue: 0,
            duration: 1000,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Field glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(fieldGlowAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false, // opacity doesn't support native driver
          }),
          Animated.timing(fieldGlowAnim, {
            toValue: 0.3,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      streamAnim.stopAnimation();
      pulseAnim.stopAnimation();
      dataParticles.stopAnimation();
      fieldGlowAnim.stopAnimation();
    }
  }, [isActive, streamAnim, pulseAnim, dataParticles, fieldGlowAnim, reducedMotion]);

  const streamTranslateY = streamAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const particleOpacity = dataParticles.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  const particleScale = dataParticles.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.5],
  });

  return (
    <View style={styles.container}>
      {/* Data stream effect */}
      <View style={styles.streamContainer}>
        <Animated.View
          style={[
            styles.dataStream,
            {
              transform: [{ translateY: streamTranslateY }],
            },
          ]}
        >
          {[...Array(5)].map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.streamDot,
                {
                  opacity: particleOpacity,
                  transform: [{ scale: particleScale }],
                },
              ]}
            />
          ))}
        </Animated.View>
      </View>

      {/* Field indicator */}
      <Animated.View
        style={[
          styles.fieldIndicator,
          {
            transform: [{ scale: pulseAnim }],
            opacity: fieldGlowAnim,
          },
        ]}
      >
        <Ionicons name="hardware-chip" size={24} color="#007AFF" />
        <Text style={styles.fieldName}>{fieldName}</Text>
      </Animated.View>

      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
      </View>

      {/* Status text */}
      <Text style={styles.statusText}>Injecting into {fieldName}...</Text>

      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: 20,
  },
  streamContainer: {
    position: 'relative',
    width: 200,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  dataStream: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streamDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginHorizontal: 4,
  },
  fieldIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  fieldName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    width: '100%',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E1E1E1',
    borderRadius: 2,
    marginRight: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1a1a1a',
    minWidth: 30,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
    textAlign: 'center',
  },
}); 