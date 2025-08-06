/**
 * Mobile Modal Component
 * Modal abstraction for cross-platform compatibility
 */

import React, { useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MobileModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  animationType?: 'none' | 'slide' | 'fade';
  transparent?: boolean;
  presentationStyle?: 'fullScreen' | 'pageSheet' | 'formSheet' | 'overFullScreen';
}

export const MobileModal: React.FC<MobileModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  animationType = 'slide',
  transparent = true,
  presentationStyle = 'pageSheet',
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 300,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const handleBackdropPress = () => {
    if (transparent) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={transparent}
      animationType={animationType}
      presentationStyle={presentationStyle}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={styles.container}>
        {/* Backdrop */}
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleBackdropPress}
        >
          <Animated.View
            style={[
              styles.backdropAnimated,
              {
                opacity: fadeAnim,
              },
            ]}
          />
        </TouchableOpacity>

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View style={styles.header}>
              {title && (
                <Text style={styles.title} numberOfLines={1}>
                  {title}
                </Text>
              )}
              {showCloseButton && (
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={24} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Content */}
          <View style={styles.content}>{children}</View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropAnimated: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    maxWidth: Dimensions.get('window').width - 40,
    maxHeight: Dimensions.get('window').height * 0.8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E1E1',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
}); 