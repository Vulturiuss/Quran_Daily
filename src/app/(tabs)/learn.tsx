import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  ArrowDown,
  ArrowUp,
  BookOpenCheck,
  Brain,
  Check,
  Ear,
  Play,
  Plus,
  Repeat,
  Sparkles,
  Target,
  X,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { OrnamentalCard } from '@/components/OrnamentalCard';
import { VerseCard } from '@/components/VerseCard';
import { Card, Eyebrow, PrimaryButton, ProgressBar, ScreenTitle, SectionHeader } from '@/components/ui';
import { getSurah } from '@/data/surahs';
import { getVerses } from '@/data/verses';
import { useAccess } from '@/hooks/useAccess';
import { useTheme } from '@/providers/ThemeProvider';
import {
  PREMIUM_MAX_LEARNING_SURAHS,
  sessionAccess,
} from '@/utils/access';
import { useQuranStore } from '@/store/useQuranStore';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';

export default function LearnScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const progressMap = useQuranStore((state) => state.progress);
  const profile = useQuranStore((state) => state.profile);
  const startDailySession = useQuranStore((state) => state.startDailySession);
  const removeFromLearningQueue = useQuranStore((state) => state.removeFromLearningQueue);
  const reorderLearningQueue = useQuranStore((state) => state.reorderLearningQueue);
  const access = useAccess();

  // Derived with useMemo rather than a store selector: the selector rebuilds the
  // array on every call, which would give useSyncExternalStore a new snapshot
  // each render and loop.
  const active = useMemo(
    () =>
      Object.values(progressMap)
        .filter((item) => item.status === 'learning')
        .sort((a, b) => (b.updatedAt ?? '').localeCompare(a.updatedAt ?? '')),
    [progressMap],
  );

  const [selectedSurah, setSelectedSurah] = useState<number>();
  const learning =
    active.find((item) => item.surahNumber === selectedSurah) ?? active[0];
  const canAddSurah = active.length < access.maxLearningSurahs;

  const surah = getSurah(learning?.surahNumber);
  const verses = getVerses(learning?.surahNumber);
  const nextVerse = verses[learning?.versesLearned ?? 0];
  const progress = learning ? learning.versesLearned / learning.totalVerses : 0;

  function start() {
    // Never write on unresolved capabilities: the free freeze allowance would be
    // stamped into the session and clamp a subscriber's freezes for the month.
    if (!access.resolved) return;
    startDailySession(
      sessionAccess(access.hasFullAccess, false, learning?.surahNumber),
    );
    const session = useQuranStore.getState().activeSession;
    router.push(session?.reviewQueue.length ? '/session/review' : '/session/learn');
  }

  if (!learning || !surah) {
    return (
      <AppScreen>
        <ScreenTitle title="Apprendre" subtitle="Choisis une sourate pour commencer." />
        <Card style={styles.empty}>
          <BookOpenCheck color={colors.gold} size={40} />
          <Text style={styles.emptyTitle}>Aucune sourate en cours</Text>
          <Text style={styles.emptyText}>
            Ouvre la bibliothèque et sélectionne une sourate courte adaptée à ton rythme.
          </Text>
          <PrimaryButton label="Choisir une sourate" onPress={() => router.push('/library')} />
        </Card>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenTitle
        title="Apprendre"
        subtitle="Un verset après l’autre, avec calme et répétition."
      />

      {active.length > 1 ? (
        <View style={styles.activeSurahs}>
          {active.map((item) => {
            const itemSurah = getSurah(item.surahNumber);
            if (!itemSurah) return null;
            const isSelected = item.surahNumber === learning.surahNumber;
            return (
              <Pressable
                accessibilityLabel={`Travailler ${itemSurah.nameTranslit}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                key={item.surahNumber}
                onPress={() => setSelectedSurah(item.surahNumber)}
                style={[
                  styles.activeSurah,
                  isSelected && styles.activeSurahSelected,
                ]}
              >
                <Text
                  numberOfLines={1}
                  style={[
                    styles.activeSurahName,
                    isSelected && styles.activeSurahNameSelected,
                  ]}
                >
                  {itemSurah.nameTranslit}
                </Text>
                <Text style={styles.activeSurahMeta}>
                  {Math.round((item.versesLearned / item.totalVerses) * 100)}%
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <OrnamentalCard contentStyle={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Eyebrow>Sourate en cours</Eyebrow>
            <Text style={styles.surahName}>{surah.nameTranslit}</Text>
            <Text style={styles.surahMeta}>{surah.nameFr}</Text>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => router.push('/library')}
              style={styles.switchSurahLink}
            >
              <Repeat color={colors.goldSoft} size={13} />
              <Text style={styles.switchSurahText}>Changer de sourate</Text>
            </Pressable>
          </View>
          <Text style={styles.surahArabic}>{surah.name}</Text>
        </View>
        <View style={styles.progressLabels}>
          <Text style={styles.progressLabel}>
            {learning.versesLearned} sur {surah.totalVerses} versets mémorisés
          </Text>
          <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
        </View>
        <ProgressBar value={progress} />
        <View style={styles.goalRow}>
          <View style={styles.goalItem}>
            <Target color={colors.gold} size={17} />
            <Text style={styles.goalText}>{profile.dailyGoalVerses} versets / jour</Text>
          </View>
          <View style={styles.goalItem}>
            <Brain color={colors.success} size={17} />
            <Text style={styles.goalText}>
              {surah.totalVerses - learning.versesLearned} restant
              {surah.totalVerses - learning.versesLearned > 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <PrimaryButton
          icon={Play}
          label="Lancer ma session"
          loading={!access.resolved}
          onPress={start}
        />
      </OrnamentalCard>

      {!access.resolved ? null : canAddSurah ? (
        <Card style={styles.addSurah}>
          <Text style={styles.addSurahText}>
            Tu peux apprendre {access.maxLearningSurahs - active.length} sourate
            {access.maxLearningSurahs - active.length > 1 ? 's' : ''} de plus en
            parallèle.
          </Text>
          <PrimaryButton
            compact
            icon={Plus}
            label="Ajouter une sourate"
            onPress={() => router.push('/library')}
            variant="ghost"
          />
        </Card>
      ) : !access.hasFullAccess ? (
        <Card style={styles.addSurah}>
          <Text style={styles.addSurahText}>
            Avec Premium, apprends jusqu’à {PREMIUM_MAX_LEARNING_SURAHS} sourates
            en parallèle.
          </Text>
          <PrimaryButton
            compact
            icon={Sparkles}
            label="Découvrir Premium"
            onPress={() => router.push('/subscription')}
            variant="ghost"
          />
        </Card>
      ) : null}

      {nextVerse ? (
        <>
          <SectionHeader title="Prochain verset" />
          <VerseCard verse={nextVerse} showToggle />
        </>
      ) : null}

      <SectionHeader title="Rituel de mémorisation" />
      <Card style={styles.ritualCard}>
        <View style={styles.ritualStep}>
          <View style={styles.ritualIcon}>
            <Ear color={colors.gold} size={19} />
          </View>
          <View style={styles.ritualCopy}>
            <Text style={styles.ritualTitle}>1. Écoute trois fois</Text>
            <Text style={styles.ritualText}>Repère le rythme avant de réciter.</Text>
          </View>
        </View>
        <View style={styles.ritualLine} />
        <View style={styles.ritualStep}>
          <View style={styles.ritualIcon}>
            <Brain color={colors.gold} size={19} />
          </View>
          <View style={styles.ritualCopy}>
            <Text style={styles.ritualTitle}>2. Masque le texte</Text>
            <Text style={styles.ritualText}>Récite sans aide, puis révèle pour vérifier.</Text>
          </View>
        </View>
        <View style={styles.ritualLine} />
        <View style={styles.ritualStep}>
          <View style={styles.ritualIcon}>
            <Check color={colors.success} size={19} />
          </View>
          <View style={styles.ritualCopy}>
            <Text style={styles.ritualTitle}>3. Valide sereinement</Text>
            <Text style={styles.ritualText}>La régularité compte plus que la vitesse.</Text>
          </View>
        </View>
      </Card>

      <SectionHeader title="À suivre" />
      {profile.learningQueue.length === 0 ? (
        <Card style={styles.queueEmpty}>
          <Text style={styles.queueEmptyText}>
            Ajoute de futures sourates depuis leur fiche dans la bibliothèque : la première de la
            file prendra automatiquement le relais dès que tu termineras la sourate en cours.
          </Text>
          <PrimaryButton
            compact
            label="Ouvrir la bibliothèque"
            onPress={() => router.push('/library')}
            variant="ghost"
          />
        </Card>
      ) : (
        <Card style={styles.queueCard}>
          {profile.learningQueue.map((surahNumber, index) => {
            const queuedSurah = getSurah(surahNumber);
            if (!queuedSurah) return null;
            return (
              <View key={surahNumber} style={styles.queueRow}>
                <Text style={styles.queuePosition}>{index + 1}</Text>
                <View style={styles.queueCopy}>
                  <Text style={styles.queueName}>{queuedSurah.nameTranslit}</Text>
                  <Text style={styles.queueMeta}>{queuedSurah.totalVerses} versets</Text>
                </View>
                <View style={styles.queueActions}>
                  <Pressable
                    accessibilityLabel="Monter dans la file"
                    accessibilityRole="button"
                    disabled={index === 0}
                    hitSlop={6}
                    onPress={() => reorderLearningQueue(surahNumber, 'up')}
                    style={[styles.queueActionButton, index === 0 && styles.queueActionDisabled]}
                  >
                    <ArrowUp color={colors.textMuted} size={15} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Descendre dans la file"
                    accessibilityRole="button"
                    disabled={index === profile.learningQueue.length - 1}
                    hitSlop={6}
                    onPress={() => reorderLearningQueue(surahNumber, 'down')}
                    style={[
                      styles.queueActionButton,
                      index === profile.learningQueue.length - 1 && styles.queueActionDisabled,
                    ]}
                  >
                    <ArrowDown color={colors.textMuted} size={15} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Retirer de la file"
                    accessibilityRole="button"
                    hitSlop={6}
                    onPress={() => removeFromLearningQueue(surahNumber)}
                    style={styles.queueActionButton}
                  >
                    <X color={colors.error} size={15} />
                  </Pressable>
                </View>
              </View>
            );
          })}
        </Card>
      )}
    </AppScreen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  activeSurahs: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  activeSurah: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  activeSurahSelected: {
    backgroundColor: withAlpha(colors.gold, 0.13),
    borderColor: colors.gold,
  },
  activeSurahName: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  activeSurahNameSelected: {
    color: colors.text,
  },
  activeSurahMeta: {
    color: colors.textFaint,
    fontFamily: typography.regular,
    fontSize: 11,
    marginTop: 2,
  },
  addSurah: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  addSurahText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
    textAlign: 'center',
  },
  switchSurahLink: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
    marginTop: spacing.sm,
  },
  switchSurahText: {
    color: colors.goldSoft,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  queueEmpty: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  queueEmptyText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
  },
  queueCard: {
    padding: spacing.sm,
  },
  queueRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  queuePosition: {
    color: colors.textFaint,
    fontFamily: typography.extraBold,
    fontSize: 14,
    width: 18,
  },
  queueCopy: {
    flex: 1,
  },
  queueName: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  queueMeta: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 11,
    marginTop: 1,
  },
  queueActions: {
    flexDirection: 'row',
    gap: 4,
  },
  queueActionButton: {
    alignItems: 'center',
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  queueActionDisabled: {
    opacity: 0.3,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 21,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 300,
    textAlign: 'center',
  },
  hero: {
    minHeight: 310,
  },
  heroTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  surahName: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 28,
    letterSpacing: -0.7,
    marginTop: spacing.xs,
  },
  surahMeta: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
  },
  surahArabic: {
    color: colors.goldSoft,
    fontFamily: typography.arabic,
    fontSize: 36,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  progressLabel: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 12,
  },
  progressPercent: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  goalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
    marginTop: spacing.lg,
  },
  goalItem: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.ink, 0.05),
    borderRadius: radius.md,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  goalText: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 11,
  },
  ritualCard: {
    padding: spacing.md,
  },
  ritualStep: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  ritualIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.1),
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 40,
  },
  ritualCopy: {
    flex: 1,
  },
  ritualTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  ritualText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  ritualLine: {
    backgroundColor: colors.border,
    height: spacing.sm,
    marginLeft: 20,
    marginVertical: 2,
    width: 1,
  },
  });
}
