import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Award, BookOpen, Clock3, Flame, Medal, Star, Trophy } from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import {
  Card,
  PrimaryButton,
  ProgressBar,
  ScreenTitle,
  SectionHeader,
  StatCard,
} from '@/components/ui';
import { badgeById, badges } from '@/data/badges';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { selectKnownCount, useQuranStore } from '@/store/useQuranStore';
import { colors, radius, spacing, typography } from '@/theme';
import { dateKey, formatShortDate } from '@/utils/date';
import { getLevelProgress } from '@/utils/gamification';

function lastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    return dateKey(date);
  });
}

export default function StatsScreen() {
  const stats = useQuranStore((state) => state.stats);
  const history = useQuranStore((state) => state.history);
  const knownCount = useQuranStore(selectKnownCount);
  const { configured, isPremium, loading } = useSubscription();
  const hasFullAccess = !configured || loading || isPremium;
  const level = getLevelProgress(stats.totalXP);
  const days = lastSevenDays();
  const values = days.map(
    (day) => history.find((record) => record.date === day)?.xpEarned ?? 0,
  );
  const max = Math.max(50, ...values);

  return (
    <AppScreen>
      <ScreenTitle title="Ta progression" subtitle="Ce qui grandit grâce à ta régularité." />

      <View style={styles.statsRow}>
        <StatCard icon={Flame} label="streak actuel" value={stats.currentStreak} />
        <StatCard icon={Trophy} label="record" value={stats.longestStreak} />
        {hasFullAccess ? (
          <StatCard icon={BookOpen} label="sourates" value={knownCount} />
        ) : null}
      </View>

      {!hasFullAccess ? (
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
      ) : (
        <>
          <Card gradient style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <View style={styles.levelBadge}>
                <Award color={colors.gold} size={30} />
              </View>
              <View style={styles.levelCopy}>
                <Text style={styles.levelKicker}>Niveau {level.current.level}</Text>
                <Text style={styles.levelName}>{level.current.name}</Text>
                <Text style={styles.levelArabic}>{level.current.arabic}</Text>
              </View>
              <View style={styles.xpBlock}>
                <Text style={styles.xpValue}>{stats.totalXP}</Text>
                <Text style={styles.xpLabel}>XP total</Text>
              </View>
            </View>
            <ProgressBar value={level.progress} />
            <Text style={styles.levelFoot}>
              {level.next
                ? `${level.remaining} XP avant ${level.next.name}`
                : 'Niveau maximal atteint'}
            </Text>
          </Card>

          <SectionHeader title="Les 7 derniers jours" />
          <Card>
            <View style={styles.chart}>
              {days.map((day, index) => (
                <View key={day} style={styles.barColumn}>
                  <Text style={styles.barValue}>{values[index] || ''}</Text>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: `${Math.max(
                            values[index] ? 12 : 3,
                            (values[index] / max) * 100,
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>
                    {formatShortDate(day).split(' ')[0]}
                  </Text>
                </View>
              ))}
            </View>
          </Card>

          <SectionHeader title="Vue d’ensemble" />
          <View style={styles.overviewGrid}>
            <Card style={styles.overviewCard}>
              <Clock3 color={colors.gold} size={21} />
              <Text style={styles.overviewValue}>{stats.totalMinutes} min</Text>
              <Text style={styles.overviewLabel}>temps de récitation</Text>
            </Card>
            <Card style={styles.overviewCard}>
              <Star color={colors.success} size={21} />
              <Text style={styles.overviewValue}>{stats.totalSessions}</Text>
              <Text style={styles.overviewLabel}>sessions terminées</Text>
            </Card>
          </View>

          <SectionHeader title="Badges" />
          <View style={styles.badges}>
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
                    style={[
                      styles.badgeTitle,
                      !unlocked && styles.badgeTextLocked,
                    ]}
                  >
                    {definition.title}
                  </Text>
                  <Text style={styles.badgeDescription}>
                    {definition.description}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  levelCard: {
    marginTop: spacing.sm,
  },
  levelHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  levelBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 60,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 60,
  },
  levelCopy: {
    flex: 1,
  },
  levelKicker: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  levelName: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 21,
    marginTop: 1,
  },
  levelArabic: {
    color: colors.textMuted,
    fontFamily: typography.arabic,
    fontSize: 18,
  },
  xpBlock: {
    alignItems: 'flex-end',
  },
  xpValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 22,
  },
  xpLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
  },
  levelFoot: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
    marginTop: spacing.sm,
    textAlign: 'right',
  },
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: 170,
    justifyContent: 'space-between',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 10,
    height: 18,
  },
  barTrack: {
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  overviewGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  overviewCard: {
    flex: 1,
    padding: spacing.md,
  },
  overviewValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 22,
    marginTop: spacing.sm,
  },
  overviewLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  badge: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    width: '48.5%',
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
    backgroundColor: 'rgba(212,175,55,0.15)',
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
