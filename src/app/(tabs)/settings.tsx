import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  Clock3,
  Crown,
  Headphones,
  RotateCcw,
  ShieldCheck,
  Target,
  UserRound,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { Card, Pill, PrimaryButton, ScreenTitle, SectionHeader } from '@/components/ui';
import { useCloud } from '@/providers/CloudProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { cancelDailyReminder, configureDailyReminder } from '@/services/notifications';
import { reciters } from '@/services/quranApi';
import { useQuranStore } from '@/store/useQuranStore';
import { colors, radius, spacing, typography } from '@/theme';

const goalOptions = [
  { minutes: 3 as const, reviews: 1, verses: 1 },
  { minutes: 5 as const, reviews: 2, verses: 2 },
  { minutes: 10 as const, reviews: 3, verses: 4 },
  { minutes: 15 as const, reviews: 5, verses: 5 },
];
const reminderTimes = ['07:00', '12:30', '20:00', '22:00'];
const reciterOptions = Object.entries(reciters).map(([id, reciter]) => ({
  id,
  label: reciter.name,
}));

export default function SettingsScreen() {
  const profile = useQuranStore((state) => state.profile);
  const updateProfile = useQuranStore((state) => state.updateProfile);
  const resetApp = useQuranStore((state) => state.resetApp);
  const { configured, session, status } = useCloud();
  const {
    configured: revenueCatConfigured,
    isPremium,
    isFamily,
    loading: subscriptionLoading,
  } = useSubscription();
  const hasFullAccess =
    !revenueCatConfigured || subscriptionLoading || isPremium;
  const [busy, setBusy] = useState(false);
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
      const granted = await configureDailyReminder(profile.notificationTime).catch(() => false);
      updateProfile({ notificationsEnabled: granted });
      if (!granted) Alert.alert('Notifications non activées', 'La permission a été refusée sur cet appareil.');
    } else {
      await cancelDailyReminder();
      updateProfile({ notificationsEnabled: false });
    }
    setBusy(false);
  }

  async function changeTime(time: string) {
    updateProfile({ notificationTime: time });
    if (profile.notificationsEnabled) {
      await configureDailyReminder(time).catch(() => undefined);
    }
  }

  function confirmReset() {
    Alert.alert(
      'Recommencer l’onboarding ?',
      'La progression locale, le streak et les statistiques seront effacés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => {
            resetApp();
            router.replace('/onboarding');
          },
        },
      ],
    );
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
            <Text style={styles.settingText}>Un rappel local, sans collecte de données.</Text>
          </View>
          <Switch
            disabled={busy}
            onValueChange={toggleNotifications}
            thumbColor={profile.notificationsEnabled ? colors.gold : colors.textFaint}
            trackColor={{ false: colors.surfaceElevated, true: 'rgba(212,175,55,0.35)' }}
            value={profile.notificationsEnabled}
          />
        </View>
        {profile.notificationsEnabled ? (
          <View style={styles.timeBlock}>
            <View style={styles.timeLabel}>
              <Clock3 color={colors.textMuted} size={16} />
              <Text style={styles.timeLabelText}>Heure du rappel</Text>
            </View>
            <View style={styles.pills}>
              {reminderTimes.map((time) => (
                <Pill
                  key={time}
                  label={time}
                  onPress={() => changeTime(time)}
                  selected={profile.notificationTime === time}
                />
              ))}
            </View>
          </View>
        ) : null}
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
          {reciterOptions.map((reciter) => (
            <Pressable
              key={reciter.id}
              onPress={() => {
                if (!hasFullAccess && reciter.id !== 'mishary') {
                  router.push('/subscription');
                  return;
                }
                updateProfile({ preferredReciter: reciter.id });
              }}
              style={[
                styles.reciter,
                profile.preferredReciter === reciter.id && styles.reciterSelected,
              ]}
            >
              <Text
                style={[
                  styles.reciterText,
                  profile.preferredReciter === reciter.id && styles.reciterTextSelected,
                ]}
              >
                {reciter.label}
                {!hasFullAccess && reciter.id !== 'mishary' ? ' · Premium' : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

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

      <PrimaryButton
        icon={RotateCcw}
        label="Réinitialiser l’application"
        onPress={confirmReset}
        variant="danger"
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(212,175,55,0.12)',
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
    backgroundColor: 'rgba(212,175,55,0.1)',
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
    marginTop: spacing.lg,
  },
  reciter: {
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  reciterSelected: {
    backgroundColor: 'rgba(212,175,55,0.1)',
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
  premiumRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  premiumIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.13)',
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
});
