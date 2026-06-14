import { ComponentType, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideProps } from 'lucide-react-native';

import { colors, radius, spacing, typography } from '@/theme';

type Icon = ComponentType<LucideProps>;

export function Eyebrow({ children }: { children: ReactNode }) {
  return <Text style={styles.eyebrow}>{children}</Text>;
}

export function ScreenTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.titleCopy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function Card({
  children,
  style,
  gradient = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gradient?: boolean;
}) {
  if (gradient) {
    return (
      <LinearGradient
        colors={[colors.surfaceElevated, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, style]}
      >
        {children}
      </LinearGradient>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function PrimaryButton({
  label,
  onPress,
  icon: IconComponent,
  disabled,
  loading,
  variant = 'gold',
  compact,
}: {
  label: string;
  onPress: () => void;
  icon?: Icon;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'gold' | 'surface' | 'ghost' | 'danger';
  compact?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        compact && styles.buttonCompact,
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'gold' ? colors.backgroundDeep : colors.text} />
      ) : (
        <>
          {IconComponent ? (
            <IconComponent
              size={compact ? 17 : 19}
              strokeWidth={2.3}
              color={variant === 'gold' ? colors.backgroundDeep : colors.text}
            />
          ) : null}
          <Text
            style={[
              styles.buttonText,
              variant === 'gold' && styles.buttonTextGold,
              compact && styles.buttonTextCompact,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function ProgressBar({
  value,
  color = colors.gold,
  height = 8,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  return (
    <View style={[styles.progressTrack, { height }]}>
      <View
        style={[
          styles.progressFill,
          { backgroundColor: color, height, width: `${Math.max(0, Math.min(1, value)) * 100}%` },
        ]}
      />
    </View>
  );
}

export function StatCard({
  value,
  label,
  icon: IconComponent,
  accent = colors.gold,
}: {
  value: string | number;
  label: string;
  icon: Icon;
  accent?: string;
}) {
  return (
    <View style={styles.statCard}>
      <IconComponent size={18} color={accent} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Pill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        selected && styles.pillSelected,
        pressed && styles.buttonPressed,
      ]}
    >
      <Text style={[styles.pillText, selected && styles.pillTextSelected]}>{label}</Text>
    </Pressable>
  );
}

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action}
    </View>
  );
}

export function IconButton({
  icon: IconComponent,
  onPress,
  label,
}: {
  icon: Icon;
  onPress: () => void;
  label: string;
}) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
    >
      <IconComponent color={colors.text} size={21} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 12,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  titleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  titleCopy: {
    flex: 1,
    paddingRight: spacing.md,
  },
  title: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 30,
    letterSpacing: -0.8,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 3,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    padding: spacing.lg,
  },
  button: {
    alignItems: 'center',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  button_gold: {
    backgroundColor: colors.gold,
  },
  button_surface: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderWidth: 1,
  },
  button_ghost: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(245,245,240,0.18)',
    borderWidth: 1,
  },
  button_danger: {
    backgroundColor: 'rgba(229,115,115,0.14)',
    borderColor: 'rgba(229,115,115,0.35)',
    borderWidth: 1,
  },
  buttonCompact: {
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonPressed: {
    opacity: 0.76,
    transform: [{ scale: 0.985 }],
  },
  buttonText: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 16,
  },
  buttonTextGold: {
    color: colors.backgroundDeep,
  },
  buttonTextCompact: {
    fontSize: 14,
  },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.09)',
    borderRadius: radius.pill,
    overflow: 'hidden',
    width: '100%',
  },
  progressFill: {
    borderRadius: radius.pill,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    minHeight: 112,
    padding: spacing.md,
  },
  statValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 24,
    marginTop: spacing.xs,
  },
  statLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  pill: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 9,
  },
  pillSelected: {
    backgroundColor: 'rgba(212,175,55,0.17)',
    borderColor: colors.gold,
  },
  pillText: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  pillTextSelected: {
    color: colors.goldSoft,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 19,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
});
