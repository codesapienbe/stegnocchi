import { logInfo, logWarn, logError, Component } from '../logger';

/**
 * Initialize TensorFlow.js backend on web environments.
 * No-ops on non-web platforms to avoid requiring tfjs-react-native.
 */
export async function initializeTfjsBackend(preferredBackend: 'webgl' | 'cpu' = 'webgl'): Promise<void> {
  try {
    // Only attempt TFJS init in web-like environments
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      logInfo(Component.APP, 'TFJS backend initialization skipped (non-web environment)');
      return;
    }

    const tf = await import('@tensorflow/tfjs');

    try {
      await tf.ready();
    } catch (e) {
      logWarn(Component.APP, 'TFJS ready() failed; continuing with best-effort', {
        error: e instanceof Error ? e.message : String(e),
      });
    }

    const available = tf.getBackend();
    logInfo(Component.APP, 'TFJS current backend', { backend: available });

    // Try preferred backend first, then fallback to cpu
    if (available !== preferredBackend) {
      try {
        const ok = await tf.setBackend(preferredBackend);
        if (ok) {
          await tf.ready();
          logInfo(Component.APP, 'TFJS backend set', { backend: preferredBackend });
        } else {
          throw new Error('setBackend returned false');
        }
      } catch (e) {
        logWarn(Component.APP, 'TFJS preferred backend not available; falling back to cpu', {
          preferredBackend,
          error: e instanceof Error ? e.message : String(e),
        });
        try {
          const ok = await tf.setBackend('cpu');
          if (ok) {
            await tf.ready();
            logInfo(Component.APP, 'TFJS backend set', { backend: 'cpu' });
          }
        } catch (e2) {
          logError(Component.APP, 'TFJS backend fallback failed', {
            error: e2 instanceof Error ? e2.message : String(e2),
          });
        }
      }
    }
  } catch (e) {
    logWarn(Component.APP, 'TFJS not installed or failed to initialize; TF-dependent models may be unavailable', {
      error: e instanceof Error ? e.message : String(e),
    });
  }
} 