import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Award,
  BookOpen,
  CalendarCheck,
  ChevronRight,
  Clock3,
  Flame,
  Gauge,
  GraduationCap,
  HeartCrack,
  Medal,
  ShieldCheck,
  Star,
  Trophy,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import {
  MetricStrip,
  ProgressRing,
} from '@/components/HabitProgress';
import {
  Card,
  Pill,
  PrimaryButton,
  ProgressBar,
  ScreenTitle,
  SectionHeader,
} from '@/components/ui';
import { badgeById, badges } from '@/data/badges';
import { getSurah } from '@/data/surahs';
import { useAccess } from '@/hooks/useAccess';
import { useTheme } from '@/providers/ThemeProvider';
import { selectKnownCount, useQuranStore } from '@/store/useQuranStore';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';
import { formatShortDate } from '@/utils/date';
import { getLevelProgress } from '@/utils/gamification';
import { buildInsight } from '@/utils/insight';
import {
  ActivityRange,
  buildActivitySeries,
  summarizeActivity,
} from '@/utils/statistics';

export default function StatsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [range, setRange] = useState<ActivityRange>(7);
  const stats = useQuranStore((state) => state.stats);
  const history = useQuranStore((state) => state.history);
  const progress = useQuranStore((state) => state.progress);
  const knownCount = useQuranStore(selectKnownCount);
  const access = useAccess();
  // The Progress tab is a Premium feature; the streak and the headline counters
  // stay visible for free, since they are what makes the user come back.
  // Render optimistically until the tier resolves, or a subscriber is shown the
  // "unlock your statistics" paywall for a beat on every visit.
  const canSeeStats = access.stats || !access.resolved;
  const level = getLevelProgress(stats.totalXP);
  const totalVersesLearned = Object.values(progress).reduce(
    (total, item) => total + item.versesLearned,
    0,
  );
  // Computed for everyone, including free users: the paywall only shows the
  // count. "You have 12 fragile verses, Premium tells you which ones" sells far
  // better than "unlock your statistics" — the teaser is true, and it is theirs.
  const insight = useMemo(
    () => buildInsight(progress, history),
    [history, progress],
  );
  const learningSurah = getSurah(
    Object.values(progress).find((item) => item.status === 'learning')?.surahNumber,
  );
  const activity = buildActivitySeries(history, range);
  const activitySummary = summarizeActivity(activity);
  const max = Math.max(50, ...activity.map((point) => point.xp));

  return (
    <AppScreen>
      <ScreenTitle
        subtitle="Visualise le chemin parcouru, sans pression."
        title="Ma progression"
      />

      {!canSeeStats ? (
        <>
          <MetricStrip
            items={[
              { icon: Flame, label: 'streak actuel', value: stats.currentStreak },
              { icon: Trophy, label: 'record', value: stats.longestStreak },
              { icon: BookOpen, label: 'sourates connues', value: knownCount },
            ]}
          />
          <Card gradient style={styles.premiumGate}>
            <Award color={colors.gold} size={34} />
            {insight.weakVerseCount > 0 ? (
              <>
                <Text style={styles.premiumTitle}>
                  Tu as {insight.weakVerseCount} verset
                  {insight.weakVerseCount > 1 ? 's' : ''} fragile
                  {insight.weakVerseCount > 1 ? 's' : ''}.
                </Text>
                <Text style={styles.premiumText}>
                  Premium te dit lesquels, dans quelles sourates, et quand ta sourate
                  sera consolidée à ton rythme actuel.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.premiumTitle}>Sais où en est ta mémoire</Text>
                <Text style={styles.premiumText}>
                  Premium te dit quels versets sont fragiles, à quelle vitesse tu
                  consolides, et quand ta sourate sera entièrement vue.
                </Text>
              </>
            )}
            <PrimaryButton
              label="Découvrir Premium"
              onPress={() => router.push('/subscription')}
            />
          </Card>
        </>
      ) : (
        <>
          <Card gradient style={styles.globalCard}>
            <Text style={styles.globalTitle}>Progression globale</Text>
            <View style={styles.globalContent}>
              <ProgressRing label="du parcours" value={knownCount / 114} />
              <View style={styles.globalMetrics}>
                <View style={styles.globalMetric}>
                  <BookOpen color={colors.gold} size={18} />
                  <View>
                    <Text style={styles.globalValue}>{knownCount}</Text>
                    <Text style={styles.globalLabel}>sourates connues</Text>
                  </View>
                </View>
                <View style={styles.globalMetric}>
                  <GraduationCap color={colors.gold} size={18} />
                  <View>
                    <Text style={styles.globalValue}>{totalVersesLearned}</Text>
                    <Text style={styles.globalLabel}>versets mémorisés</Text>
                  </View>
                </View>
                <View style={styles.globalMetric}>
                  <Clock3 color={colors.gold} size={18} />
                  <View>
                    <Text style={styles.globalValue}>{stats.totalMinutes} min</Text>
                    <Text style={styles.globalLabel}>de récitation</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.levelDivider} />
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Award color={colors.gold} size={22} />
              </View>
              <View style={styles.levelCopy}>
                <Text style={styles.levelKicker}>Niveau {level.current.level}</Text>
                <Text style={styles.levelName}>
                  {level.current.name} · {level.current.arabic}
                </Text>
              </View>
              <Text style={styles.xpValue}>{stats.totalXP} XP</Text>
            </View>
            <ProgressBar value={level.progress} />
            <Text style={styles.levelFoot}>
              {level.next
                ? `${level.remaining} XP avant ${level.next.name}`
                : 'Niveau maximal atteint'}
            </Text>
          </Card>

          {/* What the app knows about your memory, and nobody else does. */}
          <SectionHeader title="Ta mémorisation" />
          <Card style={styles.insightCard}>
            <View style={styles.insightRow}>
              <View style={styles.insightIcon}>
                <Gauge color={colors.gold} size={20} />
              </View>
              <View style={styles.insightCopy}>
                <Text style={styles.insightValue}>
                  {insight.pace} verset{insight.pace > 1 ? 's' : ''} par jour
                </Text>
                <Text style={styles.insightLabel}>
                  {insight.minutesPerActiveDay > 0
                    ? `${insight.minutesPerActiveDay} min par jour actif`
                    : 'Ton rythme apparaîtra après quelques sessions.'}
                </Text>
              </View>
            </View>

            {insight.projectedCompletion && learningSurah ? (
              <View style={styles.insightRow}>
                <View style={styles.insightIcon}>
                  <CalendarCheck color={colors.gold} size={20} />
                </View>
                <View style={styles.insightCopy}>
                  <Text style={styles.insightValue}>
                    {learningSurah.nameTranslit} sera entièrement vue le{' '}
                    {formatShortDate(insight.projectedCompletion)}
                  </Text>
                  <Text style={styles.insightLabel}>À ton rythme des 14 derniers jours.</Text>
                </View>
              </View>
            ) : null}
          </Card>

          <SectionHeader title="Versets fragiles" />
          {insight.fragile.length === 0 ? (
            <Card style={styles.solidCard}>
              <ShieldCheck color={colors.success} size={22} />
              <View style={styles.insightCopy}>
                <Text style={styles.insightValue}>Rien de fragile en ce moment.</Text>
                <Text style={styles.insightLabel}>
                  Tout ce que tu as mémorisé tient. Continue simplement.
                </Text>
              </View>
            </Card>
          ) : (
            <View style={styles.fragileList}>
              {insight.fragile.map((item) => {
                const surah = getSurah(item.surahNumber);
                const solidity = Math.round(item.solidity * 100);
                return (
                  <Pressable
                    accessibilityLabel={`${surah?.nameTranslit ?? `Sourate ${item.surahNumber}`}, tient à ${solidity}%, ${item.weakVerses.length} versets à raffermir`}
                    accessibilityRole="button"
                    key={item.surahNumber}
                    onPress={() => router.push(`/surah/${item.surahNumber}`)}
                    style={({ pressed }) => pressed && styles.fragilePressed}
                  >
                    <Card style={styles.fragileCard}>
                      <View style={styles.fragileIcon}>
                        <HeartCrack color={colors.warning} size={19} />
                      </View>
                      <View style={styles.insightCopy}>
                        <Text style={styles.insightValue}>
                          {surah?.nameTranslit ?? `Sourate ${item.surahNumber}`} · tient à{' '}
                          {solidity} %
                        </Text>
                        <Text style={styles.insightLabel}>
                          {item.weakVerses.length} verset
                          {item.weakVerses.length > 1 ? 's' : ''} à raffermir
                        </Text>
                        <View style={styles.fragileBar}>
                          <ProgressBar
                            color={colors.warning}
                            height={5}
                            value={item.solidity}
                          />
                        </View>
                      </View>
                      <ChevronRight color={colors.textFaint} size={18} />
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          )}

          <SectionHeader title="Régularité" />
          <MetricStrip
            items={[
              { icon: Flame, label: 'streak actuel', value: stats.currentStreak },
              { icon: Trophy, label: 'meilleur record', value: stats.longestStreak },
              { icon: Star, label: 'sessions finies', value: stats.totalSessions },
            ]}
          />

          <SectionHeader
            action={
              <View style={styles.rangePills}>
                <Pill label="7 j" selected={range === 7} onPress={() => setRange(7)} />
                <Pill label="30 j" selected={range === 30} onPress={() => setRange(30)} />
              </View>
            }
            title="Activité"
          />
          <Card>
            <View style={styles.activitySummary}>
              <View style={styles.activityMetric}>
                <Text style={styles.activityValue}>{activitySummary.activeDays}</Text>
                <Text style={styles.activityLabel}>jours actifs</Text>
              </View>
              <View style={styles.activityMetric}>
                <Text style={styles.activityValue}>{activitySummary.minutes}</Text>
                <Text style={styles.activityLabel}>minutes</Text>
              </View>
              <View style={styles.activityMetric}>
                <Text style={styles.activityValue}>{activitySummary.xp}</Text>
                <Text style={styles.activityLabel}>XP gagnés</Text>
              </View>
            </View>

            <ScrollView
              horizontal={range === 30}
              contentContainerStyle={[
                styles.chart,
                range === 30 && styles.chartThirty,
              ]}
              showsHorizontalScrollIndicator={false}
            >
              {activity.map((point, index) => (
                <View
                  key={point.date}
                  style={[
                    styles.barColumn,
                    range === 30 && styles.barColumnThirty,
                  ]}
                >
                  <Text style={styles.barValue}>{point.xp || ''}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max(
                            point.xp ? 12 : 3,
                            (point.xp / max) * 100,
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>
                    {range === 30
                      ? index % 5 === 0 || index === activity.length - 1
                        ? Number(point.date.slice(-2))
                        : ''
                      : new Intl.DateTimeFormat('fr-FR', {
                          weekday: 'narrow',
                        }).format(new Date(`${point.date}T12:00:00`))}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Card>

          <SectionHeader title="Badges" />
          <ScrollView
            contentContainerStyle={styles.badges}
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {badges.map((badge) => {
              const unlocked = stats.badges.includes(badge.id);
              const definition = badgeById[badge.id];
              return (
                <View
                  key={badge.id}
                  style={[styles.badge, !unlocked && styles.badgeLocked]}
                >
                  <View
                    style={[
                      styles.badgeIcon,
                      unlocked && styles.badgeIconUnlocked,
                    ]}
                  >
                    {unlocked ? (
                      <Text style={styles.badgeSymbol}>{definition.symbol}</Text>
                    ) : (
                      <Medal color={colors.textFaint} size={22} />
                    )}
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.badgeTitle,
                      !unlocked && styles.badgeTextLocked,
                    ]}
                  >
                    {definition.title}
                  </Text>
                  <Text numberOfLines={2} style={styles.badgeDescription}>
                    {definition.description}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </>
      )}
    </AppScreen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  globalCard: {
    padding: spacing.lg,
  },
  globalTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 17,
    marginBottom: spacing.lg,
  },
  globalContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
  },
  globalMetrics: {
    flex: 1,
    gap: spacing.md,
  },
  globalMetric: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  globalValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 16,
  },
  globalLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 10,
  },
  levelDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.lg,
  },
  levelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  levelBadge: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.12),
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 44,
  },
  levelCopy: {
    flex: 1,
  },
  levelKicker: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  levelName: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 15,
    marginTop: 2,
  },
  xpValue: {
    color: colors.goldSoft,
    fontFamily: typography.extraBold,
    fontSize: 14,
  },
  levelFoot: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  insightCard: {
    gap: spacing.md,
    padding: spacing.md,
  },
  insightRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  insightIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.1),
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  insightCopy: {
    flex: 1,
  },
  insightValue: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  insightLabel: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  solidCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  fragileList: {
    gap: spacing.sm,
  },
  fragilePressed: {
    opacity: 0.76,
  },
  fragileCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  fragileIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.warning, 0.12),
    borderRadius: radius.md,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  fragileBar: {
    marginTop: spacing.xs,
  },
  rangePills: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  activitySummary: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
  },
  activityMetric: {
    alignItems: 'center',
    flex: 1,
  },
  activityValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 18,
  },
  activityLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 10,
    marginTop: 2,
  },
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: 170,
    justifyContent: 'space-between',
    width: '100%',
  },
  chartThirty: {
    gap: 3,
    minWidth: 720,
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barColumnThirty: {
    flex: 0,
    width: 21,
  },
  barValue: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 10,
    height: 18,
  },
  barTrack: {
    backgroundColor: withAlpha(colors.ink, 0.05),
    borderRadius: radius.pill,
    height: 115,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 18,
  },
  bar: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    width: 18,
  },
  barLabel: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 10,
    marginTop: spacing.sm,
  },
  badges: {
    gap: spacing.sm,
    paddingRight: spacing.lg,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    minHeight: 150,
    padding: spacing.md,
    width: 150,
  },
  badgeLocked: {
    opacity: 0.56,
  },
  badgeIcon: {
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.pill,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  badgeIconUnlocked: {
    backgroundColor: withAlpha(colors.gold, 0.15),
    borderColor: colors.gold,
    borderWidth: 1,
  },
  badgeSymbol: {
    color: colors.gold,
    fontSize: 25,
  },
  badgeTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  badgeTextLocked: {
    color: colors.textMuted,
  },
  badgeDescription: {
    color: colors.textFaint,
    fontFamily: typography.regular,
    fontSize: 10,
    lineHeight: 14,
    marginTop: 3,
    textAlign: 'center',
  },
  premiumGate: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.xl,
  },
  premiumTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 21,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  premiumText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
    maxWidth: 320,
    textAlign: 'center',
  },
  });
}
