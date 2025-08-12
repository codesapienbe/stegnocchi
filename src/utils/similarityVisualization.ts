import { logInfo, Component } from '@/core/logger';
import { SimilarityResult } from '@/core/vectorSearch';

export interface BarSeries {
  label: string;
  value: number; // 0..1 similarity
  color: string; // hex
  meta?: Record<string, any>;
}

export interface VisualizationData<T> {
  title: string;
  minScore: number;
  maxScore: number;
  averageScore: number;
  items: BarSeries[];
  raw: SimilarityResult<T>[];
}

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function interpolateColor(similarity: number): string {
  // Green (#2ecc71) at 1.0, Yellow (#f1c40f) at ~0.6, Red (#e74c3c) at 0.0
  const t = clamp01(similarity);
  const r0 = 0xe7, g0 = 0x4c, b0 = 0x3c; // low (red)
  const r1 = 0xf1, g1 = 0xc4, b1 = 0x0f; // mid (yellow)
  const r2 = 0x2e, g2 = 0xcc, b2 = 0x71; // high (green)

  let r: number, g: number, b: number;
  if (t < 0.6) {
    const k = t / 0.6;
    r = Math.round(r0 + (r1 - r0) * k);
    g = Math.round(g0 + (g1 - g0) * k);
    b = Math.round(b0 + (b1 - b0) * k);
  } else {
    const k = (t - 0.6) / 0.4;
    r = Math.round(r1 + (r2 - r1) * k);
    g = Math.round(g1 + (g2 - g1) * k);
    b = Math.round(b1 + (b2 - b1) * k);
  }
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
    .toString(16)
    .padStart(2, '0')}`;
}

export function buildSimilarityBars<T>(
  results: SimilarityResult<T>[],
  options?: { title?: string; labelFor?: (item: T, index: number) => string; metaFor?: (item: T) => Record<string, any> }
): VisualizationData<T> {
  const title = options?.title || 'Similarity Results';
  if (!Array.isArray(results) || results.length === 0) {
    logInfo(Component.APP, 'No similarity results to visualize', { title });
    return {
      title,
      minScore: 0,
      maxScore: 0,
      averageScore: 0,
      items: [],
      raw: [],
    };
  }

  const scores = results.map((r) => clamp01(r.similarity));
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

  const items: BarSeries[] = results.map((r, idx) => {
    const label = options?.labelFor ? options.labelFor(r.item, idx) : `#${idx + 1}`;
    return {
      label,
      value: clamp01(r.similarity),
      color: interpolateColor(r.similarity),
      meta: options?.metaFor ? options.metaFor(r.item) : undefined,
    };
  });

  logInfo(Component.APP, 'Built similarity visualization data', {
    title,
    count: results.length,
    minScore: +minScore.toFixed(3),
    maxScore: +maxScore.toFixed(3),
    averageScore: +averageScore.toFixed(3),
  });

  return { title, minScore, maxScore, averageScore, items, raw: results };
} 