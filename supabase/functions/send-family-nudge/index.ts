import { createClient } from 'npm:@supabase/supabase-js@2';

/**
 * A parent asks the server to remind their child.
 *
 * The caller's own JWT is used — never the service role — so `auth.uid()` inside
 * `request_family_nudge` is the parent, and every check the RPC makes (parent of
 * this child, active family, rate limit) applies. The push tokens it returns
 * never leave this function: the parent asks for a reminder to be sent, they do
 * not receive the means to send one themselves.
 */

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

interface NudgeDecision {
  sent: boolean;
  reason?: 'rate_limited' | 'no_device';
  tokens?: PushToken[];
  childName?: string;
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (request.method !== 'POST') {
    return json({ sent: false, reason: 'method_not_allowed' }, 405);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) {
    return json({ sent: false, reason: 'unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey =
    Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY');
  if (!supabaseUrl || !anonKey) {
    return json({ sent: false, reason: 'server_misconfigured' }, 500);
  }

  let childUserId: string | undefined;
  try {
    const body = (await request.json()) as { childUserId?: string };
    childUserId = body?.childUserId;
  } catch {
    return json({ sent: false, reason: 'invalid_payload' }, 400);
  }
  if (!childUserId || !uuidPattern.test(childUserId)) {
    return json({ sent: false, reason: 'invalid_payload' }, 400);
  }

  // The caller's token, forwarded as-is: the RPC is `security definer`, but every
  // decision it makes rests on `auth.uid()` being the parent who asked.
  const client = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.rpc('request_family_nudge', {
    child_user_id: childUserId,
  });
  if (error) {
    // The RPC raises when the caller is not a parent of this child. That is a
    // refusal, not a server fault.
    return json({ sent: false, reason: 'forbidden', message: error.message }, 403);
  }

  const decision = data as NudgeDecision | null;
  if (!decision?.sent) {
    // `rate_limited` and `no_device` are answers, not errors: they come back with
    // a 200 so the app can say something kind rather than "une erreur est
    // survenue".
    return json({ sent: false, reason: decision?.reason ?? 'unknown' });
  }

  const tokens = decision.tokens ?? [];
  const childName = decision.childName ?? 'Ta session';
  const messages = tokens.map((item) => ({
    to: item.token,
    title: 'Un rappel de tes parents',
    body: `${childName}, ta session du jour t’attend 🌙`,
    sound: 'default',
    // Opens the app on the home screen, where the session starts.
    data: { url: '/(tabs)' },
    channelId: 'daily-reminders',
  }));

  if (messages.length === 0) {
    return json({ sent: false, reason: 'no_device' });
  }

  const pushResponse = await fetch(EXPO_PUSH_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(messages),
  });

  if (!pushResponse.ok) {
    return json({ sent: false, reason: 'push_failed' }, 502);
  }

  const pushResult = (await pushResponse.json()) as {
    data?: { status?: string }[];
  };
  const delivered = (pushResult.data ?? []).filter(
    (ticket) => ticket?.status === 'ok',
  ).length;

  if (delivered === 0) {
    return json({ sent: false, reason: 'push_failed' }, 502);
  }

  return json({ sent: true, delivered });
});
