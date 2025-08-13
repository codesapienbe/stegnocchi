/**
 * Main App component for EXIF Steganography
 * React Native cross-platform implementation
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import { AppStateProvider } from '@/hooks/useAppState';
import { SteganographyProvider } from '@/hooks/useSteganography';
import { AnimationProvider } from '@/components/animations/AnimationProvider';
import { Navigation } from '@/navigation/Navigation';
import { logAppStartup, logAppShutdown } from '@/core/logger';
import { registerFaceDetectorLoaders, registerObjectDetectorLoaders, registerSceneEmbedderLoaders } from '@/core';

const App: React.FC = () => {
  useEffect(() => {
    // Log application startup
    logAppStartup('1.0.0', __DEV__ ? 'development' : 'production');

    // Register AI model loaders (face/object/scene)
    try {
      registerFaceDetectorLoaders();
      registerObjectDetectorLoaders();
      registerSceneEmbedderLoaders();
    } catch (e) {
      // Registration just wires loaders; any missing deps will be surfaced when loading
    }

    // Cleanup on unmount
    return () => {
      logAppShutdown('Application terminated');
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppStateProvider>
          <SteganographyProvider>
            <AnimationProvider>
              <NavigationContainer>
                <Navigation />
                <StatusBar style="auto" />
              </NavigationContainer>
              <Toast />
            </AnimationProvider>
          </SteganographyProvider>
        </AppStateProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App; 