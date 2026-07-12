import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  BookOpenCheck,
  CalendarClock,
  ChevronRight,
  Clock3,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import {
  Card,
  PrimaryButton,
  ProgressBar,
  ScreenTitle,
  SectionHeader,
} from '@/components/ui';
import { getSurah } from '@/data/surahs';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useTheme } from '@/providers/ThemeProvider';
import {
  hasFullAccess as computeFullAccess,
  sessionAccess,
} from '@/utils/access';
import { useQuranStore } from '@/store/useQuranStore';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';
import { UserSurahProgress } from '@/types';
import { dateKey, dayDifference, formatShortDate } from '@/utils/date';
import { isDue, sortByReviewPriority } from '@/utils/srs';

function reviewDifficulty(progress: UserSurahProgress) {
  if (progress.reviewCount === 0) return 'Première révision';
  if (progress.easeFactor < 1.8) return 'Fragile';
  if (progress.reviewIntervalDays <= 2) return 'À renforcer';
  if (progress.reviewIntervalDays >= 14) return 'Stable';
  return 'En consolidation';
}

function reviewTiming(progress: UserSurahProgress, now: Date) {
  if (!progress.nextReviewAt) return 'À réviser maintenant';
  const diff = dayDifference(dateKey(now), dateKey(new Date(progress.nextReviewAt)));
  if (diff < 0) {
    const days = Math.abs(diff);
    return `En retard de ${days} jour${days > 1 ? 's' : ''}`;
  }
  if (diff === 0) return 'À réviser aujourd’hui';
  return `Dans ${diff} jour${diff > 1 ? 's' : ''}`;
}

function estimatedMinutes(progress: UserSurahProgress) {
  return Math.max(1, Math.ceil(progress.totalVerses / 8));
}

