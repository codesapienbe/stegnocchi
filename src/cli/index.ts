export interface CliModuleInfo {
  name: 'cli';
  version: string;
}

export function getCliModuleInfo(): CliModuleInfo {
  return { name: 'cli', version: '0.1.0' };
}

export type { CliModuleInfo as DefaultCliExport }; 