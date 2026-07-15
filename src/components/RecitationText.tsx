import { useEffect, useMemo, useState } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';
import { useAudioPlayerStatus } from 'expo-audio';

import { useRecitationCheck } from '@/components/recitationCheck';
import { useQuranAudio } from '@/providers/AudioProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { getVerseSegments } from '@/services/verseSegments';
import { useQuranStore } from '@/store/useQuranStore';
import {
  effectiveReciter,
  hasFullAccess as computeFullAccess,
} from '@/utils/access';
import {
  activeWordIndex,
  segmentsFitWords,
  splitArabicWords,
  WordTiming,
} from '@/utils/recitation';
import { CheckedWord, SpokenVerdict } from '@/utils/recitationReview';
import { Palette, typography } from '@/theme';
import { Verse } from '@/types';

/**
 * A verse's Arabic text that lights each word green as the reciter reaches it —
 * the eye following the ear, which is how memorisation actually sticks.
 *
 * A drop-in for <ArabicText>: when nothing is playing (or the reciter has no
 * timings, or they do not line up with the words) it renders exactly like the
 * plain text it replaces. The position subscription lives in a child mounted only
 * for the verse being recited, so a whole surah of these costs nothing until one
 * is played.
 */
export function RecitationText({
  verse,
  size = 31,
  style,
}: {
  verse: Verse;
  size?: number;
  style?: StyleProp<TextStyle>;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const words = useMemo(
    () => splitArabicWords(verse.textArabic),
    [verse.textArabic],
  );

  // Resolve the reciter exactly as VerseAudioButton does, so the track id and the
  // fetched timings match the button the user actually pressed.
  const preferredReciter = useQuranStore(
    (state) => state.profile.preferredReciter,
  );
  const {
    configured,
    isPremium,
    loading: subscriptionLoading,
  } = useSubscription();
  const reciterId = subscriptionLoading
    ? preferredReciter
    : effectiveReciter(
        computeFullAccess(configured, isPremium),
        preferredReciter,
      );

  // A spoken-recitation check, when one exists for this verse, wins over the
  // playback highlight: it is the user's own voice being scored, not the audio.
  const { wordsForVerse } = useRecitationCheck();
  const checkedWords = wordsForVerse(verse.verseNumber);

  const { currentTrackId } = useQuranAudio();
  const isCurrent = currentTrackId === `${reciterId}:${verse.verseKey}`;

  const [timings, setTimings] = useState<WordTiming[]>();
  useEffect(() => {
    // Only fetch once this verse is the one playing: a long surah mounts dozens
    // of these and none should touch the network until it is listened to.
    if (!isCurrent) return;
    let active = true;
    void getVerseSegments(verse, reciterId).then((result) => {
      if (active) setTimings(result);
    });
    return () => {
      active = false;
    };
  }, [isCurrent, reciterId, verse]);

  const textStyle = [
    styles.text,
    { fontSize: size, lineHeight: size * 1.85 },
    style,
  ];

  if (checkedWords && checkedWords.length === words.length) {
    return <CheckedWordsText colors={colors} textStyle={textStyle} words={checkedWords} />;
  }

  const canHighlight =
    isCurrent && timings !== undefined && segmentsFitWords(timings, words.length);

  if (canHighlight) {
    return (
      <ActiveRecitationText
        highlightColor={colors.success}
        textStyle={textStyle}
        timings={timings}
        words={words}
      />
    );
  }

  // Same word-by-word structure as the active render (so playback starts without
  // a layout shift), just with nothing highlighted.
  return (
    <WordsText activeIndex={-1} highlightColor={colors.success} textStyle={textStyle} words={words} />
  );
}

/**
 * Mounted only while its verse is being recited. This is the one place that reads
 * the player's 200 ms position ticks, keeping that churn off every other verse.
 */
function ActiveRecitationText({
  words,
  timings,
  textStyle,
  highlightColor,
}: {
  words: string[];
  timings: WordTiming[];
  textStyle: StyleProp<TextStyle>;
  highlightColor: string;
}) {
  const { player } = useQuranAudio();
  const status = useAudioPlayerStatus(player);
  // Paused mid-verse keeps its word lit; a full stop (position back to 0) clears
  // it. currentTime is in seconds.
  const index =
    status.playing || status.currentTime > 0
      ? activeWordIndex(timings, status.currentTime * 1000)
      : -1;

  return (
    <WordsText
      activeIndex={index}
      highlightColor={highlightColor}
      textStyle={textStyle}
      words={words}
    />
  );
}

/**
 * Renders the verse with each word coloured by how it was recited: green when it
 * matched, red when it was said wrong or skipped, and the plain text colour for
 * words the reciter never reached — a partial recitation must not look like a wall
 * of mistakes.
 */
function CheckedWordsText({
  words,
  textStyle,
  colors,
}: {
  words: CheckedWord[];
  textStyle: StyleProp<TextStyle>;
  colors: Palette;
}) {
  return (
    <Text style={textStyle}>
      {words.map((word, index) => (
        <Text key={index} style={verdictStyle(word.verdict, colors)}>
          {word.text}
          {index < words.length - 1 ? ' ' : ''}
        </Text>
      ))}
    </Text>
  );
}

function verdictStyle(verdict: SpokenVerdict, colors: Palette): TextStyle | undefined {
  switch (verdict) {
    case 'correct':
      return { color: colors.success };
    case 'substituted':
      return { color: colors.error };
    case 'missing':
      // Skipped rather than mis-said: still wrong, but underlined so the two read
      // differently at a glance.
      return { color: colors.error, textDecorationLine: 'underline' };
    default:
      return undefined;
  }
}

function WordsText({
  words,
  activeIndex,
  textStyle,
  highlightColor,
}: {
  words: string[];
  activeIndex: number;
  textStyle: StyleProp<TextStyle>;
  highlightColor: string;
}) {
  return (
    <Text style={textStyle}>
      {words.map((word, index) => (
        <Text
          key={index}
          style={index === activeIndex ? { color: highlightColor } : undefined}
        >
          {word}
          {index < words.length - 1 ? ' ' : ''}
        </Text>
      ))}
    </Text>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    text: {
      color: colors.text,
      fontFamily: typography.arabic,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
  });
}
