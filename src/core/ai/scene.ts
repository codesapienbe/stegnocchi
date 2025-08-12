import { logInfo, logError, Component } from '../logger';
import { SceneEmbedding } from '../vectorMetadata';

export async function extractSceneEmbedding(model: any, image: any): Promise<SceneEmbedding | null> {
  try {
    if (!model || typeof model.embed !== 'function') {
      throw new Error('Scene model must expose an embed(image) method');
    }
    const embedding: number[] = await model.embed(image);
    const tags: string[] | undefined = Array.isArray((model as any).tags) ? (model as any).tags : undefined;
    const description: string | undefined = typeof (model as any).describe === 'function' ? await (model as any).describe(image) : undefined;
    const result: SceneEmbedding = {
      embedding: Array.isArray(embedding) ? embedding : [],
      tags,
      description,
    };
    logInfo(Component.APP, 'Scene embedding extracted', { dim: result.embedding.length, hasTags: !!tags?.length, hasDescription: !!description });
    return result;
  } catch (error) {
    logError(Component.APP, 'Scene embedding extraction exception', { error: error instanceof Error ? error.message : String(error) });
    return null;
  }
} 