function ReviewCard({
  progress,
  now,
}: {
  progress: UserSurahProgress;
  now: Date;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const surah = getSurah(progress.surahNumber);
  if (!surah) return null;

  return (
    <Pressable
      accessibilityLabel={`${surah.nameTranslit}. ${reviewTiming(
        progress,
        now,
      )}. Difficulté ${reviewDifficulty(progress)}.`}
      accessibilityRole="button"
      onPress={() => router.push(`/surah/${surah.number}` as never)}
      style={({ pressed }) => [styles.reviewCard, pressed && styles.pressed]}
    >
      <View style={styles.reviewTop}>
        <View style={styles.reviewMark}>
          <RotateCcw color={colors.gold} size={20} />
        </View>
        <View style={styles.reviewCopy}>
          <View style={styles.reviewTitleRow}>
            <Text style={styles.reviewName}>{surah.nameTranslit}</Text>
            <Text style={styles.reviewArabic}>{surah.name}</Text>
          </View>
          <Text style={styles.reviewMeta}>{surah.nameFr}</Text>
        </View>
        <ChevronRight color={colors.textFaint} size={19} />
      </View>

      <View style={styles.reviewFacts}>
        <View style={styles.fact}>
          <CalendarClock color={colors.gold} size={15} />
          <View>
            <Text style={styles.factLabel}>Dernière révision</Text>
            <Text style={styles.factValue}>
              {progress.lastReviewedAt
                ? formatShortDate(dateKey(new Date(progress.lastReviewedAt)))
                : 'Jamais'}
            </Text>
          </View>
        </View>
        <View style={styles.fact}>
          <ShieldCheck color={colors.gold} size={15} />
          <View>
            <Text style={styles.factLabel}>Difficulté</Text>
            <Text style={styles.factValue}>{reviewDifficulty(progress)}</Text>
          </View>
        </View>
        <View style={styles.fact}>
          <Clock3 color={colors.gold} size={15} />
          <View>
            <Text style={styles.factLabel}>Temps estimé</Text>
            <Text style={styles.factValue}>{estimatedMinutes(progress)} min</Text>
          </View>
        </View>
      </View>

      <View style={styles.timingPill}>
        <Text style={styles.timingText}>{reviewTiming(progress, now)}</Text>
      </View>
    </Pressable>
  );
}

export default function ReviewScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const profile = useQuranStore((state) => state.profile);
  const progress = useQuranStore((state) => state.progress);
  const history = useQuranStore((state) => state.history);
  const startDailySession = useQuranStore((state) => state.startDailySession);
  const { configured, isPremium } = useSubscription();
  const hasFullAccess = computeFullAccess(configured, isPremium);
  const now = useMemo(() => new Date(), []);
  const reviewLimit = profile.dailyGoalReviews;
  const todayRecord = history.find((record) => record.date === dateKey(now));

  const known = useMemo(
    () => Object.values(progress).filter((item) => item.status === 'known'),
    [progress],
  );
  const dueReviews = sortByReviewPriority(known.filter((item) => isDue(item, now)));
  const dailyReviews = dueReviews.slice(0, reviewLimit);
  const upcomingReviews = sortByReviewPriority(
    known.filter((item) => !isDue(item, now)),
  ).slice(0, 3);
  const readiness = known.length
    ? Math.max(0, (known.length - dueReviews.length) / known.length)
    : 0;
  const dailyMinutes = dailyReviews.reduce(
    (total, item) => total + estimatedMinutes(item),
    0,
  );

  function startReviewSession(isBonus = false) {
    if (!known.length) {
      router.push('/library');
      return;
    }

    startDailySession(sessionAccess(hasFullAccess, isBonus));
    const session = useQuranStore.getState().activeSession;
    if (session?.reviewQueue.length) {
      router.push('/session/review');
    } else if (session?.versesTarget) {
      router.push('/session/learn');
    } else {
      router.push('/learn');
    }
  }

  return (
    <AppScreen>
      <ScreenTitle
        title="Réviser"
        subtitle="Reviens sur les sourates au bon moment, sans surcharge."
      />

      <Card gradient style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.heroIcon}>
            {todayRecord ? (
              <BookOpenCheck color={colors.gold} size={28} />
            ) : (
              <RotateCcw color={colors.gold} size={28} />
            )}
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>
              {todayRecord ? 'Révision du jour tenue' : 'File de révision'}
            </Text>
            <Text style={styles.heroTitle}>
              {dailyReviews.length
                ? `${dailyReviews.length} sourate${
                    dailyReviews.length > 1 ? 's' : ''
                  } à revoir`
                : todayRecord
                  ? 'Ton rendez-vous est validé.'
                  : 'Tout est à jour.'}
            </Text>
          </View>
        </View>

        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{dueReviews.length}</Text>
            <Text style={styles.heroStatLabel}>à réviser</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{known.length}</Text>
            <Text style={styles.heroStatLabel}>connues</Text>
          </View>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatValue}>{dailyMinutes || 1} min</Text>
            <Text style={styles.heroStatLabel}>estimées</Text>
          </View>
        </View>

        <View style={styles.progressBlock}>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Mémoire stable</Text>
            <Text style={styles.progressValue}>{Math.round(readiness * 100)}%</Text>
          </View>
          <ProgressBar value={readiness} />
        </View>

        {dailyReviews.length ? (
          <PrimaryButton
            icon={RotateCcw}
            label="Commencer les révisions"
            onPress={() => startReviewSession(false)}
          />
        ) : (
          <PrimaryButton
            icon={todayRecord || upcomingReviews.length ? Sparkles : BookOpenCheck}
            label={
              known.length
                ? 'Faire une révision bonus'
                : 'Choisir mes premières sourates'
            }
            onPress={() => startReviewSession(true)}
            variant={known.length ? 'surface' : 'gold'}
          />
        )}
      </Card>

      <SectionHeader
        title={dailyReviews.length ? 'À réviser maintenant' : 'Prochaines révisions'}
      />

      {dailyReviews.length ? (
        <View style={styles.list}>
          {dailyReviews.map((item) => (
            <ReviewCard key={item.surahNumber} now={now} progress={item} />
          ))}
        </View>
      ) : upcomingReviews.length ? (
        <View style={styles.list}>
          {upcomingReviews.map((item) => (
            <ReviewCard key={item.surahNumber} now={now} progress={item} />
          ))}
        </View>
      ) : (
        <Card style={styles.emptyCard}>
          <BookOpenCheck color={colors.gold} size={34} />
          <Text style={styles.emptyTitle}>Aucune révision prévue</Text>
          <Text style={styles.emptyText}>
            Marque des sourates comme connues pour alimenter ta routine de révision.
          </Text>
          <PrimaryButton
            compact
            label="Ouvrir la bibliothèque"
            onPress={() => router.push('/library')}
            variant="surface"
          />
        </Card>
      )}
    </AppScreen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  hero: {
    padding: spacing.lg,
  },
  heroTop: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.12),
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 58,
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 25,
    lineHeight: 31,
    marginTop: 3,
  },
  heroStats: {
    backgroundColor: withAlpha(colors.backgroundDeep, 0.32),
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  heroStat: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 19,
  },
  heroStatLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 10,
    marginTop: 2,
  },
  progressBlock: {
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 12,
  },
  progressValue: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  list: {
    gap: spacing.sm,
  },
  reviewCard: {
    backgroundColor: withAlpha(colors.background, 0.94),
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  pressed: {
    opacity: 0.78,
  },
  reviewTop: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  reviewMark: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.1),
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 44,
  },
  reviewCopy: {
    flex: 1,
  },
  reviewTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewName: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 17,
  },
  reviewArabic: {
    color: colors.gold,
    fontFamily: typography.arabic,
    fontSize: 22,
    marginLeft: spacing.sm,
  },
  reviewMeta: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    marginTop: 2,
  },
  reviewFacts: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
  },
  fact: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  factLabel: {
    color: colors.textFaint,
    fontFamily: typography.medium,
    fontSize: 10,
  },
  factValue: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 12,
    marginTop: 1,
  },
  timingPill: {
    alignSelf: 'flex-start',
    backgroundColor: withAlpha(colors.gold, 0.12),
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  timingText: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 11,
  },
  emptyCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 19,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 19,
    maxWidth: 300,
    textAlign: 'center',
  },
  });
}
