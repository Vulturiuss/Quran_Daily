import { useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  Apple,
  AtSign,
  ChevronRight,
  Cloud,
  Mail,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { OrnamentalCard } from '@/components/OrnamentalCard';
import { Card, PrimaryButton, ProgressBar } from '@/components/ui';
import { useCloud } from '@/providers/CloudProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { colors, radius, spacing, typography } from '@/theme';

type BusyAction = 'google' | 'apple' | 'signin' | 'signup';

export default function OnboardingAccountScreen() {
  const finishAccountOnboarding = useQuranStore(
    (state) => state.finishAccountOnboarding,
  );
  const {
    configured,
    session,
    signIn,
    signInWithProvider,
    signUp,
    syncNow,
  } = useCloud();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<BusyAction>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!session) return;
    finishAccountOnboarding();
    void syncNow();
    router.replace('/(tabs)');
  }, [finishAccountOnboarding, session, syncNow]);

  function continueLocally() {
    Alert.alert(
      'Continuer sans compte ?',
      'Ta progression restera uniquement sur cet appareil. Si tu changes de téléphone, elle pourra être perdue. Tu pourras créer un compte plus tard dans les réglages.',
      [
        { text: 'Créer un compte', style: 'cancel' },
        {
          text: 'Continuer sans compte',
          onPress: () => {
            finishAccountOnboarding();
            router.replace('/(tabs)');
          },
        },
      ],
    );
  }

  async function social(provider: 'google' | 'apple') {
    setBusy(provider);
    setError(undefined);
    const result = await signInWithProvider(provider);
    setBusy(undefined);
    if (result.error) setError(result.error);
  }

  async function authenticate(mode: 'signin' | 'signup') {
    if (!email.trim() || password.length < 6) {
      setError('Saisis un e-mail valide et un mot de passe de 6 caractères minimum.');
      return;
    }

    setBusy(mode);
    setError(undefined);
    const result =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);
    setBusy(undefined);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.emailConfirmationRequired) {
      Alert.alert(
        'Confirme ton e-mail',
        'Le lien de confirmation a été envoyé. Ta progression locale est déjà sauvegardée et sera synchronisée après ta connexion.',
        [
          {
            text: 'Continuer',
            onPress: () => {
              finishAccountOnboarding();
              router.replace('/(tabs)');
            },
          },
        ],
      );
    }
  }

  return (
    <AppScreen contentStyle={styles.screen}>
      <View style={styles.topRow}>
        <Text style={styles.stepLabel}>6 / 6</Text>
      </View>
      <ProgressBar value={1} height={5} />

      <OrnamentalCard contentStyle={styles.accountHero} style={styles.accountHeroShell}>
        <View style={styles.icon}>
          <UserRound color={colors.gold} size={35} />
        </View>
        <Text style={styles.title}>Sauvegarde ta progression</Text>
        <Text style={styles.subtitle}>
          Retrouve ton parcours sur tes appareils et protège toutes tes sessions.
        </Text>

        <View style={styles.benefits}>
          <View style={styles.benefitRow}>
            <Cloud color={colors.success} size={20} />
            <Text style={styles.benefitText}>Synchronisation automatique et hors ligne</Text>
          </View>
          <View style={styles.benefitRow}>
            <ShieldCheck color={colors.success} size={20} />
            <Text style={styles.benefitText}>Données privées, accessibles uniquement par toi</Text>
          </View>
        </View>
      </OrnamentalCard>

      {configured ? (
        <>
          <View style={styles.socialButtons}>
            <Pressable
              accessibilityLabel="Continuer avec Google"
              accessibilityRole="button"
              accessibilityState={{ disabled: Boolean(busy) }}
              disabled={Boolean(busy)}
              onPress={() => void social('google')}
              style={({ pressed }) => [
                styles.socialButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.googleMark}>G</Text>
              <Text style={styles.socialText}>
                {busy === 'google' ? 'Connexion…' : 'Continuer avec Google'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Continuer avec Apple"
              accessibilityRole="button"
              accessibilityState={{ disabled: Boolean(busy) }}
              disabled={Boolean(busy)}
              onPress={() => void social('apple')}
              style={({ pressed }) => [
                styles.socialButton,
                pressed && styles.pressed,
              ]}
            >
              <Apple color={colors.backgroundDeep} fill={colors.backgroundDeep} size={20} />
              <Text style={styles.socialText}>
                {busy === 'apple' ? 'Connexion…' : 'Continuer avec Apple'}
              </Text>
            </Pressable>
          </View>

          <View style={styles.separator}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.separatorLine} />
          </View>

          {!showEmail ? (
            <PrimaryButton
              icon={Mail}
              label="Continuer avec e-mail"
              onPress={() => setShowEmail(true)}
              variant="surface"
            />
          ) : (
            <View style={styles.emailForm}>
              <View style={styles.inputRow}>
                <AtSign color={colors.textFaint} size={18} />
                <TextInput
                  autoCapitalize="none"
                  autoComplete="email"
                  inputMode="email"
                  onChangeText={setEmail}
                  placeholder="Adresse e-mail"
                  placeholderTextColor={colors.textFaint}
                  style={styles.input}
                  value={email}
                />
              </View>
              <TextInput
                autoCapitalize="none"
                autoComplete="password"
                onChangeText={setPassword}
                placeholder="Mot de passe, 6 caractères minimum"
                placeholderTextColor={colors.textFaint}
                secureTextEntry
                style={[styles.inputRow, styles.passwordInput]}
                value={password}
              />
              <PrimaryButton
                label="Créer mon compte"
                loading={busy === 'signup'}
                onPress={() => void authenticate('signup')}
              />
              <PrimaryButton
                label="J’ai déjà un compte"
                loading={busy === 'signin'}
                onPress={() => void authenticate('signin')}
                variant="ghost"
              />
            </View>
          )}
        </>
      ) : (
        <Card style={styles.localCard}>
          <Text style={styles.localTitle}>Synchronisation non configurée</Text>
          <Text style={styles.localText}>
            L’application reste disponible localement. Tu pourras connecter Supabase plus tard
            depuis les réglages.
          </Text>
        </Card>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        onPress={continueLocally}
        style={({ pressed }) => [styles.skip, pressed && styles.pressed]}
      >
        <Text style={styles.skipText}>Continuer sans compte</Text>
        <ChevronRight color={colors.gold} size={17} />
      </Pressable>
      <Text style={styles.localWarning}>
        Tes données seront stockées uniquement sur cet appareil.
      </Text>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    alignItems: 'stretch',
    paddingBottom: spacing.xl,
  },
  topRow: {
    alignItems: 'flex-end',
    minHeight: 42,
    justifyContent: 'center',
  },
  stepLabel: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 13,
    textAlign: 'right',
  },
  icon: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(212,163,115,0.12)',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 78,
    justifyContent: 'center',
    width: 78,
  },
  accountHero: {
    alignItems: 'center',
  },
  accountHeroShell: {
    marginTop: spacing.xl,
  },
  title: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 30,
    letterSpacing: -0.8,
    marginTop: spacing.lg,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  benefits: {
    alignSelf: 'stretch',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  benefitRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  benefitText: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 13,
  },
  socialButtons: {
    gap: spacing.sm,
  },
  socialButton: {
    alignItems: 'center',
    backgroundColor: colors.text,
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
    minHeight: 54,
    paddingHorizontal: spacing.lg,
  },
  socialText: {
    color: colors.backgroundDeep,
    fontFamily: typography.bold,
    fontSize: 15,
  },
  googleMark: {
    color: '#4285F4',
    fontFamily: typography.extraBold,
    fontSize: 20,
  },
  separator: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  separatorLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1,
  },
  separatorText: {
    color: colors.textFaint,
    fontFamily: typography.medium,
    fontSize: 12,
  },
  emailForm: {
    gap: spacing.sm,
  },
  inputRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  passwordInput: {
    color: colors.text,
    fontFamily: typography.medium,
    fontSize: 14,
  },
  localCard: {
    marginTop: spacing.md,
  },
  localTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 15,
  },
  localText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  error: {
    color: colors.error,
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  skip: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xl,
    padding: spacing.sm,
  },
  skipText: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  localWarning: {
    color: colors.textFaint,
    fontFamily: typography.regular,
    fontSize: 11,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});
