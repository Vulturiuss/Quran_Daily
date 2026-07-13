import AsyncStorage from '@react-native-async-storage/async-storage';

import { localVerseUri } from '@/services/offlineAudio';
import { Verse } from '@/types';

const API_BASE = 'https://api.quran.com/api/v4';
const AUDIO_BASE = 'https://verses.quran.com/';
const AUDIO_CACHE_PREFIX = 'quran-daily-audio-v1';

export const reciters = {
  mishary: {
    id: 7,
    name: 'Mishary Rashid Al-Afasy',
    style: 'Récitation claire et mélodieuse',
  },
  husary: {
    id: 6,
    name: 'Mahmoud Khalil Al-Husary',
    style: 'Très articulé, idéal pour apprendre',
  },
  minshawi: {
    id: 9,
    name: 'Mohamed Siddiq Al-Minshawi',
    style: 'Murattal lent et posé',
  },
  sudais: {
    id: 3,
    name: 'Abdul Rahman Al-Sudais',
    style: 'Récitation de la Grande Mosquée',
  },
  shatri: {
    id: 4,
    name: 'Abu Bakr Al-Shatri',
    style: 'Voix douce et rythme régulier',
  },
  shuraym: {
    id: 10,
    name: 'Saud Al-Shuraym',
    style: 'Récitation ferme et expressive',
  },
} as const;

export type ReciterId = keyof typeof reciters;
type AudioMap = Record<string, string>;

const memoryCache = new Map<string, AudioMap>();
const pendingRequests = new Map<string, Promise<AudioMap>>();

function normalizeAudioUrl(url: string) {
  if (url.startsWith('//')) return `https:${url}`;
  if (/^https?:\/\//.test(url)) return url;
  return new URL(url, AUDIO_BASE).toString();
}

function cacheKey(reciterId: ReciterId, surahNumber: number) {
  return `${AUDIO_CACHE_PREFIX}:${reciterId}:${surahNumber}`;
}

async function fetchAudioMap(reciterId: ReciterId, surahNumber: number) {
  const key = cacheKey(reciterId, surahNumber);
  const memoryValue = memoryCache.get(key);
  if (memoryValue) return memoryValue;

  const stored = await AsyncStorage.getItem(key);
  if (stored) {
    const parsed = JSON.parse(stored) as AudioMap;
    memoryCache.set(key, parsed);
    return parsed;
  }

  const pending = pendingRequests.get(key);
  if (pending) return pending;

  const request = fetch(
    `${API_BASE}/recitations/${reciters[reciterId].id}/by_chapter/${surahNumber}?per_page=300`,
    { headers: { Accept: 'application/json' } },
  )
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`Quran.com audio API returned ${response.status}`);
      }
      return response.json() as Promise<{
        audio_files: Array<{ verse_key: string; url: string }>;
      }>;
    })
    .then(async ({ audio_files }) => {
      const audioMap = Object.fromEntries(
        audio_files.map((file) => [file.verse_key, normalizeAudioUrl(file.url)]),
      );
      memoryCache.set(key, audioMap);
      await AsyncStorage.setItem(key, JSON.stringify(audioMap));
      return audioMap;
    })
    .finally(() => {
      pendingRequests.delete(key);
    });

  pendingRequests.set(key, request);
  return request;
}

/**
 * The remote URL for a verse. Kept separate from `getVerseAudioUrl` so the
 * offline downloader can reach the network on purpose without recursing into the
 * local-file lookup below.
 */
export async function getRemoteVerseAudioUrl(verse: Verse, reciterId: string) {
  if (reciterId === 'mishary' || !(reciterId in reciters)) {
    return verse.audioUrl;
  }

  const audioMap = await fetchAudioMap(reciterId as ReciterId, verse.surahNumber);
  return audioMap[verse.verseKey] ?? verse.audioUrl;
}

/**
 * Everything that plays a verse goes through here, which is why offline needed
 * one hook and not a rewrite: a downloaded file is returned in place of the URL,
 * and `player.replace(uri)` neither knows nor cares.
 */
export async function getVerseAudioUrl(verse: Verse, reciterId: string) {
  const local = localVerseUri(reciterId, verse.surahNumber, verse.verseNumber);
  if (local) return local;

  return getRemoteVerseAudioUrl(verse, reciterId);
}
