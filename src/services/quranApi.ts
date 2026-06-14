import AsyncStorage from '@react-native-async-storage/async-storage';

import { Verse } from '@/types';

const API_BASE = 'https://api.quran.com/api/v4';
const AUDIO_BASE = 'https://verses.quran.com/';
const AUDIO_CACHE_PREFIX = 'quran-daily-audio-v1';

export const reciters = {
  mishary: {
    id: 7,
    name: 'Mishary Rashid Al-Afasy',
  },
  husary: {
    id: 6,
    name: 'Mahmoud Khalil Al-Husary',
  },
  minshawi: {
    id: 9,
    name: 'Mohamed Siddiq Al-Minshawi',
  },
  sudais: {
    id: 3,
    name: 'Abdul Rahman Al-Sudais',
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

export async function getVerseAudioUrl(verse: Verse, reciterId: string) {
  if (reciterId === 'mishary' || !(reciterId in reciters)) {
    return verse.audioUrl;
  }

  const audioMap = await fetchAudioMap(reciterId as ReciterId, verse.surahNumber);
  return audioMap[verse.verseKey] ?? verse.audioUrl;
}
