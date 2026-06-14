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
}: {
  verse: Verse;
  testMode?: boolean;
  showToggle?: boolean;
  showAudio?: boolean;
}) {
  const [hidden, setHidden] = useState(initialTestMode);

  return (
    <Card style={styles.card} gradient>
      <View style={styles.numberRow}>
        <View style={styles.number}>
          <Text style={styles.numberText}>{verse.verseNumber}</Text>
        </View>
        <View style={styles.actions}>
          {showAudio ? <VerseAudioButton compact verse={verse} /> : null}
          {showToggle ? (
            <Pressable onPress={() => setHidden((value) => !value)} style={styles.toggle}>
              {hidden ? <Eye size={18} color={colors.gold} /> : <EyeOff size={18} color={colors.gold} />}
              <Text style={styles.toggleText}>{hidden ? 'Révéler' : 'Masquer'}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {hidden ? (
        <View style={styles.hidden}>
          <Text style={styles.hiddenSymbol}>•••</Text>
          <Text style={styles.hiddenText}>Récite le verset de mémoire</Text>
        </View>
      ) : (
        <>
          <ArabicText style={styles.arabic}>{verse.textArabic}</ArabicText>
          <View style={styles.divider} />
          <Text style={styles.translation}>{verse.textFr}</Text>
          <Text style={styles.transliteration}>{verse.textTranslit}</Text>
        </>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 270,
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
});
