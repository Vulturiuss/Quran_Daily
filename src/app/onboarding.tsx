import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  Bell,
  BookHeart,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MoonStar,
  Sparkles,
  Target,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { ArabicText } from '@/components/ArabicText';
import { Card, Eyebrow, Pill, PrimaryButton, ProgressBar } from '@/components/ui';
import { getSurah, onboardingSurahs } from '@/data/surahs';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { configureDailyReminder } from '@/services/notifications';
import { isFreeSurah } from '@/services/subscription';
import { useQuranStore } from '@/store/useQuranStore';
import { colors, radius, spacing, typography } from '@/theme';

const learnableNumbers = [114, 113, 112, 108, 103, 1];
const reminderTimes = ['07:00', '12:30', '20:00', '22:00'];
const goals = [
  { minutes: 3 as const, reviews: 1, verses: 1, label: 'Doucement' },
  { minutes: 5 as const, reviews: 2, verses: 2, label: 'Régulier' },
  { minutes: 10 as const, reviews: 3, verses: 4, label: 'Soutenu' },
  { minutes: 15 as const, reviews: 5, verses: 5, label: 'Intensif' },
];

export default function OnboardingScreen() {
  const completeOnboarding = useQuranStore((state) => state.completeOnboarding);
  const { configured, isPremium, loading } = useSubscription();
  const hasFullAccess = !configured || loading || isPremium;
  const [step, setStep] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [knownSurahs, setKnownSurahs] = useState<number[]>([1, 112, 113, 114]);
  const [learningSurah, setLearningSurah] = useState(108);
  const [goal, setGoal] = useState(goals[1]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationTime, setNotificationTime] = useState('20:00');
  const [saving, setSaving] = useState(false);

  const learningChoices = useMemo(
    () =>
      learnableNumbers
        .filter((number) => hasFullAccess || isFreeSurah(number))
        .filter((number) => !knownSurahs.includes(number))
        .map((number) => getSurah(number))
        .filter(Boolean),
    [hasFullAccess, knownSurahs],
  );
  const selectableKnownSurahs = hasFullAccess
    ? onboardingSurahs
    : onboardingSurahs.filter((surah) => isFreeSurah(surah.number));

  function toggleKnown(number: number) {
    setKnownSurahs((current) =>
      current.includes(number) ? current.filter((item) => item !== number) : [...current, number],
    );
    if (number === learningSurah) {
      const replacement = learnableNumbers.find(
        (candidate) => candidate !== number && !knownSurahs.includes(candidate),
      );
      if (replacement) setLearningSurah(replacement);
    }
  }

  function goNext() {
    if (step === 1 && knownSurahs.includes(learningSurah)) {
      const replacement = learnableNumbers.find((number) => !knownSurahs.includes(number));
      if (replacement) setLearningSurah(replacement);
    }
    setStep((value) => Math.min(4, value + 1));
  }

  async function finish() {
    setSaving(true);
    let reminderGranted = false;
    if (notificationsEnabled) {
      reminderGranted = await configureDailyReminder(notificationTime).catch(() => false);
    }
    completeOnboarding({
      displayName,
      knownSurahs,
      learningSurah,
      goalMinutes: goal.minutes,
      dailyGoalVerses: goal.verses,
      dailyGoalReviews: goal.reviews,
      notificationTime,
      notificationsEnabled: reminderGranted,
    });
    router.replace('/(tabs)');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.flex}
    >
      <AppScreen contentStyle={styles.screen}>
        <View style={styles.topRow}>
          {step > 0 ? (
            <Pressable onPress={() => setStep((value) => value - 1)} style={styles.backButton}>
              <ChevronLeft color={colors.text} size={22} />
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <Text style={styles.stepLabel}>{step + 1} / 5</Text>
        </View>
        <ProgressBar value={(step + 1) / 5} height={5} />

        {step === 0 ? (
          <View style={styles.heroStep}>
            <View style={styles.logo}>
              <MoonStar color={colors.gold} size={42} strokeWidth={1.6} />
              <View style={styles.logoDot} />
            </View>
            <Eyebrow>Quran Daily</Eyebrow>
            <Text style={styles.heroTitle}>Récite chaque jour.{'\n'}N’oublie jamais.</Text>
            <ArabicText size={28} style={styles.basmala}>
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </ArabicText>
            <Text style={styles.heroCopy}>
              Une routine guidée de quelques minutes pour réviser tes sourates et progresser un
              verset à la fois.
            </Text>
            <Text style={styles.inputLabel}>Comment souhaites-tu être appelé ?</Text>
            <TextInput
              autoCapitalize="words"
              onChangeText={setDisplayName}
              placeholder="Ton prénom"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              value={displayName}
            />
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <BookHeart color={colors.gold} size={25} />
            </View>
            <Text style={styles.stepTitle}>Que connais-tu déjà ?</Text>
            <Text style={styles.stepCopy}>
              Sélectionne les sourates que tu peux réciter. Elles alimenteront tes révisions.
            </Text>
            <View style={styles.quickActions}>
              <Pill label="Aucune" onPress={() => setKnownSurahs([])} />
              <Pill
                label="Les essentielles"
                onPress={() => setKnownSurahs([1, 112, 113, 114])}
              />
            </View>
            <View style={styles.surahGrid}>
              {selectableKnownSurahs.map((surah) => {
                const selected = knownSurahs.includes(surah.number);
                return (
                  <Pressable
                    key={surah.number}
                    onPress={() => toggleKnown(surah.number)}
                    style={[styles.surahChoice, selected && styles.surahChoiceSelected]}
                  >
                    <View style={[styles.check, selected && styles.checkSelected]}>
                      {selected ? <Check color={colors.backgroundDeep} size={14} /> : null}
                    </View>
                    <View style={styles.surahChoiceCopy}>
                      <Text style={styles.surahChoiceName}>{surah.nameTranslit}</Text>
                      <Text style={styles.surahChoiceMeta}>{surah.totalVerses} versets</Text>
                    </View>
                    <Text style={styles.surahChoiceArabic}>{surah.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Sparkles color={colors.gold} size={25} />
            </View>
            <Text style={styles.stepTitle}>Ta prochaine sourate</Text>
            <Text style={styles.stepCopy}>
              Commence court. L’application te guidera verset par verset, sans surcharge.
            </Text>
            <View style={styles.learningList}>
              {learningChoices.map((surah) =>
                surah ? (
                  <Pressable
                    key={surah.number}
                    onPress={() => setLearningSurah(surah.number)}
                    style={[
                      styles.learningChoice,
                      learningSurah === surah.number && styles.learningChoiceSelected,
                    ]}
                  >
                    <View>
                      <Text style={styles.learningName}>{surah.nameTranslit}</Text>
                      <Text style={styles.learningMeta}>
                        {surah.nameFr} · {surah.totalVerses} versets
                      </Text>
                    </View>
                    <Text style={styles.learningArabic}>{surah.name}</Text>
                  </Pressable>
                ) : null,
              )}
            </View>
          </View>
        ) : null}

        {step === 3 ? (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Target color={colors.gold} size={25} />
            </View>
            <Text style={styles.stepTitle}>Ton rythme quotidien</Text>
            <Text style={styles.stepCopy}>
              La régularité compte plus que la quantité. Tu pourras ajuster cet objectif plus tard.
            </Text>
            <View style={styles.goalList}>
              {goals.map((item) => (
                <Pressable
                  key={item.minutes}
                  onPress={() => setGoal(item)}
                  style={[styles.goal, goal.minutes === item.minutes && styles.goalSelected]}
                >
                  <View style={styles.goalMinutes}>
                    <Text style={styles.goalValue}>{item.minutes}</Text>
                    <Text style={styles.goalUnit}>min</Text>
                  </View>
                  <View style={styles.goalCopy}>
                    <Text style={styles.goalLabel}>{item.label}</Text>
                    <Text style={styles.goalDescription}>
                      {item.reviews} révision{item.reviews > 1 ? 's' : ''} · {item.verses} verset
                      {item.verses > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <View style={[styles.radio, goal.minutes === item.minutes && styles.radioSelected]}>
                    {goal.minutes === item.minutes ? <View style={styles.radioDot} /> : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {step === 4 ? (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Bell color={colors.gold} size={25} />
            </View>
            <Text style={styles.stepTitle}>Protège ton rendez-vous</Text>
            <Text style={styles.stepCopy}>
              Choisis un moment calme. Le rappel est local, privé et modifiable à tout moment.
            </Text>
            <Card style={styles.notificationCard}>
              <View style={styles.notificationRow}>
                <View style={styles.notificationIcon}>
                  <Clock3 color={colors.gold} size={22} />
                </View>
                <View style={styles.notificationCopy}>
                  <Text style={styles.notificationTitle}>Rappel quotidien</Text>
                  <Text style={styles.notificationText}>Une notification douce, une fois par jour.</Text>
                </View>
                <Switch
                  onValueChange={setNotificationsEnabled}
                  thumbColor={notificationsEnabled ? colors.gold : colors.textFaint}
                  trackColor={{ false: colors.surfaceElevated, true: 'rgba(212,175,55,0.35)' }}
                  value={notificationsEnabled}
                />
              </View>
              {notificationsEnabled ? (
                <View style={styles.timeRow}>
                  {reminderTimes.map((time) => (
                    <Pill
                      key={time}
                      label={time}
                      onPress={() => setNotificationTime(time)}
                      selected={notificationTime === time}
                    />
                  ))}
                </View>
              ) : null}
            </Card>
            <View style={styles.readyCard}>
              <Text style={styles.readySymbol}>۞</Text>
              <View style={styles.readyCopy}>
                <Text style={styles.readyTitle}>Tout est prêt</Text>
                <Text style={styles.readyText}>
                  {goal.minutes} minutes par jour · {knownSurahs.length} sourates en révision
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View style={styles.footer}>
          {step < 4 ? (
            <PrimaryButton label={step === 0 ? 'Commencer' : 'Continuer'} icon={ChevronRight} onPress={goNext} />
          ) : (
            <PrimaryButton label="C’est parti" icon={Sparkles} loading={saving} onPress={finish} />
          )}
        </View>
      </AppScreen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    backgroundColor: colors.background,
    flex: 1,
  },
  screen: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  topRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  backPlaceholder: {
    width: 42,
  },
  stepLabel: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  heroStep: {
    alignItems: 'center',
    paddingTop: 54,
  },
  logo: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 35,
    borderWidth: 1,
    height: 88,
    justifyContent: 'center',
    marginBottom: spacing.lg,
    transform: [{ rotate: '45deg' }],
    width: 88,
  },
  logoDot: {
    backgroundColor: colors.gold,
    borderRadius: 4,
    height: 7,
    position: 'absolute',
    right: 13,
    top: 13,
    width: 7,
  },
  heroTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 37,
    letterSpacing: -1.3,
    lineHeight: 44,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  basmala: {
    color: colors.goldSoft,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  heroCopy: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 16,
    lineHeight: 24,
    marginTop: spacing.lg,
    maxWidth: 360,
    textAlign: 'center',
  },
  inputLabel: {
    alignSelf: 'stretch',
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 14,
    marginBottom: spacing.sm,
    marginTop: spacing.xl,
  },
  input: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: typography.medium,
    fontSize: 16,
    minHeight: 56,
    paddingHorizontal: spacing.md,
  },
  stepContent: {
    paddingTop: spacing.xl,
  },
  stepIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 52,
  },
  stepTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 30,
    letterSpacing: -0.8,
  },
  stepCopy: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginVertical: spacing.lg,
  },
  surahGrid: {
    gap: spacing.sm,
  },
  surahChoice: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 66,
    padding: spacing.md,
  },
  surahChoiceSelected: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderColor: colors.gold,
  },
  check: {
    alignItems: 'center',
    borderColor: colors.textFaint,
    borderRadius: 7,
    borderWidth: 1,
    height: 24,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 24,
  },
  checkSelected: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  surahChoiceCopy: {
    flex: 1,
  },
  surahChoiceName: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 15,
  },
  surahChoiceMeta: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
  },
  surahChoiceArabic: {
    color: colors.goldSoft,
    fontFamily: typography.arabic,
    fontSize: 23,
  },
  learningList: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  learningChoice: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 80,
    padding: spacing.md,
  },
  learningChoiceSelected: {
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderColor: colors.gold,
  },
  learningName: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 17,
  },
  learningMeta: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    marginTop: 2,
  },
  learningArabic: {
    color: colors.goldSoft,
    fontFamily: typography.arabic,
    fontSize: 28,
  },
  goalList: {
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  goal: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 84,
    padding: spacing.md,
  },
  goalSelected: {
    backgroundColor: 'rgba(212,175,55,0.11)',
    borderColor: colors.gold,
  },
  goalMinutes: {
    alignItems: 'baseline',
    flexDirection: 'row',
    width: 72,
  },
  goalValue: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 27,
  },
  goalUnit: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 12,
    marginLeft: 3,
  },
  goalCopy: {
    flex: 1,
  },
  goalLabel: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 16,
  },
  goalDescription: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    marginTop: 2,
  },
  radio: {
    alignItems: 'center',
    borderColor: colors.textFaint,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 23,
    justifyContent: 'center',
    width: 23,
  },
  radioSelected: {
    borderColor: colors.gold,
  },
  radioDot: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    height: 11,
    width: 11,
  },
  notificationCard: {
    marginTop: spacing.xl,
  },
  notificationRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  notificationIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 46,
  },
  notificationCopy: {
    flex: 1,
  },
  notificationTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 16,
  },
  notificationText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  timeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  readyCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(129,199,132,0.1)',
    borderColor: 'rgba(129,199,132,0.26)',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  readySymbol: {
    color: colors.success,
    fontSize: 30,
    marginRight: spacing.md,
  },
  readyCopy: {
    flex: 1,
  },
  readyTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 15,
  },
  readyText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    marginTop: 2,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
  },
});
