import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  GraduationCap,
  Map as MapIcon,
  MoonStar,
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
import { useAccess } from '@/hooks/useAccess';
import { useTheme } from '@/providers/ThemeProvider';
import {
  sessionAccess,
} from '@/utils/access';
import {
  selectKnownCount,
  selectLearningProgress,
  useQuranStore,
} from '@/store/useQuranStore';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';
import { addDays, dateKey } from '@/utils/date';
import { getLevelProgress, pendingStreakRepair } from '@/utils/gamification';
import {
  currentRamadan,
  goalProgressMap,
  ramadanProgress,
} from '@/utils/ramadan';
import { buildSessionPreview } from '@/utils/sessionPlan';

/** "0,6 verset par jour" reads better than "0.6". */
function formatPace(value: number) {
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
}

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
  const access = useAccess();
  const todayRecord = history.find((record) => record.date === dateKey());
  const completedToday = Boolean(todayRecord);
  const learningSurah = getSurah(learningProgress?.surahNumber);
  const level = getLevelProgress(stats.totalXP);
  const totalVersesLearned = Object.values(progress).reduce(
    (total, item) => total + item.versesLearned,
    0,
  );
  const sessionPlan = buildSessionPreview(progress, profile, new Date());
  // Replaying the recent verses and reciting a finished surah whole are work.
  // Counting only reviews and new verses had the home screen announce "all caught
  // up, come back tomorrow" while the sabqi and the final check waited in another
  // tab — the two things the whole method now rests on.
  const sessionIsEmpty =
    sessionPlan.reviewCount === 0 &&
    sessionPlan.versesCount === 0 &&
    sessionPlan.sabqiCount === 0 &&
    sessionPlan.awaitingVerification === undefined;
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

  // A streak broken after 47 days is the classic uninstall. A freeze is already
  // holding it up — silently — so the user learns nothing and leaves. The freeze
  // buys a day; only this message tells them what to do with it.
  const lastCompletedDate = useMemo(
    () =>
      history.reduce<string | undefined>(
        (latest, record) => (!latest || record.date > latest ? record.date : latest),
        undefined,
      ),
    [history],
  );
  const streakRepair = pendingStreakRepair(stats, lastCompletedDate);
  const showStreakRepair = Boolean(streakRepair?.canRepair) && !completedToday;

  // Ramadan: announced in the run-up, followed once it starts, invisible the rest
  // of the year. `currentRamadan()` returns nothing outside the season, so nothing
  // below renders — no goal is ever imposed, and none is ever nagged about.
  const ramadan = useMemo(() => currentRamadan(), []);
  const ramadanGoal = profile.ramadanGoal;
  const ramadanStatus = useMemo(() => {
    if (!ramadan || !ramadanGoal) return undefined;
    return ramadanProgress(
      ramadanGoal,
      goalProgressMap(ramadanGoal.surahNumbers, progress),
      ramadan,
    );
  }, [progress, ramadan, ramadanGoal]);

  function startSession(isBonus = false) {
    // Never write on unresolved capabilities: the session would be stamped with
    // the free freeze allowance, which clamps a subscriber's three streak freezes
    // to one for the rest of the month.
    if (!access.resolved) return;

    // Work on the surah the mission card is actually showing: with several surahs
    // learnt in parallel, that is not necessarily the store's default.
    startDailySession(
      sessionAccess(access.hasFullAccess, isBonus, sessionPlan.learningSurah),
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
        <IconButton
          icon={Settings2}
          label="Ouvrir les réglages"
          onPress={() => router.push('/settings')}
        />
      </View>

      {showStreakRepair && streakRepair ? (
        <FadeInView>
          <Card style={styles.repairCard}>
            <View style={styles.repairTop}>
              <View style={styles.repairIcon}>
                <Flame color={colors.gold} fill={colors.gold} size={22} />
              </View>
              <View style={styles.repairCopy}>
                <Eyebrow>Ta série t’attend</Eyebrow>
                <Text style={styles.repairTitle}>
                  Ta série de {streakRepair.streakAtRisk} jour
                  {streakRepair.streakAtRisk > 1 ? 's' : ''} est en danger.
                </Text>
              </View>
            </View>
            <Text style={styles.repairText}>
              Tu as manqué hier. Fais ta session maintenant et elle est sauvée — rien
              de ce que tu as construit n’est perdu.
            </Text>
            <PrimaryButton
              icon={Flame}
              label="Sauver ma série"
              loading={!access.resolved}
              onPress={() => startSession(false)}
            />
          </Card>
        </FadeInView>
      ) : null}

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
                loading={!access.resolved}
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
              loading={!access.resolved}
              onPress={() => startSession(false)}
            />
          )}
        </OrnamentalCard>
      </FadeInView>

      {ramadan && !ramadanStatus ? (
        <FadeInView delay={60}>
          <Card style={styles.ramadanCard}>
            <View style={styles.ramadanTop}>
              <View style={styles.ramadanIcon}>
                <MoonStar color={colors.gold} size={22} />
              </View>
              <View style={styles.ramadanCopy}>
                <Eyebrow>
                  {ramadan.hasStarted
                    ? `Ramadan · jour ${ramadan.dayNumber}`
                    : 'Ramadan approche'}
                </Eyebrow>
                <Text style={styles.ramadanTitle}>
                  {ramadan.hasStarted
                    ? 'Il reste tout un mois devant toi.'
                    : 'Un mois, et ce que tu veux en garder.'}
                </Text>
              </View>
            </View>
            <Text style={styles.ramadanText}>
              {ramadan.hasStarted
                ? `Encore ${ramadan.daysRemaining} jour${ramadan.daysRemaining > 1 ? 's' : ''} pour porter quelque chose de précis. Choisis ce que tu veux emporter avec toi.`
                : 'Choisis dès maintenant ce que tu aimerais mémoriser pendant ce mois. Un objectif clair, à ton rythme.'}
            </Text>
            <PrimaryButton
              icon={MoonStar}
              label="Me fixer un objectif"
              onPress={() => router.push('/ramadan' as never)}
            />
          </Card>
        </FadeInView>
      ) : null}

      {ramadan && ramadanStatus && ramadanGoal ? (
        <FadeInView delay={60}>
          <Pressable
            accessibilityLabel="Mon objectif Ramadan"
            accessibilityRole="button"
            onPress={() => router.push('/ramadan' as never)}
            style={({ pressed }) => pressed && styles.mapPressed}
          >
            <Card style={styles.ramadanCard}>
              <View style={styles.ramadanTop}>
                <View style={styles.ramadanIcon}>
                  <MoonStar color={colors.gold} size={22} />
                </View>
                <View style={styles.ramadanCopy}>
                  <Eyebrow>
                    {ramadan.hasStarted
                      ? `Ramadan · jour ${ramadan.dayNumber} sur ${ramadan.totalDays}`
                      : 'Ramadan approche'}
                  </Eyebrow>
                  <Text style={styles.ramadanTitle}>Mon objectif</Text>
                </View>
                <Text style={styles.ramadanPercent}>
                  {Math.round(ramadanStatus.progress * 100)}%
                </Text>
              </View>

              <ProgressBar value={ramadanStatus.progress} />

              <Text style={styles.ramadanText}>
                {ramadanStatus.surahsDone}/{ramadanStatus.surahsTotal} sourate
                {ramadanStatus.surahsTotal > 1 ? 's' : ''} ·{' '}
                {ramadanStatus.versesLearned}/{ramadanStatus.versesTotal} versets
              </Text>

              {ramadanStatus.versesPerDayNeeded > 0 ? (
                <Text style={styles.ramadanPace}>
                  {formatPace(ramadanStatus.versesPerDayNeeded)} verset
                  {ramadanStatus.versesPerDayNeeded > 1 ? 's' : ''} par jour pour y
                  arriver.
                </Text>
              ) : (
                <Text style={styles.ramadanPace}>
                  Objectif atteint. Qu’Allah te l’accepte.
                </Text>
              )}

              {/* Behind the pace is not a verdict. What is left is what is left,
                  and the only thing worth saying is that it still fits. */}
              {!ramadanStatus.onTrack ? (
                <Text style={styles.ramadanEncouragement}>
                  Il te reste {ramadan.daysRemaining} jour
                  {ramadan.daysRemaining > 1 ? 's' : ''}, c’est jouable. Un verset
                  aujourd’hui vaut mieux que dix promis pour demain.
                </Text>
              ) : null}
            </Card>
          </Pressable>
        </FadeInView>
      ) : null}

      {learningSurah && learningProgress ? (
        <>
          <SectionHeader
            action={
              <Text
                accessibilityRole="button"
                onPress={() => router.push('/learn')}
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

      {/* The map is free on purpose: it is the thing that is not a score, so it
          cannot be lost — and nobody uninstalls an app holding months of their
          spiritual life made visible. */}
      <SectionHeader title="Ton parcours" />
      <Pressable
        accessibilityLabel={`Ma carte du Coran. ${totalVersesLearned} versets mémorisés, ${knownCount} sourates connues.`}
        accessibilityRole="button"
        onPress={() => router.push('/map')}
        style={({ pressed }) => pressed && styles.mapPressed}
      >
        <Card gradient style={styles.mapCard}>
          <View style={styles.mapIcon}>
            <MapIcon color={colors.gold} size={24} />
          </View>
          <View style={styles.mapCopy}>
            <Text style={styles.mapTitle}>Ma carte du Coran</Text>
            <Text style={styles.mapText}>
              {totalVersesLearned} verset{totalVersesLearned > 1 ? 's' : ''} · {knownCount}{' '}
              sourate{knownCount > 1 ? 's' : ''} connue{knownCount > 1 ? 's' : ''} sur 114
            </Text>
          </View>
          <ChevronRight color={colors.textFaint} size={20} />
        </Card>
      </Pressable>

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
  repairCard: {
    backgroundColor: withAlpha(colors.gold, 0.1),
    borderColor: colors.gold,
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  repairTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  repairIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.14),
    borderColor: colors.gold,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  repairCopy: {
    flex: 1,
  },
  repairTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 19,
    letterSpacing: -0.4,
    marginTop: 2,
  },
  repairText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 20,
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
    backgroundColor: withAlpha(colors.ink, 0.04),
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
  ramadanCard: {
    borderColor: withAlpha(colors.gold, 0.34),
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  ramadanTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  ramadanIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.12),
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  ramadanCopy: {
    flex: 1,
  },
  ramadanTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 18,
    letterSpacing: -0.3,
    marginTop: 2,
  },
  ramadanPercent: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 17,
  },
  ramadanText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  ramadanPace: {
    color: colors.goldSoft,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  ramadanEncouragement: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  mapPressed: {
    opacity: 0.76,
  },
  mapCard: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: spacing.md,
  },
  mapIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.12),
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 48,
  },
  mapCopy: {
    flex: 1,
  },
  mapTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 16,
  },
  mapText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    marginTop: 2,
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
