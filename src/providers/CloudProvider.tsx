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
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import type { Provider, Session } from '@supabase/supabase-js';

import { registerPushToken, unregisterPushToken } from '@/services/pushTokens';
import { isSupabaseConfigured, supabase } from '@/services/supabase';
import { useQuranStore } from '@/store/useQuranStore';
import { CloudSnapshot } from '@/types';
import { isTrustedAuthCallback, parseAuthCallback } from '@/utils/authCallback';
import { resolveCloudIdentityAction } from '@/utils/cloudIdentity';
import { createCloudSnapshot, mergeCloudSnapshots } from '@/utils/sync';

export type CloudSyncStatus =
  | 'disabled'
  | 'local'
  | 'offline'
  | 'syncing'
  | 'synced'
  | 'error';

interface AuthResult {
  error?: string;
  emailConfirmationRequired?: boolean;
}

interface CloudContextValue {
  configured: boolean;
  initializing: boolean;
  session: Session | null;
  status: CloudSyncStatus;
  lastError?: string;
  online: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string) => Promise<AuthResult>;
  signInWithProvider: (provider: 'google' | 'apple') => Promise<AuthResult>;
  signOut: () => Promise<AuthResult>;
  resetLocalData: () => Promise<AuthResult>;
  deleteAccount: () => Promise<AuthResult>;
  syncNow: () => Promise<void>;
}

interface SnapshotRow {
  payload: CloudSnapshot;
  revision: number;
  updated_at: string;
}

const CloudContext = createContext<CloudContextValue | null>(null);

function authRedirectUrl() {
  return Linking.createURL('auth/callback');
}

function isSnapshot(value: unknown): value is CloudSnapshot {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CloudSnapshot>;
  return (
    candidate.schemaVersion === 1 &&
    typeof candidate.updatedAt === 'string' &&
    Boolean(candidate.profile) &&
    Boolean(candidate.progress) &&
    Boolean(candidate.stats) &&
    Array.isArray(candidate.history)
  );
}

function localSnapshot(): CloudSnapshot {
  const state = useQuranStore.getState();
  return createCloudSnapshot(
    {
      onboardingCompleted: state.onboardingCompleted,
      profile: state.profile,
      progress: state.progress,
      stats: state.stats,
      history: state.history,
    },
    state.syncMeta.lastLocalChangeAt ??
      state.syncMeta.lastSyncedAt ??
      '1970-01-01T00:00:00.000Z',
  );
}

