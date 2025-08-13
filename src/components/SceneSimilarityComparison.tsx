import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SceneEmbedding } from '@/core/vectorMetadata';

interface SceneSimilarityComparisonProps {
  scene: SceneEmbedding;
}

export const SceneSimilarityComparison: React.FC<SceneSimilarityComparisonProps> = ({ scene }) => {
  const embeddingDimension = scene?.embedding?.length ?? 0;
  const tagCount = scene?.tags?.length ?? 0;

  const previewVector = useMemo(() => {
    if (!scene?.embedding || scene.embedding.length === 0) return '[]';
    const head = scene.embedding.slice(0, 5).map((n) => Number(n).toFixed(3));
    return `[${head.join(', ')}${scene.embedding.length > 5 ? ', ...' : ''}]`;
  }, [scene]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scene Similarity (Preview)</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Embedding dimension</Text>
        <View style={[styles.badge, styles.badgePurple]}>
          <Text style={styles.badgeText}>{embeddingDimension}</Text>
        </View>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Tags</Text>
        <View style={[styles.badge, styles.badgeBlue]}>
          <Text style={styles.badgeText}>{tagCount}</Text>
        </View>
      </View>
      {scene?.tags && scene.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {scene.tags.slice(0, 6).map((t, i) => (
            <View key={`${t}-${i}`} style={[styles.tagPill]}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
          {scene.tags.length > 6 && (
            <View style={[styles.tagPill, styles.morePill]}>
              <Text style={styles.tagText}>+{scene.tags.length - 6}</Text>
            </View>
          )}
        </View>
      )}
      {!!scene?.description && (
        <View style={{ marginTop: 8 }}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.description}>{scene.description}</Text>
        </View>
      )}
      <View style={{ marginTop: 12 }}>
        <Text style={styles.sectionLabel}>Vector preview</Text>
        <Text style={styles.vectorPreview}>{previewVector}</Text>
      </View>
      <View style={{ marginTop: 12 }}>
        <Text style={styles.sectionLabel}>Similarity</Text>
        <Text style={styles.note}>
          This preview shows metadata only. Similarity scoring and comparisons are handled by the core search flow.
        </Text>
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
    marginBottom: 8,
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
  badgeBlue: { backgroundColor: '#DBEAFE' },
  badgePurple: { backgroundColor: '#EDE9FE' },
  badgeText: {
    color: '#111827',
    fontSize: 12,
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tagPill: { backgroundColor: '#F3F4F6', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  morePill: { backgroundColor: '#E5E7EB' },
  tagText: { fontSize: 12, color: '#111827', fontWeight: '600' },
  sectionLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  description: { fontSize: 13, color: '#374151', lineHeight: 18 },
  vectorPreview: { fontSize: 12, color: '#6B7280', fontFamily: 'monospace' },
  note: { fontSize: 12, color: '#6B7280' },
}); 