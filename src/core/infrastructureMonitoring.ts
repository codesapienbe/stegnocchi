import { logInfo, logWarn, Component } from './logger';

export interface MemoryStats {
  jsHeapTotalBytes?: number;
  jsHeapUsedBytes?: number;
}

export interface CpuStats {
  logicalProcessors?: number;
}

export interface BatteryStats {
  level?: number; // 0..1
  charging?: boolean;
}

export interface NetworkStats {
  isOnline?: boolean;
  type?: string;
}

export interface StorageStats {
  // Best-effort placeholders; platform support varies
  freeBytes?: number;
  totalBytes?: number;
}

export interface InfraMetricsSnapshot {
  timestamp: string;
  platform: 'web' | 'native' | 'unknown';
  memory?: MemoryStats;
  cpu?: CpuStats;
  battery?: BatteryStats;
  network?: NetworkStats;
  storage?: StorageStats;
}

type InfraSink = (snapshot: InfraMetricsSnapshot) => void | Promise<void>;

let monitorTimer: any = null;
let lastSnapshot: InfraMetricsSnapshot | null = null;
const sinks: InfraSink[] = [];

function getPlatform(): 'web' | 'native' | 'unknown' {
  // Heuristic detection
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') return 'native';
  if (typeof window !== 'undefined') return 'web';
  return 'unknown';
}

async function collectBattery(): Promise<BatteryStats | undefined> {
  try {
    const mod = await import('expo-battery').catch(() => null as any);
    if (mod && typeof mod.getBatteryLevelAsync === 'function') {
      const level = await mod.getBatteryLevelAsync();
      const state = await mod.getBatteryStateAsync();
      return { level: typeof level === 'number' ? level : undefined, charging: state === 2 /* charging */ };
    }
  } catch {}
  return undefined;
}

async function collectNetwork(): Promise<NetworkStats | undefined> {
  try {
    const mod = await import('expo-network').catch(() => null as any);
    if (mod && typeof mod.getNetworkStateAsync === 'function') {
      const state = await mod.getNetworkStateAsync();
      return { isOnline: !!state.isInternetReachable, type: state.type };
    }
  } catch {}
  // Fallback for web
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const isOnline = typeof navigator !== 'undefined' ? !!navigator.onLine : undefined;
    return { isOnline };
  } catch {}
  return undefined;
}

async function collectStorage(): Promise<StorageStats | undefined> {
  // No reliable cross-platform free/total without native modules; return undefined by default
  return undefined;
}

function collectMemory(): MemoryStats | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const perfMem = typeof performance !== 'undefined' && performance.memory ? performance.memory : undefined;
    if (perfMem) {
      return { jsHeapTotalBytes: perfMem.totalJSHeapSize, jsHeapUsedBytes: perfMem.usedJSHeapSize };
    }
  } catch {}
  return undefined;
}

function collectCpu(): CpuStats | undefined {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const logical = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : undefined;
    if (typeof logical === 'number') return { logicalProcessors: logical };
  } catch {}
  return undefined;
}

async function collectSnapshot(): Promise<InfraMetricsSnapshot> {
  const snapshot: InfraMetricsSnapshot = {
    timestamp: new Date().toISOString(),
    platform: getPlatform(),
    memory: collectMemory(),
    cpu: collectCpu(),
    battery: await collectBattery(),
    network: await collectNetwork(),
    storage: await collectStorage(),
  };
  lastSnapshot = snapshot;
  logInfo(Component.APP, 'Infra metrics snapshot', {
    platform: snapshot.platform,
    hasMemory: !!snapshot.memory,
    hasCpu: !!snapshot.cpu,
    hasBattery: !!snapshot.battery,
    hasNetwork: !!snapshot.network,
    hasStorage: !!snapshot.storage,
  });
  for (const sink of sinks) {
    try {
      const res = sink(snapshot);
      if (res && typeof (res as any).then === 'function') (res as Promise<void>).catch(() => {});
    } catch {}
  }
  return snapshot;
}

export function registerInfraSink(sink: InfraSink): void {
  sinks.push(sink);
}

export function unregisterInfraSink(sink: InfraSink): void {
  const i = sinks.indexOf(sink);
  if (i >= 0) sinks.splice(i, 1);
}

export function getLastInfraSnapshot(): InfraMetricsSnapshot | null {
  return lastSnapshot;
}

export async function getInfraSnapshotNow(): Promise<InfraMetricsSnapshot> {
  return await collectSnapshot();
}

export function startInfraMonitoring(intervalMs: number = 30000): void {
  if (monitorTimer) {
    logWarn(Component.APP, 'Infra monitoring already running');
    return;
  }
  monitorTimer = setInterval(() => {
    collectSnapshot().catch(() => {});
  }, Math.max(5000, intervalMs));
  logInfo(Component.APP, 'Infra monitoring started', { intervalMs: Math.max(5000, intervalMs) });
}

export function stopInfraMonitoring(): void {
  if (monitorTimer) {
    clearInterval(monitorTimer);
    monitorTimer = null;
    logInfo(Component.APP, 'Infra monitoring stopped');
  }
} 