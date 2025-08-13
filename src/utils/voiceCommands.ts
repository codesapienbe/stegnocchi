import { logInfo, logWarn, logError, Component } from '@/core/logger';

export interface VoiceStartOptions {
  lang?: string;
  interimResults?: boolean;
  continuous?: boolean;
}

export interface VoiceSession {
  stop: () => void;
}

function getRecognitionCtor(): any | null {
  if (typeof window === 'undefined') return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isVoiceSupported(): boolean {
  return !!getRecognitionCtor();
}

export function startVoiceListening(
  onResult: (text: string, isFinal: boolean) => void,
  onError?: (err: string) => void,
  options: VoiceStartOptions = {}
): VoiceSession | null {
  try {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      logWarn(Component.APP, 'Voice recognition not supported in this environment');
      return null;
    }
    const recognition = new Ctor();
    recognition.lang = options.lang || 'en-US';
    recognition.interimResults = options.interimResults ?? true;
    recognition.continuous = options.continuous ?? false;

    recognition.onstart = () => {
      logInfo(Component.APP, 'Voice recognition started', { lang: recognition.lang });
    };
    recognition.onresult = (event: any) => {
      let transcript = '';
      let isFinal = false;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        transcript += res[0].transcript;
        if (res.isFinal) isFinal = true;
      }
      onResult(transcript, isFinal);
    };
    recognition.onerror = (event: any) => {
      const msg = event?.error ? String(event.error) : 'unknown_error';
      logError(Component.APP, 'Voice recognition error', { message: msg });
      onError?.(msg);
    };
    recognition.onend = () => {
      logInfo(Component.APP, 'Voice recognition ended');
    };

    recognition.start();

    return {
      stop: () => {
        try {
          recognition.stop();
          logInfo(Component.APP, 'Voice recognition stop requested');
        } catch (e) {
          logError(Component.APP, 'Voice recognition stop error', { message: e instanceof Error ? e.message : String(e) });
        }
      },
    };
  } catch (e) {
    logError(Component.APP, 'Voice recognition initialization failed', { message: e instanceof Error ? e.message : String(e) });
    onError?.(e instanceof Error ? e.message : String(e));
    return null;
  }
} 