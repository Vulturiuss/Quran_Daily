import { Platform } from 'react-native';

export const PREMIUM_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_PREMIUM_ENTITLEMENT?.trim() || 'premium';
export const FAMILY_ENTITLEMENT_ID =
  process.env.EXPO_PUBLIC_REVENUECAT_FAMILY_ENTITLEMENT?.trim() || 'family';
export const isFamilyPlanEnabled =
  process.env.EXPO_PUBLIC_ENABLE_FAMILY_PLAN !== 'false';

const testKey = process.env.EXPO_PUBLIC_REVENUECAT_TEST_KEY?.trim();
const platformKey = Platform.select({
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY?.trim(),
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY?.trim(),
  web: process.env.EXPO_PUBLIC_REVENUECAT_WEB_KEY?.trim(),
});

export const revenueCatApiKey = testKey || platformKey;
export const isRevenueCatConfigured = Boolean(revenueCatApiKey);

// No surah is behind the paywall: the 114 are learnable and reviewable for free,
// without a daily cap. Premium sells themes, reciters, the Progress tab and
// learning three surahs at once — see src/utils/access.ts.
