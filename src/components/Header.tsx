/**
 * Header Component
 * Navigation header with logo and title
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Logo from './Logo';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  logoSize?: number;
}

export const Header: React.FC<HeaderProps> = ({
  title = 'Stegnocchi',
  subtitle = 'EXIF Steganography',
  showLogo = true,
  logoSize = 40,
}) => {
  return (
    <View style={styles.container}>
      {showLogo && (
        <Logo size={logoSize} style={styles.logo} />
      )}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logo: {
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});

export default Header; 