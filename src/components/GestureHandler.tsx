import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ViewStyle, GestureResponderEvent } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAccessibility } from '../hooks/useAccessibility';
import { logInfo, Component } from '../core/logger';

export interface GestureHandlerProps {
  children: React.ReactNode;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  longPressDelay?: number;
  doubleTapDelay?: number;
  swipeThreshold?: number;
  style?: ViewStyle;
  disabled?: boolean;
}

/**
 * Gesture handler for advanced touch interactions
 */
export const GestureHandler: React.FC<GestureHandlerProps> = ({
  children,
  onLongPress,
  onDoubleTap,
  onSwipeLeft,
  onSwipeRight,
  longPressDelay = 500,
  doubleTapDelay = 300,
  swipeThreshold = 50,
  style,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const { reducedMotion } = useAccessibility();
  const [isPressed, setIsPressed] = useState(false);
  
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e: GestureResponderEvent) => {
    if (disabled) return;

    const { pageX, pageY } = e.nativeEvent;
    touchStartRef.current = { x: pageX, y: pageY, time: Date.now() };
    setIsPressed(true);

    // Start long press timer
    if (onLongPress) {
      longPressTimerRef.current = setTimeout(() => {
        logInfo(Component.UI, 'Long press detected', {});
        onLongPress();
        setIsPressed(false);
      }, longPressDelay);
    }
  }, [disabled, onLongPress, longPressDelay]);

  const handleTouchEnd = useCallback((e: GestureResponderEvent) => {
    if (disabled || !touchStartRef.current) return;

    const { pageX, pageY } = e.nativeEvent;
    const { x: startX, y: startY, time: startTime } = touchStartRef.current;
    const currentTime = Date.now();
    const duration = currentTime - startTime;

    clearLongPressTimer();
    setIsPressed(false);

    // Check for double tap
    if (onDoubleTap && currentTime - lastTapRef.current < doubleTapDelay) {
      logInfo(Component.UI, 'Double tap detected', {});
      onDoubleTap();
      lastTapRef.current = 0;
      touchStartRef.current = null;
      return;
    }

    lastTapRef.current = currentTime;

    // Check for swipe gestures
    const deltaX = pageX - startX;
    const deltaY = pageY - startY;
    const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > swipeThreshold;
    const isQuickSwipe = duration < 300;

    if (isHorizontalSwipe && isQuickSwipe) {
      if (deltaX > 0 && onSwipeRight) {
        logInfo(Component.UI, 'Swipe right detected', { deltaX });
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        logInfo(Component.UI, 'Swipe left detected', { deltaX });
        onSwipeLeft();
      }
    }

    touchStartRef.current = null;
  }, [disabled, onDoubleTap, onSwipeLeft, onSwipeRight, doubleTapDelay, swipeThreshold, clearLongPressTimer]);

  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer();
    setIsPressed(false);
    touchStartRef.current = null;
  }, [clearLongPressTimer]);

  const containerStyle = [
    styles.container,
    {
      backgroundColor: isPressed ? theme.colors.primaryLight : 'transparent',
    },
    style,
  ];

  return (
    <View
      style={containerStyle}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      accessibilityRole="button"
      accessibilityLabel="Gesture enabled element"
      accessibilityHint="Long press for options, double tap for quick action"
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
}); 