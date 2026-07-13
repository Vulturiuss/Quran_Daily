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

import { useAccess } from '@/hooks/useAccess';
import {
  deleteAllDownloads,
  deleteSurah,
  downloadedBytes,
  downloadedSurahs,
  downloadSurah,
  isOfflineAudioSupported,
  isSurahDownloaded,
  pruneOtherReciters,
} from '@/services/offlineAudio';
import { useQuranStore } from '@/store/useQuranStore';
import { effectiveReciter } from '@/utils/access';
import { offlinePurge, offlineTargets } from '@/utils/offlinePlan';

/**
 * Keeps the recitation of what is actually being memorised on the phone.
 *
 * This is the whole difference with a music app: nobody has to build a playlist
 * and remember to hit "download". The surahs being learnt and the ones the SRS is
 * about to ask for are fetched on their own, one at a time, and dropped when they
 * stop mattering (see utils/offlinePlan.ts).
 *
 * Nothing here may block the UI or break on a bad network: a failed download is
 * simply not a downloaded surah, and streaming — free and unlimited — still
 * plays. The queue tries again on the next launch.
 */

interface OfflineAudioValue {
  supported: boolean;
  /** Bytes on disk, for the reciter in use and any leftovers. */
  bytes: number;
  /** Complete surahs on disk for the reciter in use. */
  downloaded: number[];
  /** The surah being fetched right now, if any. */
  activeSurah?: number;
  /** 0..1 for `activeSurah`. */
  activeProgress: number;
  /** Fetches one surah, waiting behind whatever is already downloading. */
  download: (surahNumber: number) => Promise<{ ok: boolean; reason?: string }>;
  remove: (surahNumber: number) => void;
  removeAll: () => void;
}

const OfflineAudioContext = createContext<OfflineAudioValue | null>(null);

export function OfflineAudioProvider({ children }: { children: ReactNode }) {
  const access = useAccess();
  const hydrated = useQuranStore((state) => state.hydrated);
  const preferredReciter = useQuranStore((state) => state.profile.preferredReciter);
  const auto = useQuranStore((state) => state.profile.offlineAudioAuto);
  const progress = useQuranStore((state) => state.progress);

  // The reciter actually played (a lapsed subscriber falls back to Mishary), so
  // the files on disk are the files the player will look for.
  const reciter = effectiveReciter(access.hasFullAccess, preferredReciter);

  const [bytes, setBytes] = useState(0);
  const [downloaded, setDownloaded] = useState<number[]>([]);
  const [activeSurah, setActiveSurah] = useState<number>();
  const [activeProgress, setActiveProgress] = useState(0);

  // Downloads are serialised on this promise: two surahs fetched at once would
  // saturate a phone connection and finish neither.
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const refresh = useCallback(() => {
    if (!isOfflineAudioSupported || !mounted.current) return;
    setBytes(downloadedBytes());
    setDownloaded(
      downloadedSurahs(reciter).filter((surahNumber) =>
        isSurahDownloaded(reciter, surahNumber),
      ),
    );
  }, [reciter]);

  useEffect(() => {
    if (hydrated) refresh();
  }, [hydrated, refresh]);

  const download = useCallback(
    (surahNumber: number) => {
      if (!isOfflineAudioSupported) {
        return Promise.resolve({ ok: false, reason: 'unsupported' });
      }

      const task = queue.current.then(async () => {
        if (isSurahDownloaded(reciter, surahNumber)) return { ok: true };

        if (mounted.current) {
          setActiveSurah(surahNumber);
          setActiveProgress(0);
        }
        const result = await downloadSurah(
          reciter,
          surahNumber,
          (value) => {
            if (mounted.current) setActiveProgress(value);
          },
          () => !mounted.current,
        );
        if (mounted.current) {
          setActiveSurah(undefined);
          setActiveProgress(0);
          refresh();
        }
        return result;
      });

      // A failed download must not poison the queue for the next surah.
      queue.current = task.catch(() => undefined);
      return task;
    },
    [reciter, refresh],
  );

  const remove = useCallback(
    (surahNumber: number) => {
      deleteSurah(reciter, surahNumber);
      refresh();
    },
    [reciter, refresh],
  );

  const removeAll = useCallback(() => {
    deleteAllDownloads();
    refresh();
  }, [refresh]);

  // Six reciters times Al-Baqara is some 400 MB of the same words. Changing voice
  // drops the others, whatever the auto setting: those files can no longer be
  // played by anything.
  const canDownload =
    isOfflineAudioSupported && hydrated && access.resolved && access.offlineAudio;

  useEffect(() => {
    if (!canDownload) return;
    pruneOtherReciters(reciter);
    refresh();
  }, [canDownload, reciter, refresh]);

  // Carried as a string so the effect below only re-runs when the *set* changes:
  // `progress` is rewritten on every rated verse, and restarting the queue each
  // time would cancel a download in flight, over and over.
  const targetsKey = useMemo(() => offlineTargets(progress).join(','), [progress]);

  useEffect(() => {
    if (!canDownload || !auto) return;
    const targets = targetsKey ? targetsKey.split(',').map(Number) : [];

    let cancelled = false;
    void (async () => {
      // Deletion first: the disk is freed before it is filled again, which matters
      // on the phone that is nearly full — the one that would otherwise fail.
      const purge = offlinePurge(
        downloadedSurahs(reciter),
        useQuranStore.getState().progress,
      );
      for (const surahNumber of purge) deleteSurah(reciter, surahNumber);
      if (purge.length > 0) refresh();

      for (const surahNumber of targets) {
        if (cancelled) return;
        // Silent on failure: no network simply means no offline copy, and the
        // verse still streams. It will be picked up again on the next launch.
        await download(surahNumber);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [auto, canDownload, download, reciter, refresh, targetsKey]);

  const value = useMemo<OfflineAudioValue>(
    () => ({
      supported: isOfflineAudioSupported,
      bytes,
      downloaded,
      activeSurah,
      activeProgress,
      download,
      remove,
      removeAll,
    }),
    [activeProgress, activeSurah, bytes, download, downloaded, remove, removeAll],
  );

  return (
    <OfflineAudioContext.Provider value={value}>{children}</OfflineAudioContext.Provider>
  );
}

export function useOfflineAudio() {
  const context = useContext(OfflineAudioContext);
  if (!context) {
    throw new Error('useOfflineAudio must be used within an OfflineAudioProvider');
  }
  return context;
}
