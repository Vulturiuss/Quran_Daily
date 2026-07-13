import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ArrowLeft,
  Check,
  ListChecks,
  MoonStar,
  Sparkles,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { OrnamentalCard } from '@/components/OrnamentalCard';
import {
  Card,
  Eyebrow,
  IconButton,
  PrimaryButton,
  ScreenTitle,
  SectionHeader,
} from '@/components/ui';
import { surahs } from '@/data/surahs';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';
import { goBackOrReplace } from '@/utils/navigation';
import {
  currentRamadan,
  goalVerseCount,
  JUZ_AMMA_SURAHS,
  LAST_TEN_SURAHS,
} from '@/utils/ramadan';

type GoalChoice = 'juz-amma' | 'last-ten' | 'custom';

function formatPace(value: number) {
  return value.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
}

export default function RamadanScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ramadan = useMemo(() => currentRamadan(), []);
  const profile = useQuranStore((state) => state.profile);
  const progress = useQuranStore((state) => state.progress);
  const setRamadanGoal = useQuranStore((state) => state.setRamadanGoal);
  const clearRamadanGoal = useQuranStore((state) => state.clearRamadanGoal);

  const existingGoal = profile.ramadanGoal;
  const [choice, setChoice] = useState<GoalChoice>('juz-amma');
  const [custom, setCustom] = useState<number[]>(
    () => existingGoal?.surahNumbers ?? [],
  );

  const selection = useMemo(() => {
    if (choice === 'juz-amma') return JUZ_AMMA_SURAHS;
    if (choice === 'last-ten') return LAST_TEN_SURAHS;
    return [...custom].sort((a, b) => a - b);
  }, [choice, custom]);

  const verses = goalVerseCount(selection);
  // Before it starts, the whole month is ahead. Once it has, only what is left of
  // it — an honest pace is computed on the days that remain, not the days that were.
  const daysAhead = ramadan
    ? ramadan.hasStarted
      ? Math.max(1, ramadan.daysRemaining)
      : ramadan.totalDays
    : 30;
  const pace = verses / daysAhead;
  const alreadyKnown = selection.filter(
    (number) => progress[number]?.status === 'known',
  ).length;

  function toggleSurah(surahNumber: number) {
    setCustom((current) =>
      current.includes(surahNumber)
        ? current.filter((number) => number !== surahNumber)
        : [...current, surahNumber],
    );
  }

  function confirm() {
    if (selection.length === 0) return;
    setRamadanGoal([...selection]);
    goBackOrReplace('/(tabs)');
  }

  function abandon() {
    clearRamadanGoal();
    goBackOrReplace('/(tabs)');
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
        subtitle="Ce que tu décides d’emporter de ce mois."
        title="Objectif Ramadan"
      />

      <OrnamentalCard contentStyle={styles.hero}>
        <View style={styles.heroIcon}>
          <MoonStar color={colors.gold} size={26} />
        </View>
        <View style={styles.heroCopy}>
          <Eyebrow>
            {ramadan
              ? ramadan.hasStarted
                ? `Jour ${ramadan.dayNumber} sur ${ramadan.totalDays}`
                : 'Ramadan approche'
              : 'Hors saison'}
          </Eyebrow>
          <Text style={styles.heroTitle}>
            {ramadan
              ? ramadan.hasStarted
                ? `Encore ${ramadan.daysRemaining} jour${ramadan.daysRemaining > 1 ? 's' : ''}.`
                : 'Le mois arrive.'
              : 'Ramadan n’est pas là.'}
          </Text>
          <Text style={styles.heroText}>
            {ramadan
              ? 'Un objectif n’est pas une dette. C’est une direction : tu la choisis, et chaque verset t’en rapproche.'
              : 'Tu pourras te fixer un objectif quand le mois approchera, in cha Allah.'}
          </Text>
        </View>
      </OrnamentalCard>

      {existingGoal ? (
        <Card style={styles.existingCard}>
          <Text style={styles.existingTitle}>
            Tu as déjà un objectif : {existingGoal.surahNumbers.length} sourate
            {existingGoal.surahNumbers.length > 1 ? 's' : ''}.
          </Text>
          <Text style={styles.existingText}>
            Tu peux le remplacer ci-dessous, ou le retirer. Rien de ce que tu as
            appris ne sera perdu.
          </Text>
          <PrimaryButton
            label="Retirer mon objectif"
            onPress={abandon}
            variant="ghost"
          />
        </Card>
      ) : null}

      <SectionHeader title="Choisis ton objectif" />

      <ChoiceRow
        colors={colors}
        description="Les 37 dernières sourates. Le chemin que presque tout le monde emprunte."
        detail={`${JUZ_AMMA_SURAHS.length} sourates · ${goalVerseCount(JUZ_AMMA_SURAHS)} versets`}
        icon={Sparkles}
        onPress={() => setChoice('juz-amma')}
        selected={choice === 'juz-amma'}
        styles={styles}
        title="Juz Amma"
      />
      <ChoiceRow
        colors={colors}
        description="Courtes, denses, récitées dans chaque prière. Un objectif que l’on tient."
        detail={`${LAST_TEN_SURAHS.length} sourates · ${goalVerseCount(LAST_TEN_SURAHS)} versets`}
        icon={MoonStar}
        onPress={() => setChoice('last-ten')}
        selected={choice === 'last-ten'}
        styles={styles}
        title="Les 10 dernières sourates"
      />
      <ChoiceRow
        colors={colors}
        description="Compose toi-même ta liste, sourate par sourate."
        detail={
          custom.length
            ? `${custom.length} sourate${custom.length > 1 ? 's' : ''} · ${goalVerseCount(custom)} versets`
            : 'Aucune sourate choisie'
        }
        icon={ListChecks}
        onPress={() => setChoice('custom')}
        selected={choice === 'custom'}
        styles={styles}
        title="Ma sélection"
      />

      {choice === 'custom' ? (
        <>
          <SectionHeader title="Bibliothèque" />
          <Card style={styles.libraryCard}>
            {surahs.map((surah, index) => {
              const selected = custom.includes(surah.number);
              const known = progress[surah.number]?.status === 'known';
              return (
                <Pressable
                  accessibilityLabel={surah.nameTranslit}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: selected }}
                  key={surah.number}
                  onPress={() => toggleSurah(surah.number)}
                  style={({ pressed }) => [
                    styles.surahRow,
                    index < surahs.length - 1 && styles.surahDivider,
                    pressed && styles.pressed,
                  ]}
                >
                  <View
                    style={[styles.checkbox, selected && styles.checkboxSelected]}
                  >
                    {selected ? (
                      <Check color={colors.backgroundDeep} size={14} strokeWidth={3} />
                    ) : (
                      <Text style={styles.surahNumber}>{surah.number}</Text>
                    )}
                  </View>
                  <View style={styles.surahCopy}>
                    <Text style={styles.surahName}>{surah.nameTranslit}</Text>
                    <Text style={styles.surahMeta}>
                      {surah.totalVerses} versets
                      {known ? ' · déjà mémorisée' : ''}
                    </Text>
                  </View>
                  <Text style={styles.surahArabic}>{surah.name}</Text>
                </Pressable>
              );
            })}
          </Card>
        </>
      ) : null}

      <SectionHeader title="Ce que cela représente" />
      <Card style={styles.summaryCard}>
        {selection.length === 0 ? (
          <Text style={styles.summaryText}>
            Choisis au moins une sourate pour voir ce que ton objectif demande.
          </Text>
        ) : (
          <>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryValue}>{selection.length}</Text>
              <Text style={styles.summaryLabel}>
                sourate{selection.length > 1 ? 's' : ''}
              </Text>
              <View style={styles.summarySpacer} />
              <Text style={styles.summaryValue}>{verses}</Text>
              <Text style={styles.summaryLabel}>versets</Text>
            </View>
            <Text style={styles.summaryText}>
              Environ {formatPace(pace)} verset{pace > 1 ? 's' : ''} par jour sur{' '}
              {daysAhead} jour{daysAhead > 1 ? 's' : ''}. À toi de voir si ce rythme
              te ressemble — un objectif tenu vaut mieux qu’un objectif ambitieux.
            </Text>
            {alreadyKnown > 0 ? (
              <Text style={styles.summaryNote}>
                {alreadyKnown} de ces sourate{alreadyKnown > 1 ? 's sont' : ' est'}{' '}
                déjà mémorisée{alreadyKnown > 1 ? 's' : ''} : autant de compté dès le
                premier jour.
              </Text>
            ) : null}
          </>
        )}
      </Card>

      <PrimaryButton
        disabled={selection.length === 0}
        icon={MoonStar}
        label={existingGoal ? 'Mettre à jour mon objectif' : 'Je me fixe cet objectif'}
        onPress={confirm}
      />
      <Text style={styles.footnote}>
        Tu pourras le modifier ou le retirer à tout moment. Il n’y a rien à perdre.
      </Text>
    </AppScreen>
  );
}

