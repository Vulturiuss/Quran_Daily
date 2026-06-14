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
import type { Session } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabase } from '@/services/supabase';
import { useQuranStore } from '@/store/useQuranStore';
import { CloudSnapshot } from '@/types';
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
  signOut: () => Promise<AuthResult>;
  syncNow: () => Promise<void>;
}

interface SnapshotRow {
  payload: CloudSnapshot;
  revision: number;
  updated_at: string;
}

const CloudContext = createContext<CloudContextValue | null>(null);

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
    if (!supabase || !session || !hydrated) return;
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
    const local = localSnapshot();

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
        );
      setStatus('synced');
      return;
    }

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

    if (
      useQuranStore.getState().syncMeta.lastLocalChangeAt !==
      startedLocalChangeAt
    ) {
      setStatus('local');
      return;
    }
    useQuranStore
      .getState()
      .applyCloudSnapshot(committedSnapshot, committedAt);
    setStatus('synced');
  }, [hydrated, online, session]);

  const syncNow = useCallback(async () => {
    if (syncPromise.current) return syncPromise.current;

    const operation = runSync()
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Synchronisation impossible.';
        setLastError(message);
        setStatus(online ? 'error' : 'offline');
      })
      .finally(() => {
        syncPromise.current = null;
      });
    syncPromise.current = operation;
    return operation;
  }, [online, runSync]);

  useEffect(() => {
    if (!session || !hydrated || !online) return;
    const timer = setTimeout(() => {
      void syncNow();
    }, dirty ? 1200 : 150);
    return () => clearTimeout(timer);
  }, [dirty, hydrated, online, session, syncNow]);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) return { error: 'Supabase n’est pas configuré.' };
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

  const signOut = useCallback(async (): Promise<AuthResult> => {
    if (!supabase) return {};
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setSession(null);
      setStatus('local');
    }
    return error ? { error: error.message } : {};
  }, []);

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
      signOut,
      syncNow,
    }),
    [
      initializing,
      lastError,
      online,
      session,
      signIn,
      signOut,
      signUp,
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
