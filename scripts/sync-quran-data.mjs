import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = 'https://api.quran.com/api/v4';
const AUDIO_BASE = 'https://verses.quran.com/';
const FRENCH_TRANSLATION_ID = 31;
const TRANSLITERATION_ID = 57;
const MISHARY_RECITATION_ID = 7;
const EXPECTED_VERSE_COUNT = 6236;
const CONCURRENCY = 6;
const MAX_RETRIES = 5;

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = resolve(rootDir, 'src/data/quran.json');

function sleep(ms) {
  return new Promise((resolvePromise) => setTimeout(resolvePromise, ms));
}

async function fetchJson(url, attempt = 1) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'QuranDaily/1.0 data-sync',
    },
  });

  if (!response.ok) {
    if (attempt < MAX_RETRIES && (response.status === 429 || response.status >= 500)) {
      await sleep(500 * 2 ** (attempt - 1));
      return fetchJson(url, attempt + 1);
    }
    throw new Error(`Quran.com API ${response.status}: ${url}`);
  }

  return response.json();
}

function stripHtml(value = '') {
  return value
    .replace(/<sup[^>]*>.*?<\/sup>/gis, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function absoluteAudioUrl(url) {
  if (!url) return undefined;
  if (url.startsWith('//')) return `https:${url}`;
  if (/^https?:\/\//.test(url)) return url;
  return new URL(url, AUDIO_BASE).toString();
}

async function fetchChapter(chapterNumber) {
  const params = new URLSearchParams({
    language: 'fr',
    words: 'false',
    translations: `${FRENCH_TRANSLATION_ID},${TRANSLITERATION_ID}`,
    audio: String(MISHARY_RECITATION_ID),
    fields: 'text_uthmani',
    per_page: '300',
  });
  const data = await fetchJson(
    `${API_BASE}/verses/by_chapter/${chapterNumber}?${params.toString()}`,
  );

  const verses = data.verses.map((item) => {
    const french = item.translations.find(
      (translation) => translation.resource_id === FRENCH_TRANSLATION_ID,
    );
    const transliteration = item.translations.find(
      (translation) => translation.resource_id === TRANSLITERATION_ID,
    );

    return {
      surahNumber: chapterNumber,
      verseNumber: item.verse_number,
      verseKey: item.verse_key,
      juzNumber: item.juz_number,
      pageNumber: item.page_number,
      textArabic: item.text_uthmani,
      textTranslit: stripHtml(transliteration?.text),
      textFr: stripHtml(french?.text),
      audioUrl: absoluteAudioUrl(item.audio?.url),
    };
  });

  console.log(`Sourate ${String(chapterNumber).padStart(3, '0')}: ${verses.length} versets`);
  return [String(chapterNumber), verses];
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;

  async function runWorker() {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker()),
  );
  return results;
}

const chapters = Array.from({ length: 114 }, (_, index) => index + 1);
const entries = await mapWithConcurrency(chapters, CONCURRENCY, fetchChapter);
const quran = Object.fromEntries(entries);
const totalVerses = Object.values(quran).reduce((total, verses) => total + verses.length, 0);

if (totalVerses !== EXPECTED_VERSE_COUNT) {
  throw new Error(
    `Corpus incomplet: ${totalVerses} versets reçus, ${EXPECTED_VERSE_COUNT} attendus.`,
  );
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(quran)}\n`, 'utf8');
console.log(`Corpus Quran.com écrit dans ${outputPath} (${totalVerses} versets).`);
