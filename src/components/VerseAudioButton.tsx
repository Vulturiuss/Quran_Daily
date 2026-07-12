import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Check, Pause, Play, Repeat2 } from 'lucide-react-native';

import { useQuranAudio } from '@/providers/AudioProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';
import { Verse } from '@/types';

export function VerseAudioButton({
  verse,
  repeatCount = 1,
  compact = false,
  reciterId: requestedReciterId,
  label,
}: {
  verse: Verse;
  repeatCount?: number;
  compact?: boolean;
  reciterId?: string;
  label?: string;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const preferredReciter = useQuranStore((state) => state.profile.preferredReciter);
  const {
    configured,
    isPremium,
    loading: subscriptionLoading,
  } = useSubscription();
  const selectedReciter = requestedReciterId ?? preferredReciter;
  const reciterId =
    configured && !subscriptionLoading && !isPremium
      ? 'mishary'
      : selectedReciter;
  const {
    completedRepeatTrackId,
    currentTrackId,
    isBuffering,
    isPlaying,
    loadingTrackId,
    playVerse,
    repeatRemaining,
  } = useQuranAudio();
  const trackId = `${reciterId}:${verse.verseKey}`;
  const isCurrent = currentTrackId === trackId;
  const loading = loadingTrackId === trackId || (isCurrent && isBuffering);
  const playing = isCurrent && isPlaying;
  const repeatCompleted =
    repeatCount > 1 && completedRepeatTrackId === trackId;
  const visibleRepeatCount =
    isCurrent && repeatRemaining > 0 ? repeatRemaining : repeatCount;
  const Icon = repeatCompleted
    ? Check
    : repeatCount > 1
      ? Repeat2
      : playing
        ? Pause
        : Play;

  return (
    <Pressable
      accessibilityLabel={
        playing
          ? 'Mettre la récitation en pause'
          : label ?? `Écouter le verset ${verse.verseNumber}`
      }
      accessibilityRole="button"
      // Only the loading state blocks a press. Disabling on `repeatCompleted`
      // locked the button for good: playVerse is the only thing that clears the
      // completed marker, so the verse being learned could never be replayed.
      disabled={loading}
      onPress={() => void playVerse(verse, reciterId, repeatCount)}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        repeatCompleted && styles.completed,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.gold} size="small" />
      ) : (
        <Icon
          color={repeatCompleted ? colors.success : colors.gold}
          fill={playing && repeatCount === 1 ? colors.gold : 'transparent'}
          size={17}
        />
      )}
      <Text style={[styles.label, repeatCompleted && styles.completedLabel]}>
        {repeatCompleted
          ? 'Répété 3 fois'
          : repeatCount > 1
            ? `Répéter ×${visibleRepeatCount}`
            : playing
              ? 'Pause'
              : label ?? 'Écouter'}
      </Text>
    </Pressable>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.1),
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.md,
  },
  compact: {
    minHeight: 34,
    paddingHorizontal: spacing.sm,
  },
  pressed: {
    opacity: 0.72,
  },
  completed: {
    backgroundColor: withAlpha(colors.success, 0.1),
    borderColor: withAlpha(colors.success, 0.35),
  },
  label: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  completedLabel: {
    color: colors.success,
  },
  });
}
