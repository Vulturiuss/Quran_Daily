import AsyncStorage from '@react-native-async-storage/async-storage';

import { ReciterId, reciters } from '@/services/quranApi';
import { Verse } from '@/types';
import { parseSegments, WordTiming } from '@/utils/recitation';

/**
 * Per-word recitation timings, fetched from Quran.com and cached like the audio
 * URLs are.
 *
 * The word-highlight follows these; the audio plays with or without them, so this
 * layer is silent on every failure — an unsupported reciter, no network, a
 * malformed row — and simply yields `undefined`, which the UI reads as "no
 * highlight for this verse".
 */

const API_BASE = 'https://api.quran.com/api/v4';
const CACHE_PREFIX = 'quran-daily-segments-v1';

const memoryCache = new Map<string, WordTiming[]>();
const pendingRequests = new Map<string, Promise<WordTiming[] | undefined>>();

function reciterNumericId(reciterId: string): number | undefined {
  return reciterId in reciters
    ? reciters[reciterId as ReciterId].id
    : undefined;
}

function cacheKey(numericId: number, verseKey: string) {
  return `${CACHE_PREFIX}:${numericId}:${verseKey}`;
}

/**
 * Raw network fetch of one verse's timings, no caching. Undefined on an
 * unsupported reciter, a non-2xx response, a network error, or a verse the
 * reciter simply has no segments for. Never rejects.
 */
async function fetchRemoteVerseSegments(
  verseKey: string,
  numericId: number,
): Promise<WordTiming[] | undefined> {
  try {
    const response = await fetch(
      `${API_BASE}/verses/by_key/${verseKey}?audio=${numericId}`,
      { headers: { Accept: 'application/json' } },
    );
    if (!response.ok) return undefined;
    const body = (await response.json()) as {
      verse?: { audio?: { segments?: unknown } };
    };
    const timings = parseSegments(body.verse?.audio?.segments);
    return timings.length > 0 ? timings : undefined;
  } catch {
    return undefined;
  }
}

export async function getVerseSegments(
  verse: Verse,
  reciterId: string,
): Promise<WordTiming[] | undefined> {
  const numericId = reciterNumericId(reciterId);
  if (numericId === undefined) return undefined;

  const key = cacheKey(numericId, verse.verseKey);

  const memoryValue = memoryCache.get(key);
  if (memoryValue) return memoryValue;

  const stored = await AsyncStorage.getItem(key).catch(() => null);
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as WordTiming[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryCache.set(key, parsed);
        return parsed;
      }
    } catch {
      // Corrupt entry: fall through and refetch.
    }
  }

  const pending = pendingRequests.get(key);
  if (pending) return pending;

  const request = fetchRemoteVerseSegments(verse.verseKey, numericId)
    .then(async (timings) => {
      if (!timings) return undefined;
      memoryCache.set(key, timings);
      await AsyncStorage.setItem(key, JSON.stringify(timings)).catch(
        () => undefined,
      );
      return timings;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, request);
  return request;
}
