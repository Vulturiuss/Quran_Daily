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

const FREE_DISCOVERY_SURAH_NUMBERS = [
  95, 96, 97, 98, 99, 100, 101, 102, 103, 104,
  105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
] as const;

export const FREE_SURAH_NUMBERS = [1, ...FREE_DISCOVERY_SURAH_NUMBERS] as const;
export const FREE_SURAH_COUNT = FREE_SURAH_NUMBERS.length;
export const FREE_SURAH_LABEL = 'Al-Fatiha + sourates 95 à 114';

const freeSurahs = new Set<number>(FREE_SURAH_NUMBERS);

export function isFreeSurah(surahNumber: number) {
  return freeSurahs.has(surahNumber);
}
