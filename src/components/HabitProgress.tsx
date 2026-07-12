import { ComponentType, ReactNode, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Flame, ShieldCheck } from 'lucide-react-native';
import { LucideProps } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';

import { Card, ProgressBar } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [colors]);
}

type Icon = ComponentType<LucideProps>;

export interface MetricItem {
  icon: Icon;
  label: string;
  value: string | number;
}

export function StreakBanner({
  current,
  longest,
  freezeCount,
}: {
  current: number;
  longest: number;
  freezeCount: number;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const recordGap = Math.max(0, longest - current);
  const message =
    current === 0
      ? 'Ta prochaine session lance une nouvelle série.'
      : recordGap > 0
        ? `${recordGap} jour${recordGap > 1 ? 's' : ''} avant ton record.`
        : 'Ton meilleur rythme est en cours.';

  return (
    <View
      accessibilityLabel={`${current} jours de suite. ${message}`}
      accessible
      style={styles.streakBanner}
    >
      <View style={styles.streakIcon}>
        <Flame color={colors.gold} fill={colors.gold} size={22} />
      </View>
      <View style={styles.streakCopy}>
        <Text style={styles.streakValue}>
          {current} jour{current > 1 ? 's' : ''} de suite
        </Text>
        <Text style={styles.streakMessage}>{message}</Text>
      </View>
      <View style={styles.freeze}>
        <ShieldCheck color={colors.success} size={15} />
        <Text style={styles.freezeValue}>{freezeCount}</Text>
      </View>
    </View>
  );
}

export function MetricStrip({ items }: { items: MetricItem[] }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Card style={styles.metricStrip}>
      {items.map((item, index) => {
        const IconComponent = item.icon;
        return (
          <View
            accessibilityLabel={`${item.label} : ${item.value}`}
            accessible
            key={item.label}
            style={[
              styles.metricItem,
              index < items.length - 1 && styles.metricItemBorder,
            ]}
          >
            <IconComponent color={colors.gold} size={18} />
            <Text style={styles.metricValue}>{item.value}</Text>
            <Text numberOfLines={2} style={styles.metricLabel}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </Card>
  );
}

export function RewardProgress({
  icon: IconComponent,
  eyebrow,
  title,
  detail,
  value,
  trailing,
}: {
  icon: Icon;
  eyebrow: string;
  title: string;
  detail: string;
  value: number;
  trailing?: ReactNode;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Card style={styles.rewardCard}>
      <View style={styles.rewardTop}>
        <View style={styles.rewardIcon}>
          <IconComponent color={colors.gold} size={22} />
        </View>
        <View style={styles.rewardCopy}>
          <Text style={styles.rewardEyebrow}>{eyebrow}</Text>
          <Text style={styles.rewardTitle}>{title}</Text>
          <Text style={styles.rewardDetail}>{detail}</Text>
        </View>
        {trailing}
      </View>
      <ProgressBar value={value} height={7} />
    </Card>
  );
}

export function ProgressRing({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const size = 120;
  const strokeWidth = 10;
  const radiusValue = (size - strokeWidth) / 2;
  const circumference = radiusValue * 2 * Math.PI;
  const normalized = Math.max(0, Math.min(1, value));

  return (
    <View accessibilityLabel={`${Math.round(normalized * 100)}% ${label}`} accessible>
      <Svg height={size} width={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radiusValue}
          stroke={withAlpha(colors.white, 0.08)}
          strokeWidth={strokeWidth}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          fill="none"
          r={radiusValue}
          stroke={colors.gold}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={circumference * (1 - normalized)}
          strokeLinecap="round"
          strokeWidth={strokeWidth}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View pointerEvents="none" style={styles.ringLabel}>
        <Text style={styles.ringValue}>{Math.round(normalized * 100)}%</Text>
        <Text style={styles.ringText}>{label}</Text>
      </View>
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  streakBanner: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.08),
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.md,
    minHeight: 70,
    padding: spacing.md,
  },
  streakIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.12),
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 42,
  },
  streakCopy: {
    flex: 1,
  },
  streakValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 15,
  },
  streakMessage: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
    marginTop: 2,
  },
  freeze: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.success, 0.1),
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  freezeValue: {
    color: colors.success,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  metricStrip: {
    flexDirection: 'row',
    paddingHorizontal: 0,
    paddingVertical: spacing.md,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
    minHeight: 80,
    paddingHorizontal: spacing.sm,
  },
  metricItemBorder: {
    borderRightColor: colors.border,
    borderRightWidth: 1,
  },
  metricValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 22,
    marginTop: spacing.xs,
  },
  metricLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 10,
    lineHeight: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  rewardCard: {
    padding: spacing.md,
  },
  rewardTop: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  rewardIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.1),
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 46,
  },
  rewardCopy: {
    flex: 1,
  },
  rewardEyebrow: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rewardTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 16,
    marginTop: 2,
  },
  rewardDetail: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
    marginTop: 2,
  },
  ringLabel: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  ringValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 25,
  },
  ringText: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 10,
    marginTop: 1,
  },
  });
}
