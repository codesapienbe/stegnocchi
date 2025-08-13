import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FaceEmbedding } from '@/core/vectorMetadata';

interface FaceThumbnailGalleryProps {
  faces: FaceEmbedding[];
  onSelect?: (face: FaceEmbedding, index: number) => void;
}

export const FaceThumbnailGallery: React.FC<FaceThumbnailGalleryProps> = ({ faces, onSelect }) => {
  const renderItem = ({ item, index }: { item: FaceEmbedding; index: number }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onSelect && onSelect(item, index)}
      accessibilityRole="button"
      accessibilityLabel={`Face ${index + 1}, confidence ${(item.confidence * 100).toFixed(0)} percent`}
    >
      <View style={styles.avatar}>
        <Ionicons name="happy" size={24} color="#1f2937" />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>#{index + 1}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{Math.round(item.confidence * 100)}%</Text>
        </View>
      </View>
      <Text style={styles.boxText}>
        {`x:${Math.round(item.boundingBox.x)} y:${Math.round(item.boundingBox.y)} w:${Math.round(item.boundingBox.width)} h:${Math.round(item.boundingBox.height)}`}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={faces}
        keyExtractor={(_, idx) => `face_${idx}`}
        renderItem={renderItem}
        numColumns={3}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    width: '32%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  avatar: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    color: '#111827',
    fontWeight: '700',
  },
  boxText: {
    marginTop: 6,
    fontSize: 10,
    color: '#6B7280',
  },
}); 