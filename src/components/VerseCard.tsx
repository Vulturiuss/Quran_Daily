import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

import { ArabicText } from '@/components/ArabicText';
import { Card } from '@/components/ui';
import { VerseAudioButton } from '@/components/VerseAudioButton';
import { colors, radius, spacing, typography } from '@/theme';
import { Verse } from '@/types';

export function VerseCard({
  verse,
  testMode: initialTestMode = false,
  showToggle = false,
  showAudio = true,
  tone = 'default',
}: {
  verse: Verse;
  testMode?: boolean;
  showToggle?: boolean;
  showAudio?: boolean;
  tone?: 'default' | 'paper';
}) {
  const [hidden, setHidden] = useState(initialTestMode);
  const paper = tone === 'paper';

  return (
    <Card gradient={!paper} style={[styles.card, paper && styles.paperCard]}>
      <View style={styles.numberRow}>
        <View style={[styles.number, paper && styles.paperNumber]}>
          <Text style={[styles.numberText, paper && styles.paperAccent]}>
            {verse.verseNumber}
          </Text>
        </View>
        <View style={styles.actions}>
          {showAudio ? <VerseAudioButton compact verse={verse} /> : null}
          {showToggle ? (
            <Pressable
              accessibilityLabel={
                hidden
                  ? `Révéler le texte du verset ${verse.verseNumber}`
                  : `Masquer le texte du verset ${verse.verseNumber}`
              }
              accessibilityRole="button"
              accessibilityState={{ expanded: !hidden }}
              onPress={() => setHidden((value) => !value)}
              style={styles.toggle}
            >
              {hidden ? (
                <Eye size={18} color={paper ? colors.goldDeep : colors.gold} />
              ) : (
                <EyeOff size={18} color={paper ? colors.goldDeep : colors.gold} />
              )}
              <Text style={[styles.toggleText, paper && styles.paperAccent]}>
                {hidden ? 'Révéler' : 'Masquer'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {hidden ? (
        <View style={styles.hidden}>
          <Text style={[styles.hiddenSymbol, paper && styles.paperAccent]}>•••</Text>
          <Text style={[styles.hiddenText, paper && styles.paperMuted]}>
            Récite le verset de mémoire
          </Text>
        </View>
      ) : (
        <>
          <ArabicText style={[styles.arabic, paper && styles.paperText]}>
            {verse.textArabic}
          </ArabicText>
          <View style={[styles.divider, paper && styles.paperDivider]} />
          <Text style={[styles.translation, paper && styles.paperText]}>
            {verse.textFr}
          </Text>
          <Text style={[styles.transliteration, paper && styles.paperMuted]}>
            {verse.textTranslit}
          </Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 270,
  },
  paperCard: {
    backgroundColor: colors.goldPale,
    borderColor: colors.gold,
  },
  numberRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  number: {
    alignItems: 'center',
    borderColor: colors.gold,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  numberText: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  toggle: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  toggleText: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  arabic: {
    marginTop: spacing.md,
  },
  divider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.md,
  },
  translation: {
    color: colors.text,
    fontFamily: typography.medium,
    fontSize: 16,
    lineHeight: 24,
  },
  transliteration: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  hidden: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    minHeight: 210,
  },
  hiddenSymbol: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 34,
    letterSpacing: 8,
  },
  hiddenText: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 15,
    marginTop: spacing.md,
  },
  paperNumber: {
    borderColor: colors.goldDeep,
  },
  paperAccent: {
    color: colors.goldDeep,
  },
  paperText: {
    color: colors.backgroundDeep,
  },
  paperMuted: {
    color: colors.surfaceMuted,
  },
  paperDivider: {
    backgroundColor: 'rgba(9,23,16,0.18)',
  },
});
