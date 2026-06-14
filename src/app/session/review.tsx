import { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check, CircleX, Frown, Sparkles, X } from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { ArabicText } from '@/components/ArabicText';
import { VerseAudioButton } from '@/components/VerseAudioButton';
import { Card, IconButton, PrimaryButton, ProgressBar } from '@/components/ui';
import { getSurah } from '@/data/surahs';
import { getVerses } from '@/data/verses';
import { useQuranAudio } from '@/providers/AudioProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { colors, radius, spacing, typography } from '@/theme';
import { ReviewRating } from '@/types';

export default function ReviewSessionScreen() {
  const session = useQuranStore((state) => state.activeSession);
  const rateCurrentReview = useQuranStore((state) => state.rateCurrentReview);
  const clearActiveSession = useQuranStore((state) => state.clearActiveSession);
  const { error: audioError, stop } = useQuranAudio();
  const currentNumber = session?.reviewQueue[session.reviewIndex ?? 0];
  const surah = getSurah(currentNumber);
  const verses = getVerses(currentNumber);
  const total = session?.reviewQueue.length ?? 0;
  const current = session?.reviewIndex ?? 0;

  useEffect(() => {
    if (!session) {
      router.replace('/(tabs)');
      return;
    }
    if (current >= total) router.replace('/session/learn');
  }, [current, session, total]);

  async function rate(rating: ReviewRating) {
    await stop();
    void Haptics.impactAsync(
      rating === 'good' ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium,
    );
    rateCurrentReview(rating);
  }

  function confirmExit() {
    Alert.alert('Quitter la session ?', 'La progression de cette session ne sera pas enregistrée.', [
      { text: 'Continuer', style: 'cancel' },
      {
        text: 'Quitter',
        style: 'destructive',
        onPress: () => {
          void stop();
          clearActiveSession();
          router.replace('/(tabs)');
        },
      },
    ]);
  }

  if (!session || !surah || current >= total) return null;

  return (
    <AppScreen>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Révision</Text>
          <Text style={styles.counter}>
            Sourate {current + 1} sur {total}
          </Text>
        </View>
        <IconButton icon={X} label="Quitter la session" onPress={confirmExit} />
      </View>
      <ProgressBar value={total ? current / total : 1} height={6} />

      <View style={styles.surahHeader}>
        <Text style={styles.surahName}>{surah.nameTranslit}</Text>
        <ArabicText size={28} style={styles.surahArabic}>
          {surah.name}
        </ArabicText>
        <Text style={styles.surahMeta}>{surah.totalVerses} versets</Text>
      </View>

      <Card gradient style={styles.recitationCard}>
        {verses.length ? (
          verses.map((verse) => (
            <View key={verse.verseNumber} style={styles.verseLine}>
              <ArabicText size={27} style={styles.verseArabic}>{verse.textArabic}</ArabicText>
              <VerseAudioButton compact verse={verse} />
              <View style={styles.verseNumber}>
                <Text style={styles.verseNumberText}>{verse.verseNumber}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.memoryPrompt}>
            <Sparkles color={colors.gold} size={32} />
            <Text style={styles.memoryTitle}>Récite cette sourate de mémoire</Text>
            <Text style={styles.memoryText}>
              Le texte complet sera disponible après synchronisation. Évalue honnêtement la fluidité
              de ta récitation.
            </Text>
          </View>
        )}
      </Card>
      {audioError ? <Text style={styles.audioError}>{audioError}</Text> : null}

      <Text style={styles.question}>Comment t’en souviens-tu ?</Text>
      <View style={styles.ratingButtons}>
        <PrimaryButton
          compact
          icon={Check}
          label="Bien"
          onPress={() => void rate('good')}
          variant="surface"
        />
        <PrimaryButton
          compact
          icon={Frown}
          label="À revoir"
          onPress={() => void rate('hard')}
          variant="surface"
        />
        <PrimaryButton
          compact
          icon={CircleX}
          label="Oubliée"
          onPress={() => void rate('forgot')}
          variant="danger"
        />
      </View>
      <Text style={styles.hint}>
        Ton choix ajuste automatiquement la prochaine date de révision.
      </Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  kicker: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 12,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  counter: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 13,
    marginTop: 2,
  },
  surahHeader: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  surahName: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 29,
  },
  surahArabic: {
    color: colors.goldSoft,
    marginTop: 2,
    textAlign: 'center',
  },
  surahMeta: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 12,
  },
  recitationCard: {
    paddingVertical: spacing.lg,
  },
  verseLine: {
    alignItems: 'center',
    borderBottomColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  verseArabic: {
    flex: 1,
  },
  verseNumber: {
    alignItems: 'center',
    borderColor: colors.gold,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 29,
    justifyContent: 'center',
    width: 29,
  },
  verseNumberText: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  memoryPrompt: {
    alignItems: 'center',
    minHeight: 230,
    justifyContent: 'center',
  },
  memoryTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 20,
    marginTop: spacing.md,
  },
  memoryText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
    maxWidth: 290,
    textAlign: 'center',
  },
  question: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 16,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
    textAlign: 'center',
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  hint: {
    color: colors.textFaint,
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  audioError: {
    color: colors.error,
    fontFamily: typography.medium,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
