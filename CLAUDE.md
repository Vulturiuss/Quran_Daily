# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Expo (React Native) app for progressive Qur'an memorization. UI copy and comments are in **French** — keep new user-facing strings French. The Qur'an corpus (6236 verses: Uthmani, transliteration, French translation) ships offline in `src/data/quran.json`; only audio needs the network.

## Commands

```bash
npm start                     # Expo dev server (a=Android, i=iOS, w=web)
npm run dev-client            # dev server for a development build (needed for RevenueCat/native)
npm run check                 # typecheck + tests — run this before finishing a change
npm run typecheck             # tsc --noEmit
npm test                      # node:test via tsx over src/**/*.test.ts
npx tsx --test src/utils/srs.test.ts   # single test file
npx expo-doctor               # dependency/config health (part of the release checklist)
npm run sync:quran            # regenerate src/data/quran.json from Quran.com APIs
npm run e2e:maestro           # Maestro flows in e2e/maestro (needs a running app + maestro CLI)
npm run beta:android          # EAS development build; also :ios, :ios-simulator, friends:android-apk (APK)
```

Tests are plain `node:test` + `node:assert/strict` on pure functions in `src/utils`, `src/services`, `src/data`. There is no React component test harness — logic that needs testing belongs in a `src/utils` module, not in a screen.

## Architecture

**Routing.** Expo Router with `src/app` as the routes dir and typed routes enabled. `src/app/_layout.tsx` nests the provider stack in a fixed order — `ThemeProvider → SafeAreaProvider → CloudProvider → FamilyProvider → ReminderProvider → SubscriptionProvider → GamificationProvider → AudioProvider`. `SubscriptionProvider` reads `useCloud()` and `useFamily()`, so that order is load-bearing.

**State.** `src/store/useQuranStore.ts` is the single Zustand store, persisted to AsyncStorage (`quran-daily-state`, currently `version: 5`). It owns onboarding, per-surah progress, stats, session history, the active session, and `syncMeta`. Every mutating action must also set `syncMeta` via `changedNow(...)` — that dirty flag is what triggers a cloud push. Bumping the persisted shape means bumping `version` and extending `migrate`.

**Sessions.** A day's work is one `ActiveSession` (review queue + verses to learn) built by `startDailySession(access)`, where `access` carries the free-tier limits (`maxReviews`, `allowedSurahNumbers`, `freezeAllowance`). Screens live in `src/app/session/{review,learn,complete}.tsx`. `completeDailySession()` computes XP, streak, badges, and the history record; a second session on the same day is automatically treated as a bonus (no streak/daily XP credit) regardless of the `isBonus` flag. `src/utils/sessionPlan.ts` builds the *preview* of the same plan for the home screen — keep the two in sync.

**SRS.** `src/utils/srs.ts`, an SM-2 variant on whole surahs (not verses): ease clamped to [1.3, 3.0], interval capped at 180 days, ratings are `good | hard | forgot`.

**Cloud sync (optional).** Supabase, and offline-first: local AsyncStorage is always the source of truth; nothing blocks on the network. `CloudProvider` debounces a sync, then reads/merges/writes a single JSON snapshot row in `user_state_snapshots` using optimistic concurrency (a `revision` column, retried up to 3×). `src/utils/sync.ts` does the field-level merge (last-write-wins per surah on `updatedAt`, `Math.max` for monotonic stats, union of badges/history). `src/utils/cloudIdentity.ts` decides whether a login merges local data or resets to the remote account — the guard that stops one user's progress leaking into another's. If Supabase env vars are absent the whole layer is inert (`status: 'disabled'`).

**Family.** Parent/child shared spaces, entirely through Supabase RPCs (`get_my_family_context`, `create_family_space`, `join_family_space`, …) defined in `supabase/schema.sql`. `family_members` has an RLS policy denying direct access — go through the RPCs in `src/services/family.ts`.

**Monetization.** RevenueCat via `SubscriptionProvider`, plus a `subscription_tier` mirror on the Supabase `profiles` row kept current by `supabase/functions/revenuecat-webhook`. Premium is granted if *either* source says so. **With no RevenueCat key configured the app is fully unlocked** (`hasFullAccess = !configured || isPremium`) — free-tier gating only appears once billing is set up. Free tier = the 21 surahs in `FREE_SURAH_NUMBERS` (`src/services/subscription.ts`), 3 reviews/day, 1 streak freeze.

**Theme.** Three palettes (teal/pink/blue) in `src/theme.ts`, selected from the user profile. Screens migrated to `useTheme()` get the live palette; the rest still import the static `colors` export (teal). Prefer `useTheme()` in new code. Design rules — fixed colors, spacing, tone — are in `design-system.md`.

## Conventions and gotchas

- Import via the `@/*` alias (→ `src/*`); tests may use either that or relative paths.
- `.env` is gitignored, so **EAS cloud builds do not see local `EXPO_PUBLIC_*` vars** — register them with `eas env:create` or the build ships without them. Never put a secret in an `EXPO_PUBLIC_*` var (that includes the Supabase `service_role` key); Edge Function secrets go through `supabase secrets set`.
- The app must keep working with zero external services configured — guard every Supabase/RevenueCat call on `isSupabaseConfigured` / `isRevenueCatConfigured` (or the null `supabase` client).
- Purchases and native notification behavior do not work in Expo Go; use a development build (`npm run beta:android` then `npm run dev-client`).
- `docs/mvp-freeze.md` records the frozen 1.0 scope and its release checklist.
