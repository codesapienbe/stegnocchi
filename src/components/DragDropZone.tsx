import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { useAccessibility } from '../hooks/useAccessibility';
import { logInfo, Component } from '../core/logger';

export interface DragDropZoneProps {
  onFilesDrop: (files: File[]) => void;
  acceptedTypes?: string[];
  maxFiles?: number;
  maxSize?: number; // in bytes
  style?: ViewStyle;
  children?: React.ReactNode;
}

/**
 * Drag and drop zone for file uploads (web only)
 */
export const DragDropZone: React.FC<DragDropZoneProps> = ({
  onFilesDrop,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxFiles = 1,
  maxSize = 50 * 1024 * 1024, // 50MB
  style,
  children,
}) => {
  const { theme } = useTheme();
  const { reducedMotion } = useAccessibility();
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragValid, setIsDragValid] = useState(true);
  const dropZoneRef = useRef<View>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFiles = useCallback((files: FileList): { valid: File[]; invalid: string[] } => {
    const validFiles: File[] = [];
    const invalidReasons: string[] = [];

    if (files.length > maxFiles) {
      invalidReasons.push(`Too many files. Maximum allowed: ${maxFiles}`);
      return { valid: [], invalid: invalidReasons };
    }

    Array.from(files).forEach((file, index) => {
      // Check file type
      if (!acceptedTypes.includes(file.type)) {
        invalidReasons.push(`${file.name}: Invalid file type. Accepted: ${acceptedTypes.join(', ')}`);
        return;
      }

      // Check file size
      if (file.size > maxSize) {
        invalidReasons.push(
          `${file.name}: File too large. Maximum size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`
        );
        return;
      }

      validFiles.push(file);
    });

    return { valid: validFiles, invalid: invalidReasons };
  }, [acceptedTypes, maxFiles, maxSize]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    setIsDragValid(true);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const { valid, invalid } = validateFiles(files);

    if (invalid.length > 0) {
      setIsDragValid(false);
      logInfo(Component.FILE_SYSTEM, 'Drag drop validation failed', {
        invalidFiles: invalid,
      });
      return;
    }

    if (valid.length > 0) {
      logInfo(Component.FILE_SYSTEM, 'Files dropped successfully', {
        fileCount: valid.length,
        fileNames: valid.map(f => f.name),
      });
      onFilesDrop(valid);
    }
  }, [validateFiles, onFilesDrop]);

  const containerStyle = [
    styles.container,
    {
      borderColor: isDragOver ? theme.colors.primary : theme.colors.border,
      backgroundColor: isDragOver ? theme.colors.primaryLight : theme.colors.surface,
    },
    style,
  ];

  const textStyle = {
    color: isDragValid ? theme.colors.text : theme.colors.error,
  };

  return (
    <View
      ref={dropZoneRef}
      style={containerStyle}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      accessibilityRole="button"
      accessibilityLabel="Drag and drop image files here"
      accessibilityHint="Drop image files to upload them for steganography"
    >
      {children || (
        <View style={styles.content}>
          <Text style={[styles.title, textStyle]}>
            {isDragOver ? 'Drop files here' : 'Drag & drop images here'}
          </Text>
          <Text style={[styles.subtitle, textStyle]}>
            {isDragValid
              ? `Supports: ${acceptedTypes.join(', ')} (max ${(maxSize / 1024 / 1024).toFixed(1)}MB)`
              : 'Invalid files detected'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 24,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.2s ease',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
  },
}); 