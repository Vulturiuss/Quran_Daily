import { useEffect, useRef } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Check,
  CircleX,
  Frown,
  Languages,
  Sparkles,
  TextQuote,
  X,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { ArabicText } from '@/components/ArabicText';
import { VerseAudioButton } from '@/components/VerseAudioButton';
import { Card, IconButton, Pill, PrimaryButton, ProgressBar } from '@/components/ui';
import { getSurah } from '@/data/surahs';
import { getVerses } from '@/data/verses';
import { useQuranAudio } from '@/providers/AudioProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { colors, radius, spacing, typography } from '@/theme';
import { ReviewRating } from '@/types';

export default function ReviewSessionScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const session = useQuranStore((state) => state.activeSession);
  const rateCurrentReview = useQuranStore((state) => state.rateCurrentReview);
  const clearActiveSession = useQuranStore((state) => state.clearActiveSession);
  const profile = useQuranStore((state) => state.profile);
  const updateProfile = useQuranStore((state) => state.updateProfile);
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

  useEffect(() => {
    scrollRef.current?.scrollTo({ animated: false, y: 0 });
  }, [current]);

  async function rate(rating: ReviewRating) {
    await stop();
    void Haptics.impactAsync(
      rating === 'good'
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium,
    );
    rateCurrentReview(rating);
  }

  function confirmExit() {
    const hasProgress = current > 0;
    Alert.alert(
      'Quitter la session ?',
      hasProgress
        ? 'Tes révisions déjà notées seront enregistrées et comptabilisées.'
        : 'Aucune révision n’a encore été notée dans cette session.',
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () => {
            void stop();
            if (hasProgress) {
              router.replace('/session/complete');
            } else {
              clearActiveSession();
              router.replace('/(tabs)');
            }
          },
        },
      ],
    );
  }

  if (!session || !surah || current >= total) return null;

  return (
    <AppScreen contentStyle={styles.screen} decorated={false} scroll={false}>
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
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
                <View style={styles.verseCopy}>
                  <ArabicText size={27} style={styles.verseArabic}>
                    {verse.textArabic}
                  </ArabicText>
                  {profile.showReviewTranslation ? (
                    <Text style={styles.translation}>{verse.textFr}</Text>
                  ) : null}
                  {profile.showReviewTransliteration ? (
                    <Text style={styles.transliteration}>{verse.textTranslit}</Text>
                  ) : null}
                </View>
                <View style={styles.verseActions}>
                  <VerseAudioButton compact verse={verse} />
                  <View style={styles.verseNumber}>
                    <Text style={styles.verseNumberText}>{verse.verseNumber}</Text>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.memoryPrompt}>
              <Sparkles color={colors.gold} size={32} />
              <Text style={styles.memoryTitle}>Récite cette sourate de mémoire</Text>
              <Text style={styles.memoryText}>
                Le texte complet sera disponible après synchronisation. Évalue honnêtement la
                fluidité de ta récitation.
              </Text>
            </View>
          )}
        </Card>

        <View style={styles.displayToggles}>
          <View style={styles.toggleLabel}>
            <Languages color={colors.textMuted} size={16} />
            <Pill
              label="Translittération"
              selected={profile.showReviewTransliteration}
              onPress={() =>
                updateProfile({
                  showReviewTransliteration: !profile.showReviewTransliteration,
                })
              }
            />
          </View>
          <View style={styles.toggleLabel}>
            <TextQuote color={colors.textMuted} size={16} />
            <Pill
              label="Traduction"
              selected={profile.showReviewTranslation}
              onPress={() =>
                updateProfile({
                  showReviewTranslation: !profile.showReviewTranslation,
                })
              }
            />
          </View>
        </View>
        {audioError ? <Text style={styles.audioError}>{audioError}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.question}>Comment t’en souviens-tu ?</Text>
        <View style={styles.ratingButtons}>
          <PrimaryButton
            compact
            icon={Check}
            label="Bien"
            onPress={() => void rate('good')}
            style={styles.ratingButton}
            variant="surface"
          />
          <PrimaryButton
            compact
            icon={Frown}
            label="À revoir"
            onPress={() => void rate('hard')}
            style={styles.ratingButton}
            variant="surface"
          />
          <PrimaryButton
            compact
            icon={CircleX}
            label="Oubliée"
            onPress={() => void rate('forgot')}
            style={styles.ratingButton}
            variant="danger"
          />
        </View>
        <Text style={styles.hint}>Ce choix ajuste la prochaine date de révision.</Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: spacing.sm,
  },
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  surahHeader: {
    alignItems: 'center',
    marginVertical: spacing.lg,
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
    textAlign: 'right',
  },
  verseCopy: {
    flex: 1,
  },
  verseActions: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  translation: {
    color: colors.text,
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing.sm,
  },
  transliteration: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    fontStyle: 'italic',
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  displayToggles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  toggleLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
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
    justifyContent: 'center',
    minHeight: 230,
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
  footer: {
    backgroundColor: colors.backgroundDeep,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
  },
  question: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 14,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  ratingButton: {
    flex: 1,
    paddingHorizontal: spacing.xs,
  },
  hint: {
    color: colors.textFaint,
    fontFamily: typography.regular,
    fontSize: 10,
    marginTop: spacing.xs,
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
