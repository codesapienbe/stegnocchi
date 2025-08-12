import { logInfo, logWarn, Component } from './logger';

export interface SimilarityThresholds {
  face: number; // 0..1
  object: number; // 0..1
  scene: number; // 0..1
}

const DEFAULTS: SimilarityThresholds = {
  face: 0.6,
  object: 0.5,
  scene: 0.4,
};

let current: SimilarityThresholds = { ...DEFAULTS };

function clamp01(x: number): number {
  if (Number.isNaN(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

export function getSimilarityThresholds(): SimilarityThresholds {
  return { ...current };
}

export function setSimilarityThresholds(update: Partial<SimilarityThresholds>): void {
  const next: SimilarityThresholds = {
    face: clamp01(update.face ?? current.face),
    object: clamp01(update.object ?? current.object),
    scene: clamp01(update.scene ?? current.scene),
  };

  if (next.face !== current.face || next.object !== current.object || next.scene !== current.scene) {
    current = next;
    logInfo(Component.APP, 'Updated similarity thresholds', { thresholds: current });
  } else {
    logWarn(Component.APP, 'Similarity thresholds unchanged', { thresholds: current });
  }
}

export function resetSimilarityThresholds(): void {
  current = { ...DEFAULTS };
  logInfo(Component.APP, 'Reset similarity thresholds to defaults', { thresholds: current });
} 