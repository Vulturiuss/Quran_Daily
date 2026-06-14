import { useEffect, useRef } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Award, BookOpen, CheckCircle2, Clock3, Flame, Home, Share2, Star } from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { Card, PrimaryButton } from '@/components/ui';
import { badgeById } from '@/data/badges';
import { useQuranStore } from '@/store/useQuranStore';
import { colors, radius, spacing, typography } from '@/theme';
import { formatDuration } from '@/utils/date';

export default function SessionCompleteScreen() {
  const activeSession = useQuranStore((state) => state.activeSession);
  const completeDailySession = useQuranStore((state) => state.completeDailySession);
  const summary = useQuranStore((state) => state.lastSummary);
  const stats = useQuranStore((state) => state.stats);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!completedRef.current && activeSession) {
      completedRef.current = true;
      completeDailySession();
    }
  }, [activeSession, completeDailySession]);

  async function shareResult() {
    if (!summary) return;
    await Share.share({
      message: `Quran Daily · Session terminée\n${summary.surahsReviewed} sourates révisées, ${summary.versesLearned} versets appris et +${summary.xpEarned} XP.`,
    });
  }

  if (!summary) {
    return (
      <AppScreen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Finalisation de la session…</Text>
        </View>
      </AppScreen>
    );
  }

  const unlocked = summary.unlockedBadgeIds.map((id) => badgeById[id]).filter(Boolean);

  return (
    <AppScreen contentStyle={styles.screen}>
      <View style={styles.sparkles}>
        <Text style={[styles.sparkle, styles.sparkleOne]}>✦</Text>
        <Text style={[styles.sparkle, styles.sparkleTwo]}>☾</Text>
        <Text style={[styles.sparkle, styles.sparkleThree]}>✧</Text>
        <Text style={[styles.sparkle, styles.sparkleFour]}>◆</Text>
      </View>

      <View style={styles.successIcon}>
        <CheckCircle2 color={colors.gold} size={58} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>Session accomplie</Text>
      <Text style={styles.subtitle}>Une petite étape répétée devient une vraie transformation.</Text>

      <View style={styles.xpPill}>
        <Star color={colors.backgroundDeep} fill={colors.backgroundDeep} size={18} />
        <Text style={styles.xpText}>+{summary.xpEarned} XP</Text>
      </View>

      <View style={styles.streakRow}>
        <Flame color={colors.gold} fill={colors.gold} size={27} />
        <View>
          <Text style={styles.streakValue}>{stats.currentStreak} jours</Text>
          <Text style={styles.streakLabel}>de régularité</Text>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <Card style={styles.summaryCard}>
          <BookOpen color={colors.gold} size={20} />
          <Text style={styles.summaryValue}>{summary.surahsReviewed}</Text>
          <Text style={styles.summaryLabel}>révisions</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Award color={colors.success} size={20} />
          <Text style={styles.summaryValue}>{summary.versesLearned}</Text>
          <Text style={styles.summaryLabel}>versets</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Clock3 color={colors.warning} size={20} />
          <Text style={styles.summaryValue}>{formatDuration(summary.durationSeconds)}</Text>
          <Text style={styles.summaryLabel}>durée</Text>
        </Card>
      </View>

      {unlocked.length ? (
        <Card gradient style={styles.badgeCard}>
          <View style={styles.badgeIcon}>
            <Award color={colors.gold} size={27} />
          </View>
          <View style={styles.badgeCopy}>
            <Text style={styles.badgeKicker}>Nouveau badge</Text>
            <Text style={styles.badgeTitle}>{unlocked[0].title}</Text>
            <Text style={styles.badgeText}>{unlocked[0].description}</Text>
          </View>
          <Text style={styles.badgeSymbol}>{unlocked[0].symbol}</Text>
        </Card>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton icon={Home} label="Retour à l’accueil" onPress={() => router.replace('/(tabs)')} />
        <PrimaryButton icon={Share2} label="Partager" onPress={shareResult} variant="ghost" />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'center',
    paddingTop: 44,
  },
  sparkles: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sparkle: {
    color: colors.gold,
    fontSize: 22,
    opacity: 0.65,
    position: 'absolute',
  },
  sparkleOne: {
    left: 32,
    top: 74,
  },
  sparkleTwo: {
    right: 34,
    top: 110,
  },
  sparkleThree: {
    left: 65,
    top: 220,
  },
  sparkleFour: {
    right: 55,
    top: 255,
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderColor: colors.gold,
    borderRadius: 52,
    borderWidth: 1,
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  title: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 32,
    letterSpacing: -1,
    marginTop: spacing.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
    maxWidth: 320,
    textAlign: 'center',
  },
  xpPill: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  xpText: {
    color: colors.backgroundDeep,
    fontFamily: typography.extraBold,
    fontSize: 17,
  },
  streakRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  streakValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 20,
  },
  streakLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: '100%',
  },
  summaryCard: {
    alignItems: 'center',
    flex: 1,
    padding: spacing.md,
  },
  summaryValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 18,
    marginTop: spacing.xs,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 10,
    marginTop: 2,
  },
  badgeCard: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: spacing.md,
    width: '100%',
  },
  badgeIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderRadius: radius.md,
    height: 50,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 50,
  },
  badgeCopy: {
    flex: 1,
  },
  badgeKicker: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  badgeTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 16,
    marginTop: 2,
  },
  badgeText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 11,
    marginTop: 2,
  },
  badgeSymbol: {
    color: colors.gold,
    fontSize: 29,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: '100%',
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontFamily: typography.medium,
  },
});
