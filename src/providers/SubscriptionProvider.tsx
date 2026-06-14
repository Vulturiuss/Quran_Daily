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
import {
  FAMILY_ENTITLEMENT_ID,
  isRevenueCatConfigured,
  PREMIUM_ENTITLEMENT_ID,
  revenueCatApiKey,
} from '@/services/subscription';

interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
}

interface SubscriptionContextValue {
  configured: boolean;
  loading: boolean;
  isPremium: boolean;
  isFamily: boolean;
  offering: PurchasesOffering | null;
  customerInfo: CustomerInfo | null;
  error?: string;
  purchase: (aPackage: PurchasesPackage) => Promise<PurchaseResult>;
  restore: () => Promise<PurchaseResult>;
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function entitlementActive(customerInfo: CustomerInfo, identifier: string) {
  return Boolean(customerInfo.entitlements.active[identifier]?.isActive);
}

function errorMessage(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Le service d’abonnement est momentanément indisponible.';
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { session, initializing: authInitializing } = useCloud();
  const [loading, setLoading] = useState(isRevenueCatConfigured);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [error, setError] = useState<string>();
  const [sdkReady, setSdkReady] = useState(false);
  const configured = useRef(false);
  const identifiedUserId = useRef<string | undefined>(undefined);

  const refresh = useCallback(async () => {
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
      await refresh();
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
  }, [refresh]);

  useEffect(() => {
    if (!sdkReady || !configured.current || authInitializing) return;
    const userId = session?.user.id;
    if (userId === identifiedUserId.current) return;

    setLoading(true);
    setError(undefined);
    setCustomerInfo(null);

    if (userId) {
      void Purchases.logIn(userId)
        .then(({ customerInfo: nextCustomerInfo }) => {
          identifiedUserId.current = userId;
          setCustomerInfo(nextCustomerInfo);
          return refresh();
        })
        .catch((caught) => setError(errorMessage(caught)))
        .finally(() => setLoading(false));
      return;
    }

    if (identifiedUserId.current) {
      void Purchases.logOut()
        .then((nextCustomerInfo) => {
          identifiedUserId.current = undefined;
          setCustomerInfo(nextCustomerInfo);
          return refresh();
        })
        .catch((caught) => setError(errorMessage(caught)))
        .finally(() => setLoading(false));
    }
  }, [authInitializing, refresh, sdkReady, session?.user.id]);

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
        const success =
          entitlementActive(nextCustomerInfo, PREMIUM_ENTITLEMENT_ID) ||
          entitlementActive(nextCustomerInfo, FAMILY_ENTITLEMENT_ID);
        return {
          success,
          error: success
            ? undefined
            : 'L’achat est validé mais aucun droit Premium n’est attaché au produit.',
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
      const success =
        entitlementActive(nextCustomerInfo, PREMIUM_ENTITLEMENT_ID) ||
        entitlementActive(nextCustomerInfo, FAMILY_ENTITLEMENT_ID);
      return {
        success,
        error: success ? undefined : 'Aucun abonnement actif n’a été retrouvé.',
      };
    } catch (caught) {
      const message = errorMessage(caught);
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const isFamily = customerInfo
    ? entitlementActive(customerInfo, FAMILY_ENTITLEMENT_ID)
    : false;
  const isPremium =
    isFamily ||
    (customerInfo
      ? entitlementActive(customerInfo, PREMIUM_ENTITLEMENT_ID)
      : false);

  const value = useMemo<SubscriptionContextValue>(
    () => ({
      configured: isRevenueCatConfigured,
      loading,
      isPremium,
      isFamily,
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
      purchase,
      refresh,
      restore,
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
