import { Platform } from 'react-native';
import { logInfo, logWarn, logError, Component } from './logger';

let pendingClearTimer: any = null;

async function writeToClipboard(text: string): Promise<void> {
  // Web Clipboard API
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText) {
      await (navigator as any).clipboard.writeText(text);
      return;
    }
  } catch (error) {
    // fallthrough to RN fallback
  }

  // React Native fallback via dynamic import to avoid hard dependency
  try {
    const mod: any = await import('expo-clipboard');
    if (mod && (mod.setStringAsync || mod.setString)) {
      if (mod.setStringAsync) {
        await mod.setStringAsync(text);
      } else {
        mod.setString(text);
      }
      return;
    }
  } catch (error) {
    // ignore to throw below
  }

  throw new Error('No clipboard API available');
}

async function readFromClipboard(): Promise<string | null> {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).clipboard?.readText) {
      return await (navigator as any).clipboard.readText();
    }
  } catch (error) {
    // fallthrough
  }
  try {
    const mod: any = await import('expo-clipboard');
    if (mod && (mod.getStringAsync || mod.getString)) {
      if (mod.getStringAsync) return await mod.getStringAsync();
      return mod.getString();
    }
  } catch (error) {
    // ignore
  }
  return null;
}

export async function isClipboardAvailable(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return typeof navigator !== 'undefined' && !!(navigator as any).clipboard?.writeText;
  }
  try {
    const mod: any = await import('expo-clipboard');
    return !!(mod && (mod.setStringAsync || mod.setString));
  } catch {
    return false;
  }
}

export async function secureCopy(
  text: string,
  options?: { autoClearMs?: number }
): Promise<{ success: boolean; error?: string }> {
  const autoClearMs = typeof options?.autoClearMs === 'number' && options!.autoClearMs > 0 ? options!.autoClearMs : 15000;

  try {
    if (typeof text !== 'string') {
      return { success: false, error: 'Clipboard content must be a string' };
    }

    await writeToClipboard(text);

    if (pendingClearTimer) {
      clearTimeout(pendingClearTimer);
      pendingClearTimer = null;
    }

    pendingClearTimer = setTimeout(async () => {
      try {
        await writeToClipboard('');
        logInfo(Component.APP, 'Clipboard auto-cleared', { length: 0 });
      } catch (error) {
        logWarn(Component.APP, 'Failed to auto-clear clipboard', {});
      } finally {
        pendingClearTimer = null;
      }
    }, autoClearMs);

    logInfo(Component.APP, 'Copied to clipboard securely', { length: text.length, autoClearMs });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Clipboard copy failed';
    logError(Component.APP, 'Clipboard copy exception', { error: message });
    return { success: false, error: message };
  }
}

export async function clearClipboard(): Promise<boolean> {
  try {
    await writeToClipboard('');
    if (pendingClearTimer) {
      clearTimeout(pendingClearTimer);
      pendingClearTimer = null;
    }
    logInfo(Component.APP, 'Clipboard cleared on demand', {});
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Clipboard clear failed';
    logError(Component.APP, 'Clipboard clear exception', { error: message });
    return false;
  }
}
