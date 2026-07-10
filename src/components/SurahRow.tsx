import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookOpen, Check, ChevronRight, Crown, Sparkles } from 'lucide-react-native';

import { colors, radius, spacing, typography } from '@/theme';
import { Surah, UserSurahProgress } from '@/types';

export function SurahRow({
  surah,
  progress,
  onPress,
  selected,
  premiumLocked = false,
}: {
  surah: Surah;
  progress?: UserSurahProgress;
  onPress: () => void;
  selected?: boolean;
  premiumLocked?: boolean;
}) {
  const status = progress?.status ?? 'locked';
  const StatusIcon = premiumLocked
    ? Crown
    : status === 'known'
      ? Check
      : status === 'learning'
        ? Sparkles
        : BookOpen;
  const statusColor =
    premiumLocked
      ? colors.gold
      : status === 'known'
        ? colors.success
        : status === 'learning'
          ? colors.gold
          : colors.textFaint;

  return (
    <Pressable
      accessibilityHint={
        premiumLocked
          ? 'Ouvre la page présentant l’abonnement Premium.'
          : 'Ouvre le détail de la sourate.'
      }
      accessibilityLabel={`${surah.nameTranslit}, ${surah.nameFr}, ${
        surah.totalVerses
      } versets. ${
        premiumLocked
          ? 'Réservée à Premium'
          : status === 'known'
            ? 'Connue'
            : status === 'learning'
              ? `${progress?.versesLearned ?? 0} versets mémorisés`
              : 'À apprendre'
      }`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.numberBadge}>
        <Text style={styles.number}>{surah.number}</Text>
      </View>
      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{surah.nameTranslit}</Text>
          <Text style={styles.arabic}>{surah.name}</Text>
        </View>
        <Text style={styles.meta}>
          {surah.nameFr} · {surah.totalVerses} versets
          {premiumLocked ? ' · Premium' : ''}
        </Text>
        {status === 'learning' && progress ? (
          <View style={styles.miniProgress}>
            <View
              style={[
                styles.miniProgressFill,
                { width: `${(progress.versesLearned / progress.totalVerses) * 100}%` },
              ]}
            />
          </View>
        ) : null}
      </View>
      <View style={styles.status}>
        <StatusIcon size={17} color={statusColor} />
        <Text style={[styles.statusText, { color: statusColor }]}>
          {premiumLocked
            ? 'Premium'
            : status === 'known'
              ? 'Connue'
              : status === 'learning'
                ? `${Math.round(
                    ((progress?.versesLearned ?? 0) /
                      Math.max(1, progress?.totalVerses ?? 1)) *
                      100,
                  )}%`
                : ''}
        </Text>
        <ChevronRight size={18} color={colors.textFaint} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: spacing.sm,
    minHeight: 80,
    padding: spacing.md,
  },
  selected: {
    backgroundColor: 'rgba(212,163,115,0.13)',
    borderColor: colors.gold,
  },
  pressed: {
    opacity: 0.78,
  },
  numberBadge: {
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 46,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 46,
  },
  number: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  copy: {
    flex: 1,
  },
  nameRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  name: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 16,
  },
  arabic: {
    color: colors.goldSoft,
    fontFamily: typography.arabic,
    fontSize: 20,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    marginTop: 2,
  },
  miniProgress: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.pill,
    height: 4,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  miniProgressFill: {
    backgroundColor: colors.gold,
    height: 4,
  },
  status: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: spacing.sm,
  },
  statusText: {
    fontFamily: typography.bold,
    fontSize: 10,
  },
});
