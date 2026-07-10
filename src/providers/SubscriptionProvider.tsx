import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  PurchasesError,
  PurchasesOffering,
  PurchasesPackage,
} from 'react-native-purchases';

import { useCloud } from '@/providers/CloudProvider';
import { useFamily } from '@/providers/FamilyProvider';
import {
  FAMILY_ENTITLEMENT_ID,
  isRevenueCatConfigured,
  PREMIUM_ENTITLEMENT_ID,
  revenueCatApiKey,
} from '@/services/subscription';
import { isSupabaseConfigured, supabase } from '@/services/supabase';
import {
  hasCloudPaidAccess,
  SubscriptionTier,
} from '@/utils/subscriptionAccess';

interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
}

interface SubscriptionContextValue {
  configured: boolean;
  billingConfigured: boolean;
  loading: boolean;
  isPremium: boolean;
  isFamily: boolean;
  subscriptionTier: SubscriptionTier;
  offering: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  error?: string;
  purchase: (aPackage: PurchasesPackage) => Promise<PurchaseResult>;
  restore: () => Promise<PurchaseResult>;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

interface ProfileSubscriptionRow {
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
}

function entitlementActive(customerInfo: CustomerInfo, identifier: string) {
  return Boolean(customerInfo.entitlements.active[identifier]?.isActive);
}

function hasPaidAccess(customerInfo: CustomerInfo) {
  return (
    entitlementActive(customerInfo, PREMIUM_ENTITLEMENT_ID) ||
    entitlementActive(customerInfo, FAMILY_ENTITLEMENT_ID)
  );
}

const MISSING_ENTITLEMENT_MESSAGE =
  'Dans RevenueCat, attache le produit à l’entitlement premium ou family, puis restaure les achats.';

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Le service d’abonnement est momentanément indisponible.';
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { session, initializing: authInitializing } = useCloud();
  const { context: familyContext, loading: familyLoading } = useFamily();
  const [loading, setLoading] = useState(isRevenueCatConfigured);
  const [profileLoading, setProfileLoading] = useState(isSupabaseConfigured);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [cloudTier, setCloudTier] = useState<SubscriptionTier>('free');
  const [cloudExpiresAt, setCloudExpiresAt] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [sdkReady, setSdkReady] = useState(false);
  const configured = useRef(false);
  const identifiedUserId = useRef<string | undefined>(undefined);
  const activeProfileUserId = useRef<string | undefined>(session?.user.id);
  activeProfileUserId.current = session?.user.id;

