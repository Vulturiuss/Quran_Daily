import { createClient } from 'npm:@supabase/supabase-js@2';

interface RevenueCatEntitlement {
  expires_date?: string | null;
  grace_period_expires_date?: string | null;
}

interface RevenueCatCustomerResponse {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>;
  };
}

interface RevenueCatWebhookBody {
  event?: {
    aliases?: string[];
    app_user_id?: string;
    original_app_user_id?: string;
    transferred_to?: string[];
    redeemed_by?: string[];
    type?: string;
  };
}

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function entitlementActive(
  entitlement: RevenueCatEntitlement | undefined,
  now = Date.now(),
) {
  if (!entitlement) return false;
  if (!entitlement.expires_date) return true;

  const expiresAt = new Date(entitlement.expires_date).getTime();
  const graceAt = entitlement.grace_period_expires_date
    ? new Date(entitlement.grace_period_expires_date).getTime()
    : 0;
  return Math.max(expiresAt, graceAt) > now;
}

function entitlementExpiration(
  entitlement: RevenueCatEntitlement | undefined,
) {
  if (!entitlement?.expires_date) return null;
  const expiration = new Date(entitlement.expires_date);
  const grace = entitlement.grace_period_expires_date
    ? new Date(entitlement.grace_period_expires_date)
    : undefined;
  const latest =
    grace && grace.getTime() > expiration.getTime() ? grace : expiration;
  return Number.isNaN(latest.getTime()) ? null : latest.toISOString();
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const expectedAuthorization = Deno.env.get(
    'REVENUECAT_WEBHOOK_AUTHORIZATION',
  );
  if (
    !expectedAuthorization ||
    request.headers.get('authorization') !== expectedAuthorization
  ) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const revenueCatSecretKey = Deno.env.get('REVENUECAT_SECRET_API_KEY');
  if (!supabaseUrl || !serviceRoleKey || !revenueCatSecretKey) {
    return new Response('Server configuration missing', { status: 500 });
  }

  const body = (await request.json()) as RevenueCatWebhookBody;
  const event = body.event;
  if (!event) return new Response('Invalid payload', { status: 400 });
  if (event.type === 'TEST') {
    return Response.json({ received: true });
  }

  const candidates = [
    event.app_user_id,
    event.original_app_user_id,
    ...(event.aliases ?? []),
    ...(event.transferred_to ?? []),
    ...(event.redeemed_by ?? []),
  ].filter((value): value is string => Boolean(value));
  const userIds = [...new Set(candidates.filter((value) => uuidPattern.test(value)))];
  if (!userIds.length) {
    return Response.json({ received: true, updated: false });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('id')
    .in('id', userIds)
    .limit(1);
  if (profileError) {
    return new Response(profileError.message, { status: 500 });
  }

  const userId = profiles?.[0]?.id as string | undefined;
  if (!userId) {
    return Response.json({ received: true, updated: false });
  }

  const revenueCatUserId = event.app_user_id ?? userId;
  const customerResponse = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(
      revenueCatUserId,
    )}`,
    {
      headers: {
        Authorization: `Bearer ${revenueCatSecretKey}`,
        Accept: 'application/json',
      },
    },
  );
  if (!customerResponse.ok) {
    return new Response('RevenueCat customer lookup failed', { status: 502 });
  }

  const customer =
    (await customerResponse.json()) as RevenueCatCustomerResponse;
  const entitlements = customer.subscriber?.entitlements ?? {};
  const familyId = Deno.env.get('REVENUECAT_FAMILY_ENTITLEMENT') || 'family';
  const premiumId =
    Deno.env.get('REVENUECAT_PREMIUM_ENTITLEMENT') || 'premium';
  const familyEntitlement = entitlements[familyId];
  const premiumEntitlement = entitlements[premiumId];
  const familyActive = entitlementActive(familyEntitlement);
  const premiumActive = entitlementActive(premiumEntitlement);
  const subscriptionTier = familyActive
    ? 'family'
    : premiumActive
      ? 'premium'
      : 'free';
  const subscriptionExpiresAt = familyActive
    ? entitlementExpiration(familyEntitlement)
    : premiumActive
      ? entitlementExpiration(premiumEntitlement)
      : null;

  const { error: updateError } = await admin
    .from('profiles')
    .update({
      subscription_tier: subscriptionTier,
      subscription_expires_at: subscriptionExpiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  if (updateError) {
    return new Response(updateError.message, { status: 500 });
  }

  return Response.json({
    received: true,
    updated: true,
    subscriptionTier,
  });
});
