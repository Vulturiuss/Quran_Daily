import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Pause, Play, Repeat2 } from 'lucide-react-native';

import { useQuranAudio } from '@/providers/AudioProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { colors, radius, spacing, typography } from '@/theme';
import { Verse } from '@/types';

export function VerseAudioButton({
  verse,
  repeatCount = 1,
  compact = false,
}: {
  verse: Verse;
  repeatCount?: number;
  compact?: boolean;
}) {
  const preferredReciter = useQuranStore((state) => state.profile.preferredReciter);
  const {
    configured,
    isPremium,
    loading: subscriptionLoading,
  } = useSubscription();
  const reciterId =
    configured && !subscriptionLoading && !isPremium
      ? 'mishary'
      : preferredReciter;
  const { currentTrackId, isBuffering, isPlaying, loadingTrackId, playVerse } = useQuranAudio();
  const trackId = `${reciterId}:${verse.verseKey}`;
  const isCurrent = currentTrackId === trackId;
  const loading = loadingTrackId === trackId || (isCurrent && isBuffering);
  const playing = isCurrent && isPlaying;
  const Icon = repeatCount > 1 ? Repeat2 : playing ? Pause : Play;

  return (
    <Pressable
      accessibilityLabel={
        playing ? 'Mettre la récitation en pause' : `Écouter le verset ${verse.verseNumber}`
      }
      accessibilityRole="button"
      disabled={loading}
      onPress={() => void playVerse(verse, reciterId, repeatCount)}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compact,
        pressed && styles.pressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.gold} size="small" />
      ) : (
        <Icon color={colors.gold} fill={playing ? colors.gold : 'transparent'} size={17} />
      )}
      <Text style={styles.label}>
        {repeatCount > 1 ? `Répéter ×${repeatCount}` : playing ? 'Pause' : 'Écouter'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.1)',
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
  label: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 12,
  },
});
