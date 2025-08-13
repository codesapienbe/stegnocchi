/**
 * Navigation component for EXIF Steganography App
 * React Native stack navigation setup
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MainScreen } from '@/screens/MainScreen';
import { ResultScreen } from '@/screens/ResultScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { SearchScreen } from '@/screens/SearchScreen';
import { BatchScreen } from '@/screens/BatchScreen';

// Navigation types
export type RootStackParamList = {
  Main: undefined;
  Result: {
    success: boolean;
    title: string;
    message: string;
    data?: any;
  };
  Settings: undefined;
  Search: undefined;
  Batch: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

export const Navigation: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen 
        name="Main" 
        component={MainScreen}
        options={{
          title: 'Stegnocchi',
        }}
      />
      <Stack.Screen 
        name="Result" 
        component={ResultScreen}
        options={{
          title: 'Result',
        }}
      />
      <Stack.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen 
        name="Search" 
        component={SearchScreen}
        options={{
          title: 'Search',
        }}
      />
      <Stack.Screen 
        name="Batch" 
        component={BatchScreen}
        options={{
          title: 'Batch',
        }}
      />
    </Stack.Navigator>
  );
}; 