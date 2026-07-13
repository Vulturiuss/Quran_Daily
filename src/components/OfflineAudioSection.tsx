import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Check, Crown, Download, HardDrive, Trash2 } from 'lucide-react-native';

import { Card, PrimaryButton, ProgressBar, SectionHeader } from '@/components/ui';
import { getSurah } from '@/data/surahs';
import { useAccess } from '@/hooks/useAccess';
import { useOfflineAudio } from '@/providers/OfflineAudioProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { formatBytes, isOfflineAudioSupported } from '@/services/offlineAudio';
import { useQuranStore } from '@/store/useQuranStore';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';
import { offlineTargets } from '@/utils/offlinePlan';

const failures: Record<string, string> = {
  network: 'Le téléchargement s’est interrompu. Vérifie ta connexion, puis réessaie.',
  no_audio: 'Cette récitation n’est pas disponible pour ce récitateur.',
  cancelled: 'Téléchargement interrompu.',
};

/**
 * The offline downloads, shown rather than hidden.
 *
 * The list is not a catalogue of the 114 surahs: it is exactly what the app has
 * decided to keep — what is being learnt and what is coming up for review. The
 * space used and the "tout supprimer" button sit at the top, because an audio app
 * that grows in silence is an audio app that gets uninstalled.
 */
