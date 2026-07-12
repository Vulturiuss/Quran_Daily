import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

/**
 * How long the user has actually been on the current item.
 *
 * This is the measurement the anti-speed-run floors in `src/utils/effort.ts` are
 * compared against, so two things matter:
 *
 * - **Time is read from the clock, never counted in ticks.** A `setInterval` is
 *   throttled the moment the JS thread is busy — a long surah rendering a few
 *   hundred verses is enough — so counting ticks would credit less time than the
 *   user really spent and hold an honest reader hostage. The interval only asks
 *   "what does `Date.now()` say now?"; it is a repaint, not the source of truth.
 * - **Backgrounded time does not count.** Otherwise the floor is trivially
 *   defeated by leaving the app open, and — worse for an honest user — a session
 *   interrupted by a phone call would be credited with reading that never happened.
 */

const TICK_MS = 1000;

const WEB = Platform.OS === 'web';

function isForeground(status: AppStateStatus | null | undefined) {
  // On web, AppState is a thin shim over `document.visibilitychange`: it only
  // ever reports 'active' or 'background', and it can report nothing at all
  // before the first visibility change — which must not read as "backgrounded".
  // Native does have a third state: iOS is 'inactive' while the control centre
  // is dragged over the app, and no one is reading a verse through that.
  if (!status) return true;
  return WEB ? status !== 'background' : status === 'active';
}

export function useDwell(key: string | number | undefined) {
  const [seconds, setSeconds] = useState(0);
  // Time already banked from previous foreground stretches, plus the timestamp
  // the current stretch began — null while the app is backgrounded.
  const bankedMsRef = useRef(0);
  const startedAtRef = useRef<number | null>(null);

  const elapsed = useCallback(() => {
    const running = startedAtRef.current === null ? 0 : Date.now() - startedAtRef.current;
    return Math.floor((bankedMsRef.current + running) / 1000);
  }, []);

  const reset = useCallback(() => {
    bankedMsRef.current = 0;
    startedAtRef.current = isForeground(AppState.currentState) ? Date.now() : null;
    setSeconds(0);
  }, []);

  // A new verse or a new surah is a new item: the clock starts over.
  useEffect(() => {
    reset();
  }, [key, reset]);

  useEffect(() => {
    const tick = setInterval(() => setSeconds(elapsed()), TICK_MS);

    const subscription = AppState.addEventListener('change', (status) => {
      if (isForeground(status)) {
        if (startedAtRef.current === null) startedAtRef.current = Date.now();
      } else if (startedAtRef.current !== null) {
        bankedMsRef.current += Date.now() - startedAtRef.current;
        startedAtRef.current = null;
      }
      setSeconds(elapsed());
    });

    return () => {
      clearInterval(tick);
      subscription.remove();
    };
  }, [elapsed]);

  return { seconds, reset };
}
