import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Flame,
  Play,
  Settings2,
  Sparkles,
  Star,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import {
  Card,
  Eyebrow,
  IconButton,
  PrimaryButton,
  ProgressBar,
  SectionHeader,
  StatCard,
} from '@/components/ui';
import { getSurah } from '@/data/surahs';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { FREE_SURAH_NUMBERS, isFreeSurah } from '@/services/subscription';
import {
  selectKnownCount,
  selectLearningProgress,
  useQuranStore,
} from '@/store/useQuranStore';
import { colors, radius, spacing, typography } from '@/theme';
import { dateKey } from '@/utils/date';
import { getLevelProgress } from '@/utils/gamification';

export default function HomeScreen() {
  const profile = useQuranStore((state) => state.profile);
  const stats = useQuranStore((state) => state.stats);
  const history = useQuranStore((state) => state.history);
  const knownCount = useQuranStore(selectKnownCount);
  const learningProgress = useQuranStore(selectLearningProgress);
  const startDailySession = useQuranStore((state) => state.startDailySession);
  const { configured, isPremium, loading } = useSubscription();
  const hasFullAccess = !configured || loading || isPremium;
  const completedToday = history.some((record) => record.date === dateKey());
  const learningSurah = getSurah(learningProgress?.surahNumber);
  const level = getLevelProgress(stats.totalXP);
  const progressValue = learningProgress
    ? learningProgress.versesLearned / learningProgress.totalVerses
    : 0;

  function startSession() {
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

  return (
    <AppScreen>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Assalamu alaykum,</Text>
          <Text style={styles.name}>{profile.displayName}</Text>
        </View>
        <View style={styles.headerActions}>
          <View style={styles.streak}>
            <Flame color={colors.gold} fill={colors.gold} size={19} />
            <Text style={styles.streakText}>{stats.currentStreak}</Text>
          </View>
          <IconButton
            icon={Settings2}
            label="Ouvrir les réglages"
            onPress={() => router.push('/settings')}
          />
        </View>
      </View>

      <Card gradient style={styles.sessionCard}>
        <View style={styles.sessionGlow} />
        <View style={styles.sessionTop}>
          <View>
            <Eyebrow>{completedToday ? 'Rendez-vous tenu' : 'Session du jour'}</Eyebrow>
            <Text style={styles.sessionTitle}>
              {completedToday ? 'Belle constance.' : `${profile.dailyGoalMinutes} minutes pour avancer`}
            </Text>
          </View>
          <View style={[styles.sessionIcon, completedToday && styles.sessionIconDone]}>
            {completedToday ? (
              <CheckCircle2 color={colors.success} size={27} />
            ) : (
              <BookOpen color={colors.gold} size={27} />
            )}
          </View>
        </View>

        <View style={styles.sessionDetails}>
          <View style={styles.sessionDetail}>
            <Text style={styles.sessionDetailValue}>
              {hasFullAccess ? profile.dailyGoalReviews : Math.min(3, profile.dailyGoalReviews)}
            </Text>
            <Text style={styles.sessionDetailLabel}>sourates à revoir</Text>
          </View>
          <View style={styles.sessionDivider} />
          <View style={styles.sessionDetail}>
            <Text style={styles.sessionDetailValue}>{profile.dailyGoalVerses}</Text>
            <Text style={styles.sessionDetailLabel}>versets à apprendre</Text>
          </View>
        </View>

        {completedToday ? (
          <PrimaryButton
            icon={ArrowRight}
            label="Voir ma progression"
            onPress={() => router.push('/stats')}
            variant="surface"
          />
        ) : (
          <PrimaryButton icon={Play} label="Commencer ma session" onPress={startSession} />
        )}
      </Card>

      {learningSurah && learningProgress ? (
        <>
          <SectionHeader
            title="En apprentissage"
            action={
              <Text
                onPress={() =>
                  !hasFullAccess && !isFreeSurah(learningSurah.number)
                    ? router.push('/subscription')
                    : router.push('/learn')
                }
                style={styles.link}
              >
                Continuer
              </Text>
            }
          />
          <Card style={styles.learningCard}>
            <View style={styles.learningTop}>
              <View style={styles.surahMark}>
                <Text style={styles.surahNumber}>{learningSurah.number}</Text>
              </View>
              <View style={styles.learningCopy}>
                <Text style={styles.learningName}>{learningSurah.nameTranslit}</Text>
                <Text style={styles.learningMeta}>
                  {learningSurah.nameFr} · verset {learningProgress.versesLearned + 1}/
                  {learningSurah.totalVerses}
                </Text>
              </View>
              <Text style={styles.learningArabic}>{learningSurah.name}</Text>
            </View>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Progression</Text>
              <Text style={styles.progressValue}>{Math.round(progressValue * 100)}%</Text>
            </View>
            <ProgressBar value={progressValue} />
          </Card>
        </>
      ) : null}

      <SectionHeader title="Ton élan" />
      <View style={styles.statsRow}>
        <StatCard icon={Flame} label="jours de suite" value={stats.currentStreak} />
        <StatCard icon={BookOpen} label="sourates connues" value={knownCount} />
        <StatCard icon={Star} label="XP gagnés" value={stats.totalXP} />
      </View>

      <Card style={styles.levelCard}>
        <View style={styles.levelTop}>
          <View style={styles.levelIcon}>
            <Award color={colors.gold} size={23} />
          </View>
          <View style={styles.levelCopy}>
            <Text style={styles.levelLabel}>Niveau {level.current.level}</Text>
            <Text style={styles.levelName}>
              {level.current.name} · {level.current.arabic}
            </Text>
          </View>
          {level.next ? <Text style={styles.levelRemaining}>{level.remaining} XP</Text> : null}
        </View>
        <ProgressBar value={level.progress} color={colors.success} height={7} />
      </Card>

      <SectionHeader title="Une intention simple" />
      <View style={styles.quote}>
        <Sparkles color={colors.gold} size={19} />
        <Text style={styles.quoteText}>
          « Les œuvres les plus aimées sont les plus régulières, même si elles sont peu nombreuses. »
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
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
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  streak: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 5,
    height: 44,
    paddingHorizontal: 14,
  },
  streakText: {
    color: colors.goldSoft,
    fontFamily: typography.extraBold,
    fontSize: 15,
  },
  sessionCard: {
    minHeight: 330,
    padding: spacing.lg,
  },
  sessionGlow: {
    backgroundColor: 'rgba(212,175,55,0.11)',
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
  sessionTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 25,
    letterSpacing: -0.6,
    lineHeight: 31,
    marginTop: spacing.sm,
    maxWidth: 255,
  },
  sessionIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 58,
    justifyContent: 'center',
    width: 58,
  },
  sessionIconDone: {
    backgroundColor: 'rgba(129,199,132,0.12)',
    borderColor: 'rgba(129,199,132,0.3)',
  },
  sessionDetails: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radius.md,
    flexDirection: 'row',
    marginVertical: spacing.lg,
    padding: spacing.md,
  },
  sessionDetail: {
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
    fontSize: 12,
  },
  sessionDivider: {
    backgroundColor: colors.border,
    height: 38,
    marginHorizontal: spacing.md,
    width: 1,
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
    backgroundColor: colors.surfaceElevated,
    borderRadius: 13,
    height: 45,
    justifyContent: 'center',
    marginRight: spacing.md,
    transform: [{ rotate: '45deg' }],
    width: 45,
  },
  surahNumber: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 12,
    transform: [{ rotate: '-45deg' }],
  },
  learningCopy: {
    flex: 1,
  },
  learningName: {
    color: colors.text,
    fontFamily: typography.bold,
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
    fontSize: 26,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
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
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  levelCard: {
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  levelTop: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  levelIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderRadius: radius.md,
    height: 45,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 45,
  },
  levelCopy: {
    flex: 1,
  },
  levelLabel: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  levelName: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 16,
    marginTop: 2,
  },
  levelRemaining: {
    color: colors.success,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  quote: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(212,175,55,0.07)',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
  },
  quoteText: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 22,
  },
});
