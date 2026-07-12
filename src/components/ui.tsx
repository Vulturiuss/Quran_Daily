import { ComponentType, ReactNode, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LucideProps } from 'lucide-react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { Palette, motion, radius, spacing, typography, withAlpha } from '@/theme';

type Icon = ComponentType<LucideProps>;

function useStyles() {
  const { colors } = useTheme();
  return useMemo(() => createStyles(colors), [colors]);
}

export function Eyebrow({ children }: { children: ReactNode }) {
  const styles = useStyles();
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
  const styles = useStyles();
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
  const { colors } = useTheme();
  const styles = useStyles();
  if (gradient) {
    return (
      <LinearGradient
        colors={[colors.surfaceMuted, colors.surface, colors.background]}
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
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: Icon;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'gold' | 'surface' | 'ghost' | 'danger';
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        compact && styles.buttonCompact,
        (disabled || loading) && styles.buttonDisabled,
        pressed && styles.buttonPressed,
        style,
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
  color,
  height = 8,
}: {
  value: number;
  color?: string;
  height?: number;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const progress = useRef(new Animated.Value(0)).current;
  const normalizedValue = Math.max(0, Math.min(1, value));

  useEffect(() => {
    const animation = Animated.timing(progress, {
      duration: motion.standard,
      toValue: normalizedValue,
      useNativeDriver: false,
    });
    animation.start();
    return () => animation.stop();
  }, [normalizedValue, progress]);

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{
        max: 100,
        min: 0,
        now: Math.round(normalizedValue * 100),
      }}
      style={[styles.progressTrack, { height }]}
    >
      <Animated.View
        style={[
          styles.progressFill,
          {
            backgroundColor: color ?? colors.gold,
            height,
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

export function StatCard({
  value,
  label,
  icon: IconComponent,
  accent,
}: {
  value: string | number;
  label: string;
  icon: Icon;
  accent?: string;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View
      accessibilityLabel={`${label} : ${value}`}
      accessible
      style={styles.statCard}
    >
      <IconComponent size={18} color={accent ?? colors.gold} />
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
  const styles = useStyles();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected: Boolean(selected) }}
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
  const styles = useStyles();
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
  const { colors } = useTheme();
  const styles = useStyles();
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

export function TimeStepper({
  value,
  onChange,
}: {
  value: string;
  onChange: (time: string) => void;
}) {
  const styles = useStyles();
  const [hourStr, minuteStr] = value.split(':');
  const hour = Number(hourStr) || 0;
  const minute = Number(minuteStr) || 0;

  function commit(nextHour: number, nextMinute: number) {
    const h = ((nextHour % 24) + 24) % 24;
    const m = ((nextMinute % 60) + 60) % 60;
    onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }

  return (
    <View style={styles.timeStepper}>
      <View style={styles.timeStepperColumn}>
        <Pressable
          accessibilityLabel="Heure suivante"
          accessibilityRole="button"
          onPress={() => commit(hour + 1, minute)}
          style={({ pressed }) => [styles.timeStepperButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.timeStepperButtonText}>+</Text>
        </Pressable>
        <Text style={styles.timeStepperValue}>{String(hour).padStart(2, '0')}</Text>
        <Pressable
          accessibilityLabel="Heure précédente"
          accessibilityRole="button"
          onPress={() => commit(hour - 1, minute)}
          style={({ pressed }) => [styles.timeStepperButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.timeStepperButtonText}>-</Text>
        </Pressable>
      </View>
      <Text style={styles.timeStepperColon}>:</Text>
      <View style={styles.timeStepperColumn}>
        <Pressable
          accessibilityLabel="Minute suivante"
          accessibilityRole="button"
          onPress={() => commit(hour, minute + 5)}
          style={({ pressed }) => [styles.timeStepperButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.timeStepperButtonText}>+</Text>
        </Pressable>
        <Text style={styles.timeStepperValue}>{String(minute).padStart(2, '0')}</Text>
        <Pressable
          accessibilityLabel="Minute précédente"
          accessibilityRole="button"
          onPress={() => commit(hour, minute - 5)}
          style={({ pressed }) => [styles.timeStepperButton, pressed && styles.buttonPressed]}
        >
          <Text style={styles.timeStepperButtonText}>-</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
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
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      elevation: 2,
      overflow: 'hidden',
      padding: spacing.lg,
      shadowColor: colors.shadow,
      shadowOffset: { height: 5, width: 0 },
      shadowOpacity: 0.14,
      shadowRadius: 10,
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
      backgroundColor: colors.goldSoft,
      borderColor: colors.goldPale,
      borderWidth: 1,
      elevation: 5,
      shadowColor: colors.gold,
      shadowOffset: { height: 5, width: 0 },
      shadowOpacity: 0.24,
      shadowRadius: 10,
    },
    button_surface: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.border,
      borderWidth: 1,
    },
    button_ghost: {
      backgroundColor: 'transparent',
      borderColor: withAlpha(colors.text, 0.18),
      borderWidth: 1,
    },
    button_danger: {
      backgroundColor: withAlpha(colors.error, 0.14),
      borderColor: withAlpha(colors.error, 0.35),
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
      backgroundColor: withAlpha(colors.ink, 0.09),
      borderRadius: radius.pill,
      overflow: 'hidden',
      width: '100%',
    },
    progressFill: {
      borderRadius: radius.pill,
    },
    statCard: {
      alignItems: 'center',
      backgroundColor: colors.card,
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
      borderColor: withAlpha(colors.ink, 0.12),
      borderRadius: radius.pill,
      borderWidth: 1,
      paddingHorizontal: 15,
      paddingVertical: 9,
    },
    pillSelected: {
      backgroundColor: withAlpha(colors.gold, 0.17),
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
      fontFamily: typography.extraBold,
      fontSize: 18,
      letterSpacing: -0.3,
    },
    iconButton: {
      alignItems: 'center',
      backgroundColor: colors.cardStrong,
      borderColor: colors.borderStrong,
      borderRadius: radius.pill,
      borderWidth: 1,
      height: 44,
      justifyContent: 'center',
      width: 44,
      elevation: 3,
      shadowColor: colors.shadow,
      shadowOffset: { height: 4, width: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
    },
    timeStepper: {
      alignItems: 'center',
      alignSelf: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
    },
    timeStepperColumn: {
      alignItems: 'center',
      gap: spacing.xs,
    },
    timeStepperButton: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.pill,
      borderWidth: 1,
      height: 36,
      justifyContent: 'center',
      width: 52,
    },
    timeStepperButtonText: {
      color: colors.gold,
      fontFamily: typography.extraBold,
      fontSize: 18,
    },
    timeStepperValue: {
      color: colors.text,
      fontFamily: typography.extraBold,
      fontSize: 26,
      minWidth: 52,
      textAlign: 'center',
    },
    timeStepperColon: {
      color: colors.textMuted,
      fontFamily: typography.extraBold,
      fontSize: 22,
    },
  });
}
