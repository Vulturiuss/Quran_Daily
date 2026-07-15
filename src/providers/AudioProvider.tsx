import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import { usePathname } from 'expo-router';
import { Platform } from 'react-native';

import { getVerseAudioUrl } from '@/services/quranApi';
import { Verse } from '@/types';

type AudioPlayerInstance = ReturnType<typeof useAudioPlayer>;

interface AudioContextValue {
  completedRepeatTrackId?: string;
  currentTrackId?: string;
  error?: string;
  isBuffering: boolean;
  isPlaying: boolean;
  loadingTrackId?: string;
  /**
   * The shared player. Exposed so the word-highlight can subscribe to its
   * position on its own — reading `currentTime` into this context value would
   * rebuild it every 200 ms and re-render every verse button (see the statusRef
   * note below), which is exactly what that indirection avoids.
   */
  player: AudioPlayerInstance;
  repeatRemaining: number;
  playVerse: (verse: Verse, reciterId: string, repeatCount?: number) => Promise<void>;
  stop: () => Promise<void>;
}

const AudioContext = createContext<AudioContextValue | undefined>(undefined);

export function AudioProvider({ children }: { children: ReactNode }) {
  const player = useAudioPlayer(null, {
    downloadFirst: Platform.OS !== 'web',
    updateInterval: 200,
  });
  const status = useAudioPlayerStatus(player);
  const [completedRepeatTrackId, setCompletedRepeatTrackId] = useState<string>();
  const [currentTrackId, setCurrentTrackId] = useState<string>();
  const [loadingTrackId, setLoadingTrackId] = useState<string>();
  const [error, setError] = useState<string>();
  const repeatRemainingRef = useRef(0);
  const repeatTarget = useRef(0);
  const [repeatRemaining, setRepeatRemaining] = useState(0);
  const finishHandled = useRef(false);
  // Bumped on every play/stop. A verse's audio URL is fetched asynchronously, so
  // tapping verse B while A is still resolving would otherwise let A's late
  // response win `player.replace` and drive the wrong button's state.
  const playRequestId = useRef(0);
  // `status` ticks every 200 ms while playing. Reading it through a ref keeps
  // playVerse/stop stable, so the context value below does not have to be
  // rebuilt 5x/s — which used to re-render every consumer, including the
  // hundreds of verse buttons mounted during a review of a long surah.
  const statusRef = useRef(status);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    void setAudioModeAsync({
      allowsRecording: false,
      interruptionMode: 'doNotMix',
      playsInSilentMode: true,
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
  }, []);

  useEffect(() => {
    if (status.error) {
      setError(status.error);
    }

    if (status.didJustFinish && !finishHandled.current) {
      finishHandled.current = true;
      if (repeatRemainingRef.current > 1) {
        repeatRemainingRef.current -= 1;
        setRepeatRemaining(repeatRemainingRef.current);
        void player
          .seekTo(0)
          .then(() => player.play())
          .catch(() => setError('La lecture en boucle a été interrompue.'));
      } else {
        repeatRemainingRef.current = 0;
        setRepeatRemaining(0);
        if (repeatTarget.current > 1) {
          setCompletedRepeatTrackId(currentTrackId);
        }
      }
    } else if (!status.didJustFinish) {
      finishHandled.current = false;
    }
  }, [currentTrackId, player, status.didJustFinish, status.error]);

  const playVerse = useCallback(
    async (verse: Verse, reciterId: string, repeatCount = 1) => {
      const trackId = `${reciterId}:${verse.verseKey}`;
      const current = statusRef.current;
      const requestId = (playRequestId.current += 1);
      setError(undefined);
      setCompletedRepeatTrackId(undefined);

      if (currentTrackId === trackId) {
        if (current.playing) {
          player.pause();
          return;
        }

        repeatTarget.current = Math.max(1, repeatCount);
        repeatRemainingRef.current = repeatTarget.current;
        setRepeatRemaining(repeatTarget.current);
        try {
          if (
            current.didJustFinish ||
            (current.duration > 0 && current.currentTime >= current.duration)
          ) {
            await player.seekTo(0);
          }
          player.play();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : 'Impossible de lire le verset.');
        }
        return;
      }

      setLoadingTrackId(trackId);
      try {
        const audioUrl = await getVerseAudioUrl(verse, reciterId);
        // A newer play or a stop happened while the URL was resolving: this
        // request is stale, so it must not seize the player.
        if (playRequestId.current !== requestId) return;
        if (!audioUrl) throw new Error('Audio indisponible pour ce verset.');

        player.replace(audioUrl);
        repeatTarget.current = Math.max(1, repeatCount);
        repeatRemainingRef.current = repeatTarget.current;
        setRepeatRemaining(repeatTarget.current);
        finishHandled.current = false;
        setCurrentTrackId(trackId);
        player.play();
      } catch (caught) {
        if (playRequestId.current === requestId) {
          setError(caught instanceof Error ? caught.message : 'Impossible de charger l’audio.');
        }
      } finally {
        if (playRequestId.current === requestId) setLoadingTrackId(undefined);
      }
    },
    [currentTrackId, player],
  );

  const stop = useCallback(async () => {
    // Invalidate any in-flight load so it cannot start playing after we stop.
    playRequestId.current += 1;
    player.pause();
    repeatRemainingRef.current = 0;
    setRepeatRemaining(0);
    if (statusRef.current.currentTime > 0) await player.seekTo(0);
  }, [player]);

  // The player lives at the root, so it outlives every screen. Stop it whenever
  // the route changes, or a recitation started on one screen would keep playing
  // over the next with no visible control to silence it.
  const pathname = usePathname();
  useEffect(() => {
    void stop();
  }, [pathname, stop]);

  const value = useMemo<AudioContextValue>(
    () => ({
      completedRepeatTrackId,
      currentTrackId,
      error,
      isBuffering: status.isBuffering,
      isPlaying: status.playing,
      loadingTrackId,
      player,
      repeatRemaining,
      playVerse,
      stop,
    }),
    [
      completedRepeatTrackId,
      currentTrackId,
      error,
      loadingTrackId,
      player,
      playVerse,
      repeatRemaining,
      status.isBuffering,
      status.playing,
      stop,
    ],
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useQuranAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useQuranAudio must be used inside AudioProvider');
  return context;
}
