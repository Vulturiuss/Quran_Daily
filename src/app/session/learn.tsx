import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Check,
  ChevronRight,
  EyeOff,
  GraduationCap,
  Link2,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { RecallVerse } from '@/components/RecallVerse';
import { VerseAudioButton } from '@/components/VerseAudioButton';
import { VerseCard } from '@/components/VerseCard';
import { Card, IconButton, PrimaryButton, ProgressBar } from '@/components/ui';
import { getSurah } from '@/data/surahs';
import { getVerses } from '@/data/verses';
import { useDwell } from '@/hooks/useDwell';
import { useQuranAudio } from '@/providers/AudioProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { Palette, spacing, typography } from '@/theme';
import { minVerseSeconds } from '@/utils/effort';
import { linkingCue } from '@/utils/memorization';

/**
 * The learning session, in two phases.
 *
 * **Sabqi** first: the verses learnt in the last few days are replayed from
 * memory, before anything new. This is the pillar the app was missing — a surah
 * being learnt was revisited at no point until it was finished.
 *
 * **New verses** second, each shown with the tail of the previous one above it, so
 * the seam between the two is learnt with the verse rather than after it.
 */
export default function LearnSessionScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState<'study' | 'test'>('study');
  const [reveals, setReveals] = useState(0);
  const session = useQuranStore((state) => state.activeSession);
  const learnCurrentVerse = useQuranStore((state) => state.learnCurrentVerse);
  const rateSabqiVerse = useQuranStore((state) => state.rateSabqiVerse);
  const clearActiveSession = useQuranStore((state) => state.clearActiveSession);
  const { error: audioError, stop } = useQuranAudio();
  const surah = getSurah(session?.learningSurah);
  const verses = getVerses(session?.learningSurah);

  const sabqiQueue = session?.sabqiQueue ?? [];
  const sabqiIndex = session?.sabqiIndex ?? 0;
  const sabqiTotal = sabqiQueue.length;
  const inSabqi = sabqiIndex < sabqiTotal;
  const sabqiVerse = inSabqi ? verses[sabqiQueue[sabqiIndex] - 1] : undefined;

  const currentIndex = (session?.verseStart ?? 0) + (session?.versesLearned ?? 0);
  const newVerse = verses[currentIndex];
  const target = session?.versesTarget ?? 0;
  const learned = session?.versesLearned ?? 0;

  // The sabqi verse and the new verse are two different items, so the anti-speed-run
  // clock has to restart between them even when they happen to be the same verse.
  const verse = inSabqi ? sabqiVerse : newVerse;
  const cue = linkingCue(
    inSabqi
      ? sabqiVerse && verses[sabqiVerse.verseNumber - 2]
      : verses[currentIndex - 1],
  );
  const { seconds } = useDwell(verse ? `${inSabqi ? 'sabqi' : 'new'}:${verse.verseKey}` : undefined);
  const requiredSeconds = minVerseSeconds(verse);
  const ready = seconds >= requiredSeconds;
  const remainingSeconds = Math.max(0, requiredSeconds - seconds);

  // Both phases in one bar: the user sees a single session advancing, not two.
  const totalSteps = sabqiTotal + target;
  const doneSteps = sabqiIndex + learned;
  const hasNewVerses = Boolean(surah && newVerse && target > 0);

  useEffect(() => {
    if (!session) router.replace('/(tabs)');
  }, [session]);

  useEffect(() => {
    setMode('study');
  }, [verse?.verseKey]);

  const handleReveals = useCallback((count: number) => setReveals(count), []);

  /**
   * The sabqi verse is graded on an ACTIVE declaration. With a single "J'ai
   * récité" button, revealing nothing scored full marks — so waiting out the
   * timer and tapping once certified the verse. "J'ai bloqué" is not a failure
   * button: it is what keeps the verse in the sabqi until it really holds.
   */
  async function validateSabqi(recalled: boolean) {
    if (!ready || !sabqiVerse) return;
    await stop();
    void (recalled
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
    rateSabqiVerse(reveals, recalled, seconds);
    // Last replay of a session that has nothing new to teach today: it is over.
    if (sabqiIndex + 1 >= sabqiTotal && !hasNewVerses) {
      router.replace('/session/complete');
    }
  }

  async function validateNewVerse() {
    if (!ready) return;
    await stop();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    learnCurrentVerse(seconds);
    if (learned + 1 >= target) router.replace('/session/complete');
  }

  async function continueWithoutVerse() {
    await stop();
    router.replace('/session/complete');
  }

  function confirmExit() {
    const hasProgress =
      (session?.reviewIndex ?? 0) > 0 ||
      (session?.versesLearned ?? 0) > 0 ||
      (session?.sabqiIndex ?? 0) > 0;
    Alert.alert(
      'Quitter la session ?',
      hasProgress
        ? 'Ta progression déjà validée sera enregistrée et comptabilisée. Le verset en cours sera perdu.'
        : 'La progression non validée sera perdue.',
      [
        { text: 'Continuer', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () => {
            void stop();
            if (hasProgress) {
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

  if (!session) return null;

  // The sabqi queue can name a verse whose text is not available offline: it is
  // skipped rather than blocking the whole session.
  if (inSabqi && !sabqiVerse) {
    return (
      <AppScreen contentStyle={styles.screen} decorated={false} scroll={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.kicker}>Révision</Text>
            <Text style={styles.counter}>Texte indisponible</Text>
          </View>
          <IconButton icon={X} label="Quitter la session" onPress={confirmExit} />
        </View>
        <Card style={styles.empty}>
          <GraduationCap color={colors.gold} size={42} />
          <Text style={styles.emptyTitle}>Verset indisponible hors ligne</Text>
          <Text style={styles.emptyText}>
            Ce verset sera récupéré lors de la prochaine synchronisation. Passe à la suite.
          </Text>
        </Card>
        <View style={styles.footer}>
          <PrimaryButton
            icon={ChevronRight}
            label="Passer"
            // Le texte manque : rien n'a été récité, donc rien n'est certifié —
            // le verset restera dans la révision quotidienne.
            onPress={() => rateSabqiVerse(0, false, 0)}
          />
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen contentStyle={styles.screen} decorated={false} scroll={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.kicker}>{inSabqi ? 'Révision' : 'Apprentissage'}</Text>
          <Text style={styles.counter}>
            {inSabqi
              ? `Révision ${sabqiIndex + 1} sur ${sabqiTotal}`
              : target
                ? `Verset ${Math.min(learned + 1, target)} sur ${target}`
                : 'Étape finale'}
          </Text>
        </View>
        <IconButton icon={X} label="Quitter la session" onPress={confirmExit} />
      </View>
      <ProgressBar value={totalSteps ? doneSteps / totalSteps : 1} height={6} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        {inSabqi && sabqiVerse && surah ? (
          <>
            <View style={styles.surahHeader}>
              <Text style={styles.surahName}>{surah.nameTranslit}</Text>
              <Text style={styles.verseLabel}>Verset {sabqiVerse.verseNumber}</Text>
            </View>
            <RecallVerse
              cue={cue}
              key={`sabqi:${sabqiVerse.verseKey}`}
              onRevealsChange={handleReveals}
              verse={sabqiVerse}
            />
            <Card style={styles.tip}>
              <Sparkles color={colors.gold} size={19} />
              <Text style={styles.tipText}>
                On consolide d’abord ce que tu as appris ces derniers jours. Récite de
                mémoire : ne révèle un mot que si tu bloques vraiment.
              </Text>
            </Card>
          </>
        ) : surah && newVerse ? (
          <>
            <View style={styles.surahHeader}>
              <Text style={styles.surahName}>{surah.nameTranslit}</Text>
              <Text style={styles.verseLabel}>Verset {newVerse.verseNumber}</Text>
            </View>
            {cue ? (
              <View style={styles.cueBlock}>
                <View style={styles.cueLabelRow}>
                  <Link2 color={colors.textFaint} size={13} />
                  <Text style={styles.cueLabel}>Fin du verset précédent</Text>
                </View>
                <Text style={styles.cueText}>{`… ${cue}`}</Text>
              </View>
            ) : null}
            <VerseCard
              key={`${newVerse.verseKey}:${mode}`}
              verse={newVerse}
              testMode={mode === 'test'}
              showToggle={mode === 'test'}
            />
            <View style={styles.audioActions}>
              <VerseAudioButton repeatCount={3} verse={newVerse} />
            </View>
            {audioError ? <Text style={styles.audioError}>{audioError}</Text> : null}
            <Card style={styles.tip}>
              <Sparkles color={colors.gold} size={19} />
              <Text style={styles.tipText}>
                {mode === 'study'
                  ? 'Lis et écoute trois fois, en enchaînant depuis la fin du verset précédent. Passe ensuite au test sans regarder le texte.'
                  : 'Récite maintenant de mémoire. Révèle le texte seulement pour te corriger.'}
              </Text>
            </Card>
          </>
        ) : (
          <Card style={styles.empty}>
            <GraduationCap color={colors.gold} size={42} />
            <Text style={styles.emptyTitle}>
              {surah ? 'Contenu hors ligne indisponible' : 'Choisis une sourate'}
            </Text>
            <Text style={styles.emptyText}>
              {surah
                ? `La session de révision est terminée. Le texte de ${surah.nameTranslit} sera récupéré lors de la synchronisation.`
                : 'Sélectionne une sourate dans la bibliothèque pour activer l’apprentissage guidé.'}
            </Text>
          </Card>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {inSabqi ? (
          <View style={styles.testActions}>
            <View style={styles.actionRow}>
              <PrimaryButton
                icon={Check}
                label="Récité de mémoire"
                onPress={() => void validateSabqi(true)}
                progress={seconds / requiredSeconds}
                style={styles.actionButton}
              />
              <PrimaryButton
                disabled={!ready}
                icon={RotateCcw}
                label="J’ai bloqué"
                onPress={() => void validateSabqi(false)}
                style={styles.actionButton}
                variant="surface"
              />
            </View>
            {ready ? (
              <Text style={styles.dwellHint}>
                Réponds sincèrement : un verset qui a bloqué revient demain, c’est
                tout — c’est ainsi qu’il finit par tenir.
              </Text>
            ) : (
              <Text style={styles.dwellHint}>
                Prends le temps de réciter — encore {remainingSeconds} s.
              </Text>
            )}
          </View>
        ) : hasNewVerses ? (
          mode === 'study' ? (
            <PrimaryButton
              icon={EyeOff}
              label="Tester ma mémoire"
              onPress={() => {
                void stop();
                setMode('test');
              }}
            />
          ) : (
            <View style={styles.testActions}>
              <PrimaryButton
                icon={learned + 1 >= target ? Check : ChevronRight}
                label={learned + 1 >= target ? 'Je peux le réciter' : 'Verset mémorisé'}
                onPress={() => void validateNewVerse()}
                progress={seconds / requiredSeconds}
              />
              {ready ? null : (
                <Text style={styles.dwellHint}>
                  Prends le temps de lire ce verset — encore {remainingSeconds} s.
                </Text>
              )}
              <PrimaryButton
                compact
                icon={RotateCcw}
                label="Revoir le verset"
                onPress={() => setMode('study')}
                variant="ghost"
              />
            </View>
          )
        ) : (
          <PrimaryButton
            icon={ChevronRight}
            label="Terminer la session"
            onPress={() => void continueWithoutVerse()}
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
  cueBlock: {
    marginBottom: spacing.sm,
  },
  cueLabelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: 2,
  },
  cueLabel: {
    color: colors.textFaint,
    fontFamily: typography.bold,
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  cueText: {
    color: colors.textFaint,
    fontFamily: typography.arabic,
    fontSize: 18,
    lineHeight: 30,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  tip: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  audioActions: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  audioError: {
    color: colors.error,
    fontFamily: typography.medium,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: 'center',
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
  testActions: {
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
