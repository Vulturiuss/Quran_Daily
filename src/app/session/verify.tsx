import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Check, Home, RotateCcw, ShieldCheck, X } from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { RecallVerse } from '@/components/RecallVerse';
import { Card, IconButton, PrimaryButton, ProgressBar } from '@/components/ui';
import { getSurah } from '@/data/surahs';
import { getVerses } from '@/data/verses';
import { useDwell } from '@/hooks/useDwell';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { Palette, spacing, typography } from '@/theme';
import { minVerseSeconds } from '@/utils/effort';
import { linkingCue } from '@/utils/memorization';

/**
 * The final check.
 *
 * A surah used to be declared "known" the moment each of its verses had been seen
 * once, and it entered the SRS on that false premise. It now has to be recited
 * whole, verse after verse, from memory. Whatever is failed comes back as a weak
 * verse in the sabqi — nothing is lost, the surah simply stays in learning until
 * it holds.
 */
export default function VerifySessionScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [reveals, setReveals] = useState(0);
  const session = useQuranStore((state) => state.activeSession);
  const recordVerificationVerse = useQuranStore((state) => state.recordVerificationVerse);
  const completeVerification = useQuranStore((state) => state.completeVerification);
  const clearActiveSession = useQuranStore((state) => state.clearActiveSession);

  const surah = getSurah(session?.verifySurah);
  const verses = getVerses(session?.verifySurah);
  const index = session?.verifyIndex ?? 0;
  const total = verses.length;
  const verse = verses[index];
  const cue = linkingCue(verses[index - 1]);

  const { seconds } = useDwell(verse?.verseKey);
  const requiredSeconds = minVerseSeconds(verse);
  const ready = seconds >= requiredSeconds;
  const remainingSeconds = Math.max(0, requiredSeconds - seconds);

  useEffect(() => {
    if (!session || session.verifySurah === undefined) router.replace('/(tabs)');
  }, [session]);

  // No reset needed: RecallVerse is keyed on the verse, so it remounts and reports
  // zero reveals for the new one.
  const handleReveals = useCallback((count: number) => setReveals(count), []);

  /**
   * The verse is graded on an ACTIVE declaration, never on inaction. A single
   * "Récité" button meant that waiting out the timer and tapping once scored full
   * marks — the best grade was the default, reachable without reciting anything.
   * Saying "j'ai bloqué" is not a failure: it is what sends the verse back to be
   * reworked instead of certifying it.
   */
  function validate(recalled: boolean) {
    if (!ready || !verse) return;
    void (recalled
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    recordVerificationVerse(reveals, recalled, seconds);
    if (index + 1 >= total) {
      completeVerification();
      router.replace('/session/complete');
    }
  }

  function confirmExit() {
    Alert.alert(
      'Interrompre le contrôle ?',
      'La sourate restera en contrôle final : tu pourras la réciter en entier plus tard, sans rien perdre.',
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Interrompre',
          style: 'destructive',
          onPress: () => {
            if (index > 0) {
              // Le travail déjà fourni est comptabilisé ; la sourate, elle, reste
              // en 'verifying' tant qu'elle n'a pas été récitée en entier.
              router.replace('/session/complete');
            } else {
              clearActiveSession();
              router.replace('/(tabs)');
            }
          },
        },
      ],
    );
  }

  if (!session || session.verifySurah === undefined || !surah) return null;

  return (
    <AppScreen contentStyle={styles.screen} decorated={false} scroll={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>Contrôle final</Text>
          <Text style={styles.counter}>
            {total ? `Verset ${Math.min(index + 1, total)} sur ${total}` : surah.nameTranslit}
          </Text>
        </View>
        <IconButton icon={X} label="Interrompre le contrôle" onPress={confirmExit} />
      </View>
      <ProgressBar value={total ? index / total : 0} height={6} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.surahHeader}>
          <Text style={styles.surahName}>{surah.nameTranslit}</Text>
          <Text style={styles.verseLabel}>
            {verse ? `Verset ${verse.verseNumber}` : surah.nameFr}
          </Text>
        </View>

        {verse ? (
          <>
            <RecallVerse
              cue={cue}
              key={verse.verseKey}
              onRevealsChange={handleReveals}
              verse={verse}
            />
            <Card style={styles.tip}>
              <ShieldCheck color={colors.gold} size={19} />
              <Text style={styles.tipText}>
                Récite la sourate en entier, verset après verset. Ce n’est pas un examen :
                on vérifie simplement qu’elle tient avant de la déclarer mémorisée. Ce qui
                hésite reviendra tranquillement en révision.
              </Text>
            </Card>
          </>
        ) : (
          <Card style={styles.empty}>
            <ShieldCheck color={colors.gold} size={42} />
            <Text style={styles.emptyTitle}>Texte indisponible hors ligne</Text>
            <Text style={styles.emptyText}>
              Le texte de {surah.nameTranslit} sera récupéré lors de la prochaine
              synchronisation. Le contrôle final t’attendra ici.
            </Text>
          </Card>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {verse ? (
          <View style={styles.actions}>
            <View style={styles.actionRow}>
              <PrimaryButton
                icon={Check}
                label="Récité de mémoire"
                onPress={() => validate(true)}
                progress={seconds / requiredSeconds}
                style={styles.actionButton}
              />
              <PrimaryButton
                disabled={!ready}
                icon={RotateCcw}
                label="J’ai bloqué"
                onPress={() => validate(false)}
                style={styles.actionButton}
                variant="surface"
              />
            </View>
            {ready ? (
              <Text style={styles.dwellHint}>
                Réponds sincèrement : un verset qui a bloqué n’est pas perdu, il
                revient simplement en révision.
              </Text>
            ) : (
              <Text style={styles.dwellHint}>
                Prends le temps de réciter — encore {remainingSeconds} s.
              </Text>
            )}
          </View>
        ) : (
          <PrimaryButton
            icon={Home}
            label="Retour à l’accueil"
            onPress={() => {
              clearActiveSession();
              router.replace('/(tabs)');
            }}
            variant="ghost"
          />
        )}
      </View>
    </AppScreen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    screen: {
      paddingBottom: spacing.md,
    },
    header: {
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
      marginTop: spacing.xs,
    },
    kicker: {
      color: colors.gold,
      fontFamily: typography.extraBold,
      fontSize: 12,
      letterSpacing: 1.4,
      textTransform: 'uppercase',
    },
    counter: {
      color: colors.textMuted,
      fontFamily: typography.medium,
      fontSize: 13,
      marginTop: 2,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: spacing.md,
    },
    surahHeader: {
      alignItems: 'center',
      marginVertical: spacing.lg,
    },
    surahName: {
      color: colors.text,
      fontFamily: typography.extraBold,
      fontSize: 28,
    },
    verseLabel: {
      color: colors.gold,
      fontFamily: typography.bold,
      fontSize: 12,
      marginTop: 2,
    },
    tip: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.md,
      padding: spacing.md,
    },
    tipText: {
      color: colors.textMuted,
      flex: 1,
      fontFamily: typography.medium,
      fontSize: 12,
      lineHeight: 18,
    },
    footer: {
      backgroundColor: colors.backgroundDeep,
      borderTopColor: colors.border,
      borderTopWidth: 1,
      paddingTop: spacing.md,
    },
    actions: {
      gap: spacing.sm,
    },
    actionRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    actionButton: {
      flex: 1,
    },
    dwellHint: {
      color: colors.textFaint,
      fontFamily: typography.regular,
      fontSize: 11,
      textAlign: 'center',
    },
    empty: {
      alignItems: 'center',
      marginTop: spacing.xl,
      paddingVertical: spacing.xxl,
    },
    emptyTitle: {
      color: colors.text,
      fontFamily: typography.extraBold,
      fontSize: 20,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    emptyText: {
      color: colors.textMuted,
      fontFamily: typography.regular,
      fontSize: 13,
      lineHeight: 20,
      marginTop: spacing.sm,
      maxWidth: 300,
      textAlign: 'center',
    },
  });
}
