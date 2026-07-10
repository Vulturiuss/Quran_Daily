import { SyncMeta } from '@/types';

export type CloudIdentityAction =
  | 'merge-local'
  | 'replace-from-remote'
  | 'reset-for-user';

export function resolveCloudIdentityAction(
  syncMeta: SyncMeta,
  userId: string,
  hasRemoteSnapshot: boolean,
): CloudIdentityAction {
  const belongsToAnotherUser =
    Boolean(syncMeta.cloudUserId) && syncMeta.cloudUserId !== userId;
  const legacyOwnerUnknown =
    !syncMeta.cloudUserId && Boolean(syncMeta.lastSyncedAt);

  if (!belongsToAnotherUser && !legacyOwnerUnknown) return 'merge-local';
  return hasRemoteSnapshot ? 'replace-from-remote' : 'reset-for-user';
}
