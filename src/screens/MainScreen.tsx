/**
 * Main Screen Component
 * Primary interface for EXIF Steganography App
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';

import { useAppState } from '@/hooks/useAppState';
import { useSteganography } from '@/hooks/useSteganography';
import { RootStackParamList } from '@/navigation/Navigation';
import { logUserInteraction, Component } from '@/core/logger';
import { MobileLayout, MobileScrollView } from '@/components/layout';
import { FileUploadAnimation } from '@/components/animations';
import { AIAnalysisProgress } from '@/components/animations';
import { pickFiles, useResponsive } from '@/utils';
import { isVoiceSupported, startVoiceListening } from '@/utils';
import Logo from '@/components/Logo';
import { VectorPreview } from '@/components';

type MainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

export const MainScreen: React.FC = () => {
  const navigation = useNavigation<MainScreenNavigationProp>();
  const { state, dispatch } = useAppState();
  const { validateFile, validateOperation } = useSteganography();
  const [isLoading, setIsLoading] = useState(false);
  const { isMobile, isTablet, isDesktop, SPACING, PADDING, TOUCH_TARGETS } = useResponsive();
  const [voiceSession, setVoiceSession] = useState<null | { stop: () => void }>(null);
  const [isListening, setIsListening] = useState(false);

  const pickImage = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const result = await pickFiles({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 1,
      });

      if (!result.cancelled && result.file) {
        // Validate file
        const validation = validateFile(result.file);
        if (!validation.isValid) {
          Alert.alert('Invalid File', validation.errors.join('\n'));
          return;
        }

        // Set file in app state
        dispatch({ type: 'SET_FILE', payload: result.file });
        dispatch({ type: 'SET_PHASE', payload: 'input' });
        
        logUserInteraction('image_picked', true, {
          fileName: result.fileName,
          fileSize: result.fileSize,
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
      logUserInteraction('image_picked', false, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleHideMode = (): void => {
    if (!state.file) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }
    
    dispatch({ type: 'SET_MODE', payload: 'hide' });
    logUserInteraction('mode_selected', true, { mode: 'hide' });
  };

  const handleExtractMode = (): void => {
    if (!state.file) {
      Alert.alert('No Image', 'Please select an image first');
      return;
    }
    
    dispatch({ type: 'SET_MODE', payload: 'extract' });
    logUserInteraction('mode_selected', true, { mode: 'extract' });
  };

  const resetApp = (): void => {
    dispatch({ type: 'RESET_STATE' });
    logUserInteraction('app_reset', true);
  };

  const handleVoiceToggle = (): void => {
    if (voiceSession) {
      voiceSession.stop();
      setVoiceSession(null);
      setIsListening(false);
      return;
    }
    const session = startVoiceListening(
      (text, isFinal) => {
        if (isFinal) {
          dispatch({ type: 'SET_MESSAGE', payload: text });
        }
      },
      (err) => {
        // Non-fatal: log and reset listening state
        console.error('Voice error', err);
        setIsListening(false);
        setVoiceSession(null);
      },
      { lang: 'en-US', interimResults: true, continuous: false }
    );
    if (session) {
      setVoiceSession(session);
      setIsListening(true);
    }
  };

  return (
    <MobileLayout>
      <MobileScrollView>
        {/* Header */}
        <View style={styles.header}>
          <Logo size={80} style={styles.logo} />
          <Text style={styles.title}>Stegnocchi</Text>
          <Text style={styles.subtitle}>EXIF Steganography</Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {state.phase === 'waiting' && (
            <View style={styles.uploadSection}>
              <FileUploadAnimation
                isUploading={isLoading}
                isComplete={false}
                hasError={false}
              >
                <TouchableOpacity
                  style={[styles.uploadButton, { minHeight: TOUCH_TARGETS.large }]}
                  onPress={pickImage}
                  disabled={isLoading}
                >
                  <Ionicons 
                    name={isLoading ? "hourglass" : "cloud-upload"} 
                    size={48} 
                    color="#007AFF" 
                  />
                  <Text style={styles.uploadText}>
                    {isLoading ? 'Loading...' : 'Select Image'}
                  </Text>
                  <Text style={styles.uploadSubtext}>
                    Choose a JPEG image to begin
                  </Text>
                </TouchableOpacity>
              </FileUploadAnimation>
            </View>
          )}

          {state.phase === 'processing' && (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <AIAnalysisProgress isActive={true} progress={42} stage={'initializing'} />
            </View>
          )}

          {state.phase === 'input' && state.file && (
            <View style={styles.inputSection}>
              <View style={styles.fileInfo}>
                <Ionicons name="image" size={24} color="#007AFF" />
                <Text style={styles.fileName}>{state.file.name}</Text>
              </View>
              
              <View style={styles.toggleRow}>
                <View style={styles.toggleTextContainer}>
                  <Text style={styles.toggleLabel}>Include Vector Metadata</Text>
                  <Text style={styles.toggleSubtext}>Attach AI vector metadata when hiding</Text>
                </View>
                <Switch
                  value={state.includeVectorMetadata}
                  onValueChange={(value) => dispatch({ type: 'SET_INCLUDE_VECTOR_METADATA', payload: value })}
                />
              </View>
              
              <View style={styles.modeButtons}>
                <TouchableOpacity
                  style={[styles.modeButton, styles.hideButton, { minHeight: TOUCH_TARGETS.medium }]}
                  onPress={handleHideMode}
                >
                  <Ionicons name="lock-closed" size={24} color="white" />
                  <Text style={styles.modeButtonText}>Hide Message</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modeButton, styles.extractButton, { minHeight: TOUCH_TARGETS.medium }]}
                  onPress={handleExtractMode}
                >
                  <Ionicons name="lock-open" size={24} color="white" />
                  <Text style={styles.modeButtonText}>Extract Message</Text>
                </TouchableOpacity>
              </View>

              {isVoiceSupported() && (
                <TouchableOpacity
                  style={[styles.voiceButton, { minHeight: TOUCH_TARGETS.medium }]}
                  onPress={handleVoiceToggle}
                >
                  <Ionicons name={isListening ? 'mic-off' : 'mic'} size={20} color="#1a1a1a" />
                  <Text style={styles.voiceButtonText}>{isListening ? 'Stop Voice Input' : 'Voice Input'}</Text>
                </TouchableOpacity>
              )}

              {state.includeVectorMetadata && (
                <View style={{ width: '100%', marginTop: 16 }}>
                  <VectorPreview faces={[]} objects={[]} scene={undefined} />
                </View>
              )}
            </View>
          )}

          {state.error && (
            <View style={styles.errorSection}>
              <Text style={styles.errorText}>{state.error}</Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.resetButton, { minHeight: TOUCH_TARGETS.medium }]} 
            onPress={resetApp}
          >
            <Ionicons name="refresh" size={20} color="#666" />
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
        </View>
      </MobileScrollView>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  logo: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  uploadSection: {
    alignItems: 'center',
  },
  uploadButton: {
    alignItems: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginTop: 16,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  inputSection: {
    alignItems: 'center',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginLeft: 12,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    width: '100%'
  },
  toggleTextContainer: {
    flexDirection: 'column',
    flex: 1,
    marginRight: 12,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  toggleSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  modeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  hideButton: {
    backgroundColor: '#007AFF',
  },
  extractButton: {
    backgroundColor: '#34C759',
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 8,
  },
  voiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  voiceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginLeft: 8,
  },
  errorSection: {
    backgroundColor: '#FFE5E5',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resetButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
}); 