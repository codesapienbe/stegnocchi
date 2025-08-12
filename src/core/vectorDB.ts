import { logInfo, logWarn, logError, Component } from './logger';

export interface VectorRecord {
  id: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

export interface QueryResult {
  id: string;
  score: number; // similarity 0..1
  metadata?: Record<string, any>;
}

export interface VectorDbProvider {
  upsert(records: VectorRecord[]): Promise<void>;
  delete(ids: string[]): Promise<void>;
  query(embedding: number[], topK: number, minScore?: number): Promise<QueryResult[]>;
  count(): Promise<number>;
  clear(): Promise<void>;
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) s += a[i] * b[i];
  return s;
}

function norm(a: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  return Math.sqrt(s);
}

function cosine(a: number[], b: number[]): number {
  const na = norm(a) || 1;
  const nb = norm(b) || 1;
  return Math.max(-1, Math.min(1, dot(a, b) / (na * nb)));
}

export class LocalVectorDb implements VectorDbProvider {
  private entries: Map<string, VectorRecord> = new Map();

  async upsert(records: VectorRecord[]): Promise<void> {
    for (const r of records) {
      if (!Array.isArray(r.embedding) || r.embedding.length === 0) {
        logWarn(Component.APP, 'Skipping upsert for record with empty embedding', { id: r.id });
        continue;
      }
      this.entries.set(r.id, r);
    }
    logInfo(Component.APP, 'Upserted vectors', { count: records.length, total: this.entries.size });
  }

  async delete(ids: string[]): Promise<void> {
    for (const id of ids) this.entries.delete(id);
    logInfo(Component.APP, 'Deleted vectors', { count: ids.length, total: this.entries.size });
  }

  async query(embedding: number[], topK: number, minScore: number = 0): Promise<QueryResult[]> {
    if (!Array.isArray(embedding) || embedding.length === 0) return [];
    const results: QueryResult[] = [];
    for (const [id, rec] of this.entries.entries()) {
      const score = cosine(embedding, rec.embedding);
      if (score >= minScore) results.push({ id, score, metadata: rec.metadata });
    }
    results.sort((a, b) => b.score - a.score);
    const sliced = results.slice(0, Math.max(1, topK));
    logInfo(Component.APP, 'Vector DB query', { topK, minScore, resultCount: sliced.length, corpus: this.entries.size });
    return sliced;
  }

  async count(): Promise<number> {
    return this.entries.size;
  }

  async clear(): Promise<void> {
    this.entries.clear();
    logInfo(Component.APP, 'Cleared vector DB', {});
  }
}

export class VectorDbRegistry {
  private provider: VectorDbProvider;

  constructor(provider?: VectorDbProvider) {
    this.provider = provider || new LocalVectorDb();
  }

  setProvider(provider: VectorDbProvider): void {
    this.provider = provider;
    logInfo(Component.APP, 'Vector DB provider set', { provider: provider.constructor.name });
  }

  getProvider(): VectorDbProvider {
    return this.provider;
  }
}

export const vectorDb = new VectorDbRegistry(); 