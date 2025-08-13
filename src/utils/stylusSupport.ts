import { useEffect } from 'react';
import { Platform } from 'react-native';
import { logInfo, logWarn, Component } from '@/core/logger';

export function isStylusPointerEvent(evt: any): boolean {
  try {
    return !!evt && (evt.pointerType === 'pen' || evt.pointerType === 'stylus');
  } catch {
    return false;
  }
}

export function useStylusDetection(onDetected: () => void): void {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Stylus detection is web-pointer based only here; native no-op
      return;
    }

    const handler = (evt: any) => {
      if (isStylusPointerEvent(evt)) {
        try {
          onDetected();
          logInfo(Component.UI, 'Stylus input detected', {
            pointerType: evt.pointerType || 'pen',
          });
        } catch (e) {
          logWarn(Component.UI, 'Stylus detection callback failed', {
            message: e instanceof Error ? e.message : String(e),
          });
        }
      }
    };

    window.addEventListener('pointerdown' as any, handler, { passive: true } as any);
    return () => {
      window.removeEventListener('pointerdown' as any, handler as any);
    };
  }, [onDetected]);
} 