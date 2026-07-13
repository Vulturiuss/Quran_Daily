import { supabase } from '@/services/supabase';
import { FamilyContext, FamilyMemberSummary } from '@/types';
import {
  normalizeFamilyContext,
  normalizeFamilyMembers,
} from '@/utils/family';

export interface FamilyResult<T = undefined> {
  data?: T;
  error?: string;
}

function message(error: unknown) {
  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }
  return 'Le service familial est momentanément indisponible.';
}

export async function fetchFamilyContext(): Promise<
  FamilyResult<FamilyContext | null>
> {
  if (!supabase) return { data: null };
  const { data, error } = await supabase.rpc('get_my_family_context');
  return error
    ? { error: message(error) }
    : { data: normalizeFamilyContext(data) };
}

export async function fetchFamilyDashboard(): Promise<
  FamilyResult<FamilyMemberSummary[]>
> {
  if (!supabase) return { data: [] };
  const { data, error } = await supabase.rpc('get_family_dashboard');
  return error
    ? { error: message(error) }
    : { data: normalizeFamilyMembers(data) };
}

export async function createFamily(
  name: string,
): Promise<FamilyResult<FamilyContext | null>> {
  if (!supabase) return { error: 'Supabase n’est pas configuré.' };
  const { data, error } = await supabase.rpc('create_family_space', {
    family_name: name.trim() || null,
  });
  return error
    ? { error: message(error) }
    : { data: normalizeFamilyContext(data) };
}

// Members always join as `child`; only the subscription owner can promote
// someone to parent afterwards (the invite code is shared with the people the
// parental dashboard is meant to watch over, so it cannot confer the role).
export async function joinFamily(
  code: string,
): Promise<FamilyResult<FamilyContext | null>> {
  if (!supabase) return { error: 'Supabase n’est pas configuré.' };
  const { data, error } = await supabase.rpc('join_family_space', {
    family_code: code.trim().toUpperCase(),
  });
  return error
    ? { error: message(error) }
    : { data: normalizeFamilyContext(data) };
}

export async function promoteFamilyMember(
  userId: string,
): Promise<FamilyResult> {
  if (!supabase) return { error: 'Supabase n’est pas configuré.' };
  const { error } = await supabase.rpc('promote_family_member', {
    member_user_id: userId,
  });
  return error ? { error: message(error) } : {};
}

export async function regenerateInviteCode(): Promise<
  FamilyResult<string>
> {
  if (!supabase) return { error: 'Supabase n’est pas configuré.' };
  const { data, error } = await supabase.rpc(
    'regenerate_family_invite_code',
  );
  return error ? { error: message(error) } : { data: String(data) };
}

export async function removeFamilyChild(
  userId: string,
): Promise<FamilyResult> {
  if (!supabase) return { error: 'Supabase n’est pas configuré.' };
  const { error } = await supabase.rpc('remove_family_member', {
    member_user_id: userId,
  });
  return error ? { error: message(error) } : {};
}

export async function leaveFamily(): Promise<FamilyResult> {
  if (!supabase) return { error: 'Supabase n’est pas configuré.' };
  const { error } = await supabase.rpc('leave_family_space');
  return error ? { error: message(error) } : {};
}

export async function deleteFamily(): Promise<FamilyResult> {
  if (!supabase) return { error: 'Supabase n’est pas configuré.' };
  const { error } = await supabase.rpc('delete_family_space');
  return error ? { error: message(error) } : {};
}

/**
 * `rate_limited` and `no_device` are outcomes, not failures: a reminder that
 * cannot be sent right now is something to say gently, not an error to report.
 */
export type NudgeOutcome = 'sent' | 'rate_limited' | 'no_device';

/**
 * Asks the server to send a child the day's reminder. The parent never handles a
 * push token: the Edge Function calls `request_family_nudge`, which checks the
 * family, the rate limit, and only then sends.
 */
export async function sendFamilyNudge(
  childUserId: string,
): Promise<FamilyResult<NudgeOutcome>> {
  if (!supabase) return { error: 'Supabase n’est pas configuré.' };

  const { data, error } = await supabase.functions.invoke('send-family-nudge', {
    body: { childUserId },
  });
  if (error) return { error: message(error) };

  const payload = data as { sent?: boolean; reason?: string } | null;
  if (payload?.sent) return { data: 'sent' };
  if (payload?.reason === 'rate_limited') return { data: 'rate_limited' };
  if (payload?.reason === 'no_device') return { data: 'no_device' };
  return { error: 'Le rappel n’a pas pu être envoyé.' };
}
