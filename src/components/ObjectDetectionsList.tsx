import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ObjectDetection } from '@/core/vectorMetadata';

interface ObjectDetectionsListProps {
  objects: ObjectDetection[];
}

export const ObjectDetectionsList: React.FC<ObjectDetectionsListProps> = ({ objects }) => {
  const renderItem = ({ item, index }: { item: ObjectDetection; index: number }) => (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          <Ionicons name="cube" size={16} color="#1f2937" />
          <Text style={styles.title} numberOfLines={1}>{item.label || `Object ${index + 1}`}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{Math.round(item.confidence * 100)}%</Text>
        </View>
      </View>
      <Text style={styles.boxText}>
        {`x:${Math.round(item.boundingBox.x)} y:${Math.round(item.boundingBox.y)} w:${Math.round(item.boundingBox.width)} h:${Math.round(item.boundingBox.height)}`}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={objects}
      keyExtractor={(_, idx) => `obj_${idx}`}
      renderItem={renderItem}
      scrollEnabled={false}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '75%',
  },
  title: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#DCFCE7',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  boxText: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
  },
}); 