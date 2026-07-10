import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BookOpenCheck, Brain, Check, Ear, Play, Sparkles, Target } from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { OrnamentalCard } from '@/components/OrnamentalCard';
import { VerseCard } from '@/components/VerseCard';
import { Card, Eyebrow, PrimaryButton, ProgressBar, ScreenTitle, SectionHeader } from '@/components/ui';
import { getSurah } from '@/data/surahs';
import { getVerses } from '@/data/verses';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { FREE_SURAH_NUMBERS, isFreeSurah } from '@/services/subscription';
import { selectLearningProgress, useQuranStore } from '@/store/useQuranStore';
import { colors, radius, spacing, typography } from '@/theme';

export default function LearnScreen() {
  const learning = useQuranStore(selectLearningProgress);
  const profile = useQuranStore((state) => state.profile);
  const startDailySession = useQuranStore((state) => state.startDailySession);
  const { configured, isPremium } = useSubscription();
  const hasFullAccess = !configured || isPremium;
  const surah = getSurah(learning?.surahNumber);
  const verses = getVerses(learning?.surahNumber);
  const nextVerse = verses[learning?.versesLearned ?? 0];
  const progress = learning ? learning.versesLearned / learning.totalVerses : 0;
  const premiumLocked = Boolean(
    surah && !hasFullAccess && !isFreeSurah(surah.number),
  );

  function start() {
    if (surah && premiumLocked) {
      router.push(`/subscription?surah=${surah.number}` as never);
      return;
    }
    startDailySession(
      hasFullAccess
        ? { freezeAllowance: 3 }
        : {
            maxReviews: 3,
            allowedSurahNumbers: FREE_SURAH_NUMBERS,
            freezeAllowance: 1,
          },
    );
    const session = useQuranStore.getState().activeSession;
    router.push(session?.reviewQueue.length ? '/session/review' : '/session/learn');
  }

  if (!learning || !surah) {
    return (
      <AppScreen>
        <ScreenTitle title="Apprendre" subtitle="Choisis une sourate pour commencer." />
        <Card style={styles.empty}>
          <BookOpenCheck color={colors.gold} size={40} />
          <Text style={styles.emptyTitle}>Aucune sourate en cours</Text>
          <Text style={styles.emptyText}>
            Ouvre la bibliothèque et sélectionne une sourate courte adaptée à ton rythme.
          </Text>
          <PrimaryButton label="Choisir une sourate" onPress={() => router.push('/library')} />
        </Card>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenTitle
        title="Apprendre"
        subtitle="Un verset après l’autre, avec calme et répétition."
      />

      <OrnamentalCard contentStyle={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Eyebrow>Sourate en cours</Eyebrow>
            <Text style={styles.surahName}>{surah.nameTranslit}</Text>
            <Text style={styles.surahMeta}>{surah.nameFr}</Text>
          </View>
          <Text style={styles.surahArabic}>{surah.name}</Text>
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>
            {learning.versesLearned} sur {surah.totalVerses} versets mémorisés
          </Text>
          <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
        </View>
        <ProgressBar value={progress} />
        <View style={styles.goalRow}>
          <View style={styles.goalItem}>
            <Target color={colors.gold} size={17} />
            <Text style={styles.goalText}>{profile.dailyGoalVerses} versets / jour</Text>
          </View>
          <View style={styles.goalItem}>
            <Brain color={colors.success} size={17} />
            <Text style={styles.goalText}>
              {surah.totalVerses - learning.versesLearned} restant
              {surah.totalVerses - learning.versesLearned > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <PrimaryButton
          icon={premiumLocked ? Sparkles : Play}
          label={premiumLocked ? 'Débloquer cette sourate' : 'Lancer ma session'}
          onPress={start}
        />
      </OrnamentalCard>

      {nextVerse ? (
        <>
          <SectionHeader title="Prochain verset" />
          <VerseCard verse={nextVerse} showToggle />
        </>
      ) : null}

      <SectionHeader title="Rituel de mémorisation" />
      <Card style={styles.ritualCard}>
        <View style={styles.ritualStep}>
          <View style={styles.ritualIcon}>
            <Ear color={colors.gold} size={19} />
          </View>
          <View style={styles.ritualCopy}>
            <Text style={styles.ritualTitle}>1. Écoute trois fois</Text>
            <Text style={styles.ritualText}>Repère le rythme avant de réciter.</Text>
          </View>
        </View>
        <View style={styles.ritualLine} />
        <View style={styles.ritualStep}>
          <View style={styles.ritualIcon}>
            <Brain color={colors.gold} size={19} />
          </View>
          <View style={styles.ritualCopy}>
            <Text style={styles.ritualTitle}>2. Masque le texte</Text>
            <Text style={styles.ritualText}>Récite sans aide, puis révèle pour vérifier.</Text>
          </View>
        </View>
        <View style={styles.ritualLine} />
        <View style={styles.ritualStep}>
          <View style={styles.ritualIcon}>
            <Check color={colors.success} size={19} />
          </View>
          <View style={styles.ritualCopy}>
            <Text style={styles.ritualTitle}>3. Valide sereinement</Text>
            <Text style={styles.ritualText}>La régularité compte plus que la vitesse.</Text>
          </View>
        </View>
      </Card>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 21,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
  hero: {
    minHeight: 310,
  },
  heroTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  surahName: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 28,
    letterSpacing: -0.7,
    marginTop: spacing.xs,
  },
  surahMeta: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
  },
  surahArabic: {
    color: colors.goldSoft,
    fontFamily: typography.arabic,
    fontSize: 36,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  progressLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 12,
  },
  progressPercent: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  goalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  goalItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  goalText: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 11,
  },
  ritualCard: {
    padding: spacing.md,
  },
  ritualStep: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  ritualIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,163,115,0.1)',
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 40,
  },
  ritualCopy: {
    flex: 1,
  },
  ritualTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  ritualText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  ritualLine: {
    backgroundColor: colors.border,
    height: spacing.sm,
    marginLeft: 20,
    marginVertical: 2,
    width: 1,
  },
});
