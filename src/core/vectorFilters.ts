import { logInfo, Component } from './logger';
import { VectorMetadata } from './vectorMetadata';

export interface ObjectFilterOptions {
  labels?: string[]; // any of these labels present
  minConfidence?: number; // 0..1
}

export function filterByObjectLabel(
  items: VectorMetadata[],
  options: ObjectFilterOptions
): VectorMetadata[] {
  const labels = (options.labels || []).map((l) => l.toLowerCase());
  const minConf = options.minConfidence ?? 0;
  const result = items.filter((m) => {
    const objs = m.objects || [];
    return objs.some((o) => {
      const labelOk = labels.length === 0 || labels.includes(o.label.toLowerCase());
      const confOk = typeof o.confidence === 'number' ? o.confidence >= minConf : true;
      return labelOk && confOk;
    });
  });
  logInfo(Component.APP, 'Applied object label filter', {
    input: items.length,
    output: result.length,
    labels,
    minConfidence: minConf,
  });
  return result;
}

export interface FaceCountFilterOptions {
  minFaces?: number;
  maxFaces?: number;
}

export function filterByFaceCount(
  items: VectorMetadata[],
  options: FaceCountFilterOptions
): VectorMetadata[] {
  const minFaces = options.minFaces ?? 0;
  const maxFaces = options.maxFaces ?? Number.POSITIVE_INFINITY;
  const result = items.filter((m) => {
    const count = (m.faces || []).length;
    return count >= minFaces && count <= maxFaces;
  });
  logInfo(Component.APP, 'Applied face count filter', {
    input: items.length,
    output: result.length,
    minFaces,
    maxFaces: isFinite(maxFaces) ? maxFaces : 'inf',
  });
  return result;
}

export interface SceneFilterOptions {
  tagsAny?: string[]; // match if any tag present
  tagsAll?: string[]; // match if all tags present
}

export function filterBySceneTags(
  items: VectorMetadata[],
  options: SceneFilterOptions
): VectorMetadata[] {
  const tagsAny = (options.tagsAny || []).map((t) => t.toLowerCase());
  const tagsAll = (options.tagsAll || []).map((t) => t.toLowerCase());
  const result = items.filter((m) => {
    const sceneTags = (m.scene?.tags || []).map((t) => t.toLowerCase());
    const anyOk = tagsAny.length === 0 || tagsAny.some((t) => sceneTags.includes(t));
    const allOk = tagsAll.length === 0 || tagsAll.every((t) => sceneTags.includes(t));
    return anyOk && allOk;
  });
  logInfo(Component.APP, 'Applied scene tag filter', {
    input: items.length,
    output: result.length,
    tagsAny,
    tagsAll,
  });
  return result;
}
