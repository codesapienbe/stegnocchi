/**
 * Result Screen Component
 * Displays operation results for steganography operations
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { VectorPreview } from '@/components';

import { RootStackParamList } from '@/navigation/Navigation';

type ResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Result'>;
type ResultScreenRouteProp = RouteProp<RootStackParamList, 'Result'>;

export const ResultScreen: React.FC = () => {
  const navigation = useNavigation<ResultScreenNavigationProp>();
  const route = useRoute<ResultScreenRouteProp>();
  const { success, title, message, data } = route.params;

  const handleBack = (): void => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={success ? 'checkmark-circle' : 'close-circle'}
            size={80}
            color={success ? '#34C759' : '#FF3B30'}
          />
        </View>
        
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        
        {data && (
          <View style={styles.dataContainer}>
            <Text style={styles.dataLabel}>Additional Data:</Text>
            <Text style={styles.dataText}>{JSON.stringify(data, null, 2)}</Text>
          </View>
        )}

        {data && (Array.isArray((data as any).faces) || Array.isArray((data as any).objects) || (data as any).scene) && (
          <View style={[styles.dataContainer, { marginTop: 16 }]}> 
            <Text style={styles.dataLabel}>Vector Metadata</Text>
            <VectorPreview
              faces={(data as any).faces}
              objects={(data as any).objects}
              scene={(data as any).scene}
            />
          </View>
        )}
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={20} color="white" />
          <Text style={styles.backButtonText}>Back to Main</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  dataContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    width: '100%',
  },
  dataLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  dataText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
  },
  footer: {
    padding: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
}); 