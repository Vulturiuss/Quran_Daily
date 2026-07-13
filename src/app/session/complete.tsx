import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  PixelRatio,
  Platform,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import {
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Flame,
  GraduationCap,
  Home,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { CelebrationConfetti } from '@/components/CelebrationConfetti';
import { ShareCard } from '@/components/ShareCard';
import { Card, PrimaryButton } from '@/components/ui';
import { badgeById } from '@/data/badges';
import { getSurah } from '@/data/surahs';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';
import { addDays, formatDuration } from '@/utils/date';
import { surahSolidity } from '@/utils/memorization';
import { buildSessionPreview } from '@/utils/sessionPlan';

export default function SessionCompleteScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const activeSession = useQuranStore((state) => state.activeSession);
  const completeDailySession = useQuranStore((state) => state.completeDailySession);
  const startVerification = useQuranStore((state) => state.startVerification);
  const summary = useQuranStore((state) => state.lastSummary);
  const stats = useQuranStore((state) => state.stats);
  const profile = useQuranStore((state) => state.profile);
  const progress = useQuranStore((state) => state.progress);
  const hasLearningSurah = Object.values(progress).some((item) => item.status === 'learning');
  const shareCardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (activeSession && !summary) {
      completeDailySession();
    }
  }, [activeSession, completeDailySession, summary]);

  useEffect(() => {
    // No session left to settle and nothing to show: either the session earned no
    // credit (nothing reviewed, nothing learned) or it was already flushed. This
    // screen has gestures disabled, so without this it is a dead end.
    if (!activeSession && !summary) {
      router.replace('/(tabs)');
    }
  }, [activeSession, summary]);

  async function shareResult() {
    if (!summary) return;
    const message = `Quran Daily · ${summary.isBonus ? 'Session bonus' : 'Session du jour'} terminée\n${summary.surahsReviewed} sourates révisées, ${summary.versesLearned} versets appris et +${summary.xpEarned} XP.`;

    if (Platform.OS === 'web' || !shareCardRef.current) {
      await Share.share({ message });
      return;
    }

    setSharing(true);
    try {
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (!sharingAvailable) {
        await Share.share({ message });
        return;
      }

      const cardSize = 1080 / PixelRatio.get();
      const uri = await captureRef(shareCardRef, {
        format: 'png',
        height: cardSize,
        quality: 1,
        result: 'tmpfile',
        width: cardSize,
      });
      await Sharing.shareAsync(uri, {
        dialogTitle: 'Partager ma session Quran Daily',
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

  if (!summary) {
    return (
      <AppScreen>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Finalisation de la session…</Text>
        </View>
      </AppScreen>
    );
  }

  const unlocked = summary.unlockedBadgeIds.map((id) => badgeById[id]).filter(Boolean);
  const completedSurah = getSurah(summary.completedSurah);
  const awaitingSurah = getSurah(summary.awaitingVerification);

  // A final check that left a few verses behind. The screen used to say nothing at
  // all about it — and silence, after a recitation the user knows did not go
  // through, reads as failure. It is not one: the surah holds, a couple of seams
  // do not yet, and those are exactly what tomorrow's session will drill. The word
  // "échec" never appears, because that is not what happened.
  const verifiedProgress =
    summary.verifiedSurah !== undefined ? progress[summary.verifiedSurah] : undefined;
  const verifiedSurah = getSurah(summary.verifiedSurah);
  const weakVerses = verifiedProgress?.weakVerses ?? [];
  const showPartialCheck =
    summary.completedSurah === undefined &&
    Boolean(verifiedSurah) &&
    Boolean(verifiedProgress) &&
    weakVerses.length > 0;
  const solidity = verifiedProgress ? Math.round(surahSolidity(verifiedProgress) * 100) : 0;
  const tomorrow = buildSessionPreview(progress, profile, addDays(new Date(), 1));
  const tomorrowSurah = getSurah(tomorrow.learningSurah);
  return (
    <AppScreen contentStyle={styles.screen}>
      <CelebrationConfetti />
      <View style={styles.sparkles}>
        <Text style={[styles.sparkle, styles.sparkleOne]}>✦</Text>
        <Text style={[styles.sparkle, styles.sparkleTwo]}>☾</Text>
        <Text style={[styles.sparkle, styles.sparkleThree]}>✧</Text>
        <Text style={[styles.sparkle, styles.sparkleFour]}>◆</Text>
      </View>

      <View style={styles.successIcon}>
        <CheckCircle2 color={colors.gold} size={58} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>
        {summary.isBonus ? 'Session bonus accomplie' : 'Session accomplie'}
      </Text>
      <Text style={styles.subtitle}>Une petite étape répétée devient une vraie transformation.</Text>

      <View style={styles.xpPill}>
        <Star color={colors.backgroundDeep} fill={colors.backgroundDeep} size={18} />
        <Text style={styles.xpText}>+{summary.xpEarned} XP</Text>
      </View>

      <View style={styles.streakRow}>
        <Flame color={colors.gold} fill={colors.gold} size={27} />
        <View>
          <Text style={styles.streakValue}>{stats.currentStreak} jours</Text>
          <Text style={styles.streakLabel}>de régularité</Text>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <Card style={styles.summaryCard}>
          <BookOpen color={colors.gold} size={20} />
          <Text style={styles.summaryValue}>{summary.surahsReviewed}</Text>
          <Text style={styles.summaryLabel}>révisions</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Award color={colors.success} size={20} />
          <Text style={styles.summaryValue}>{summary.versesLearned}</Text>
          <Text style={styles.summaryLabel}>versets</Text>
        </Card>
        <Card style={styles.summaryCard}>
          <Clock3 color={colors.warning} size={20} />
          <Text style={styles.summaryValue}>{formatDuration(summary.durationSeconds)}</Text>
          <Text style={styles.summaryLabel}>durée</Text>
        </Card>
      </View>

      {showPartialCheck && verifiedSurah ? (
        <Card gradient style={styles.eventCard}>
          <Sparkles color={colors.gold} size={25} />
          <View style={styles.badgeCopy}>
            <Text style={styles.eventTitle}>
              {verifiedSurah.nameTranslit} tient à {solidity} %.
            </Text>
            <Text style={styles.badgeText}>
              {weakVerses.length} verset{weakVerses.length > 1 ? 's' : ''} à raffermir,
              on {weakVerses.length > 1 ? 'les' : 'le'} revoit demain. Tout le reste de
              la sourate est déjà en place.
            </Text>
          </View>
        </Card>
      ) : null}

      {summary.freezeUsed ? (
        <Card style={styles.eventCard}>
          <ShieldCheck color={colors.success} size={24} />
          <View style={styles.badgeCopy}>
            <Text style={styles.eventTitle}>Streak protégé</Text>
            <Text style={styles.badgeText}>
              Un freeze a couvert la journée manquée.
            </Text>
          </View>
        </Card>
      ) : null}

      {completedSurah ? (
        <Card gradient style={styles.eventCard}>
          <GraduationCap color={colors.gold} size={25} />
          <View style={styles.badgeCopy}>
            <Text style={styles.eventTitle}>Sourate mémorisée</Text>
            <Text style={styles.badgeText}>
              {completedSurah.nameTranslit} rejoint tes sourates connues.
            </Text>
          </View>
        </Card>
      ) : awaitingSurah ? (
        // Every verse has been seen, and that is all. Saying "memorised" here —
        // which is what this screen used to do — certifies the very thing the
        // final recitation exists to check.
        <Card gradient style={styles.eventCard}>
          <ShieldCheck color={colors.gold} size={25} />
          <View style={styles.badgeCopy}>
            <Text style={styles.eventTitle}>Contrôle final débloqué</Text>
            <Text style={styles.badgeText}>
              Tu as vu tous les versets de {awaitingSurah.nameTranslit}. Récite-la en
              entier pour qu’elle rejoigne tes sourates connues.
            </Text>
          </View>
          <PrimaryButton
            compact
            label="Réciter"
            onPress={() => {
              startVerification(awaitingSurah.number);
              router.replace('/session/verify');
            }}
            variant="surface"
          />
        </Card>
      ) : null}

      {completedSurah && !hasLearningSurah ? (
        <Card style={styles.eventCard}>
          <BookOpen color={colors.gold} size={25} />
          <View style={styles.badgeCopy}>
            <Text style={styles.eventTitle}>Prochaine sourate</Text>
            <Text style={styles.badgeText}>
              Choisis ta prochaine sourate pour continuer ton parcours.
            </Text>
          </View>
          <PrimaryButton
            compact
            label="Choisir"
            onPress={() => router.replace('/library')}
            variant="surface"
          />
        </Card>
      ) : null}

      {unlocked.length ? (
        <View style={styles.unlockedList}>
          {unlocked.map((badge) => (
            <Card key={badge.id} gradient style={styles.badgeCard}>
              <View style={styles.badgeIcon}>
                <Award color={colors.gold} size={27} />
              </View>
              <View style={styles.badgeCopy}>
                <Text style={styles.badgeKicker}>Nouveau badge</Text>
                <Text style={styles.badgeTitle}>{badge.title}</Text>
                <Text style={styles.badgeText}>{badge.description}</Text>
              </View>
              <Text style={styles.badgeSymbol}>{badge.symbol}</Text>
            </Card>
          ))}
        </View>
      ) : null}

      <Card style={styles.tomorrowCard}>
        <CalendarDays color={colors.gold} size={24} />
        <View style={styles.badgeCopy}>
          <Text style={styles.eventTitle}>Demain, en quelques minutes</Text>
          <Text style={styles.badgeText}>
            {tomorrow.reviewCount} révision{tomorrow.reviewCount > 1 ? 's' : ''}
            {tomorrow.versesCount > 0
              ? ` · ${tomorrow.versesCount} verset${tomorrow.versesCount > 1 ? 's' : ''} de ${
                  tomorrowSurah?.nameTranslit ?? 'ta sourate'
                }`
              : ' · consolidation de tes acquis'}
          </Text>
        </View>
      </Card>

      <View pointerEvents="none" style={styles.shareCapture}>
        <ShareCard ref={shareCardRef} streak={stats.currentStreak} summary={summary} />
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          icon={Share2}
          label="Partager ma session"
          loading={sharing}
          onPress={shareResult}
        />
        <PrimaryButton
          icon={Home}
          label="Retour à l’accueil"
          onPress={() => router.replace('/(tabs)')}
          variant="ghost"
        />
      </View>
    </AppScreen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  screen: {
    alignItems: 'center',
    paddingTop: 44,
  },
  sparkles: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  sparkle: {
    color: colors.gold,
    fontSize: 22,
    opacity: 0.65,
    position: 'absolute',
  },
  sparkleOne: {
    left: 32,
    top: 74,
  },
  sparkleTwo: {
    right: 34,
    top: 110,
  },
  sparkleThree: {
    left: 65,
    top: 220,
  },
  sparkleFour: {
    right: 55,
    top: 255,
  },
  successIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.12),
    borderColor: colors.gold,
    borderRadius: 52,
    borderWidth: 1,
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  title: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 32,
    letterSpacing: -1,
    marginTop: spacing.lg,
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
    maxWidth: 320,
    textAlign: 'center',
  },
  xpPill: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  xpText: {
    color: colors.backgroundDeep,
    fontFamily: typography.extraBold,
    fontSize: 17,
  },
  streakRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  streakValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 20,
  },
  streakLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: '100%',
  },
  summaryCard: {
    alignItems: 'center',
    flex: 1,
    padding: spacing.md,
  },
  summaryValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 18,
    marginTop: spacing.xs,
  },
  summaryLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 10,
    marginTop: 2,
  },
  eventCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    width: '100%',
  },
  eventTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 15,
  },
  unlockedList: {
    gap: spacing.sm,
    marginTop: spacing.md,
    width: '100%',
  },
  tomorrowCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    width: '100%',
  },
  shareCapture: {
    left: -2000,
    position: 'absolute',
    top: 0,
  },
  badgeCard: {
    alignItems: 'center',
    flexDirection: 'row',
    width: '100%',
  },
  badgeIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.12),
    borderRadius: radius.md,
    height: 50,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 50,
  },
  badgeCopy: {
    flex: 1,
  },
  badgeKicker: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  badgeTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 16,
    marginTop: 2,
  },
  badgeText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 11,
    marginTop: 2,
  },
  badgeSymbol: {
    color: colors.gold,
    fontSize: 29,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xl,
    width: '100%',
  },
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    color: colors.textMuted,
    fontFamily: typography.medium,
  },
  });
}
