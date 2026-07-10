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
  completedRepeatTrackId?: string;
  currentTrackId?: string;
  error?: string;
  isBuffering: boolean;
  isPlaying: boolean;
  loadingTrackId?: string;
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
        void player.seekTo(0).then(() => player.play());
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

  async function playVerse(verse: Verse, reciterId: string, repeatCount = 1) {
    const trackId = `${reciterId}:${verse.verseKey}`;
    setError(undefined);
    setCompletedRepeatTrackId(undefined);

    if (currentTrackId === trackId) {
      if (status.playing) {
        player.pause();
        return;
      }

      repeatTarget.current = Math.max(1, repeatCount);
      repeatRemainingRef.current = repeatTarget.current;
      setRepeatRemaining(repeatTarget.current);
      try {
        if (status.didJustFinish || (status.duration > 0 && status.currentTime >= status.duration)) {
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
      if (!audioUrl) throw new Error('Audio indisponible pour ce verset.');

      player.replace(audioUrl);
      repeatTarget.current = Math.max(1, repeatCount);
      repeatRemainingRef.current = repeatTarget.current;
      setRepeatRemaining(repeatTarget.current);
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
    repeatRemainingRef.current = 0;
    setRepeatRemaining(0);
    if (status.currentTime > 0) await player.seekTo(0);
  }

  const value = useMemo<AudioContextValue>(
    () => ({
      completedRepeatTrackId,
      currentTrackId,
      error,
      isBuffering: status.isBuffering,
      isPlaying: status.playing,
      loadingTrackId,
      repeatRemaining,
      playVerse,
      stop,
    }),
    [
      completedRepeatTrackId,
      currentTrackId,
      error,
      loadingTrackId,
      repeatRemaining,
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
