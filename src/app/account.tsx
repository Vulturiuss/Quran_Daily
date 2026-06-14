import { useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle2,
  Cloud,
  CloudOff,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import {
  Card,
  IconButton,
  PrimaryButton,
  ScreenTitle,
  SectionHeader,
} from '@/components/ui';
import { useCloud } from '@/providers/CloudProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { colors, radius, spacing, typography } from '@/theme';

const statusLabels = {
  disabled: 'Mode local',
  local: 'En attente',
  offline: 'Hors ligne',
  syncing: 'Synchronisation...',
  synced: 'Synchronisé',
  error: 'Erreur de synchronisation',
} as const;

export default function AccountScreen() {
  const {
    configured,
    initializing,
    session,
    status,
    lastError,
    online,
    signIn,
    signUp,
    signOut,
    syncNow,
  } = useCloud();
  const syncMeta = useQuranStore((state) => state.syncMeta);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'signin' | 'signup' | 'signout'>();
  const [formError, setFormError] = useState<string>();

  async function authenticate(mode: 'signin' | 'signup') {
    if (!email.trim() || password.length < 6) {
      setFormError('Saisis un e-mail valide et un mot de passe de 6 caractères minimum.');
      return;
    }

    setBusy(mode);
    setFormError(undefined);
    const result =
      mode === 'signin'
        ? await signIn(email, password)
        : await signUp(email, password);
    setBusy(undefined);

    if (result.error) {
      setFormError(result.error);
      return;
    }
    if (result.emailConfirmationRequired) {
      Alert.alert(
        'Confirme ton e-mail',
        'Un lien de confirmation vient de t’être envoyé. Tes données locales restent disponibles.',
      );
    }
  }

  async function disconnect() {
    setBusy('signout');
    const result = await signOut();
    setBusy(undefined);
    if (result.error) setFormError(result.error);
  }

  const lastSync = syncMeta.lastSyncedAt
    ? new Date(syncMeta.lastSyncedAt).toLocaleString('fr-FR')
    : 'Jamais';

  return (
    <AppScreen>
      <ScreenTitle
        title="Compte"
        subtitle="Sauvegarde et retrouve ta progression sur plusieurs appareils."
        action={
          <IconButton
            icon={ArrowLeft}
            label="Retour"
            onPress={() => router.back()}
          />
        }
      />

      {!configured ? (
        <>
          <Card>
            <View style={styles.iconRow}>
              <View style={styles.iconBox}>
                <CloudOff color={colors.gold} size={24} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.title}>Supabase non configuré</Text>
                <Text style={styles.text}>
                  L’application continue de fonctionner entièrement en local et hors ligne.
                </Text>
              </View>
            </View>
          </Card>

          <SectionHeader title="Configuration" />
          <Card>
            <Text style={styles.step}>1. Exécute `supabase/schema.sql` dans le SQL Editor.</Text>
            <Text style={styles.step}>2. Copie `.env.example` vers `.env`.</Text>
            <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL=...</Text>
            <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...</Text>
            <Text style={styles.step}>3. Redémarre Expo avec le cache vidé.</Text>
            <Text style={styles.code}>npx expo start --clear</Text>
          </Card>
        </>
      ) : session ? (
        <>
          <Card>
            <View style={styles.iconRow}>
              <View style={styles.iconBox}>
                {online ? (
                  <Cloud color={colors.gold} size={24} />
                ) : (
                  <CloudOff color={colors.warning} size={24} />
                )}
              </View>
              <View style={styles.copy}>
                <Text style={styles.title}>{session.user.email}</Text>
                <Text style={styles.text}>Compte Supabase connecté</Text>
              </View>
            </View>

            <View style={styles.statusBox}>
              <CheckCircle2
                color={status === 'error' ? colors.error : colors.success}
                size={18}
              />
              <View style={styles.copy}>
                <Text style={styles.status}>{statusLabels[status]}</Text>
                <Text style={styles.meta}>
                  Dernière synchronisation : {lastSync}
                  {syncMeta.dirty ? ' · Changements locaux en attente' : ''}
                </Text>
              </View>
            </View>

            {lastError ? <Text style={styles.error}>{lastError}</Text> : null}
          </Card>

          <View style={styles.actions}>
            <PrimaryButton
              icon={RefreshCw}
              label="Synchroniser maintenant"
              loading={status === 'syncing'}
              disabled={!online}
              onPress={() => void syncNow()}
            />
            <PrimaryButton
              icon={LogOut}
              label="Se déconnecter"
              loading={busy === 'signout'}
              onPress={() => void disconnect()}
              variant="ghost"
            />
          </View>

          <View style={styles.privacy}>
            <ShieldCheck color={colors.success} size={19} />
            <Text style={styles.privacyText}>
              La déconnexion ne supprime pas les sourates ni la progression stockées sur cet
              appareil.
            </Text>
          </View>
        </>
      ) : (
        <>
          <Card>
            <View style={styles.iconRow}>
              <View style={styles.iconBox}>
                <Cloud color={colors.gold} size={24} />
              </View>
              <View style={styles.copy}>
                <Text style={styles.title}>Synchronisation facultative</Text>
                <Text style={styles.text}>
                  Connecte-toi pour sauvegarder la progression. Sans compte, tout reste local.
                </Text>
              </View>
            </View>
          </Card>

          <SectionHeader title="Connexion" />
          <View style={styles.form}>
            <Text style={styles.label}>Adresse e-mail</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              inputMode="email"
              onChangeText={setEmail}
              placeholder="toi@exemple.fr"
              placeholderTextColor={colors.textFaint}
              style={styles.input}
              value={email}
            />
            <Text style={styles.label}>Mot de passe</Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="password"
              onChangeText={setPassword}
              placeholder="6 caractères minimum"
              placeholderTextColor={colors.textFaint}
              secureTextEntry
              style={styles.input}
              value={password}
            />
            {formError ? <Text style={styles.error}>{formError}</Text> : null}
            <PrimaryButton
              label="Se connecter"
              loading={busy === 'signin' || initializing}
              onPress={() => void authenticate('signin')}
            />
            <PrimaryButton
              label="Créer un compte"
              loading={busy === 'signup'}
              onPress={() => void authenticate('signup')}
              variant="surface"
            />
          </View>
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  iconRow: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  iconBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderRadius: radius.md,
    height: 50,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 50,
  },
  copy: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 16,
  },
  text: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  step: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  code: {
    backgroundColor: colors.backgroundDeep,
    borderRadius: radius.sm,
    color: colors.goldSoft,
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
  statusBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(129,199,132,0.08)',
    borderRadius: radius.md,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  status: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  meta: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 2,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  privacy: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.md,
  },
  privacyText: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  form: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: typography.medium,
    fontSize: 15,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  error: {
    color: colors.error,
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
    marginVertical: spacing.xs,
  },
});
