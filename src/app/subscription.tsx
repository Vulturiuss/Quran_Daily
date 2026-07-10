import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Check,
  Crown,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react-native';
import { PACKAGE_TYPE, PurchasesPackage } from 'react-native-purchases';

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
import { getSurah } from '@/data/surahs';
import { useSubscription } from '@/providers/SubscriptionProvider';
import {
  FAMILY_ENTITLEMENT_ID,
  FREE_SURAH_COUNT,
  FREE_SURAH_LABEL,
  isFamilyPlanEnabled,
  PREMIUM_ENTITLEMENT_ID,
} from '@/services/subscription';
import { colors, radius, spacing, typography } from '@/theme';
import { goBackOrReplace } from '@/utils/navigation';
import { getPackageFreeTrialLabel } from '@/utils/paywall';

const premiumBenefits = [
  'Les 114 sourates et leur apprentissage guidé',
  'Tous les récitateurs disponibles',
  'Révisions quotidiennes illimitées',
  'Statistiques détaillées et tous les badges',
  'Aucune publicité pendant ton parcours',
];

const familyBenefits = [
  'Premium partagé sur 5 comptes',
  'Un ou plusieurs comptes parents',
  'Suivi quotidien des enfants',
  'Progressions séparées pour chaque membre',
  'Les 114 sourates et récitateurs Premium',
];

function packageLabel(aPackage: PurchasesPackage) {
  const identifier = `${aPackage.identifier} ${aPackage.product.identifier}`.toLowerCase();
  const family = identifier.includes('family') || identifier.includes('famille');
  if (family && aPackage.packageType === PACKAGE_TYPE.ANNUAL) return 'Famille annuel';
  if (family && aPackage.packageType === PACKAGE_TYPE.MONTHLY) return 'Famille mensuel';
  if (family) return 'Famille';
  if (aPackage.packageType === PACKAGE_TYPE.ANNUAL) return 'Annuel';
  if (aPackage.packageType === PACKAGE_TYPE.MONTHLY) return 'Mensuel';
  if (aPackage.packageType === PACKAGE_TYPE.LIFETIME) return 'À vie';
  return aPackage.product.title || aPackage.identifier;
}

function isFamilyPackage(aPackage: PurchasesPackage) {
  return `${aPackage.identifier} ${aPackage.product.identifier}`
    .toLowerCase()
    .match(/family|famille/);
}

function packageDescription(aPackage: PurchasesPackage) {
  const label = packageLabel(aPackage);
  if (label.startsWith('Famille')) {
    return '5 comptes, parents et enfants, avec suivi quotidien';
  }
  if (aPackage.packageType === PACKAGE_TYPE.ANNUAL) {
    return aPackage.product.pricePerMonthString
      ? `Soit environ ${aPackage.product.pricePerMonthString} par mois`
      : 'Le meilleur tarif sur l’année';
  }
  if (aPackage.packageType === PACKAGE_TYPE.MONTHLY) {
    return 'Flexible, renouvelé chaque mois';
  }
  return aPackage.product.description || 'Accès Premium';
}

