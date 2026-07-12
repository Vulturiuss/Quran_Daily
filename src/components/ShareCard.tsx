import { forwardRef, useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { ornamentalPatternSource } from '@/components/OrnamentalCard';
import { useTheme } from '@/providers/ThemeProvider';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';
import { SessionSummary } from '@/types';
import { formatDuration } from '@/utils/date';

interface ShareCardProps {
  streak: number;
  summary: SessionSummary;
}

const appUrl = process.env.EXPO_PUBLIC_APP_URL?.trim() || 'Quran Daily';

export const ShareCard = forwardRef<View, ShareCardProps>(
  ({ streak, summary }, ref) => {
    const { colors } = useTheme();
    const styles = useMemo(() => createStyles(colors), [colors]);

    return (
    <View collapsable={false} ref={ref} style={styles.frame}>
      <Image
        resizeMode="cover"
        source={ornamentalPatternSource}
        style={styles.pattern}
      />
      <LinearGradient
        colors={[...colors.shareGradient]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.card}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandSymbol}>☾</Text>
          </View>
          <View>
            <Text style={styles.brand}>Quran Daily</Text>
            <Text style={styles.tagline}>Récite chaque jour. N’oublie jamais.</Text>
          </View>
        </View>

        <View style={styles.center}>
          <Text style={styles.kicker}>
            {summary.isBonus ? 'SESSION BONUS' : 'SESSION DU JOUR'}
          </Text>
          <Text style={styles.title}>Session accomplie</Text>
          <Text style={styles.xp}>+{summary.xpEarned} XP</Text>
          <Text style={styles.streak}>🔥 {streak} jour{streak > 1 ? 's' : ''} de suite</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{summary.surahsReviewed}</Text>
            <Text style={styles.statLabel}>révisions</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{summary.versesLearned}</Text>
            <Text style={styles.statLabel}>versets</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatDuration(summary.durationSeconds)}</Text>
            <Text style={styles.statLabel}>durée</Text>
          </View>
        </View>

        <Text style={styles.quote}>
          « Les œuvres les plus aimées sont les plus régulières. »
        </Text>
        <Text style={styles.footer}>{appUrl}</Text>
      </LinearGradient>
    </View>
    );
  },
);

ShareCard.displayName = 'ShareCard';

function createStyles(colors: Palette) {
  return StyleSheet.create({
  frame: {
    aspectRatio: 1,
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    width: '100%',
  },
  pattern: {
    bottom: 0,
    left: 0,
    opacity: 0.05,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  card: {
    flex: 1,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  brandRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  brandMark: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.14),
    borderColor: colors.gold,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  brandSymbol: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 26,
  },
  brand: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 17,
  },
  tagline: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 9,
    marginTop: 1,
  },
  center: {
    alignItems: 'center',
  },
  kicker: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 10,
    letterSpacing: 1.6,
  },
  title: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 29,
    letterSpacing: -0.7,
    marginTop: spacing.xs,
  },
  xp: {
    color: colors.goldSoft,
    fontFamily: typography.extraBold,
    fontSize: 32,
    marginTop: spacing.sm,
  },
  streak: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  stats: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.white, 0.055),
    borderRadius: radius.md,
    flexDirection: 'row',
    paddingVertical: spacing.md,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 17,
  },
  statLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 9,
    marginTop: 2,
  },
  divider: {
    backgroundColor: colors.border,
    height: 32,
    width: 1,
  },
  quote: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
    fontStyle: 'italic',
    lineHeight: 16,
    paddingHorizontal: spacing.md,
    textAlign: 'center',
  },
  footer: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  });
}
