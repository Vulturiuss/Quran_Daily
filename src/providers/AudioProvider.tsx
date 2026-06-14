import {
  createContext,
  ReactNode,
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
import { Platform } from 'react-native';

import { getVerseAudioUrl } from '@/services/quranApi';
import { Verse } from '@/types';

interface AudioContextValue {
  currentTrackId?: string;
  error?: string;
  isBuffering: boolean;
  isPlaying: boolean;
  loadingTrackId?: string;
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
  const [currentTrackId, setCurrentTrackId] = useState<string>();
  const [loadingTrackId, setLoadingTrackId] = useState<string>();
  const [error, setError] = useState<string>();
  const repeatRemaining = useRef(0);
  const finishHandled = useRef(false);

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
      if (repeatRemaining.current > 1) {
        repeatRemaining.current -= 1;
        void player.seekTo(0).then(() => player.play());
      } else {
        repeatRemaining.current = 0;
      }
    } else if (!status.didJustFinish) {
      finishHandled.current = false;
    }
  }, [player, status.didJustFinish, status.error]);

  async function playVerse(verse: Verse, reciterId: string, repeatCount = 1) {
    const trackId = `${reciterId}:${verse.verseKey}`;
    setError(undefined);

    if (currentTrackId === trackId) {
      if (status.playing) {
        player.pause();
        return;
      }

      repeatRemaining.current = Math.max(1, repeatCount);
      if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) {
        await player.seekTo(0);
      }
      player.play();
      return;
    }

    setLoadingTrackId(trackId);
    try {
      const audioUrl = await getVerseAudioUrl(verse, reciterId);
      if (!audioUrl) throw new Error('Audio indisponible pour ce verset.');

      player.replace(audioUrl);
      repeatRemaining.current = Math.max(1, repeatCount);
      finishHandled.current = false;
      setCurrentTrackId(trackId);
      player.play();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Impossible de charger l’audio.');
    } finally {
      setLoadingTrackId(undefined);
    }
  }

  async function stop() {
    player.pause();
    repeatRemaining.current = 0;
    if (status.currentTime > 0) await player.seekTo(0);
  }

  const value = useMemo<AudioContextValue>(
    () => ({
      currentTrackId,
      error,
      isBuffering: status.isBuffering,
      isPlaying: status.playing,
      loadingTrackId,
      playVerse,
      stop,
    }),
    [
      currentTrackId,
      error,
      loadingTrackId,
      status.isBuffering,
      status.playing,
      status.currentTime,
      status.didJustFinish,
      status.duration,
    ],
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useQuranAudio() {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useQuranAudio must be used inside AudioProvider');
  return context;
}
