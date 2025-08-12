import { VectorMetadata } from './vectorMetadata';
import { logInfo, Component } from './logger';

export interface SummaryStats {
  count: number;
  min: number;
  max: number;
  mean: number;
}

export interface DimStats {
  dims: number[];
  min: number;
  max: number;
  modes: Array<{ dim: number; count: number }>;
}

export interface VectorAnalytics {
  items: number;
  facesTotal: number;
  objectsTotal: number;
  scenesWithEmbedding: number;
  faceDims: DimStats;
  objectDims: DimStats;
  faceArea: SummaryStats;
  faceEmbeddingNorm: SummaryStats;
  objectEmbeddingNorm: SummaryStats;
  sceneEmbeddingNorm: SummaryStats;
  topObjectLabels: Array<{ label: string; count: number }>;
  createdAtRange?: { earliest: string; latest: string };
}

function summarize(values: number[]): SummaryStats {
  const filtered = values.filter((v) => Number.isFinite(v));
  const count = filtered.length;
  if (count === 0) return { count: 0, min: 0, max: 0, mean: 0 };
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;
  for (const v of filtered) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  return { count, min, max, mean: sum / count };
}

function norm(a: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  return Math.sqrt(s);
}

function dimsStats(dims: number[]): DimStats {
  const filtered = dims.filter((d) => Number.isFinite(d));
  if (filtered.length === 0) return { dims: [], min: 0, max: 0, modes: [] };
  const min = Math.min(...filtered);
  const max = Math.max(...filtered);
  const map = new Map<number, number>();
  for (const d of filtered) map.set(d, (map.get(d) || 0) + 1);
  const modes = Array.from(map.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([dim, count]) => ({ dim, count }));
  return { dims: filtered, min, max, modes };
}

export function computeVectorAnalytics(items: VectorMetadata[]): VectorAnalytics {
  const facesTotal = items.reduce((acc, m) => acc + (m.faces?.length || 0), 0);
  const objectsTotal = items.reduce((acc, m) => acc + (m.objects?.length || 0), 0);
  const scenesWithEmbedding = items.reduce((acc, m) => acc + (Array.isArray(m.scene?.embedding) ? 1 : 0), 0);

  const faceDimsArr: number[] = [];
  const objectDimsArr: number[] = [];
  const faceAreas: number[] = [];
  const faceNorms: number[] = [];
  const objectNorms: number[] = [];
  const sceneNorms: number[] = [];
  const labelCounts = new Map<string, number>();

  const createdAts: number[] = [];

  for (const m of items) {
    if (m.createdAt) {
      const t = Date.parse(m.createdAt);
      if (!Number.isNaN(t)) createdAts.push(t);
    }

    for (const f of m.faces || []) {
      faceDimsArr.push(Array.isArray(f.embedding) ? f.embedding.length : 0);
      faceAreas.push(Math.max(0, f.boundingBox.width * f.boundingBox.height));
      if (Array.isArray(f.embedding)) faceNorms.push(norm(f.embedding));
    }
    for (const o of m.objects || []) {
      if (Array.isArray(o.embedding)) {
        objectDimsArr.push(o.embedding.length);
        objectNorms.push(norm(o.embedding));
      }
      const label = (o.label || '').toLowerCase();
      if (label) labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
    }
    if (Array.isArray(m.scene?.embedding)) sceneNorms.push(norm(m.scene!.embedding));
  }

  const topObjectLabels = Array.from(labelCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([label, count]) => ({ label, count }));

  const createdAtRange = createdAts.length > 0
    ? { earliest: new Date(Math.min(...createdAts)).toISOString(), latest: new Date(Math.max(...createdAts)).toISOString() }
    : undefined;

  const analytics: VectorAnalytics = {
    items: items.length,
    facesTotal,
    objectsTotal,
    scenesWithEmbedding,
    faceDims: dimsStats(faceDimsArr),
    objectDims: dimsStats(objectDimsArr),
    faceArea: summarize(faceAreas),
    faceEmbeddingNorm: summarize(faceNorms),
    objectEmbeddingNorm: summarize(objectNorms),
    sceneEmbeddingNorm: summarize(sceneNorms),
    topObjectLabels,
    createdAtRange,
  };

  logInfo(Component.APP, 'Computed vector analytics', {
    items: analytics.items,
    facesTotal: analytics.facesTotal,
    objectsTotal: analytics.objectsTotal,
    scenesWithEmbedding: analytics.scenesWithEmbedding,
    topLabelCount: analytics.topObjectLabels.length,
  });

  return analytics;
} 