  const refreshRevenueCat = useCallback(async () => {
    if (!configured.current) return;
    setError(undefined);

    try {
      const nextCustomerInfo = await Purchases.getCustomerInfo();
      setCustomerInfo(nextCustomerInfo);
    } catch (caught) {
      setError(errorMessage(caught));
    }

    try {
      const offerings = await Purchases.getOfferings();
      setOffering(offerings.current);
    } catch (caught) {
      setError((current) => current ?? errorMessage(caught));
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!supabase || authInitializing) {
      if (!isSupabaseConfigured) setProfileLoading(false);
      return;
    }

    const userId = session?.user.id;
    if (!userId) {
      setCloudTier('free');
      setCloudExpiresAt(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    const { data, error: profileError } = await supabase
      .from('profiles')
      .select('subscription_tier, subscription_expires_at')
      .eq('id', userId)
      .maybeSingle();

    if (activeProfileUserId.current !== userId) return;
    if (profileError) {
      setError(profileError.message);
    } else {
      const profile = data as ProfileSubscriptionRow | null;
      setCloudTier(profile?.subscription_tier ?? 'free');
      setCloudExpiresAt(profile?.subscription_expires_at ?? null);
    }
    setProfileLoading(false);
  }, [authInitializing, session?.user.id]);

  const refresh = useCallback(async () => {
    await Promise.all([refreshRevenueCat(), refreshProfile()]);
  }, [refreshProfile, refreshRevenueCat]);

  useEffect(() => {
    if (!isRevenueCatConfigured || !revenueCatApiKey) {
      setLoading(false);
      return;
    }

    let active = true;
    let listenerRegistered = false;
    const listener = (nextCustomerInfo: CustomerInfo) => {
      setCustomerInfo(nextCustomerInfo);
    };

    void (async () => {
      await Purchases.setLogLevel(
        __DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO,
      );
      if (!(await Purchases.isConfigured())) {
        Purchases.configure({
          apiKey: revenueCatApiKey,
          ...(session?.user.id ? { appUserID: session.user.id } : {}),
        });
      }

      configured.current = true;
      const currentUserId = await Purchases.getAppUserID();
      identifiedUserId.current = currentUserId.startsWith('$RCAnonymousID:')
        ? undefined
        : currentUserId;

      if (!active) return;
      Purchases.addCustomerInfoUpdateListener(listener);
      listenerRegistered = true;
      setSdkReady(true);
      await refreshRevenueCat();
    })()
      .catch((caught) => {
        if (active) setError(errorMessage(caught));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      if (listenerRegistered) {
        Purchases.removeCustomerInfoUpdateListener(listener);
      }
    };
  }, [refreshRevenueCat]);

  useEffect(() => {
    if (!sdkReady || !configured.current || authInitializing) return;
    const userId = session?.user.id;
    if (userId === identifiedUserId.current) return;

    let aborted = false;

    setLoading(true);
    setError(undefined);
    setCustomerInfo(null);

    if (userId) {
      void Purchases.logIn(userId)
        .then(({ customerInfo: nextCustomerInfo }) => {
          if (aborted) return;
          identifiedUserId.current = userId;
          setCustomerInfo(nextCustomerInfo);
          return refreshRevenueCat();
        })
        .catch((caught) => { if (!aborted) setError(errorMessage(caught)); })
        .finally(() => { if (!aborted) setLoading(false); });
    } else if (identifiedUserId.current) {
      void Purchases.logOut()
        .then((nextCustomerInfo) => {
          if (aborted) return;
          identifiedUserId.current = undefined;
          setCustomerInfo(nextCustomerInfo);
          return refreshRevenueCat();
        })
        .catch((caught) => { if (!aborted) setError(errorMessage(caught)); })
        .finally(() => { if (!aborted) setLoading(false); });
    }

    return () => { aborted = true; };
  }, [authInitializing, refreshRevenueCat, sdkReady, session?.user.id]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  useEffect(() => {
    if (!supabase || !session?.user.id) return;
    const userId = session.user.id;
    const channel = supabase
      .channel(`profile-subscription:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          filter: `id=eq.${userId}`,
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const profile = payload.new as ProfileSubscriptionRow;
          setCloudTier(profile.subscription_tier ?? 'free');
          setCloudExpiresAt(profile.subscription_expires_at ?? null);
        },
      )
      .subscribe();

    return () => {
      void supabase?.removeChannel(channel);
    };
  }, [session?.user.id]);

  const purchase = useCallback(
    async (aPackage: PurchasesPackage): Promise<PurchaseResult> => {
      if (!configured.current) {
        return { success: false, error: 'RevenueCat n’est pas configuré.' };
      }

      setLoading(true);
      setError(undefined);
      try {
        const { customerInfo: nextCustomerInfo } =
          await Purchases.purchasePackage(aPackage);
        setCustomerInfo(nextCustomerInfo);
        const success = hasPaidAccess(nextCustomerInfo);
        return {
          success,
          error: success ? undefined : MISSING_ENTITLEMENT_MESSAGE,
        };
      } catch (caught) {
        const purchasesError = caught as Partial<PurchasesError>;
        if (
          purchasesError.code ===
          PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR
        ) {
          return { success: false, cancelled: true };
        }
        const message = errorMessage(caught);
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const restore = useCallback(async (): Promise<PurchaseResult> => {
    if (!configured.current) {
      return { success: false, error: 'RevenueCat n’est pas configuré.' };
    }

    setLoading(true);
    setError(undefined);
    try {
      const nextCustomerInfo = await Purchases.restorePurchases();
      setCustomerInfo(nextCustomerInfo);
      const success = hasPaidAccess(nextCustomerInfo);
      return {
        success,
        error: success ? undefined : MISSING_ENTITLEMENT_MESSAGE,
      };
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const hasCloudAccess = hasCloudPaidAccess(cloudTier, cloudExpiresAt);
  const isFamily =
    (customerInfo
      ? entitlementActive(customerInfo, FAMILY_ENTITLEMENT_ID)
      : false) ||
    (cloudTier === 'family' && hasCloudAccess) ||
    Boolean(familyContext?.active);
  const isPremium =
    isFamily ||
    hasCloudAccess ||
    (customerInfo ? hasPaidAccess(customerInfo) : false);
  const subscriptionTier: SubscriptionTier = isFamily
    ? 'family'
    : isPremium
      ? 'premium'
      : 'free';

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      configured: isRevenueCatConfigured || isSupabaseConfigured,
      billingConfigured: isRevenueCatConfigured,
      loading:
        loading || profileLoading || authInitializing || familyLoading,
      isPremium,
      isFamily,
      subscriptionTier,
      offering,
      customerInfo,
      error,
      purchase,
      restore,
      refresh,
    }),
    [
      customerInfo,
      error,
      isFamily,
      isPremium,
      loading,
      offering,
      profileLoading,
      purchase,
      refresh,
      restore,
      subscriptionTier,
      authInitializing,
      familyLoading,
    ],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used inside SubscriptionProvider');
  }
  return context;
}
