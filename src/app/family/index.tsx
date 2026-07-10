import { useState } from 'react';
import {
  Alert,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import {
  ArrowLeft,
  ChevronRight,
  Crown,
  Link2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { OrnamentalCard } from '@/components/OrnamentalCard';
import {
  Card,
  IconButton,
  PrimaryButton,
  ScreenTitle,
  SectionHeader,
} from '@/components/ui';
import { useCloud } from '@/providers/CloudProvider';
import { useFamily } from '@/providers/FamilyProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { colors, radius, spacing, typography } from '@/theme';
import { FamilyRole } from '@/types';
import { goBackOrReplace } from '@/utils/navigation';

export default function FamilyScreen() {
  const { session } = useCloud();
  const { isFamily } = useSubscription();
  const {
    loading,
    busy,
    context,
    members,
    error,
    refresh,
    createFamily,
    joinFamily,
    regenerateInviteCode,
    removeChild,
    leaveFamily,
    deleteFamily,
  } = useFamily();
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [joinRole, setJoinRole] = useState<FamilyRole>('child');
  const parents = members.filter((member) => member.role === 'parent');
  const children = members.filter((member) => member.role === 'child');
  const slotsRemaining = context
    ? Math.max(0, context.maxMembers - context.memberCount)
    : 0;

  async function handleCreate() {
    const result = await createFamily(familyName);
    if (!result.error) setFamilyName('');
  }

  async function handleJoin() {
    if (!inviteCode.trim()) {
      Alert.alert('Code requis', 'Saisis le code transmis par ta famille.');
      return;
    }
    const result = await joinFamily(inviteCode, joinRole);
    if (!result.error) setInviteCode('');
  }

  async function shareCode() {
    if (!context?.inviteCode) return;
    await Share.share({
      message: `Rejoins ma famille sur Quran Daily avec le code ${context.inviteCode}. Connecte-toi avec ton propre compte puis choisis Parent ou Enfant dans Réglages > Famille.`,
      title: 'Invitation Quran Daily Famille',
    });
  }

  function confirmRemoveChild(userId: string, name: string) {
    Alert.alert(
      `Retirer ${name} ?`,
      'Son compte et sa progression seront conservés, mais il perdra l’accès Premium Famille et le suivi parental.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: () => void removeChild(userId),
        },
      ],
    );
  }

  function confirmLeave() {
    Alert.alert(
      'Quitter la famille ?',
      'Ta progression restera intacte. Tu perdras uniquement l’accès Premium partagé.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: () => void leaveFamily(),
        },
      ],
    );
  }

  function confirmDelete() {
    Alert.alert(
      'Supprimer l’espace familial ?',
      'Les comptes et les progressions seront conservés. Tous les enfants seront détachés de la famille.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => void deleteFamily(),
        },
      ],
    );
  }

  return (
    <AppScreen>
      <ScreenTitle
        action={
          <IconButton
            icon={ArrowLeft}
            label="Retour"
            onPress={() => goBackOrReplace('/settings')}
          />
        }
        subtitle="Un abonnement, plusieurs parcours indépendants."
        title="Famille"
      />

      {!session ? (
        <Card style={styles.centerCard}>
          <Users color={colors.gold} size={38} />
          <Text style={styles.centerTitle}>Un compte est nécessaire</Text>
          <Text style={styles.centerText}>
            Chaque parent et chaque enfant utilise son propre compte pour préserver sa progression.
          </Text>
          <PrimaryButton
            label="Se connecter"
            onPress={() => router.push('/account')}
          />
        </Card>
      ) : loading ? (
        <Card style={styles.centerCard}>
          <RefreshCw color={colors.gold} size={32} />
          <Text style={styles.centerText}>Chargement de ta famille…</Text>
        </Card>
      ) : context?.role === 'parent' ? (
        <>
          <OrnamentalCard contentStyle={styles.familyHero}>
            <View style={styles.familyIcon}>
              <Users color={colors.gold} size={29} />
            </View>
            <View style={styles.familyCopy}>
              <Text style={styles.familyEyebrow}>Espace parent</Text>
              <Text style={styles.familyTitle}>{context.familyName}</Text>
              <Text style={styles.familyText}>
                {context.memberCount}/{context.maxMembers} comptes utilisés · {context.parentCount} parent{context.parentCount > 1 ? 's' : ''} · {context.childCount} enfant{context.childCount > 1 ? 's' : ''}
              </Text>
              <Text style={styles.familyText}>
                {slotsRemaining} place{slotsRemaining > 1 ? 's' : ''} restante{slotsRemaining > 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.activeBadge}>
              <ShieldCheck
                color={context.active ? colors.success : colors.warning}
                size={17}
              />
              <Text
                style={[
                  styles.activeText,
                  !context.active && styles.inactiveText,
                ]}
              >
                {context.active ? 'Actif' : 'Inactif'}
              </Text>
            </View>
          </OrnamentalCard>

          {!context.active ? (
            <Card style={styles.warningCard}>
              <Crown color={colors.warning} size={22} />
              <Text style={styles.warningText}>
                L’abonnement Famille du parent doit être actif dans Supabase pour partager l’accès.
              </Text>
            </Card>
          ) : null}

          <SectionHeader title="Inviter un compte" />
          <Card>
            <View style={styles.inviteHeader}>
              <View style={styles.settingIcon}>
                <Link2 color={colors.gold} size={21} />
              </View>
              <View style={styles.familyCopy}>
                <Text style={styles.settingTitle}>Code familial</Text>
                <Text style={styles.settingText}>
                  Le membre invité choisira Parent ou Enfant depuis son propre compte.
                </Text>
              </View>
            </View>
            <Text selectable style={styles.inviteCode}>
              {context.inviteCode ?? '—'}
            </Text>
            <View style={styles.inlineActions}>
              <PrimaryButton
                compact
                icon={UserPlus}
                label="Partager"
                onPress={() => void shareCode()}
                style={styles.inlineButton}
              />
              <PrimaryButton
                compact
                icon={RefreshCw}
                label="Nouveau code"
                loading={busy}
                onPress={() => void regenerateInviteCode()}
                style={styles.inlineButton}
                variant="ghost"
              />
            </View>
          </Card>

          {parents.length ? (
            <>
              <SectionHeader title="Comptes parents" />
              <Card style={styles.parentsCard}>
                {parents.map((parent, index) => (
                  <View
                    key={parent.userId}
                    style={[
                      styles.parentRow,
                      index < parents.length - 1 && styles.parentDivider,
                    ]}
                  >
                    <View style={styles.childAvatar}>
                      <UserRound color={colors.gold} size={21} />
                    </View>
                    <View style={styles.familyCopy}>
                      <Text style={styles.childName}>{parent.displayName}</Text>
                      <Text style={styles.childMeta}>
                        {parent.isOwner ? 'Propriétaire de l’abonnement' : 'Co-parent'}
                      </Text>
                    </View>
                    <ShieldCheck
                      color={parent.isOwner ? colors.gold : colors.success}
                      size={18}
                    />
                  </View>
                ))}
              </Card>
            </>
          ) : null}

          <SectionHeader
            action={
              <Pressable
                accessibilityLabel="Actualiser les progressions"
                accessibilityRole="button"
                onPress={() => void refresh()}
                style={styles.refresh}
              >
                <RefreshCw color={colors.gold} size={16} />
                <Text style={styles.refreshText}>Actualiser</Text>
              </Pressable>
            }
            title="Progression des enfants"
          />

          {children.length ? (
            <View style={styles.children}>
              {children.map((child) => (
                <Card key={child.userId} style={styles.childCard}>
                  <Pressable
                    accessibilityLabel={`Voir la progression de ${child.displayName}`}
                    accessibilityRole="button"
                    onPress={() =>
                      router.push(`/family/${child.userId}` as never)
                    }
                    style={({ pressed }) => [
                      styles.childMain,
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.childAvatar}>
                      <UserRound color={colors.gold} size={22} />
                    </View>
                    <View style={styles.familyCopy}>
                      <Text style={styles.childName}>{child.displayName}</Text>
                      <Text style={styles.childMeta}>
                        {child.currentStreak} j de streak · {child.knownSurahs} sourates · {child.totalXP} XP
                      </Text>
                      <Text
                        style={[
                          styles.todayMeta,
                          child.todayCompleted && styles.todayMetaDone,
                        ]}
                      >
                        {child.todayCompleted
                          ? `Aujourd’hui fait · ${child.todayReviews} révision${child.todayReviews > 1 ? 's' : ''} · ${child.todayVersesLearned} verset${child.todayVersesLearned > 1 ? 's' : ''} · +${child.todayXPEarned} XP`
                          : 'Aujourd’hui à faire'}
                      </Text>
                    </View>
                    <ChevronRight color={colors.textFaint} size={19} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel={`Retirer ${child.displayName} de la famille`}
                    accessibilityRole="button"
                    onPress={() =>
                      confirmRemoveChild(child.userId, child.displayName)
                    }
                    style={styles.removeButton}
                  >
                    <Trash2 color={colors.error} size={17} />
                  </Pressable>
                </Card>
              ))}
            </View>
          ) : (
            <Card style={styles.centerCard}>
              <UserPlus color={colors.gold} size={34} />
              <Text style={styles.centerTitle}>Aucun enfant ajouté</Text>
              <Text style={styles.centerText}>
                Partage le code ci-dessus. Chaque enfant apparaîtra ici avec sa progression synchronisée.
              </Text>
            </Card>
          )}

          <SectionHeader title="Gestion" />
          <PrimaryButton
            disabled={busy}
            icon={Trash2}
            label="Supprimer l’espace familial"
            onPress={confirmDelete}
            variant="danger"
          />
        </>
      ) : context?.role === 'child' ? (
        <>
          <OrnamentalCard contentStyle={styles.childHero}>
            <View style={styles.familyIcon}>
              <ShieldCheck color={colors.success} size={29} />
            </View>
            <Text style={styles.familyEyebrow}>Premium Famille</Text>
            <Text style={styles.childHeroTitle}>{context.familyName}</Text>
            <Text style={styles.centerText}>
              L’espace est géré par {context.ownerDisplayName}. Ta progression reste personnelle et les parents voient uniquement tes indicateurs d’apprentissage.
            </Text>
          </OrnamentalCard>
          <Card style={styles.privacyCard}>
            <ShieldCheck color={colors.success} size={20} />
            <Text style={styles.privacyText}>
              Ton mot de passe, tes données de connexion et tes réglages privés ne sont jamais partagés.
            </Text>
          </Card>
          <PrimaryButton
            disabled={busy}
            label="Quitter cette famille"
            onPress={confirmLeave}
            variant="danger"
          />
        </>
      ) : (
        <>
          {isFamily ? (
            <>
              <SectionHeader title="Créer mon espace parent" />
              <Card>
                <View style={styles.inviteHeader}>
                  <View style={styles.settingIcon}>
                    <Users color={colors.gold} size={21} />
                  </View>
                  <View style={styles.familyCopy}>
                    <Text style={styles.settingTitle}>Jusqu’à 5 comptes</Text>
                    <Text style={styles.settingText}>
                      Invite un autre parent ou des enfants, chacun avec sa progression.
                    </Text>
                  </View>
                </View>
                <TextInput
                  onChangeText={setFamilyName}
                  placeholder="Nom de la famille, facultatif"
                  placeholderTextColor={colors.textFaint}
                  style={styles.input}
                  value={familyName}
                />
                <PrimaryButton
                  icon={Users}
                  label="Créer mon espace familial"
                  loading={busy}
                  onPress={() => void handleCreate()}
                />
              </Card>
            </>
          ) : (
            <Card gradient style={styles.upgradeCard}>
              <Crown color={colors.gold} size={34} />
              <Text style={styles.centerTitle}>Premium Famille</Text>
              <Text style={styles.centerText}>
                Partage Premium avec jusqu’à 5 comptes et suis le quotidien des enfants.
              </Text>
              <PrimaryButton
                label="Découvrir l’offre Famille"
                onPress={() => router.push('/subscription')}
              />
            </Card>
          )}

          <SectionHeader title="Rejoindre une famille" />
          <Card>
            <View style={styles.inviteHeader}>
              <View style={styles.settingIcon}>
                <UserPlus color={colors.gold} size={21} />
              </View>
              <View style={styles.familyCopy}>
                <Text style={styles.settingTitle}>J’ai reçu un code</Text>
                <Text style={styles.settingText}>
                  Utilise ton compte personnel et choisis ton rôle dans la famille.
                </Text>
              </View>
            </View>
            <View style={styles.rolePicker}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: joinRole === 'child' }}
                onPress={() => setJoinRole('child')}
                style={[
                  styles.roleOption,
                  joinRole === 'child' && styles.roleOptionSelected,
                ]}
              >
                <UserRound
                  color={joinRole === 'child' ? colors.gold : colors.textMuted}
                  size={19}
                />
                <View style={styles.familyCopy}>
                  <Text style={styles.roleTitle}>Enfant</Text>
                  <Text style={styles.roleText}>Ma progression est suivie</Text>
                </View>
              </Pressable>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: joinRole === 'parent' }}
                onPress={() => setJoinRole('parent')}
                style={[
                  styles.roleOption,
                  joinRole === 'parent' && styles.roleOptionSelected,
                ]}
              >
                <ShieldCheck
                  color={joinRole === 'parent' ? colors.gold : colors.textMuted}
                  size={19}
                />
                <View style={styles.familyCopy}>
                  <Text style={styles.roleTitle}>Parent</Text>
                  <Text style={styles.roleText}>Je peux suivre les enfants</Text>
                </View>
              </Pressable>
            </View>
            <TextInput
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={10}
              onChangeText={setInviteCode}
              placeholder="CODE FAMILIAL"
              placeholderTextColor={colors.textFaint}
              style={[styles.input, styles.codeInput]}
              value={inviteCode}
            />
            <PrimaryButton
              icon={UserPlus}
              label="Rejoindre la famille"
              loading={busy}
              onPress={() => void handleJoin()}
              variant="surface"
            />
          </Card>
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  centerCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  centerTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 20,
    textAlign: 'center',
  },
  centerText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 360,
    textAlign: 'center',
  },
  familyHero: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  familyIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,163,115,0.12)',
    borderRadius: radius.pill,
    height: 58,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 58,
  },
  familyCopy: {
    flex: 1,
  },
  familyEyebrow: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  familyTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 22,
    marginTop: 2,
  },
  familyText: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 12,
    marginTop: 2,
  },
  activeBadge: {
    alignItems: 'center',
    backgroundColor: 'rgba(129,199,132,0.1)',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  activeText: {
    color: colors.success,
    fontFamily: typography.bold,
    fontSize: 10,
  },
  inactiveText: {
    color: colors.warning,
  },
  warningCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  warningText: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  inviteHeader: {
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
  inviteCode: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.goldSoft,
    fontFamily: typography.extraBold,
    fontSize: 24,
    letterSpacing: 4,
    marginVertical: spacing.lg,
    padding: spacing.md,
    textAlign: 'center',
  },
  parentsCard: {
    paddingVertical: spacing.sm,
  },
  parentRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 62,
    paddingVertical: spacing.sm,
  },
  parentDivider: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inlineButton: {
    flex: 1,
  },
  refresh: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  refreshText: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  children: {
    gap: spacing.sm,
  },
  childCard: {
    alignItems: 'center',
    flexDirection: 'row',
    padding: spacing.sm,
  },
  childMain: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    padding: spacing.xs,
  },
  childAvatar: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,163,115,0.1)',
    borderRadius: radius.pill,
    height: 46,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 46,
  },
  childName: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 15,
  },
  childMeta: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
    marginTop: 3,
  },
  todayMeta: {
    color: colors.warning,
    fontFamily: typography.bold,
    fontSize: 11,
    marginTop: 4,
  },
  todayMetaDone: {
    color: colors.success,
  },
  removeButton: {
    alignItems: 'center',
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  pressed: {
    opacity: 0.72,
  },
  childHero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  childHeroTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 24,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  privacyCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  privacyText: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
  },
  upgradeCard: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  rolePicker: {
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  roleOption: {
    alignItems: 'center',
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 62,
    padding: spacing.md,
  },
  roleOptionSelected: {
    backgroundColor: 'rgba(212,163,115,0.11)',
    borderColor: colors.gold,
  },
  roleTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 14,
  },
  roleText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 11,
    marginTop: 2,
  },
  input: {
    backgroundColor: colors.backgroundDeep,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: typography.medium,
    fontSize: 15,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    minHeight: 54,
    paddingHorizontal: spacing.md,
  },
  codeInput: {
    fontFamily: typography.extraBold,
    letterSpacing: 2,
    textAlign: 'center',
  },
  error: {
    color: colors.error,
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing.md,
    textAlign: 'center',
  },
});
