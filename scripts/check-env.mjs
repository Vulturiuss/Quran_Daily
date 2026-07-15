/**
 * Fails a release build when the public runtime config is missing.
 *
 * `.env` is gitignored, so an EAS build only sees the variables registered with
 * `eas env:create`. If they are absent the app still builds — and ships with
 * `configured === false`, which unlocks every surah, hides the paywall and
 * disables accounts (see src/utils/access.ts). That failure is silent and looks
 * like a working app, so it has to be caught here instead.
 *
 * Runs on EAS via the `eas-build-pre-install` npm hook, and locally through
 * `npm run check:env`.
 */
const PROFILE = process.env.EAS_BUILD_PROFILE;
// `production` only: it is what reaches a store. `preview` builds the APK we hand
// to friends and testers, and it is allowed to ship without a billing key or the
// legal URLs — it never faces store review, and Supabase alone is enough to keep
// `configured === true`, so nothing unlocks silently.
const RELEASE_PROFILES = new Set(['production']);

// Required for the app to have accounts, sync and a paywall at all.
const REQUIRED = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'EXPO_PUBLIC_REVENUECAT_PREMIUM_ENTITLEMENT',
  'EXPO_PUBLIC_REVENUECAT_FAMILY_ENTITLEMENT',
  // Store review rejects an app whose privacy policy points nowhere, and an
  // unset support email is rendered as a placeholder string in the legal screens.
  'EXPO_PUBLIC_PRIVACY_URL',
  'EXPO_PUBLIC_TERMS_URL',
  'EXPO_PUBLIC_SUPPORT_EMAIL',
];

// At least one real billing key must be present, otherwise the paywall is inert.
const BILLING_KEYS = [
  'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
  'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY',
];

if (!RELEASE_PROFILES.has(PROFILE ?? '')) {
  console.log(
    `check-env: profile "${PROFILE ?? 'local'}" is not a release profile, skipping.`,
  );
  process.exit(0);
}

const missing = REQUIRED.filter((name) => !process.env[name]?.trim());
const hasBillingKey = BILLING_KEYS.some((name) => process.env[name]?.trim());
if (!hasBillingKey) missing.push(`one of ${BILLING_KEYS.join(' / ')}`);

// src/services/subscription.ts resolves the key as `testKey || platformKey`, so
// a stray Test Store key WINS over the real platform key — every install would
// then talk to the sandbox and grant entitlements without a real charge. A
// store build must never carry it, whatever else is set.
if (process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY?.trim()) {
  console.error(
    `\ncheck-env: refusing to build profile "${PROFILE}" — ` +
      'EXPO_PUBLIC_REVENUECAT_TEST_KEY is set.\n' +
      'It takes precedence over the platform key, so the app would ship against\n' +
      'the RevenueCat Test Store and hand out Premium for free. Remove it with:\n' +
      '  eas env:delete --environment production EXPO_PUBLIC_REVENUECAT_TEST_KEY\n',
  );
  process.exit(1);
}

if (missing.length > 0) {
  console.error(
    `\ncheck-env: refusing to build profile "${PROFILE}" — missing variables:\n` +
      missing.map((name) => `  - ${name}`).join('\n') +
      '\n\nRegister them once with:  eas env:create --environment production\n' +
      'Shipping without them would publish the app fully unlocked, with no paywall\n' +
      'and no accounts.\n',
  );
  process.exit(1);
}

console.log(`check-env: profile "${PROFILE}" has all required variables.`);
