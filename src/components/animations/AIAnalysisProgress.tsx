import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAnimation } from './AnimationProvider';

interface AIAnalysisProgressProps {
  isActive: boolean;
  progress: number; // 0-100
  stage?: 'faces' | 'objects' | 'scenes' | 'initializing' | 'finalizing';
}

export const AIAnalysisProgress: React.FC<AIAnalysisProgressProps> = ({
  isActive,
  progress,
  stage = 'initializing'
}) => {
  const { reducedMotion } = useAnimation();
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const sweepAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive && !reducedMotion) {
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(sweepAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(sweepAnim, {
            toValue: 0,
            duration: 1200,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      rotationAnim.stopAnimation();
      pulseAnim.stopAnimation();
      sweepAnim.stopAnimation();
    }
  }, [isActive, reducedMotion, rotationAnim, pulseAnim, sweepAnim]);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sweepOpacity = sweepAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.8],
  });

  const getStageLabel = (): string => {
    switch (stage) {
      case 'faces':
        return 'Analyzing faces...';
      case 'objects':
        return 'Detecting objects...';
      case 'scenes':
        return 'Extracting scene embeddings...';
      case 'finalizing':
        return 'Finalizing analysis...';
      default:
        return 'Initializing AI models...';
    }
  };

  const iconForStage = (): string => {
    switch (stage) {
      case 'faces':
        return 'happy-outline';
      case 'objects':
        return 'cube-outline';
      case 'scenes':
        return 'image-outline';
      case 'finalizing':
        return 'checkmark-done';
      default:
        return 'sparkles-outline';
    }
  };

  const radius = 44;
  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.radar,
          {
            transform: [{ rotate: spin }, { scale: pulseAnim }],
          },
        ]}
      >
        <View style={[styles.ring, { width: radius * 2, height: radius * 2, borderRadius: radius }]} />
        <View style={[styles.ringThin, { width: radius * 1.5, height: radius * 1.5, borderRadius: radius * 0.75 }]} />
        <View style={[styles.ringThin, { width: radius, height: radius, borderRadius: radius * 0.5 }]} />

        <Animated.View
          style={[
            styles.sweep,
            {
              width: radius * 2,
              height: radius * 2,
              borderRadius: radius,
              opacity: sweepOpacity,
            },
          ]}
        />

        <View style={styles.centerIcon}>
          <Ionicons name={iconForStage() as any} size={20} color="#4F46E5" />
        </View>
      </Animated.View>

      <View style={styles.textContainer}>
        <Text style={styles.progressText}>{Math.round(progress)}%</Text>
        <Text style={styles.statusText}>{getStageLabel()}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  radar: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: '#E0E7FF',
  },
  ringThin: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  sweep: {
    position: 'absolute',
    backgroundColor: '#A5B4FC',
  },
  centerIcon: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  progressText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  statusText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
}); 