import assert from 'node:assert/strict';
import test from 'node:test';

import { isTrustedAuthCallback, parseAuthCallback } from './authCallback';

const redirect = 'qurandaily://auth/callback';

test('accepts the exact redirect url we handed to Supabase', () => {
  assert.equal(
    isTrustedAuthCallback('qurandaily://auth/callback?code=abc', redirect),
    true,
  );
  assert.equal(isTrustedAuthCallback('qurandaily://auth/callback/', redirect), true);
});

test('accepts the Expo development callback url', () => {
  const devRedirect = 'exp://192.168.1.10:8081/--/auth/callback';
  assert.equal(
    isTrustedAuthCallback('exp://192.168.1.10:8081/--/auth/callback?code=abc', devRedirect),
    true,
  );
});

test('rejects a foreign scheme or host carrying the same path', () => {
  assert.equal(
    isTrustedAuthCallback('evilapp://auth/callback?code=abc', redirect),
    false,
  );
  assert.equal(
    isTrustedAuthCallback('https://evil.example/auth/callback?code=abc', redirect),
    false,
  );
});

test('rejects a path that merely contains the callback segment', () => {
  assert.equal(
    isTrustedAuthCallback('qurandaily://open?next=auth/callback', redirect),
    false,
  );
  assert.equal(
    isTrustedAuthCallback('qurandaily://auth/callback/evil', redirect),
    false,
  );
});

test('rejects malformed urls', () => {
  assert.equal(isTrustedAuthCallback('not a url', redirect), false);
});

test('extracts the PKCE code', () => {
  assert.deepEqual(parseAuthCallback('qurandaily://auth/callback?code=abc123'), {
    code: 'abc123',
  });
});

test('surfaces the provider error description', () => {
  const parsed = parseAuthCallback(
    'qurandaily://auth/callback?error_description=Acc%C3%A8s%20refus%C3%A9',
  );
  assert.equal(parsed.errorDescription, 'Accès refusé');
  assert.equal(parsed.code, undefined);
});

test('ignores injected tokens in the fragment', () => {
  const parsed = parseAuthCallback(
    'qurandaily://auth/callback#access_token=stolen&refresh_token=stolen',
  );
  assert.deepEqual(parsed, { code: undefined });
});
