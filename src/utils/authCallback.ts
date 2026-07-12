function stripTrailingSlash(pathname: string) {
  return pathname.replace(/\/+$/, '');
}

/**
 * A deep link is only allowed to drive the auth exchange when it matches the
 * redirect URL we ourselves handed to Supabase — same scheme, same host, same
 * path. Matching on a bare `url.includes('auth/callback')` would let any link
 * from any app reach `exchangeCodeForSession`.
 */
export function isTrustedAuthCallback(url: string, redirectUrl: string) {
  let parsed: URL;
  let expected: URL;
  try {
    parsed = new URL(url);
    expected = new URL(redirectUrl);
  } catch {
    return false;
  }

  return (
    parsed.protocol === expected.protocol &&
    parsed.host === expected.host &&
    stripTrailingSlash(parsed.pathname) === stripTrailingSlash(expected.pathname)
  );
}

export interface AuthCallbackParams {
  code?: string;
  errorDescription?: string;
}

/**
 * With PKCE the callback carries a single-use `code`; tokens never travel in
 * the URL. Anything that still ships an `access_token` fragment is either a
 * stale implicit-flow response or an injection attempt, and is ignored.
 */
export function parseAuthCallback(url: string): AuthCallbackParams {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return {};
  }

  const fragment = new URLSearchParams(parsed.hash.replace(/^#/, ''));
  const errorDescription =
    parsed.searchParams.get('error_description') ??
    fragment.get('error_description') ??
    undefined;
  if (errorDescription) {
    return { errorDescription: decodeURIComponent(errorDescription) };
  }

  return { code: parsed.searchParams.get('code') ?? undefined };
}
