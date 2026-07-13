import { forwardRef, memo, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { ArrowLeft, Share2 } from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { ProgressRing } from '@/components/HabitProgress';
import { ornamentalPatternSource } from '@/components/OrnamentalCard';
import { Card, IconButton, PrimaryButton, ScreenTitle, SectionHeader } from '@/components/ui';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';
import { goBackOrReplace } from '@/utils/navigation';
import { buildQuranMap, JuzCell, MapState, QuranMap, SurahCell } from '@/utils/quranMap';

/**
 * The map of the Quran.
 *
 * A streak is a number, and a number can be lost. A map is not something you can
 * fail — it is something you build, cell by cell. It stays free on purpose: it is
 * the reason to come back, not something to sell.
 */

const appUrl = process.env.EXPO_PUBLIC_APP_URL?.trim() || 'Quran Daily';

const stateLabels: Record<MapState, string> = {
  untouched: 'non commencée',
  learning: 'en apprentissage',
  verifying: 'à réciter en entier',
  known: 'connue',
};

const legend: { state: MapState; label: string }[] = [
  { state: 'known', label: 'Connue' },
  { state: 'learning', label: 'En cours' },
  { state: 'verifying', label: 'À réciter' },
  { state: 'untouched', label: 'À découvrir' },
];

/** A single surah. Memoised: 114 of them are on screen at once. */
const SurahCellView = memo(function SurahCellView({
  cell,
  size,
  onPress,
}: {
  cell: SurahCell;
  size: number;
  onPress?: (number: number) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const percent = Math.round(cell.progress * 100);

  const body = (
    <>
      {cell.state === 'learning' ? (
        // A half-learnt surah is half-filled: the cell fills from the bottom, so
        // the grid shows the shape of the effort and not just its outcome.
        <View
          pointerEvents="none"
          style={[
            styles.cellFill,
            {
              backgroundColor: withAlpha(colors.gold, 0.3 + cell.progress * 0.55),
              height: `${Math.max(6, percent)}%`,
            },
          ]}
        />
      ) : null}
      {size >= 30 ? (
        <Text
          style={[
            styles.cellNumber,
            cell.state === 'known' && styles.cellNumberKnown,
            cell.state === 'untouched' && styles.cellNumberUntouched,
          ]}
        >
          {cell.number}
        </Text>
      ) : null}
    </>
  );

  const cellStyle = [
    styles.cell,
    { height: size, width: size },
    cell.state === 'untouched' && styles.cellUntouched,
    cell.state === 'learning' && styles.cellLearning,
    cell.state === 'verifying' && styles.cellVerifying,
    cell.state === 'known' && styles.cellKnown,
  ];

  if (!onPress) {
    return <View style={cellStyle}>{body}</View>;
  }

  return (
    <Pressable
      accessibilityLabel={`${cell.nameTranslit}, ${stateLabels[cell.state]}, ${percent}%`}
      accessibilityRole="button"
      onPress={() => onPress(cell.number)}
      style={({ pressed }) => [...cellStyle, pressed && styles.cellPressed]}
    >
      {body}
    </Pressable>
  );
});

function JuzBar({ juz }: { juz: JuzCell }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const percent = Math.round(juz.progress * 100);

  return (
    <View
      accessibilityLabel={`Juz ${juz.number}, ${percent}%`}
      accessible
      style={styles.juz}
    >
      <Text style={styles.juzNumber}>{juz.number}</Text>
      <View style={styles.juzTrack}>
        <View style={[styles.juzFill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}

/** The shareable image. Same map, framed, with no chrome. */
const MapShareCard = forwardRef<View, { map: QuranMap }>(({ map }, ref) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View collapsable={false} ref={ref} style={styles.shareFrame}>
      <Image
        resizeMode="cover"
        source={ornamentalPatternSource}
        style={styles.sharePattern}
      />
      <LinearGradient
        colors={[...colors.shareGradient]}
        end={{ x: 1, y: 1 }}
        start={{ x: 0, y: 0 }}
        style={styles.shareCard}
      >
        <Text style={styles.shareKicker}>MA CARTE DU CORAN</Text>
        <Text style={styles.shareTitle}>
          {map.versesLearned} / {map.totalVerses} versets
        </Text>
        <Text style={styles.shareSubtitle}>
          {map.surahsKnown} sourate{map.surahsKnown > 1 ? 's' : ''} connue
          {map.surahsKnown > 1 ? 's' : ''} · {Math.round(map.progress * 100)}% du Coran
        </Text>

        <View style={styles.shareGrid}>
          {map.surahs.map((cell) => (
            <SurahCellView cell={cell} key={cell.number} size={22} />
          ))}
        </View>

        <Text style={styles.shareQuote}>
          « Une page après l’autre, la carte se remplit. »
        </Text>
        <Text style={styles.shareFooter}>{appUrl}</Text>
      </LinearGradient>
    </View>
  );
});

MapShareCard.displayName = 'MapShareCard';

export default function MapScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const progress = useQuranStore((state) => state.progress);
  // 114 surahs and 30 juz rebuilt on every keystroke of the store would be a
  // waste: the map only changes when the progress does.
  const map = useMemo(() => buildQuranMap(progress), [progress]);
  const shareCardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  async function shareMap() {
    const message = `Ma carte du Coran · ${map.versesLearned} versets mémorisés sur ${map.totalVerses}, ${map.surahsKnown} sourates connues.`;

    if (Platform.OS === 'web' || !shareCardRef.current) {
      await Share.share({ message });
      return;
    }

    setSharing(true);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        await Share.share({ message });
        return;
      }

      const uri = await captureRef(shareCardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });
      await Sharing.shareAsync(uri, {
        dialogTitle: 'Partager ma carte du Coran',
        mimeType: 'image/png',
        UTI: 'public.png',
      });
    } catch {
      Alert.alert(
        'Partage impossible',
        'La carte n’a pas pu être générée. Réessaie dans quelques secondes.',
      );
    } finally {
      setSharing(false);
    }
  }

  return (
    <AppScreen>
      <ScreenTitle
        action={
          <IconButton
            icon={ArrowLeft}
            label="Retour"
            onPress={() => goBackOrReplace('/(tabs)')}
          />
        }
        subtitle="Ce que tu construis, sourate après sourate."
        title="Ma carte du Coran"
      />

      <Card gradient style={styles.headerCard}>
        <ProgressRing label="du Coran" value={map.progress} />
        <View style={styles.headerCopy}>
          <Text style={styles.headerValue}>
            {map.versesLearned} / {map.totalVerses} versets
          </Text>
          <Text style={styles.headerLabel}>
            {map.surahsKnown} sourate{map.surahsKnown > 1 ? 's' : ''} connue
            {map.surahsKnown > 1 ? 's' : ''} sur 114
          </Text>
          <Text style={styles.headerNote}>
            Chaque cellule se remplit à mesure que tu mémorises.
          </Text>
        </View>
      </Card>

      <SectionHeader title="Les 30 juz" />
      <Card style={styles.juzCard}>
        <View style={styles.juzGrid}>
          {map.juz.map((juz) => (
            <JuzBar juz={juz} key={juz.number} />
          ))}
        </View>
      </Card>

      <SectionHeader title="Les 114 sourates" />
      <Card style={styles.gridCard}>
        <View style={styles.grid}>
          {map.surahs.map((cell) => (
            <SurahCellView
              cell={cell}
              key={cell.number}
              onPress={(number) => router.push(`/surah/${number}`)}
              size={40}
            />
          ))}
        </View>

        <View style={styles.legend}>
          {legend.map((item) => (
            <View key={item.state} style={styles.legendItem}>
              <View
                style={[
                  styles.legendSwatch,
                  item.state === 'untouched' && styles.cellUntouched,
                  item.state === 'learning' && styles.legendSwatchLearning,
                  item.state === 'verifying' && styles.cellVerifying,
                  item.state === 'known' && styles.cellKnown,
                ]}
              />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <View pointerEvents="none" style={styles.shareCapture}>
        <MapShareCard map={map} ref={shareCardRef} />
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          icon={Share2}
          label="Partager ma carte"
          loading={sharing}
          onPress={() => void shareMap()}
        />
      </View>
    </AppScreen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    headerCard: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.lg,
    },
    headerCopy: {
      flex: 1,
    },
    headerValue: {
      color: colors.text,
      fontFamily: typography.extraBold,
      fontSize: 18,
    },
    headerLabel: {
      color: colors.goldSoft,
      fontFamily: typography.bold,
      fontSize: 13,
      marginTop: 3,
    },
    headerNote: {
      color: colors.textMuted,
      fontFamily: typography.regular,
      fontSize: 11,
      lineHeight: 16,
      marginTop: spacing.sm,
    },
    juzCard: {
      padding: spacing.md,
    },
    juzGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      justifyContent: 'center',
    },
    juz: {
      alignItems: 'center',
      gap: 4,
      width: 42,
    },
    juzNumber: {
      color: colors.textMuted,
      fontFamily: typography.bold,
      fontSize: 10,
    },
    juzTrack: {
      backgroundColor: withAlpha(colors.ink, 0.08),
      borderRadius: radius.pill,
      height: 5,
      overflow: 'hidden',
      width: '100%',
    },
    juzFill: {
      backgroundColor: colors.gold,
      borderRadius: radius.pill,
      height: 5,
    },
    gridCard: {
      padding: spacing.md,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      justifyContent: 'center',
    },
    cell: {
      alignItems: 'center',
      borderRadius: radius.sm,
      justifyContent: 'center',
      overflow: 'hidden',
    },
    cellUntouched: {
      backgroundColor: withAlpha(colors.ink, 0.06),
    },
    cellLearning: {
      backgroundColor: withAlpha(colors.ink, 0.06),
    },
    cellVerifying: {
      backgroundColor: withAlpha(colors.gold, 0.06),
      borderColor: colors.gold,
      borderWidth: 1.5,
    },
    cellKnown: {
      backgroundColor: colors.success,
    },
    cellPressed: {
      opacity: 0.7,
    },
    cellFill: {
      bottom: 0,
      left: 0,
      position: 'absolute',
      right: 0,
    },
    cellNumber: {
      color: colors.text,
      fontFamily: typography.bold,
      fontSize: 11,
    },
    cellNumberKnown: {
      color: colors.backgroundDeep,
      fontFamily: typography.extraBold,
    },
    cellNumberUntouched: {
      color: colors.textFaint,
    },
    legend: {
      borderTopColor: colors.border,
      borderTopWidth: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.md,
      justifyContent: 'center',
      marginTop: spacing.md,
      paddingTop: spacing.md,
    },
    legendItem: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
    },
    legendSwatch: {
      borderRadius: 5,
      height: 14,
      width: 14,
    },
    legendSwatchLearning: {
      backgroundColor: withAlpha(colors.gold, 0.7),
    },
    legendLabel: {
      color: colors.textMuted,
      fontFamily: typography.medium,
      fontSize: 11,
    },
    actions: {
      marginTop: spacing.xl,
    },
    shareCapture: {
      left: -2000,
      position: 'absolute',
      top: 0,
      width: 360,
    },
    shareFrame: {
      backgroundColor: colors.backgroundDeep,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      overflow: 'hidden',
      width: '100%',
    },
    sharePattern: {
      bottom: 0,
      left: 0,
      opacity: 0.05,
      position: 'absolute',
      right: 0,
      top: 0,
    },
    shareCard: {
      alignItems: 'center',
      padding: spacing.lg,
    },
    shareKicker: {
      color: colors.gold,
      fontFamily: typography.extraBold,
      fontSize: 10,
      letterSpacing: 1.6,
    },
    shareTitle: {
      color: colors.text,
      fontFamily: typography.extraBold,
      fontSize: 24,
      marginTop: spacing.xs,
    },
    shareSubtitle: {
      color: colors.textMuted,
      fontFamily: typography.medium,
      fontSize: 11,
      marginTop: 2,
    },
    shareGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      justifyContent: 'center',
      marginVertical: spacing.lg,
    },
    shareQuote: {
      color: colors.textMuted,
      fontFamily: typography.medium,
      fontSize: 11,
      fontStyle: 'italic',
      textAlign: 'center',
    },
    shareFooter: {
      color: colors.gold,
      fontFamily: typography.bold,
      fontSize: 10,
      letterSpacing: 0.8,
      marginTop: spacing.sm,
    },
  });
}
