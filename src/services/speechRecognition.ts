/**
 * On-device speech recognition, kept entirely optional.
 *
 * `expo-speech-recognition` is a native module: it exists only in a development
 * build that bundled it, never in Expo Go, and never in the plain test/tsc
 * environment. So it is loaded through a guarded `require` — exactly how the app
 * treats Supabase and RevenueCat — and everything downstream reads
 * `isSpeechRecognitionAvailable` before offering the feature. With the module
 * absent the whole layer is inert and the app is unchanged.
 *
 * The recogniser is used in *constrained* mode: we already know the verse, so a
 * rough Arabic transcription is enough for `matchRecitation` to align against the
 * known text. Accuracy on classical Qur'anic Arabic is imperfect by nature, which
 * is why the checker downstream is deliberately lenient and never a pass/fail.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

import { splitArabicWords } from '@/utils/recitation';

/** One alternative the engine heard, best first. */
interface SpeechResult {
  transcript: string;
  confidence?: number;
}

interface SpeechResultEvent {
  results: SpeechResult[];
  isFinal: boolean;
}

interface SpeechErrorEvent {
  error?: string;
  message?: string;
}

interface Subscription {
  remove(): void;
}

interface SpeechModule {
  requestPermissionsAsync(): Promise<{ granted: boolean }>;
  start(options: {
    lang: string;
    interimResults?: boolean;
    continuous?: boolean;
  }): void | Promise<void>;
  stop(): void | Promise<void>;
  abort?(): void | Promise<void>;
  addListener(event: 'result', listener: (e: SpeechResultEvent) => void): Subscription;
  addListener(event: 'error', listener: (e: SpeechErrorEvent) => void): Subscription;
  addListener(event: 'end' | 'start', listener: () => void): Subscription;
}

function loadModule(): SpeechModule | null {
  try {
    // Resolved by Metro only when a dev build bundled the package. Absent in Expo
    // Go and in tsc/tests, where the catch keeps the app fully functional. A
    // static import would make this hard dependency mandatory; require keeps it
    // optional, exactly as the app treats every other native service.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('expo-speech-recognition');
    const native = mod?.ExpoSpeechRecognitionModule;
    return native && typeof native.start === 'function' ? (native as SpeechModule) : null;
  } catch {
    return null;
  }
}

const speechModule = loadModule();

/** True only in a build that actually bundled the native recogniser. */
export const isSpeechRecognitionAvailable = speechModule !== null;

export type RecitationListenState =
  | 'unsupported'
  | 'idle'
  | 'listening'
  | 'error';

export interface SpeechRecitation {
  state: RecitationListenState;
  /** Final words heard so far, in order — fed straight to `buildRecitationReview`. */
  words: string[];
  /** The live, not-yet-final fragment, for a subtle "listening…" echo. */
  partial: string;
  error: string | null;
  available: boolean;
  start(): Promise<void>;
  stop(): Promise<void>;
  reset(): void;
}

/**
 * Drives one recitation capture. Accumulates every finalised fragment (the engine
 * emits them as the reciter pauses) into a single ordered word list, and exposes
 * the current interim fragment separately so the UI can show it is still hearing.
 */
export function useSpeechRecitation(lang = 'ar-SA'): SpeechRecitation {
  const [state, setState] = useState<RecitationListenState>(
    isSpeechRecognitionAvailable ? 'idle' : 'unsupported',
  );
  const [words, setWords] = useState<string[]>([]);
  const [partial, setPartial] = useState('');
  const [error, setError] = useState<string | null>(null);
  const finals = useRef<string[]>([]);

  useEffect(() => {
    if (!speechModule) return undefined;
    const subs = [
      speechModule.addListener('result', (e) => {
        const best = e.results?.[0]?.transcript?.trim() ?? '';
        if (e.isFinal) {
          if (best) finals.current.push(best);
          setPartial('');
          setWords(splitArabicWords(finals.current.join(' ')));
        } else {
          setPartial(best);
        }
      }),
      speechModule.addListener('error', (e) => {
        setError(e.message || 'La reconnaissance vocale a échoué.');
        setState('error');
      }),
      speechModule.addListener('end', () => {
        setPartial('');
        setState((s) => (s === 'listening' ? 'idle' : s));
      }),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);

  const start = useCallback(async () => {
    if (!speechModule) {
      setState('unsupported');
      return;
    }
    setError(null);
    finals.current = [];
    setWords([]);
    setPartial('');
    try {
      const permission = await speechModule.requestPermissionsAsync();
      if (!permission?.granted) {
        setError('Accès au micro refusé.');
        setState('error');
        return;
      }
      await speechModule.start({ lang, interimResults: true, continuous: true });
      setState('listening');
    } catch {
      setError('Reconnaissance vocale indisponible sur cet appareil.');
      setState('error');
    }
  }, [lang]);

  const stop = useCallback(async () => {
    if (!speechModule) return;
    try {
      await speechModule.stop();
    } catch {
      // A stop that races the engine ending is harmless.
    }
    setState((s) => (s === 'listening' ? 'idle' : s));
  }, []);

  const reset = useCallback(() => {
    finals.current = [];
    setWords([]);
    setPartial('');
    setError(null);
    setState(isSpeechRecognitionAvailable ? 'idle' : 'unsupported');
  }, []);

  return { state, words, partial, error, available: isSpeechRecognitionAvailable, start, stop, reset };
}
