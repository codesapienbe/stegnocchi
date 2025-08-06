/**
 * Success Celebration Animation Component
 * Animated confetti/celebration effect upon success
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

interface SuccessCelebrationAnimationProps {
  isActive: boolean;
  children?: React.ReactNode;
}

export const SuccessCelebrationAnimation: React.FC<SuccessCelebrationAnimationProps> = ({
  isActive,
  children
}) => {
  const { reducedMotion } = useAnimation();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Celebration animation sequence
  useEffect(() => {
    if (isActive && !reducedMotion) {
      // Scale in with bounce
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 300,
          easing: Easing.out(Easing.back(1.5)),
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]).start();

      // Rotation animation
      Animated.timing(rotationAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }).start();

      // Confetti animation
      Animated.timing(confettiAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();

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
      scaleAnim.setValue(0);
      rotationAnim.setValue(0);
      confettiAnim.setValue(0);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isActive, scaleAnim, rotationAnim, confettiAnim, pulseAnim, reducedMotion]);

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const confettiOpacity = confettiAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const confettiScale = confettiAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // Generate confetti pieces
  const confettiPieces = Array.from({ length: 12 }, (_, index) => {
    const angle = (index / 12) * 360;
    const distance = 80;
    const x = Math.cos((angle * Math.PI) / 180) * distance;
    const y = Math.sin((angle * Math.PI) / 180) * distance;

    return (
      <Animated.View
        key={index}
        style={[
          styles.confettiPiece,
          {
            backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][index % 6],
            transform: [
              { translateX: x },
              { translateY: y },
              { scale: confettiScale },
              { rotate: `${angle}deg` },
            ],
            opacity: confettiOpacity,
          },
        ]}
      />
    );
  });

  return (
    <View style={styles.container}>
      {/* Confetti pieces */}
      <View style={styles.confettiContainer}>
        {confettiPieces}
      </View>

      {/* Success icon */}
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
        <View style={styles.iconBackground}>
          <Ionicons name="checkmark-circle" size={64} color="#34C759" />
        </View>
      </Animated.View>

      {/* Success text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: confettiOpacity,
            transform: [{ scale: confettiScale }],
          },
        ]}
      >
        <Text style={styles.successText}>Success!</Text>
        <Text style={styles.subtitleText}>Operation completed</Text>
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
  confettiContainer: {
    position: 'absolute',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconBackground: {
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
  },
  successText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
}); 