import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Play,
  RotateCcw,
  Settings2,
  Zap,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { FadeInView } from '@/components/FadeInView';
import {
  MetricStrip,
  RewardProgress,
  StreakBanner,
} from '@/components/HabitProgress';
import { GeometricDivider, IslamicStar } from '@/components/IslamicOrnaments';
import { OrnamentalCard } from '@/components/OrnamentalCard';
import {
  Card,
  Eyebrow,
  IconButton,
  PrimaryButton,
  ProgressBar,
  SectionHeader,
} from '@/components/ui';
import { getSurah } from '@/data/surahs';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { FREE_SURAH_NUMBERS, isFreeSurah } from '@/services/subscription';
import {
  FREE_MAX_REVIEWS,
  hasFullAccess as computeFullAccess,
  sessionAccess,
} from '@/utils/access';
import {
  selectKnownCount,
  selectLearningProgress,
  useQuranStore,
} from '@/store/useQuranStore';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';
import { addDays, dateKey } from '@/utils/date';
import { getLevelProgress } from '@/utils/gamification';
import { buildSessionPreview } from '@/utils/sessionPlan';

export default function HomeScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const profile = useQuranStore((state) => state.profile);
  const stats = useQuranStore((state) => state.stats);
  const history = useQuranStore((state) => state.history);
  const knownCount = useQuranStore(selectKnownCount);
  const learningProgress = useQuranStore(selectLearningProgress);
  const startDailySession = useQuranStore((state) => state.startDailySession);
  const progress = useQuranStore((state) => state.progress);
  const { configured, isPremium } = useSubscription();
  const hasFullAccess = computeFullAccess(configured, isPremium);
  const todayRecord = history.find((record) => record.date === dateKey());
  const completedToday = Boolean(todayRecord);
  const learningSurah = getSurah(learningProgress?.surahNumber);
  const level = getLevelProgress(stats.totalXP);
  const totalVersesLearned = Object.values(progress).reduce(
    (total, item) => total + item.versesLearned,
    0,
  );
  const sessionPlan = buildSessionPreview(
    progress,
    profile,
    new Date(),
    hasFullAccess
      ? profile.dailyGoalReviews
      : Math.min(FREE_MAX_REVIEWS, profile.dailyGoalReviews),
    hasFullAccess ? undefined : FREE_SURAH_NUMBERS,
  );
  const sessionIsEmpty =
    sessionPlan.reviewCount === 0 && sessionPlan.versesCount === 0;
  const reviewNames = sessionPlan.reviewSurahNumbers
    .map((number) => getSurah(number)?.nameTranslit)
    .filter(Boolean)
    .join(' · ');
  const missionLearningSurah = getSurah(sessionPlan.learningSurah);
  const sevenDaysAgo = dateKey(addDays(new Date(), -6));
  const activeDaysThisWeek = new Set(
    history
      .filter((record) => record.date >= sevenDaysAgo)
      .map((record) => record.date),
  ).size;
  const displayedReviews = completedToday
    ? todayRecord?.surahsReviewed ?? 0
    : sessionPlan.reviewCount;
  const displayedVerses = completedToday
    ? todayRecord?.versesLearned ?? 0
    : sessionPlan.versesCount;
  const progressValue = learningProgress
    ? learningProgress.versesLearned / learningProgress.totalVerses
    : 0;

  function startSession(isBonus = false) {
    startDailySession(sessionAccess(hasFullAccess, isBonus));
    const session = useQuranStore.getState().activeSession;
    router.push(session?.reviewQueue.length ? '/session/review' : '/session/learn');
  }

  return (
    <AppScreen>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Assalamu alaykum,</Text>
          <Text style={styles.name}>{profile.displayName}</Text>
        </View>
        <IconButton
          icon={Settings2}
          label="Ouvrir les réglages"
          onPress={() => router.push('/settings')}
        />
      </View>

      <StreakBanner
        current={stats.currentStreak}
        freezeCount={stats.freezeCount}
        longest={stats.longestStreak}
      />

      <FadeInView>
        <OrnamentalCard contentStyle={styles.sessionCard}>
          <View style={styles.sessionGlow} />
          <View style={styles.sessionTop}>
            <View style={styles.sessionHeading}>
              <Eyebrow>
                {completedToday
                  ? 'Rendez-vous tenu'
                  : sessionIsEmpty
                    ? 'Progression à jour'
                    : 'Mission du jour'}
              </Eyebrow>
              <Text style={styles.sessionTitle}>
                {completedToday
                  ? 'Belle constance.'
                  : sessionIsEmpty
                    ? 'Tout est à jour. Reviens demain.'
                    : 'Avance en quelques minutes.'}
              </Text>
            </View>
            <View style={[styles.sessionIcon, completedToday && styles.sessionIconDone]}>
              {completedToday ? (
                <CheckCircle2 color={colors.success} size={27} />
              ) : (
                <IslamicStar color={colors.goldSoft} size={30} />
              )}
            </View>
          </View>

          {completedToday ? (
            <View style={styles.sessionDetails}>
              <View style={styles.sessionDetail}>
                <Text style={styles.sessionDetailValue}>{displayedReviews}</Text>
                <Text style={styles.sessionDetailLabel}>sourates révisées</Text>
              </View>
              <View style={styles.sessionDivider} />
              <View style={styles.sessionDetail}>
                <Text style={styles.sessionDetailValue}>{displayedVerses}</Text>
                <Text style={styles.sessionDetailLabel}>versets appris</Text>
              </View>
            </View>
          ) : (
            <View style={styles.missionList}>
              <View style={styles.missionRow}>
                <View style={styles.missionIcon}>
                  <RotateCcw color={colors.gold} size={18} />
                </View>
                <View style={styles.missionCopy}>
                  <Text style={styles.missionLabel}>Réviser</Text>
                  <Text numberOfLines={1} style={styles.missionValue}>
                    {reviewNames || 'Aucune révision prévue'}
                  </Text>
                </View>
                <Text style={styles.missionCount}>{sessionPlan.reviewCount}</Text>
              </View>
              <View style={styles.missionRow}>
                <View style={styles.missionIcon}>
                  <GraduationCap color={colors.gold} size={19} />
                </View>
                <View style={styles.missionCopy}>
                  <Text style={styles.missionLabel}>Apprendre</Text>
                  <Text numberOfLines={1} style={styles.missionValue}>
                    {missionLearningSurah && sessionPlan.learningVerseStart
                      ? `${missionLearningSurah.nameTranslit} · versets ${sessionPlan.learningVerseStart}–${sessionPlan.learningVerseEnd}`
                      : 'Consolider tes acquis'}
                  </Text>
                </View>
                <Text style={styles.missionCount}>{sessionPlan.versesCount}</Text>
              </View>
              <GeometricDivider />
              <View style={styles.estimatedTime}>
                <Clock3 color={colors.goldSoft} size={17} />
                <Text style={styles.estimatedTimeLabel}>Temps estimé</Text>
                <Text style={styles.estimatedTimeValue}>
                  {sessionPlan.estimatedMinutes} min
                </Text>
              </View>
            </View>
          )}

          {completedToday || sessionIsEmpty ? (
            <View style={styles.completedActions}>
              <PrimaryButton
                icon={Play}
                label="Faire une session bonus"
                onPress={() => startSession(true)}
              />
              <PrimaryButton
                icon={ArrowRight}
                label="Voir ma progression"
                onPress={() => router.push('/stats')}
                variant="surface"
              />
            </View>
          ) : (
            <PrimaryButton
              icon={Play}
              label="Commencer ma session"
              onPress={() => startSession(false)}
            />
          )}
        </OrnamentalCard>
      </FadeInView>

      {learningSurah && learningProgress ? (
        <>
          <SectionHeader
            action={
              <Text
                accessibilityRole="button"
                onPress={() =>
                  !hasFullAccess && !isFreeSurah(learningSurah.number)
                    ? router.push(`/subscription?surah=${learningSurah.number}`)
                    : router.push('/learn')
                }
                style={styles.link}
              >
                Continuer
              </Text>
            }
            title="En apprentissage"
          />
          <Card style={styles.learningCard}>
            <View style={styles.learningTop}>
              <View style={styles.surahMark}>
                <GraduationCap color={colors.gold} size={20} />
              </View>
              <View style={styles.learningCopy}>
                <Text style={styles.learningName}>{learningSurah.nameTranslit}</Text>
                <Text style={styles.learningMeta}>
                  Prochain verset : {Math.min(
                    learningProgress.versesLearned + 1,
                    learningSurah.totalVerses,
                  )}
                  /{learningSurah.totalVerses}
                </Text>
              </View>
              <Text style={styles.learningArabic}>{learningSurah.name}</Text>
            </View>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>
                {learningProgress.versesLearned} versets mémorisés
              </Text>
              <Text style={styles.progressValue}>{Math.round(progressValue * 100)}%</Text>
            </View>
            <ProgressBar value={progressValue} />
          </Card>
        </>
      ) : null}

      <FadeInView delay={80}>
        <SectionHeader title="Ton élan" />
        <MetricStrip
          items={[
            { icon: BookOpen, label: 'sourates connues', value: knownCount },
            { icon: GraduationCap, label: 'versets mémorisés', value: totalVersesLearned },
            { icon: Zap, label: 'XP gagnés', value: stats.totalXP },
          ]}
        />
      </FadeInView>

      <SectionHeader title="Prochaine récompense" />
      <RewardProgress
        detail={
          level.next
            ? `${level.remaining} XP restants · ${activeDaysThisWeek}/5 jours actifs cette semaine`
            : `${activeDaysThisWeek}/5 jours actifs cette semaine`
        }
        eyebrow={`Niveau ${level.current.level}`}
        icon={Award}
        title={level.next ? `Débloquer ${level.next.name}` : 'Niveau maximal atteint'}
        trailing={
          <Text style={styles.rewardPercent}>{Math.round(level.progress * 100)}%</Text>
        }
        value={level.progress}
      />
    </AppScreen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  greeting: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
  },
  name: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 27,
    letterSpacing: -0.7,
  },
  sessionCard: {
    minHeight: 320,
    padding: spacing.lg,
  },
  sessionGlow: {
    backgroundColor: withAlpha(colors.gold, 0.11),
    borderRadius: 120,
    height: 210,
    position: 'absolute',
    right: -80,
    top: -90,
    width: 210,
  },
  sessionTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionHeading: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  sessionTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 25,
    letterSpacing: -0.6,
    lineHeight: 31,
    marginTop: spacing.sm,
    maxWidth: 265,
  },
  sessionIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.12),
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  sessionIconDone: {
    backgroundColor: withAlpha(colors.success, 0.12),
    borderColor: withAlpha(colors.success, 0.3),
  },
  sessionDetails: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.white, 0.04),
    borderRadius: radius.md,
    flexDirection: 'row',
    marginVertical: spacing.lg,
    padding: spacing.md,
  },
  sessionDetail: {
    alignItems: 'center',
    flex: 1,
  },
  sessionDetailValue: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 24,
  },
  sessionDetailLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
  },
  sessionDivider: {
    backgroundColor: colors.border,
    height: 38,
    marginHorizontal: spacing.md,
    width: 1,
  },
  missionList: {
    backgroundColor: colors.vignette,
    borderColor: withAlpha(colors.gold, 0.16),
    borderRadius: radius.md,
    borderWidth: 1,
    marginVertical: spacing.lg,
    padding: spacing.md,
  },
  missionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 52,
  },
  missionIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.1),
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  missionCopy: {
    flex: 1,
  },
  missionLabel: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  missionValue: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 14,
    marginTop: 2,
  },
  missionCount: {
    color: colors.goldSoft,
    fontFamily: typography.extraBold,
    fontSize: 18,
  },
  estimatedTime: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  estimatedTimeLabel: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 12,
  },
  estimatedTimeValue: {
    color: colors.goldSoft,
    fontFamily: typography.extraBold,
    fontSize: 14,
  },
  completedActions: {
    gap: spacing.sm,
  },
  link: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  learningCard: {
    padding: spacing.md,
  },
  learningTop: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  surahMark: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.1),
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 46,
  },
  learningCopy: {
    flex: 1,
  },
  learningName: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 17,
  },
  learningMeta: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    marginTop: 2,
  },
  learningArabic: {
    color: colors.goldSoft,
    fontFamily: typography.arabic,
    fontSize: 25,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
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
  rewardPercent: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 15,
  },
  });
}
