import { logInfo, Component } from './logger';

export interface VectorTemplate {
  name: string;
  description: string;
  fields: string[];
}

const DEFAULT_TEMPLATES: VectorTemplate[] = [];

export function listVectorTemplates(): VectorTemplate[] {
  logInfo(Component.APP, 'Vector templates listed', { count: DEFAULT_TEMPLATES.length });
  return DEFAULT_TEMPLATES;
}

export function getVectorTemplateByName(name: string): VectorTemplate | null {
  const template = DEFAULT_TEMPLATES.find(t => t.name === name) || null;
  logInfo(Component.APP, 'Vector template lookup', { name, found: !!template });
  return template;
} 