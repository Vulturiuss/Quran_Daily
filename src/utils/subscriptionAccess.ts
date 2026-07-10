export type SubscriptionTier = 'free' | 'premium' | 'family';

export function hasCloudPaidAccess(
  tier: SubscriptionTier,
  expiresAt?: string | null,
  now = new Date(),
) {
  if (tier === 'free') return false;
  if (!expiresAt) return true;

  const expiration = new Date(expiresAt);
  return !Number.isNaN(expiration.getTime()) && expiration > now;
}