function ChoiceRow({
  colors,
  description,
  detail,
  icon: IconComponent,
  onPress,
  selected,
  styles,
  title,
}: {
  colors: Palette;
  description: string;
  detail: string;
  icon: typeof MoonStar;
  onPress: () => void;
  selected: boolean;
  styles: ReturnType<typeof createStyles>;
  title: string;
}) {
  return (
    <Pressable
      accessibilityLabel={title}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}
    >
      <Card style={[styles.choiceCard, selected && styles.choiceCardSelected]}>
        <View style={styles.choiceIcon}>
          <IconComponent color={colors.gold} size={20} />
        </View>
        <View style={styles.choiceCopy}>
          <Text style={styles.choiceTitle}>{title}</Text>
          <Text style={styles.choiceText}>{description}</Text>
          <Text style={styles.choiceDetail}>{detail}</Text>
        </View>
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? (
            <Check color={colors.backgroundDeep} size={13} strokeWidth={3} />
          ) : null}
        </View>
      </Card>
    </Pressable>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
    hero: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    heroIcon: {
      alignItems: 'center',
      backgroundColor: withAlpha(colors.gold, 0.12),
      borderRadius: radius.pill,
      height: 56,
      justifyContent: 'center',
      width: 56,
    },
    heroCopy: {
      flex: 1,
    },
    heroTitle: {
      color: colors.text,
      fontFamily: typography.extraBold,
      fontSize: 21,
      letterSpacing: -0.4,
      marginTop: 2,
    },
    heroText: {
      color: colors.textMuted,
      fontFamily: typography.regular,
      fontSize: 13,
      lineHeight: 20,
      marginTop: spacing.xs,
    },
    existingCard: {
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    existingTitle: {
      color: colors.text,
      fontFamily: typography.bold,
      fontSize: 14,
    },
    existingText: {
      color: colors.textMuted,
      fontFamily: typography.regular,
      fontSize: 12,
      lineHeight: 19,
    },
    choiceCard: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.sm,
      padding: spacing.md,
    },
    choiceCardSelected: {
      backgroundColor: withAlpha(colors.gold, 0.1),
      borderColor: colors.gold,
    },
    choiceIcon: {
      alignItems: 'center',
      backgroundColor: withAlpha(colors.gold, 0.1),
      borderRadius: radius.md,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    choiceCopy: {
      flex: 1,
    },
    choiceTitle: {
      color: colors.text,
      fontFamily: typography.extraBold,
      fontSize: 15,
    },
    choiceText: {
      color: colors.textMuted,
      fontFamily: typography.regular,
      fontSize: 12,
      lineHeight: 18,
      marginTop: 2,
    },
    choiceDetail: {
      color: colors.goldSoft,
      fontFamily: typography.bold,
      fontSize: 11,
      marginTop: spacing.xs,
    },
    radio: {
      alignItems: 'center',
      borderColor: colors.border,
      borderRadius: radius.pill,
      borderWidth: 1,
      height: 24,
      justifyContent: 'center',
      width: 24,
    },
    radioSelected: {
      backgroundColor: colors.gold,
      borderColor: colors.gold,
    },
    libraryCard: {
      padding: spacing.md,
    },
    surahRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.md,
      minHeight: 56,
    },
    surahDivider: {
      borderBottomColor: colors.divider,
      borderBottomWidth: 1,
    },
    checkbox: {
      alignItems: 'center',
      backgroundColor: withAlpha(colors.ink, 0.05),
      borderColor: colors.border,
      borderRadius: radius.sm,
      borderWidth: 1,
      height: 32,
      justifyContent: 'center',
      width: 32,
    },
    checkboxSelected: {
      backgroundColor: colors.gold,
      borderColor: colors.gold,
    },
    surahNumber: {
      color: colors.textFaint,
      fontFamily: typography.bold,
      fontSize: 11,
    },
    surahCopy: {
      flex: 1,
    },
    surahName: {
      color: colors.text,
      fontFamily: typography.bold,
      fontSize: 14,
    },
    surahMeta: {
      color: colors.textMuted,
      fontFamily: typography.regular,
      fontSize: 11,
      marginTop: 2,
    },
    surahArabic: {
      color: colors.goldSoft,
      fontFamily: typography.arabic,
      fontSize: 20,
    },
    summaryCard: {
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    summaryRow: {
      alignItems: 'baseline',
      flexDirection: 'row',
      gap: spacing.xs,
    },
    summarySpacer: {
      width: spacing.md,
    },
    summaryValue: {
      color: colors.gold,
      fontFamily: typography.extraBold,
      fontSize: 24,
    },
    summaryLabel: {
      color: colors.textMuted,
      fontFamily: typography.medium,
      fontSize: 12,
    },
    summaryText: {
      color: colors.textMuted,
      fontFamily: typography.regular,
      fontSize: 13,
      lineHeight: 20,
    },
    summaryNote: {
      color: colors.goldSoft,
      fontFamily: typography.medium,
      fontSize: 12,
      lineHeight: 18,
    },
    footnote: {
      color: colors.textFaint,
      fontFamily: typography.regular,
      fontSize: 11,
      lineHeight: 17,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
    pressed: {
      opacity: 0.76,
    },
  });
}
