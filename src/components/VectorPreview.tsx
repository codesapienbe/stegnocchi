import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FaceEmbedding, ObjectDetection, SceneEmbedding } from '@/core/vectorMetadata';

interface VectorPreviewProps {
  faces?: FaceEmbedding[];
  objects?: ObjectDetection[];
  scene?: SceneEmbedding;
}

export const VectorPreview: React.FC<VectorPreviewProps> = ({ faces, objects, scene }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vector Metadata Preview</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Faces:</Text>
        <View style={[styles.badge, styles.badgeBlue]}>
          <Text style={styles.badgeText}>{faces?.length ?? 0}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Objects:</Text>
        <View style={[styles.badge, styles.badgeGreen]}>
          <Text style={styles.badgeText}>{objects?.length ?? 0}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Scene:</Text>
        <View style={[styles.badge, styles.badgePurple]}>
          <Text style={styles.badgeText}>{scene ? '1' : '0'}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  label: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  badge: {
    minWidth: 28,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeBlue: {
    backgroundColor: '#DBEAFE',
  },
  badgeGreen: {
    backgroundColor: '#DCFCE7',
  },
  badgePurple: {
    backgroundColor: '#EDE9FE',
  },
  badgeText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '600',
  },
}); 