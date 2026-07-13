import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Eye } from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';
import { Verse } from '@/types';
import { maskedWordIndices } from '@/utils/memorization';

/**
 * A verse with some of its words hidden, to be recalled rather than re-read.
 *
 * "Hide the text, then tell us you knew it" is the illusion of knowing: re-reading
 * feels like mastery and does not survive recall. Here the grade is *measured* —
 * every word the user has to uncover is counted, and the parent turns that count
 * into a rating with `ratingFromReveals`.
 *
 * The cue above the verse is the tail of the previous one (`linkingCue`): a hafiz
 * does not fail on a verse, they fail on the seam between two.
 */

const ARABIC_SIZE = 28;

/** Roughly the width the word would have taken, so the line does not reflow on reveal. */
function maskWidth(word: string) {
  return Math.max(38, Math.min(150, word.length * 13));
}

function maskDots(word: string) {
  return '·'.repeat(Math.max(2, Math.min(6, Math.ceil(word.length / 2))));
}

interface RecallVerseProps {
  verse: Verse;
  /** The end of the previous verse. Displayed above, in small, as the starting hook. */
  cue?: string;
  /** How many hidden words have been uncovered so far. */
  onRevealsChange?: (reveals: number) => void;
}

export function RecallVerse({ verse, cue, onRevealsChange }: RecallVerseProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const words = useMemo(
    () => verse.textArabic.trim().split(/\s+/).filter(Boolean),
    [verse.textArabic],
  );
  // Deterministic for a given verse: the mask must not reshuffle on every render.
  const masked = useMemo(() => maskedWordIndices(verse), [verse]);
  // Nothing is revealed to start with. A new verse is a new test, so callers give
  // the component a `key` on the verse: it remounts, and the count starts at zero
  // rather than being reset after the fact.
  const [revealed, setRevealed] = useState<number[]>([]);

  useEffect(() => {
    onRevealsChange?.(revealed.length);
  }, [onRevealsChange, revealed.length]);

  const reveal = useCallback((index: number) => {
    setRevealed((current) =>
      current.includes(index) ? current : [...current, index],
    );
  }, []);

  // Giving up counts as having uncovered everything: the grade stays honest.
  const revealAll = useCallback(() => setRevealed(masked), [masked]);

  const remaining = masked.length - revealed.length;

  return (
    <View style={styles.container}>
      {cue ? <Text style={styles.cue}>{`… ${cue}`}</Text> : null}

      <View style={styles.words}>
        {words.map((word, index) => {
          const isMasked = masked.includes(index);
          const isRevealed = revealed.includes(index);

          if (!isMasked || isRevealed) {
            return (
              <Text
                key={`${verse.verseKey}:${index}`}
                style={[styles.word, isRevealed && styles.wordRevealed]}
              >
                {word}
              </Text>
            );
          }

          return (
            <Pressable
              accessibilityHint="Touche pour révéler ce mot"
              accessibilityLabel="Mot masqué"
              accessibilityRole="button"
              key={`${verse.verseKey}:${index}`}
              onPress={() => reveal(index)}
              style={({ pressed }) => [
                styles.mask,
                { minWidth: maskWidth(word) },
                pressed && styles.maskPressed,
              ]}
            >
              <Text style={styles.maskText}>{maskDots(word)}</Text>
            </Pressable>
          );
        })}
      </View>

      {remaining > 0 ? (
        <Pressable
          accessibilityLabel="Tout révéler"
          accessibilityRole="button"
          hitSlop={8}
          onPress={revealAll}
          style={({ pressed }) => [styles.revealAll, pressed && styles.maskPressed]}
        >
          <Eye color={colors.textFaint} size={14} />
          <Text style={styles.revealAllText}>Tout révéler</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.lg,
    },
    cue: {
      color: colors.textFaint,
      fontFamily: typography.arabic,
      fontSize: 18,
      lineHeight: 30,
      marginBottom: spacing.sm,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    // Arabic reads right to left: the words start at the right edge and wrap
    // leftwards.
    words: {
      alignItems: 'center',
      flexDirection: 'row-reverse',
      flexWrap: 'wrap',
      gap: spacing.xs,
      justifyContent: 'flex-start',
    },
    word: {
      color: colors.text,
      fontFamily: typography.arabic,
      fontSize: ARABIC_SIZE,
      lineHeight: ARABIC_SIZE * 1.7,
      writingDirection: 'rtl',
    },
    // A word that had to be uncovered stays marked: it is the one to work on.
    wordRevealed: {
      color: colors.goldSoft,
    },
    mask: {
      alignItems: 'center',
      backgroundColor: withAlpha(colors.gold, 0.15),
      borderColor: colors.border,
      borderRadius: radius.sm,
      borderWidth: 1,
      height: ARABIC_SIZE * 1.35,
      justifyContent: 'center',
      paddingHorizontal: spacing.xs,
    },
    maskPressed: {
      opacity: 0.7,
    },
    maskText: {
      color: colors.textFaint,
      fontFamily: typography.bold,
      fontSize: 15,
      letterSpacing: 3,
    },
    revealAll: {
      alignItems: 'center',
      alignSelf: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
      marginTop: spacing.md,
      paddingVertical: spacing.xs,
    },
    revealAllText: {
      color: colors.textFaint,
      fontFamily: typography.bold,
      fontSize: 12,
    },
  });
}