export function CloudProvider({ children }: { children: ReactNode }) {
  const hydrated = useQuranStore((state) => state.hydrated);
  const dirty = useQuranStore((state) => state.syncMeta.dirty);
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(isSupabaseConfigured);
  const [online, setOnline] = useState(true);
  const [status, setStatus] = useState<CloudSyncStatus>(
    isSupabaseConfigured ? 'local' : 'disabled',
  );
  const [lastError, setLastError] = useState<string>();
  const syncPromise = useRef<Promise<void> | null>(null);
  const syncingUserId = useRef<string | undefined>(undefined);
  const activeUserId = useRef<string | undefined>(undefined);
  const deletingAccount = useRef(false);
  const pulledUserId = useRef<string | undefined>(undefined);
  activeUserId.current = session?.user.id;

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((networkState) => {
      const connected =
        networkState.isConnected !== false &&
        networkState.isInternetReachable !== false;
      setOnline(connected);
      if (!connected && isSupabaseConfigured) setStatus('offline');
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!supabase) {
      setInitializing(false);
      return;
    }

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setStatus(data.session ? 'local' : 'local');
      setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (nextSession) deletingAccount.current = false;
      // Signing out must not skip the initial pull if the same user signs back in.
      if (!nextSession) pulledUserId.current = undefined;
      setSession(nextSession);
      setStatus(nextSession ? 'local' : 'local');
      setLastError(undefined);
      setInitializing(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // A session appearing is the only moment this device can be attached to a user.
  // It fails quietly: a refused notification permission must not break sign-in,
  // it only means a parent's reminder will report "no device" instead.
  useEffect(() => {
    if (!session) return;
    void registerPushToken();
  }, [session]);

  const handleAuthCallback = useCallback(async (url?: string | null) => {
    if (!supabase || !url) return;
    if (!isTrustedAuthCallback(url, authRedirectUrl())) return;

    const { code, errorDescription } = parseAuthCallback(url);
    if (errorDescription) {
      setLastError(errorDescription);
      setStatus('error');
      return;
    }
    if (!code) return;

    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Connexion sociale impossible.';
      setLastError(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;

    void Linking.getInitialURL().then(handleAuthCallback);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleAuthCallback(url);
    });
    return () => subscription.remove();
  }, [handleAuthCallback]);

  useEffect(() => {
    if (!supabase || Platform.OS === 'web') return;
    const client = supabase;
    if (AppState.currentState === 'active') client.auth.startAutoRefresh();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        client.auth.startAutoRefresh();
      } else {
        client.auth.stopAutoRefresh();
      }
    });

    return () => {
      subscription.remove();
      client.auth.stopAutoRefresh();
    };
  }, []);

  const runSync = useCallback(async () => {
    if (!supabase || !session || !hydrated || deletingAccount.current) return;
    const client = supabase;
    const userId = session.user.id;
    if (!online) {
      setStatus('offline');
      return;
    }

    setStatus('syncing');
    setLastError(undefined);

    const state = useQuranStore.getState();
    const startedLocalChangeAt = state.syncMeta.lastLocalChangeAt;

    async function fetchSnapshotRow() {
      const { data, error } = await client
        .from('user_state_snapshots')
        .select('payload, revision, updated_at')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      return data as SnapshotRow | null;
    }

    let row = await fetchSnapshotRow();
    const initialRemote = row && isSnapshot(row.payload) ? row.payload : null;
    if (activeUserId.current !== userId) return;
    const identityAction = resolveCloudIdentityAction(
      state.syncMeta,
      userId,
      Boolean(initialRemote),
    );

    if (identityAction !== 'merge-local') {
      if (initialRemote) {
        useQuranStore
          .getState()
          .applyCloudSnapshot(
            initialRemote,
            row?.updated_at ?? initialRemote.updatedAt,
            userId,
          );
        if (!initialRemote.onboardingCompleted) {
          router.replace('/onboarding');
        }
      } else {
        useQuranStore.getState().resetForCloudUser(userId);
        router.replace('/onboarding');
      }
      setStatus('synced');
      return;
    }

    if (row && initialRemote && !state.syncMeta.dirty) {
      if (
        useQuranStore.getState().syncMeta.lastLocalChangeAt !==
        startedLocalChangeAt
      ) {
        setStatus('local');
        return;
      }
      useQuranStore
        .getState()
        .applyCloudSnapshot(
          initialRemote,
          row.updated_at ?? initialRemote.updatedAt,
          userId,
        );
      setStatus('synced');
      return;
    }

    const local = localSnapshot();
    let committedSnapshot: CloudSnapshot | undefined;
    let committedAt: string | undefined;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const now = new Date().toISOString();
      const remote = row && isSnapshot(row.payload) ? row.payload : null;
      const nextSnapshot = remote
        ? mergeCloudSnapshots(local, remote, now)
        : { ...local, updatedAt: now };

      if (row) {
        const { data, error } = await client
          .from('user_state_snapshots')
          .update({
            payload: nextSnapshot,
            revision: row.revision + 1,
            updated_at: now,
          })
          .eq('user_id', userId)
          .eq('revision', row.revision)
          .select('payload, revision, updated_at')
          .maybeSingle();
        if (error) throw error;
        if (!data) {
          row = await fetchSnapshotRow();
          continue;
        }
      } else {
        const { error } = await client.from('user_state_snapshots').insert({
          user_id: userId,
          payload: nextSnapshot,
          revision: 1,
          updated_at: now,
        });
        if (error?.code === '23505') {
          row = await fetchSnapshotRow();
          continue;
        }
        if (error) throw error;
      }

      committedSnapshot = nextSnapshot;
      committedAt = now;
      break;
    }

    if (!committedSnapshot || !committedAt) {
      throw new Error(
        'La progression a changé sur un autre appareil. Réessaie la synchronisation.',
      );
    }

    if (activeUserId.current !== userId) return;
    if (
      useQuranStore.getState().syncMeta.lastLocalChangeAt !==
      startedLocalChangeAt
    ) {
      setStatus('local');
      return;
    }
    useQuranStore
      .getState()
      .applyCloudSnapshot(committedSnapshot, committedAt, userId);
    setStatus('synced');
  }, [hydrated, online, session]);

  const syncNow = useCallback(async () => {
    const userId = session?.user.id;
    if (syncPromise.current && syncingUserId.current === userId) {
      return syncPromise.current;
    }

    const operation = runSync()
      .catch((error: unknown) => {
        if (deletingAccount.current || activeUserId.current !== userId) return;
        const message =
          error instanceof Error ? error.message : 'Synchronisation impossible.';
        setLastError(message);
        setStatus(online ? 'error' : 'offline');
      })
      .finally(() => {
        if (syncPromise.current === operation) {
          syncPromise.current = null;
          syncingUserId.current = undefined;
        }
      });
    syncPromise.current = operation;
    syncingUserId.current = userId;
    return operation;
  }, [online, runSync, session?.user.id]);

  useEffect(() => {
    if (!session || !hydrated || !online) return;
    const userId = session.user.id;
    const needsInitialPull = pulledUserId.current !== userId;
    // A completed push flips `dirty` back to false, which re-runs this effect.
    // Without this guard that scheduled another full round-trip every time, so
    // each local change cost two syncs.
    if (!needsInitialPull && !dirty) return;

    const timer = setTimeout(() => {
      pulledUserId.current = userId;
      void syncNow();
    }, needsInitialPull ? 150 : 1200);
    return () => clearTimeout(timer);
  }, [dirty, hydrated, online, session, syncNow]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) return { error: 'Supabase n’est pas configuré.' };
      deletingAccount.current = false;
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      return error ? { error: error.message } : {};
    },
    [],
  );

  const signUp = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) return { error: 'Supabase n’est pas configuré.' };
      deletingAccount.current = false;
      const displayName = useQuranStore.getState().profile.displayName;
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (error) return { error: error.message };
      return { emailConfirmationRequired: !data.session };
    },
    [],
  );

  const signInWithProvider = useCallback(
    async (provider: 'google' | 'apple'): Promise<AuthResult> => {
      if (!supabase) return { error: 'Supabase n’est pas configuré.' };
      deletingAccount.current = false;
      const redirectTo = authRedirectUrl();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as Provider,
        options: {
          redirectTo,
          skipBrowserRedirect: Platform.OS !== 'web',
        },
      });
      if (error) return { error: error.message };

      if (Platform.OS !== 'web') {
        if (!data.url) return { error: 'URL de connexion indisponible.' };
        // openAuthSessionAsync keeps the flow in an ephemeral in-app auth
        // session and hands the callback straight back to us, so the code
        // never travels through a deep link another app could claim.
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        if (result.type === 'cancel' || result.type === 'dismiss') return {};
        if (result.type !== 'success') {
          return { error: 'Impossible d’ouvrir la page de connexion.' };
        }
        await handleAuthCallback(result.url);
      }
      return {};
    },
    [handleAuthCallback],
  );

  const signOut = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return {};
    // Before the session goes: RLS only lets us delete our own token, and a token
    // left behind would keep sending this user's reminders to a phone that is no
    // longer theirs.
    await unregisterPushToken();
    const { error } = await supabase.auth.signOut();
    if (!error) {
      pulledUserId.current = undefined;
      setSession(null);
      setStatus('local');
    }
    return error ? { error: error.message } : {};
  }, []);

  const resetLocalData = useCallback(async (): Promise<AuthResult> => {
    if (supabase && session) {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) return { error: error.message };
    }
    useQuranStore.getState().resetApp();
    setSession(null);
    setStatus(isSupabaseConfigured ? 'local' : 'disabled');
    setLastError(undefined);
    return {};
  }, [session]);

  const deleteAccount = useCallback(async (): Promise<AuthResult> => {
    if (!supabase || !session) return { error: 'Aucun compte connecté.' };
    if (!online) {
      return {
        error: 'Une connexion internet est nécessaire pour supprimer définitivement le compte.',
      };
    }

    deletingAccount.current = true;
    setStatus('syncing');
    setLastError(undefined);
    const { error } = await supabase.rpc('delete_current_user');
    if (error) {
      deletingAccount.current = false;
      setStatus('error');
      setLastError(error.message);
      return { error: error.message };
    }

    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    useQuranStore.getState().resetApp();
    setSession(null);
    setStatus('local');
    return {};
  }, [online, session]);

  const value = useMemo<CloudContextValue>(
    () => ({
      configured: isSupabaseConfigured,
      initializing,
      session,
      status,
      lastError,
      online,
      signIn,
      signUp,
      signInWithProvider,
      signOut,
      resetLocalData,
      deleteAccount,
      syncNow,
    }),
    [
      initializing,
      lastError,
      online,
      session,
      deleteAccount,
      signIn,
      signInWithProvider,
      signOut,
      signUp,
      resetLocalData,
      status,
      syncNow,
    ],
  );

  return <CloudContext.Provider value={value}>{children}</CloudContext.Provider>;
}

export function useCloud() {
  const context = useContext(CloudContext);
  if (!context) throw new Error('useCloud must be used inside CloudProvider');
  return context;
}
