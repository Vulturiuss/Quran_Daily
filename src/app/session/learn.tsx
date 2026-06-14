import { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check, ChevronRight, GraduationCap, Sparkles, X } from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { VerseAudioButton } from '@/components/VerseAudioButton';
import { VerseCard } from '@/components/VerseCard';
import { Card, IconButton, PrimaryButton, ProgressBar } from '@/components/ui';
import { getSurah } from '@/data/surahs';
import { getVerses } from '@/data/verses';
import { useQuranAudio } from '@/providers/AudioProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { colors, spacing, typography } from '@/theme';

export default function LearnSessionScreen() {
  const session = useQuranStore((state) => state.activeSession);
  const learnCurrentVerse = useQuranStore((state) => state.learnCurrentVerse);
  const clearActiveSession = useQuranStore((state) => state.clearActiveSession);
  const { error: audioError, stop } = useQuranAudio();
  const surah = getSurah(session?.learningSurah);
  const verses = getVerses(session?.learningSurah);
  const currentIndex = (session?.verseStart ?? 0) + (session?.versesLearned ?? 0);
  const verse = verses[currentIndex];
  const target = session?.versesTarget ?? 0;
  const learned = session?.versesLearned ?? 0;

  useEffect(() => {
    if (!session) router.replace('/(tabs)');
  }, [session]);

  async function validate() {
    await stop();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    learnCurrentVerse();
    if (learned + 1 >= target) router.replace('/session/complete');
  }

  async function continueWithoutVerse() {
    await stop();
    router.replace('/session/complete');
  }

  function confirmExit() {
    Alert.alert('Quitter la session ?', 'La progression non validée sera perdue.', [
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

  if (!session) return null;

  return (
    <AppScreen>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Apprentissage</Text>
          <Text style={styles.counter}>
            {target ? `Verset ${Math.min(learned + 1, target)} sur ${target}` : 'Étape finale'}
          </Text>
        </View>
        <IconButton icon={X} label="Quitter la session" onPress={confirmExit} />
      </View>
      <ProgressBar value={target ? learned / target : 1} height={6} />

      {surah && verse ? (
        <>
          <View style={styles.surahHeader}>
            <Text style={styles.surahName}>{surah.nameTranslit}</Text>
            <Text style={styles.verseLabel}>Verset {verse.verseNumber}</Text>
          </View>
          <VerseCard key={verse.verseNumber} verse={verse} showToggle />
          <View style={styles.audioActions}>
            <VerseAudioButton repeatCount={3} verse={verse} />
          </View>
          {audioError ? <Text style={styles.audioError}>{audioError}</Text> : null}
          <Card style={styles.tip}>
            <Sparkles color={colors.gold} size={19} />
            <Text style={styles.tipText}>
              Lis trois fois, masque le texte, puis récite lentement avant de valider.
            </Text>
          </Card>
          <PrimaryButton
            icon={learned + 1 >= target ? Check : ChevronRight}
            label={learned + 1 >= target ? 'Je peux le réciter' : 'Verset mémorisé'}
            onPress={() => void validate()}
          />
        </>
      ) : (
        <Card style={styles.empty}>
          <GraduationCap color={colors.gold} size={42} />
          <Text style={styles.emptyTitle}>
            {surah ? 'Contenu hors ligne indisponible' : 'Choisis une sourate'}
          </Text>
          <Text style={styles.emptyText}>
            {surah
              ? `La session de révision est terminée. Le texte de ${surah.nameTranslit} sera récupéré lors de la synchronisation.`
              : 'Sélectionne une sourate dans la bibliothèque pour activer l’apprentissage guidé.'}
          </Text>
          <PrimaryButton
            icon={ChevronRight}
            label="Terminer la session"
            onPress={() => void continueWithoutVerse()}
          />
        </Card>
      )}
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
    fontSize: 28,
  },
  verseLabel: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 12,
    marginTop: 2,
  },
  tip: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  audioActions: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  audioError: {
    color: colors.error,
    fontFamily: typography.medium,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  tipText: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 20,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
    maxWidth: 300,
    textAlign: 'center',
  },
});
