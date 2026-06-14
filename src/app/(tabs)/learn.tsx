import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { BookOpenCheck, Brain, Play, RotateCcw, Sparkles, Target } from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
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
  const { configured, isPremium, loading } = useSubscription();
  const hasFullAccess = !configured || loading || isPremium;
  const surah = getSurah(learning?.surahNumber);
  const verses = getVerses(learning?.surahNumber);
  const nextVerse = verses[learning?.versesLearned ?? 0];
  const progress = learning ? learning.versesLearned / learning.totalVerses : 0;

  function start() {
    startDailySession(
      hasFullAccess
        ? undefined
        : {
            maxReviews: 3,
            allowedSurahNumbers: FREE_SURAH_NUMBERS,
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

  if (!hasFullAccess && !isFreeSurah(surah.number)) {
    return (
      <AppScreen>
        <ScreenTitle
          title="Apprendre"
          subtitle="Cette sourate fait partie du parcours Premium."
        />
        <Card gradient style={styles.empty}>
          <Sparkles color={colors.gold} size={40} />
          <Text style={styles.emptyTitle}>{surah.nameTranslit}</Text>
          <Text style={styles.emptyText}>
            Débloque les 114 sourates et poursuis ta progression sans limite.
          </Text>
          <PrimaryButton
            label="Découvrir Premium"
            onPress={() => router.push('/subscription')}
          />
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

      <Card gradient style={styles.hero}>
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
            <Text style={styles.goalText}>{surah.totalVerses - learning.versesLearned} restants</Text>
          </View>
        </View>
        <PrimaryButton icon={Play} label="Lancer ma session" onPress={start} />
      </Card>

      {nextVerse ? (
        <>
          <SectionHeader title="Prochain verset" />
          <VerseCard verse={nextVerse} showToggle />
        </>
      ) : null}

      <SectionHeader title="Méthode du jour" />
      <View style={styles.methodRow}>
        <Card style={styles.methodCard}>
          <View style={styles.methodIcon}>
            <RotateCcw color={colors.gold} size={20} />
          </View>
          <Text style={styles.methodTitle}>Écoute & répète</Text>
          <Text style={styles.methodText}>Lis lentement trois fois avant de masquer le texte.</Text>
        </Card>
        <Card style={styles.methodCard}>
          <View style={styles.methodIcon}>
            <Sparkles color={colors.gold} size={20} />
          </View>
          <Text style={styles.methodTitle}>Récite de mémoire</Text>
          <Text style={styles.methodText}>Valide seulement quand le verset vient sans effort.</Text>
        </Card>
      </View>
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
  methodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  methodCard: {
    flex: 1,
    padding: spacing.md,
  },
  methodIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderRadius: radius.md,
    height: 40,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 40,
  },
  methodTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  methodText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
});
