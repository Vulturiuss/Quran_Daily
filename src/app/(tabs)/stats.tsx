import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Award,
  BookOpen,
  Clock3,
  Flame,
  GraduationCap,
  Medal,
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
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { selectKnownCount, useQuranStore } from '@/store/useQuranStore';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';
import { getLevelProgress } from '@/utils/gamification';
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
  const { configured, isPremium } = useSubscription();
  const hasFullAccess = !configured || isPremium;
  const level = getLevelProgress(stats.totalXP);
  const totalVersesLearned = Object.values(progress).reduce(
    (total, item) => total + item.versesLearned,
    0,
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

      {!hasFullAccess ? (
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
            <Text style={styles.premiumTitle}>Débloque toutes tes statistiques</Text>
            <Text style={styles.premiumText}>
              Graphiques, XP, niveaux, temps de récitation et collection complète de badges.
            </Text>
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
    backgroundColor: withAlpha(colors.white, 0.05),
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