export function OfflineAudioSection() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const access = useAccess();
  const progress = useQuranStore((state) => state.progress);
  const auto = useQuranStore((state) => state.profile.offlineAudioAuto);
  const updateProfile = useQuranStore((state) => state.updateProfile);
  const { bytes, downloaded, activeSurah, activeProgress, download, remove, removeAll } =
    useOfflineAudio();
  const [pending, setPending] = useState<number>();

  const targets = useMemo(() => offlineTargets(progress), [progress]);

  // On the web there is no file system to download to: the section would promise
  // something it cannot do.
  if (!isOfflineAudioSupported) return null;

  // Optimistic while the tier resolves, like the reciter and theme pickers: a
  // subscriber must not see the paywall flash on every launch.
  const hasFullAccess = access.offlineAudio || !access.resolved;

  if (!hasFullAccess) {
    return (
      <>
        <SectionHeader title="Écoute hors ligne" />
        <Card gradient>
          <View style={styles.header}>
            <View style={styles.icon}>
              <Crown color={colors.gold} size={21} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>Incluse dans Premium</Text>
              <Text style={styles.text}>
                L’écoute en ligne reste gratuite et illimitée. Premium garde la récitation
                de tes sourates sur ton téléphone, pour ne plus dépendre du réseau.
              </Text>
            </View>
          </View>
          <PrimaryButton
            label="Découvrir Premium"
            onPress={() => router.push('/subscription')}
            variant="surface"
          />
        </Card>
      </>
    );
  }

  async function startDownload(surahNumber: number) {
    setPending(surahNumber);
    const result = await download(surahNumber);
    setPending(undefined);
    if (!result.ok && result.reason !== 'cancelled') {
      Alert.alert(
        'Téléchargement impossible',
        failures[result.reason ?? ''] ?? 'Réessaie dans un moment.',
      );
    }
  }

  function confirmRemoveAll() {
    Alert.alert(
      'Tout supprimer ?',
      'Les récitations téléchargées seront effacées. Elles resteront écoutables en ligne, et seront retéléchargées si le téléchargement automatique est actif.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: removeAll },
      ],
    );
  }

  return (
    <>
      <SectionHeader title="Écoute hors ligne" />
      <Card>
        <View style={styles.header}>
          <View style={styles.icon}>
            <HardDrive color={colors.gold} size={21} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.title}>{formatBytes(bytes)} sur ton téléphone</Text>
            <Text style={styles.text}>
              Seules les sourates en cours et celles à réviser sont gardées.
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.switchRow}>
          <View style={styles.copy}>
            <Text style={styles.title}>Téléchargement automatique</Text>
            <Text style={styles.text}>
              L’application télécharge d’elle-même ce que tu apprends et ce que tu vas
              réviser, une sourate à la fois.
            </Text>
          </View>
          <Switch
            disabled={!access.resolved}
            onValueChange={(value) => updateProfile({ offlineAudioAuto: value })}
            thumbColor={auto ? colors.gold : colors.textFaint}
            trackColor={{ false: colors.surfaceElevated, true: withAlpha(colors.gold, 0.35) }}
            value={auto}
          />
        </View>

        {targets.length > 0 ? (
          <View style={styles.list}>
            {targets.map((surahNumber) => {
              const surah = getSurah(surahNumber);
              if (!surah) return null;
              const isDownloaded = downloaded.includes(surahNumber);
              const isActive = activeSurah === surahNumber;
              const isPending = pending === surahNumber && !isActive;

              return (
                <View key={surahNumber} style={styles.row}>
                  <View style={styles.copy}>
                    <Text style={styles.rowTitle}>
                      {surah.number}. {surah.nameTranslit}
                    </Text>
                    <Text style={styles.text}>
                      {isActive
                        ? `Téléchargement · ${Math.round(activeProgress * 100)} %`
                        : isPending
                          ? 'En attente…'
                          : isDownloaded
                            ? 'Disponible hors ligne'
                            : `${surah.totalVerses} versets · en ligne uniquement`}
                    </Text>
                    {isActive ? (
                      <View style={styles.progress}>
                        <ProgressBar height={4} value={activeProgress} />
                      </View>
                    ) : null}
                  </View>

                  {isDownloaded ? (
                    <Pressable
                      accessibilityLabel={`Supprimer la récitation de ${surah.nameTranslit}`}
                      accessibilityRole="button"
                      onPress={() => remove(surahNumber)}
                      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
                    >
                      <Check color={colors.success} size={18} />
                      <Trash2 color={colors.textFaint} size={18} />
                    </Pressable>
                  ) : (
                    <Pressable
                      accessibilityLabel={`Télécharger la récitation de ${surah.nameTranslit}`}
                      accessibilityRole="button"
                      disabled={isActive || isPending}
                      onPress={() => void startDownload(surahNumber)}
                      style={({ pressed }) => [
                        styles.action,
                        (isActive || isPending) && styles.actionBusy,
                        pressed && styles.pressed,
                      ]}
                    >
                      <Download color={colors.gold} size={18} />
                    </Pressable>
                  )}
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.text, styles.empty]}>
            Rien à garder pour l’instant : commence une sourate et elle sera téléchargée.
          </Text>
        )}

        {bytes > 0 ? (
          <PrimaryButton
            compact
            icon={Trash2}
            label="Tout supprimer"
            onPress={confirmRemoveAll}
            style={styles.removeAll}
            variant="danger"
          />
        ) : null}
      </Card>
    </>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    header: {
      alignItems: 'center',
      flexDirection: 'row',
    },
    icon: {
      alignItems: 'center',
      backgroundColor: withAlpha(colors.gold, 0.1),
      borderRadius: radius.md,
      height: 44,
      justifyContent: 'center',
      marginRight: spacing.md,
      width: 44,
    },
    copy: {
      flex: 1,
    },
    title: {
      color: colors.text,
      fontFamily: typography.bold,
      fontSize: 15,
    },
    text: {
      color: colors.textMuted,
      fontFamily: typography.regular,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 2,
    },
    divider: {
      backgroundColor: colors.border,
      height: 1,
      marginVertical: spacing.lg,
    },
    switchRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.md,
    },
    list: {
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    row: {
      alignItems: 'center',
      borderColor: withAlpha(colors.ink, 0.1),
      borderRadius: radius.md,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.md,
    },
    rowTitle: {
      color: colors.text,
      fontFamily: typography.bold,
      fontSize: 13,
    },
    progress: {
      marginTop: spacing.sm,
    },
    action: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.pill,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.xs,
      height: 40,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    actionBusy: {
      opacity: 0.45,
    },
    pressed: {
      opacity: 0.76,
    },
    empty: {
      marginTop: spacing.lg,
    },
    removeAll: {
      marginTop: spacing.lg,
    },
  });
}
