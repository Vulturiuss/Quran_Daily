/**
 * Normalises Arabic text for *comparison* — never for display.
 *
 * The recitation checker compares two texts that spell the same words
 * differently: the Uthmani corpus carries full vowelling and Quranic annotation
 * marks, while a speech-to-text engine returns bare, modern orthography. Matching
 * them verbatim would flag every word wrong. So both sides are reduced to a common
 * skeleton — consonants only, unified letter shapes — before they are aligned.
 *
 * This is deliberately aggressive (it folds hamza and alef variants together):
 * the goal is "did they recite the right word", not orthographic identity, and a
 * lenient fold is what keeps the checker from punishing a correct recitation.
 *
 * Everything is done by code point on purpose: combining marks are unreadable and
 * unstable to edit as literals, so nothing here relies on how the editor stores
 * an Arabic diacritic.
 */

/** Harakat, tanwin, shadda, sukun, superscript alef, tatweel, and Quranic marks. */
function isDiacritic(code: number): boolean {
  return (
    (code >= 0x0610 && code <= 0x061a) || // sign marks / honorifics
    (code >= 0x064b && code <= 0x065f) || // harakat, tanwin, shadda, sukun, maddah, hamza marks
    code === 0x0640 || // tatweel (kashida)
    code === 0x0670 || // superscript alef
    (code >= 0x06d6 && code <= 0x06dc) || // small high marks
    (code >= 0x06df && code <= 0x06e8) || // small high/low marks
    (code >= 0x06ea && code <= 0x06ed) || // empty-centre / small waw & ya marks
    (code >= 0x08d3 && code <= 0x08ff) // Arabic Extended-A marks
  );
}

const ALEF = 'ا';
const YA = 'ي';
const HA = 'ه';
const WAW = 'و';

/** Letter shapes that fold to a single skeleton letter (or to nothing). */
const FOLD: Record<number, string> = {
  0x0622: ALEF, // آ  alef madda
  0x0623: ALEF, // أ  alef + hamza above
  0x0625: ALEF, // إ  alef + hamza below
  0x0671: ALEF, // ٱ  alef wasla
  0x0649: YA, //   ى  alef maqsura
  0x0629: HA, //   ة  ta marbuta
  0x0624: WAW, //  ؤ  waw + hamza
  0x0626: YA, //   ئ  ya + hamza
  0x0621: '', //   ء  free-standing hamza
};

export function normalizeArabic(text: string): string {
  let out = '';
  for (const ch of text.trim()) {
    const code = ch.codePointAt(0);
    if (code === undefined) continue;
    if (isDiacritic(code)) continue;
    const folded = FOLD[code];
    out += folded === undefined ? ch : folded;
  }
  return out;
}

/**
 * True when two words are the same once reduced to their comparison skeleton.
 * Both empty counts as equal so callers never special-case it.
 */
export function sameArabicWord(a: string, b: string): boolean {
  return normalizeArabic(a) === normalizeArabic(b);
}
