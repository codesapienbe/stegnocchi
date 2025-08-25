export interface ApiModuleInfo {
  name: 'api';
  version: string;
}

export function getApiModuleInfo(): ApiModuleInfo {
  return { name: 'api', version: '0.1.0' };
}

export type { ApiModuleInfo as DefaultApiExport }; 