import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Clock3,
  Crown,
  FileText,
  Headphones,
  RotateCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { VerseAudioButton } from '@/components/VerseAudioButton';
import { Card, Pill, PrimaryButton, ScreenTitle, SectionHeader, TimeStepper } from '@/components/ui';
import { getVerse } from '@/data/verses';
import { useCloud } from '@/providers/CloudProvider';
import { useFamily } from '@/providers/FamilyProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { cancelSmartReminders, enableSmartReminders } from '@/services/notifications';
import { reciters } from '@/services/quranApi';
import { useQuranStore } from '@/store/useQuranStore';
import { Palette, radius, spacing, themeOptions, typography } from '@/theme';

const goalOptions = [
  { minutes: 3 as const, reviews: 1, verses: 1 },
  { minutes: 5 as const, reviews: 2, verses: 2 },
  { minutes: 10 as const, reviews: 3, verses: 4 },
  { minutes: 15 as const, reviews: 5, verses: 5 },
];
const reciterOptions = Object.entries(reciters).map(([id, reciter]) => ({
  id,
  label: reciter.name,
  style: reciter.style,
}));
const previewVerse = getVerse(1, 1);

export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const profile = useQuranStore((state) => state.profile);
  const currentStreak = useQuranStore((state) => state.stats.currentStreak);
  const freezeCount = useQuranStore((state) => state.stats.freezeCount);
  const history = useQuranStore((state) => state.history);
  const updateProfile = useQuranStore((state) => state.updateProfile);
  const resetApp = useQuranStore((state) => state.resetApp);
  const { configured, session, status, resetLocalData } = useCloud();
  const { context: familyContext } = useFamily();
  const {
    configured: revenueCatConfigured,
    isPremium,
    isFamily,
  } = useSubscription();
  const hasFullAccess = !revenueCatConfigured || isPremium;
  const [busy, setBusy] = useState(false);
  const [showAllReciters, setShowAllReciters] = useState(false);
  const visibleReciters = showAllReciters
    ? reciterOptions
    : [
        ...reciterOptions.filter(
          (reciter) => reciter.id === profile.preferredReciter,
        ),
        ...reciterOptions.filter(
          (reciter) => reciter.id !== profile.preferredReciter,
        ),
      ].slice(0, 2);
  const accountLabel = session
    ? status === 'synced'
      ? 'Compte synchronisé'
      : 'Compte connecté'
    : configured
      ? 'Compte local · Synchronisation disponible'
      : 'Compte local · Offre gratuite';

  async function toggleNotifications(enabled: boolean) {
    setBusy(true);
    if (enabled) {
      const granted = await enableSmartReminders({
        time: profile.notificationTime,
        currentStreak,
        completedDates: history.map((record) => record.date),
      }).catch(() => false);
      updateProfile({ notificationsEnabled: granted });
      if (!granted) Alert.alert('Notifications non activées', 'La permission a été refusée sur cet appareil.');
    } else {
      await cancelSmartReminders();
      updateProfile({ notificationsEnabled: false });
    }
    setBusy(false);
  }

  async function changeTime(time: string) {
    updateProfile({ notificationTime: time });
    if (profile.notificationsEnabled) {
      await enableSmartReminders({
        time,
        currentStreak,
        completedDates: history.map((record) => record.date),
      }).catch(() => undefined);
    }
  }

  function confirmReset() {
    Alert.alert(
      'Recommencer l’onboarding ?',
      session
        ? 'La progression locale sera effacée et le compte sera déconnecté. La sauvegarde cloud restera disponible après reconnexion.'
        : 'La progression locale, le streak et les statistiques seront effacés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => void performReset(),
        },
      ],
    );
  }

  async function performReset() {
    setBusy(true);
    const result = session ? await resetLocalData() : (resetApp(), {});
    setBusy(false);
    if ('error' in result && result.error) {
      Alert.alert('Réinitialisation impossible', result.error);
      return;
    }
    router.replace('/onboarding');
  }

  return (
    <AppScreen>
      <ScreenTitle title="Réglages" subtitle="Adapte la routine à ton quotidien." />

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/account')}
        style={({ pressed }) => pressed && styles.accountPressed}
      >
        <Card style={styles.profileCard}>
          <View style={styles.avatar}>
            <UserRound color={colors.gold} size={26} />
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.profileName}>{profile.displayName}</Text>
            <Text style={styles.profileTier}>{accountLabel}</Text>
          </View>
          <ChevronRight color={colors.textFaint} size={20} />
        </Card>
      </Pressable>

      <SectionHeader title="Objectif quotidien" />
      <Card>
        <View style={styles.settingHeader}>
          <View style={styles.settingIcon}>
            <Target color={colors.gold} size={21} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>{profile.dailyGoalMinutes} minutes par jour</Text>
            <Text style={styles.settingText}>
              {profile.dailyGoalReviews} révisions · {profile.dailyGoalVerses} versets
            </Text>
          </View>
        </View>
        <View style={styles.pills}>
          {goalOptions.map((goal) => (
            <Pill
              key={goal.minutes}
              label={`${goal.minutes} min`}
              selected={profile.dailyGoalMinutes === goal.minutes}
              onPress={() => {
                if (!hasFullAccess && goal.reviews > 3) {
                  router.push('/subscription');
                  return;
                }
                updateProfile({
                  dailyGoalMinutes: goal.minutes,
                  dailyGoalReviews: goal.reviews,
                  dailyGoalVerses: goal.verses,
                });
              }}
            />
          ))}
        </View>
      </Card>

      <SectionHeader title="Rappels" />
      <Card>
        <View style={styles.switchRow}>
          <View style={styles.settingIcon}>
            <Bell color={colors.gold} size={21} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Notification quotidienne</Text>
            <Text style={styles.settingText}>
              Rappel rotatif et alerte streak à 22 h, sans collecte de données.
            </Text>
          </View>
          <Switch
            disabled={busy}
            onValueChange={toggleNotifications}
            thumbColor={profile.notificationsEnabled ? colors.gold : colors.textFaint}
            trackColor={{ false: colors.surfaceElevated, true: 'rgba(212,163,115,0.35)' }}
            value={profile.notificationsEnabled}
          />
        </View>
        {profile.notificationsEnabled ? (
          <View style={styles.timeBlock}>
            <View style={styles.timeLabel}>
              <Clock3 color={colors.textMuted} size={16} />
              <Text style={styles.timeLabelText}>Heure du rappel</Text>
            </View>
            <TimeStepper onChange={(time) => void changeTime(time)} value={profile.notificationTime} />
          </View>
        ) : null}
        <View style={styles.settingDivider} />
        <View style={styles.switchRow}>
          <View style={[styles.settingIcon, styles.freezeIcon]}>
            <ShieldCheck color={colors.success} size={21} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Protection automatique du streak</Text>
            <Text style={styles.settingText}>
              {freezeCount} disponible{freezeCount > 1 ? 's' : ''} · recharge mensuelle à{' '}
              {isPremium ? 3 : 1}.
            </Text>
          </View>
        </View>
      </Card>

      <SectionHeader title="Récitateur" />
      <Card>
        <View style={styles.settingHeader}>
          <View style={styles.settingIcon}>
            <Headphones color={colors.gold} size={21} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Voix préférée</Text>
            <Text style={styles.settingText}>Utilisée lorsque les audios en ligne sont disponibles.</Text>
          </View>
        </View>
        <View style={styles.reciters}>
          {visibleReciters.map((reciter) => (
            <View
              key={reciter.id}
              style={[
                styles.reciter,
                profile.preferredReciter === reciter.id && styles.reciterSelected,
              ]}
            >
              <Pressable
                accessibilityLabel={`${reciter.label}. ${reciter.style}${
                  !hasFullAccess && reciter.id !== 'mishary'
                    ? '. Réservé à Premium'
                    : ''
                }`}
                accessibilityRole="radio"
                accessibilityState={{
                  selected: profile.preferredReciter === reciter.id,
                }}
                onPress={() => {
                  if (!hasFullAccess && reciter.id !== 'mishary') {
                    router.push('/subscription');
                    return;
                  }
                  updateProfile({ preferredReciter: reciter.id });
                }}
                style={styles.reciterChoice}
              >
                <Text
                  style={[
                    styles.reciterText,
                    profile.preferredReciter === reciter.id &&
                      styles.reciterTextSelected,
                  ]}
                >
                  {reciter.label}
                  {!hasFullAccess && reciter.id !== 'mishary' ? ' · Premium' : ''}
                </Text>
                <Text style={styles.reciterMeta}>{reciter.style}</Text>
              </Pressable>
              {previewVerse && (hasFullAccess || reciter.id === 'mishary') ? (
                <VerseAudioButton
                  compact
                  label="Aperçu"
                  reciterId={reciter.id}
                  verse={previewVerse}
                />
              ) : (
                <Crown color={colors.textFaint} size={18} />
              )}
            </View>
          ))}
        </View>
        {reciterOptions.length > 2 ? (
          <PrimaryButton
            compact
            label={showAllReciters ? 'Réduire la liste' : 'Voir tous les récitants'}
            onPress={() => setShowAllReciters((value) => !value)}
            variant="ghost"
          />
        ) : null}
      </Card>

      <SectionHeader title="Thème" />
      <Card>
        <View style={styles.settingHeader}>
          <View style={styles.settingIcon}>
            <Sparkles color={colors.gold} size={21} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>Couleur de l'application</Text>
            <Text style={styles.settingText}>Change l'ambiance visuelle à tout moment.</Text>
          </View>
        </View>
        <View style={styles.pills}>
          {themeOptions.map((option) => (
            <Pill
              key={option.id}
              label={option.label}
              selected={profile.theme === option.id}
              onPress={() => updateProfile({ theme: option.id })}
            />
          ))}
        </View>
      </Card>

      <SectionHeader title="Famille" />
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/family' as never)}
        style={({ pressed }) => pressed && styles.accountPressed}
      >
        <Card gradient style={styles.familyCard}>
          <View style={styles.premiumIcon}>
            <Users color={colors.gold} size={24} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>
              {familyContext?.role === 'parent'
                ? `${familyContext.memberCount}/${familyContext.maxMembers} comptes`
                : familyContext?.role === 'child'
                  ? `Famille de ${familyContext.ownerDisplayName}`
                  : isFamily
                    ? 'Configurer mon espace familial'
                    : 'Premium Famille'}
            </Text>
            <Text style={styles.settingText}>
              {familyContext?.role === 'parent'
                ? `${familyContext.parentCount} parent${familyContext.parentCount > 1 ? 's' : ''} · ${familyContext.childCount} enfant${familyContext.childCount > 1 ? 's' : ''} suivi${familyContext.childCount > 1 ? 's' : ''}`
                : familyContext?.role === 'child'
                  ? 'Ton accès Premium est partagé par ta famille.'
                  : 'Jusqu’à 5 comptes avec des progressions séparées.'}
            </Text>
          </View>
          <ChevronRight color={colors.textFaint} size={20} />
        </Card>
      </Pressable>

      <SectionHeader title="Abonnement" />
      <Card gradient>
        <View style={styles.premiumRow}>
          <View style={styles.premiumIcon}>
            <Crown color={colors.gold} size={24} />
          </View>
          <View style={styles.settingCopy}>
            <Text style={styles.settingTitle}>
              {isFamily
                ? 'Premium Famille'
                : isPremium
                  ? 'Quran Daily Premium'
                  : 'Passer à Premium'}
            </Text>
            <Text style={styles.settingText}>
              {isPremium
                ? 'Ton accès complet est actif sur ce compte.'
                : '114 sourates, récitateurs et statistiques avancées.'}
            </Text>
          </View>
        </View>
        <PrimaryButton
          label={isPremium ? 'Gérer mon abonnement' : 'Découvrir les offres'}
          onPress={() => router.push('/subscription')}
          variant="surface"
        />
      </Card>

      <SectionHeader title="Données & confidentialité" />
      <View style={styles.infoRow}>
        <ShieldCheck color={colors.success} size={19} />
        <Text style={styles.infoText}>
          Les 114 sourates sont disponibles hors ligne. Les audios sont diffusés depuis Quran.com
          et téléchargés temporairement sur mobile avant lecture.
        </Text>
      </View>

      <Card style={styles.legalCard}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/privacy')}
          style={({ pressed }) => [styles.legalRow, pressed && styles.accountPressed]}
        >
          <FileText color={colors.gold} size={20} />
          <Text style={styles.legalText}>Politique de confidentialité</Text>
          <ChevronRight color={colors.textFaint} size={18} />
        </Pressable>
        <View style={styles.legalDivider} />
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/terms')}
          style={({ pressed }) => [styles.legalRow, pressed && styles.accountPressed]}
        >
          <Scale color={colors.gold} size={20} />
          <Text style={styles.legalText}>Conditions d’utilisation</Text>
          <ChevronRight color={colors.textFaint} size={18} />
        </Pressable>
      </Card>

      <PrimaryButton
        disabled={busy}
        icon={RotateCcw}
        label="Réinitialiser l’application"
        onPress={confirmReset}
        variant="danger"
      />
    </AppScreen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  profileCard: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: spacing.md,
  },
  accountPressed: {
    opacity: 0.76,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,163,115,0.12)',
    borderRadius: radius.pill,
    height: 52,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 52,
  },
  profileCopy: {
    flex: 1,
  },
  profileName: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 18,
  },
  profileTier: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    marginTop: 2,
  },
  settingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  settingIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,163,115,0.1)',
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 44,
  },
  settingCopy: {
    flex: 1,
  },
  settingTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 15,
  },
  settingText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  timeBlock: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
  },
  settingDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginVertical: spacing.lg,
  },
  freezeIcon: {
    backgroundColor: 'rgba(129,199,132,0.1)',
  },
  timeLabel: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  timeLabelText: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  reciters: {
    gap: spacing.sm,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  reciter: {
    alignItems: 'center',
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
  },
  reciterChoice: {
    flex: 1,
  },
  reciterSelected: {
    backgroundColor: 'rgba(212,163,115,0.1)',
    borderColor: colors.gold,
  },
  reciterText: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  reciterTextSelected: {
    color: colors.goldSoft,
  },
  reciterMeta: {
    color: colors.textFaint,
    fontFamily: typography.regular,
    fontSize: 11,
    marginTop: 2,
  },
  premiumRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  familyCard: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: spacing.md,
  },
  premiumIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,163,115,0.13)',
    borderRadius: radius.md,
    height: 48,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 48,
  },
  infoRow: {
    alignItems: 'center',
    backgroundColor: 'rgba(129,199,132,0.08)',
    borderColor: 'rgba(129,199,132,0.22)',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  infoText: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  legalCard: {
    marginBottom: spacing.lg,
    padding: 0,
  },
  legalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  legalText: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  legalDivider: {
    backgroundColor: colors.border,
    height: 1,
    marginHorizontal: spacing.md,
  },
  });
}
