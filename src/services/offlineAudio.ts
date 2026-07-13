import { Directory, File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import { getVerses } from '@/data/verses';
// The *remote* resolver on purpose: getVerseAudioUrl prefers a local file, which
// is exactly what we are creating here.
import { getRemoteVerseAudioUrl, ReciterId } from '@/services/quranApi';

/**
 * Offline recitation.
 *
 * Audio is streamed from Quran.com, so without a network there is no recitation —
 * and the moments people actually memorise in are the metro, the plane, the
 * mosque. This downloads the surahs a user is actually working on.
 *
 * It never gates content: streaming stays free and unlimited. What Premium buys
 * is not depending on the network, which is also what genuinely costs bandwidth.
 *
 * The whole Quran is roughly 1 GB per reciter, so downloading everything is not
 * on the table — and it does not need to be. The product already knows what
 * matters: the one to three surahs being learnt, and the ones due for review.
 * That is a few dozen megabytes.
 */

const ROOT = 'recitations';

export interface SurahDownload {
  surahNumber: number;
  reciterId: string;
  /** 0..1 */
  progress: number;
  bytes: number;
}

export const isOfflineAudioSupported = Platform.OS !== 'web';

function reciterDirectory(reciterId: string) {
  const root = new Directory(Paths.document, ROOT);
  if (!root.exists) root.create({ intermediates: true });
  const directory = new Directory(root, reciterId);
  if (!directory.exists) directory.create({ intermediates: true });
  return directory;
}

function verseFile(reciterId: string, surahNumber: number, verseNumber: number) {
  return new File(
    reciterDirectory(reciterId),
    `${surahNumber}_${verseNumber}.mp3`,
  );
}

/** The local file for a verse, if it has been downloaded. */
export function localVerseUri(
  reciterId: string,
  surahNumber: number,
  verseNumber: number,
): string | undefined {
  if (!isOfflineAudioSupported) return undefined;
  try {
    const file = verseFile(reciterId, surahNumber, verseNumber);
    return file.exists ? file.uri : undefined;
  } catch {
    return undefined;
  }
}

export function isSurahDownloaded(reciterId: string, surahNumber: number) {
  if (!isOfflineAudioSupported) return false;
  const verses = getVerses(surahNumber);
  if (verses.length === 0) return false;
  try {
    return verses.every(
      (verse) => verseFile(reciterId, surahNumber, verse.verseNumber).exists,
    );
  } catch {
    return false;
  }
}

/**
 * Downloads one surah, verse by verse, reporting progress.
 *
 * Partial downloads are the failure mode that matters: a truncated mp3 that
 * crashes playback is worse than no offline at all. Each verse is only counted
 * once its file is on disk, and a failed verse aborts rather than leaving a hole
 * the player would fall into later.
 */
export async function downloadSurah(
  reciterId: string,
  surahNumber: number,
  onProgress?: (progress: number) => void,
  shouldCancel?: () => boolean,
): Promise<{ ok: boolean; reason?: string }> {
  if (!isOfflineAudioSupported) return { ok: false, reason: 'unsupported' };

  const verses = getVerses(surahNumber);
  if (verses.length === 0) return { ok: false, reason: 'unknown_surah' };

  const directory = reciterDirectory(reciterId);

  for (let index = 0; index < verses.length; index += 1) {
    if (shouldCancel?.()) return { ok: false, reason: 'cancelled' };

    const verse = verses[index];
    const file = verseFile(reciterId, surahNumber, verse.verseNumber);
    if (file.exists) {
      onProgress?.((index + 1) / verses.length);
      continue;
    }

    const url = await getRemoteVerseAudioUrl(verse, reciterId as ReciterId);
    if (!url) return { ok: false, reason: 'no_audio' };

    try {
      const downloaded = await File.downloadFileAsync(url, directory);
      // Downloaded under the CDN's own name; move it to the name we look up.
      downloaded.move(file);
    } catch {
      return { ok: false, reason: 'network' };
    }

    onProgress?.((index + 1) / verses.length);
  }

  return { ok: true };
}

/**
 * The surahs that have at least one file on disk for this reciter, read from the
 * directory listing rather than by stat-ing every verse — the purge has to be
 * able to ask "what is lying around?" without touching 6 236 files.
 */
export function downloadedSurahs(reciterId: string): number[] {
  if (!isOfflineAudioSupported) return [];
  try {
    const directory = new Directory(new Directory(Paths.document, ROOT), reciterId);
    if (!directory.exists) return [];

    const numbers = new Set<number>();
    for (const entry of directory.list()) {
      const match = entry.name.match(/^(\d+)_\d+\.mp3$/);
      if (match) numbers.add(Number(match[1]));
    }
    return [...numbers];
  } catch {
    return [];
  }
}

export function deleteSurah(reciterId: string, surahNumber: number) {
  if (!isOfflineAudioSupported) return;
  for (const verse of getVerses(surahNumber)) {
    try {
      const file = verseFile(reciterId, surahNumber, verse.verseNumber);
      if (file.exists) file.delete();
    } catch {
      // Already gone: nothing to do.
    }
  }
}

/** Everything, for the "free up space" button. */
export function deleteAllDownloads() {
  if (!isOfflineAudioSupported) return;
  try {
    const root = new Directory(Paths.document, ROOT);
    if (root.exists) root.delete();
  } catch {
    // Nothing to delete.
  }
}

/**
 * Bytes currently held on disk. Storage that grows silently is how audio apps get
 * uninstalled, so this exists to be shown, not just measured.
 */
export function downloadedBytes() {
  if (!isOfflineAudioSupported) return 0;
  try {
    const root = new Directory(Paths.document, ROOT);
    if (!root.exists) return 0;

    let total = 0;
    const walk = (directory: Directory) => {
      for (const entry of directory.list()) {
        if (entry instanceof File) total += entry.size ?? 0;
        else walk(entry);
      }
    };
    walk(root);
    return total;
  } catch {
    return 0;
  }
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

/**
 * Downloads a reciter's surahs and removes the rest — including every other
 * reciter's copy.
 *
 * Six reciters times Al-Baqara is some 400 MB of the same words. Only the chosen
 * reciter is kept: this is the difference between an offline feature and an app
 * that quietly eats a phone.
 */
export function pruneOtherReciters(keepReciterId: string) {
  if (!isOfflineAudioSupported) return;
  try {
    const root = new Directory(Paths.document, ROOT);
    if (!root.exists) return;

    for (const entry of root.list()) {
      if (entry instanceof Directory && entry.name !== keepReciterId) {
        entry.delete();
      }
    }
  } catch {
    // Nothing to prune.
  }
}