export default function SubscriptionScreen() {
  const params = useLocalSearchParams<{ surah?: string }>();
  const requestedSurah = getSurah(Number(params.surah));
  const { session } = useCloud();
  const {
    billingConfigured: configured,
    loading,
    isPremium,
    isFamily,
    offering,
    customerInfo,
    error,
    purchase,
    restore,
    refresh,
  } = useSubscription();
  const [selected, setSelected] = useState<PurchasesPackage>();

  const packages = (offering?.availablePackages ?? []).filter(
    (aPackage) => isFamilyPlanEnabled || !isFamilyPackage(aPackage),
  );
  const selectedTrialLabel = getPackageFreeTrialLabel(selected);
  const selectedIsFamily = selected ? Boolean(isFamilyPackage(selected)) : false;
  const activeBenefits = isFamily ? familyBenefits : premiumBenefits;
  const displayedBenefits = selectedIsFamily ? familyBenefits : premiumBenefits;
  const activeEntitlement =
    customerInfo?.entitlements.active[FAMILY_ENTITLEMENT_ID] ??
    customerInfo?.entitlements.active[PREMIUM_ENTITLEMENT_ID];

  useEffect(() => {
    if (!packages.length || selected) return;
    setSelected(
      offering?.annual ??
        offering?.monthly ??
        packages[0],
    );
  }, [offering, packages, selected]);

  const subscriptionStatus = useMemo(() => {
    if (!activeEntitlement) return undefined;
    if (!activeEntitlement.expirationDate) return 'Accès permanent';
    const expiration = new Date(activeEntitlement.expirationDate).toLocaleDateString('fr-FR');
    return activeEntitlement.willRenew
      ? `Renouvellement prévu le ${expiration}`
      : `Accès jusqu’au ${expiration}`;
  }, [activeEntitlement]);

  async function buy() {
    if (!session) {
      router.push('/account');
      return;
    }
    if (!selected) return;

    const buyingFamily = Boolean(isFamilyPackage(selected));
    const result = await purchase(selected);
    if (result.success) {
      Alert.alert(
        buyingFamily ? 'Premium Famille activé' : 'Premium activé',
        buyingFamily
          ? 'Tu peux maintenant créer ton espace familial et inviter tes proches.'
          : 'Toutes les fonctionnalités sont maintenant disponibles.',
      );
      return;
    }
    if (result.error) Alert.alert('Achat impossible', result.error);
  }

  async function restorePurchase() {
    if (!session) {
      router.push('/account');
      return;
    }
    const result = await restore();
    Alert.alert(
      result.success ? 'Achats restaurés' : 'Restauration terminée',
      result.success
        ? 'Ton abonnement Premium est de nouveau actif.'
        : result.error ?? 'Aucun abonnement actif n’a été retrouvé.',
    );
  }

  return (
    <AppScreen>
      <ScreenTitle
        title="Premium & Famille"
        subtitle={
          requestedSurah
            ? `Débloque ${requestedSurah.nameTranslit} et poursuis ton parcours.`
            : 'Un parcours complet seul, ou partagé avec ta famille.'
        }
        action={
          <IconButton
            icon={ArrowLeft}
            label="Retour"
            onPress={() => goBackOrReplace('/(tabs)')}
          />
        }
      />

      {isPremium ? (
        <>
          <OrnamentalCard contentStyle={styles.activeCard}>
            <View style={styles.crown}>
              {isFamily ? (
                <Users color={colors.gold} size={32} />
              ) : (
                <Crown color={colors.gold} size={32} />
              )}
            </View>
            <Text style={styles.activeTitle}>
              {isFamily ? 'Premium Famille actif' : 'Premium actif'}
            </Text>
            <Text style={styles.activeText}>
              {subscriptionStatus ?? 'Ton accès complet est actif.'}
            </Text>
          </OrnamentalCard>

          <View style={styles.activeBenefits}>
            {activeBenefits.map((benefit) => (
              <View key={benefit} style={styles.benefit}>
                <View style={styles.check}>
                  <Check color={colors.backgroundDeep} size={14} strokeWidth={3} />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {customerInfo?.managementURL ? (
            <PrimaryButton
              icon={ExternalLink}
              label="Gérer mon abonnement"
              onPress={() => void Linking.openURL(customerInfo.managementURL!)}
              variant="surface"
            />
          ) : null}
        </>
      ) : (
        <>
          <OrnamentalCard contentStyle={styles.hero}>
            <View style={styles.heroIcon}>
              <Sparkles color={colors.gold} size={31} />
            </View>
            <Text style={styles.heroTitle}>
              {selectedIsFamily ? 'Une famille, plusieurs parcours' : 'Tout le Coran, à ton rythme'}
            </Text>
            <Text style={styles.heroText}>
              {requestedSurah
                ? `${requestedSurah.nameTranslit} fait partie des 114 sourates accessibles avec Premium.`
                : `Tu gardes ${FREE_SURAH_COUNT} sourates gratuites (${FREE_SURAH_LABEL}). Premium débloque le parcours complet quand tu veux aller plus loin.`}
            </Text>
          </OrnamentalCard>

          <View style={styles.benefits}>
            {displayedBenefits.map((benefit) => (
              <View key={benefit} style={styles.benefit}>
                <View style={styles.check}>
                  <Check color={colors.backgroundDeep} size={14} strokeWidth={3} />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>

          {!configured ? (
            <>
              <SectionHeader title="Configuration requise" />
              <Card>
                <Text style={styles.infoTitle}>RevenueCat n’est pas encore configuré</Text>
                <Text style={styles.infoText}>
                  L’application reste entièrement accessible pendant le développement. Ajoute une
                  clé Test Store ou les clés Apple/Google dans `.env`.
                </Text>
              </Card>
            </>
          ) : Platform.OS === 'web' ? (
            <>
              <SectionHeader title="Achats mobiles" />
              <Card>
                <Text style={styles.infoText}>
                  Ouvre cette page sur Android ou iOS pour souscrire. Les achats web nécessitent une
                  application RevenueCat Web Billing distincte.
                </Text>
              </Card>
            </>
          ) : packages.length ? (
            <>
              <SectionHeader title="Choisis ton offre" />
              <View style={styles.packages}>
                {packages.map((aPackage) => {
                  const active = selected?.identifier === aPackage.identifier;
                  const comparableMonthlyPackage = packages.find(
                    (candidate) =>
                      candidate.packageType === PACKAGE_TYPE.MONTHLY &&
                      Boolean(isFamilyPackage(candidate)) ===
                        Boolean(isFamilyPackage(aPackage)),
                  );
                  const annualSavings =
                    aPackage.packageType === PACKAGE_TYPE.ANNUAL && comparableMonthlyPackage
                      ? Math.max(
                          0,
                          Math.round(
                            (1 -
                              aPackage.product.price /
                                (comparableMonthlyPackage.product.price * 12)) *
                              100,
                          ),
                        )
                      : 0;
                  const trialLabel = getPackageFreeTrialLabel(aPackage);
                  return (
                    <Pressable
                      accessibilityLabel={`${packageLabel(aPackage)}. ${
                        packageDescription(aPackage)
                      }. ${aPackage.product.priceString}`}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: active }}
                      key={aPackage.identifier}
                      onPress={() => setSelected(aPackage)}
                      style={[
                        styles.package,
                        active && styles.packageSelected,
                      ]}
                    >
                      <View style={styles.packageCopy}>
                        <View style={styles.packageTitleRow}>
                          <Text style={styles.packageTitle}>{packageLabel(aPackage)}</Text>
                          {annualSavings > 0 ? (
                            <Text style={styles.savings}>-{annualSavings}%</Text>
                          ) : null}
                        </View>
                        <Text style={styles.packageDescription}>
                          {packageDescription(aPackage)}
                        </Text>
                        {trialLabel ? (
                          <Text style={styles.trialText}>{trialLabel}</Text>
                        ) : null}
                      </View>
                      <View style={styles.packagePrice}>
                        <Text style={styles.price}>{aPackage.product.priceString}</Text>
                        <View style={[styles.radio, active && styles.radioSelected]}>
                          {active ? <View style={styles.radioDot} /> : null}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <PrimaryButton
                icon={Crown}
                label={
                  session
                    ? selectedTrialLabel
                      ? 'Démarrer l’essai gratuit'
                      : 'Continuer'
                    : 'Se connecter pour continuer'
                }
                loading={loading}
                disabled={!selected}
                onPress={() => void buy()}
              />
            </>
          ) : (
            <>
              <SectionHeader title="Offres indisponibles" />
              <Card>
                <Text style={styles.infoText}>
                  Crée un entitlement `premium`, attache les produits à une offering courante,
                  puis actualise cette page.
                </Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}
              </Card>
              <PrimaryButton
                icon={RefreshCw}
                label="Actualiser les offres"
                loading={loading}
                onPress={() => void refresh()}
                variant="surface"
              />
            </>
          )}

          {configured && Platform.OS !== 'web' ? (
            <Pressable
              accessibilityLabel="Restaurer mes achats"
              accessibilityRole="button"
              onPress={() => void restorePurchase()}
              style={styles.restore}
            >
              <Text style={styles.restoreText}>Restaurer mes achats</Text>
            </Pressable>
          ) : null}
        </>
      )}

      <View style={styles.security}>
        <ShieldCheck color={colors.success} size={19} />
        <Text style={styles.securityText}>
          Le paiement est traité par Apple ou Google. L’abonnement se renouvelle automatiquement
          jusqu’à son annulation dans les réglages du store.
        </Text>
      </View>

      <View style={styles.legalLinks}>
        <Text
          accessibilityRole="link"
          onPress={() => router.push('/terms')}
          style={styles.legalLink}
        >
          Conditions d’utilisation
        </Text>
        <Text
          accessibilityRole="link"
          onPress={() => router.push('/privacy')}
          style={styles.legalLink}
        >
          Confidentialité
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  heroIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,163,115,0.13)',
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 68,
    justifyContent: 'center',
    width: 68,
  },
  heroTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 25,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  heroText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
    maxWidth: 320,
    textAlign: 'center',
  },
  benefits: {
    gap: spacing.md,
    marginVertical: spacing.xl,
  },
  activeBenefits: {
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  benefit: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  check: {
    alignItems: 'center',
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    height: 25,
    justifyContent: 'center',
    width: 25,
  },
  benefitText: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 14,
  },
  packages: {
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  package: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 86,
    padding: spacing.md,
  },
  packageSelected: {
    backgroundColor: 'rgba(212,163,115,0.11)',
    borderColor: colors.gold,
  },
  packageCopy: {
    flex: 1,
  },
  packageTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 17,
  },
  packageTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  savings: {
    backgroundColor: 'rgba(129,199,132,0.14)',
    borderRadius: radius.pill,
    color: colors.success,
    fontFamily: typography.extraBold,
    fontSize: 10,
    overflow: 'hidden',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  packageDescription: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    marginTop: 3,
  },
  trialText: {
    color: colors.success,
    fontFamily: typography.bold,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  packagePrice: {
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  price: {
    color: colors.goldSoft,
    fontFamily: typography.extraBold,
    fontSize: 17,
  },
  radio: {
    alignItems: 'center',
    borderColor: colors.textFaint,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 22,
    justifyContent: 'center',
    width: 22,
  },
  radioSelected: {
    borderColor: colors.gold,
  },
  radioDot: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    height: 10,
    width: 10,
  },
  restore: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  restoreText: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  security: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
  },
  securityText: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.regular,
    fontSize: 11,
    lineHeight: 17,
  },
  infoTitle: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 15,
  },
  infoText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  error: {
    color: colors.error,
    fontFamily: typography.medium,
    fontSize: 12,
    marginTop: spacing.md,
  },
  activeCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  crown: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,163,115,0.13)',
    borderRadius: radius.pill,
    height: 70,
    justifyContent: 'center',
    width: 70,
  },
  activeTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 23,
    marginTop: spacing.md,
  },
  activeText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  legalLinks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    justifyContent: 'center',
  },
  legalLink: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
    textDecorationLine: 'underline',
  },
});
