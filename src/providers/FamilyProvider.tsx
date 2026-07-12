import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState } from 'react-native';

import { useCloud } from '@/providers/CloudProvider';
import {
  createFamily as createFamilyRequest,
  deleteFamily as deleteFamilyRequest,
  FamilyResult,
  fetchFamilyContext,
  fetchFamilyDashboard,
  joinFamily as joinFamilyRequest,
  leaveFamily as leaveFamilyRequest,
  regenerateInviteCode as regenerateInviteCodeRequest,
  removeFamilyChild as removeFamilyChildRequest,
} from '@/services/family';
import { FamilyContext, FamilyMemberSummary } from '@/types';

interface FamilyContextValue {
  loading: boolean;
  busy: boolean;
  context: FamilyContext | null;
  members: FamilyMemberSummary[];
  error?: string;
  refresh: () => Promise<void>;
  createFamily: (name: string) => Promise<FamilyResult<unknown>>;
  joinFamily: (code: string) => Promise<FamilyResult<unknown>>;
  regenerateInviteCode: () => Promise<FamilyResult<unknown>>;
  removeChild: (userId: string) => Promise<FamilyResult<unknown>>;
  leaveFamily: () => Promise<FamilyResult<unknown>>;
  deleteFamily: () => Promise<FamilyResult<unknown>>;
}

const FamilyStateContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { session, initializing } = useCloud();
  const [loading, setLoading] = useState(Boolean(session));
  const [busy, setBusy] = useState(false);
  const [context, setContext] = useState<FamilyContext | null>(null);
  const [members, setMembers] = useState<FamilyMemberSummary[]>([]);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (initializing) return;
    if (!session) {
      setContext(null);
      setMembers([]);
      setError(undefined);
      setLoading(false);
      return;
    }

    // A silent refresh keeps the current data on screen while it revalidates.
    // SubscriptionProvider folds `familyLoading` into its own `loading`, so
    // flipping it on every foreground made the paywall-dependent screens blink.
    if (!silent) setLoading(true);
    const contextResult = await fetchFamilyContext();
    if (contextResult.error) {
      setError(contextResult.error);
      setLoading(false);
      return;
    }

    const nextContext = contextResult.data ?? null;
    setContext(nextContext);
    setError(undefined);

    if (nextContext?.role === 'parent' && nextContext.active) {
      const dashboardResult = await fetchFamilyDashboard();
      if (dashboardResult.error) {
        setError(dashboardResult.error);
        setMembers([]);
      } else {
        setMembers(dashboardResult.data ?? []);
      }
    } else {
      setMembers([]);
    }
    setLoading(false);
  }, [initializing, session]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh({ silent: true });
    });
    return () => subscription.remove();
  }, [refresh]);

  const runMutation = useCallback(
    async <T,>(operation: () => Promise<FamilyResult<T>>) => {
      setBusy(true);
      setError(undefined);
      const result = await operation();
      if (result.error) {
        setError(result.error);
      } else {
        await refresh();
      }
      setBusy(false);
      return result;
    },
    [refresh],
  );

  const createFamily = useCallback(
    (name: string) => runMutation(() => createFamilyRequest(name)),
    [runMutation],
  );
  const joinFamily = useCallback(
    (code: string) => runMutation(() => joinFamilyRequest(code)),
    [runMutation],
  );
  const regenerateInviteCode = useCallback(
    () => runMutation(regenerateInviteCodeRequest),
    [runMutation],
  );
  const removeChild = useCallback(
    (userId: string) =>
      runMutation(() => removeFamilyChildRequest(userId)),
    [runMutation],
  );
  const leaveFamily = useCallback(
    () => runMutation(leaveFamilyRequest),
    [runMutation],
  );
  const deleteFamily = useCallback(
    () => runMutation(deleteFamilyRequest),
    [runMutation],
  );

  const value = useMemo<FamilyContextValue>(
    () => ({
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
    }),
    [
      busy,
      context,
      createFamily,
      deleteFamily,
      error,
      joinFamily,
      leaveFamily,
      loading,
      members,
      refresh,
      regenerateInviteCode,
      removeChild,
    ],
  );

  return (
    <FamilyStateContext.Provider value={value}>
      {children}
    </FamilyStateContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyStateContext);
  if (!context) {
    throw new Error('useFamily must be used inside FamilyProvider');
  }
  return context;
}
