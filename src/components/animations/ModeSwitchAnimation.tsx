/**
 * Mode Switch Animation Component
 * Transition with swipe gestures for mode switching
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  PanGestureHandler,
  State,
  GestureHandlerRootView,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAnimation } from './AnimationProvider';

interface ModeSwitchAnimationProps {
  currentMode: 'hide' | 'extract';
  onModeChange: (mode: 'hide' | 'extract') => void;
  children?: React.ReactNode;
}

export const ModeSwitchAnimation: React.FC<ModeSwitchAnimationProps> = ({
  currentMode,
  onModeChange,
  children
}) => {
  const { reducedMotion } = useAnimation();
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationY: translateY } }],
    { useNativeDriver: true }
  );

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationY, velocityY } = event.nativeEvent;
      
      // Determine swipe direction and threshold
      const threshold = 50;
      const velocityThreshold = 500;
      
      if (translationY < -threshold || velocityY < -velocityThreshold) {
        // Swipe up - switch to hide mode
        if (currentMode !== 'hide') {
          animateModeChange('hide');
        }
      } else if (translationY > threshold || velocityY > velocityThreshold) {
        // Swipe down - switch to extract mode
        if (currentMode !== 'extract') {
          animateModeChange('extract');
        }
      }
      
      // Reset position
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  };

  const animateModeChange = (newMode: 'hide' | 'extract') => {
    if (reducedMotion) {
      onModeChange(newMode);
      return;
    }

    // Scale and fade out animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.5,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change mode
      onModeChange(newMode);
      
      // Scale and fade in animation
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const getModeIcon = () => {
    return currentMode === 'hide' ? 'lock-closed' : 'lock-open';
  };

  const getModeColor = () => {
    return currentMode === 'hide' ? '#007AFF' : '#34C759';
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
        activeOffsetY={[-10, 10]}
      >
        <Animated.View
          style={[
            styles.content,
            {
              transform: [
                { translateY },
                { scale: scaleAnim },
              ],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Mode indicator */}
          <View style={styles.modeIndicator}>
            <View style={[styles.iconContainer, { backgroundColor: getModeColor() }]}>
              <Ionicons name={getModeIcon()} size={24} color="white" />
            </View>
            <View style={styles.modeText}>
              <Text style={styles.modeTitle}>
                {currentMode === 'hide' ? 'Hide Message' : 'Extract Message'}
              </Text>
              <Text style={styles.modeSubtitle}>
                {currentMode === 'hide' 
                  ? 'Swipe down to extract' 
                  : 'Swipe up to hide'
                }
              </Text>
            </View>
          </View>

          {children}
        </Animated.View>
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modeText: {
    flex: 1,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  modeSubtitle: {
    fontSize: 12,
    color: '#666',
  },
}); 