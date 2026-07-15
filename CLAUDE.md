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

**Routing.** Expo Router with `src/app` as the routes dir and typed routes enabled. `src/app/_layout.tsx` nests the provider stack in a fixed order — `SafeAreaProvider → CloudProvider → FamilyProvider → ReminderProvider → SubscriptionProvider → GamificationProvider → ThemeProvider → AudioProvider`. That order is load-bearing: `SubscriptionProvider` reads `useCloud()` and `useFamily()`, and `ThemeProvider` reads `useSubscription()` because themes are a Premium feature.

**State.** `src/store/useQuranStore.ts` is the single Zustand store, persisted to AsyncStorage (`quran-daily-state`, currently `version: 10`). It owns onboarding, per-surah progress, stats, session history, the active session, and `syncMeta`. Every mutating action must also set `syncMeta` via `changedNow(...)` — that dirty flag is what triggers a cloud push. Bumping the persisted shape means bumping `version` and extending `migrate`.

**Sessions.** A day's work is one `ActiveSession` (review queue + verses to learn) built by `startDailySession(access)`, where `access` (from `sessionAccess()`) carries the freeze allowance and which of the surahs learnt in parallel to work on. Screens live in `src/app/session/{review,learn,complete}.tsx`. `completeDailySession()` computes XP, streak, badges, and the history record; it credits `session.date`, not today, and earns nothing when nothing was reviewed or learnt. A second session on the same day is automatically a bonus (no streak/daily XP credit) regardless of the `isBonus` flag. `src/utils/sessionPlan.ts` builds the *preview* of the same plan for the home screen — keep the two in sync.

**Learning several surahs.** Up to `capabilities().maxLearningSurahs` surahs can be in the `learning` state at once (1 free, 3 with Premium). `updatedAt` doubles as the activation order, so it must stay strictly increasing — `setLearningSurah` enforces that, and the oldest surah steps aside when the limit is reached. `src/utils/learningQueue.ts` heals corrupted state (a surah that promoted itself and stayed pinned at 100%); it runs in the persist migration and on every incoming cloud snapshot.

**SRS.** `src/utils/srs.ts`, an SM-2 variant on whole surahs (not verses): ease clamped to [1.3, 3.0], interval capped at 180 days, ratings are `good | hard | forgot`.

**Cloud sync (optional).** Supabase, and offline-first: local AsyncStorage is always the source of truth; nothing blocks on the network. `CloudProvider` debounces a sync, then reads/merges/writes a single JSON snapshot row in `user_state_snapshots` using optimistic concurrency (a `revision` column, retried up to 3×). `src/utils/sync.ts` does the field-level merge (last-write-wins per surah on `updatedAt`, `Math.max` for monotonic stats, union of badges/history). `src/utils/cloudIdentity.ts` decides whether a login merges local data or resets to the remote account — the guard that stops one user's progress leaking into another's. If Supabase env vars are absent the whole layer is inert (`status: 'disabled'`).

**Family.** Parent/child shared spaces, entirely through Supabase RPCs (`get_my_family_context`, `create_family_space`, `join_family_space`, …) defined in `supabase/schema.sql`. `family_members` has an RLS policy denying direct access — go through the RPCs in `src/services/family.ts`.

**Monetization.** RevenueCat via `SubscriptionProvider`, plus a `subscription_tier` mirror on the Supabase `profiles` row kept current by `supabase/functions/revenuecat-webhook`. Premium is granted if *either* source says so. **With no RevenueCat key configured the app is fully unlocked** (`hasFullAccess = !configured || isPremium`) — `scripts/check-env.mjs` fails a release build that would ship in that state.

**Never gate content.** The app is fully usable for free: all 114 surahs, learning and reviewing, with no daily cap. `src/utils/access.ts` is the single definition of what each tier may do — `capabilities()` returns `maxLearningSurahs` (1 / 3), `allReciters`, `allThemes`, `stats` and `freezeAllowance`. Premium sells capacity and comfort, Family shares it with 5 members. A test asserts no surah is gated; do not reintroduce per-surah locks.

**Theme.** Seven palettes in `src/theme.ts`, each a `ThemeSeed` of 7 values — adding a theme is one entry, everything structural is derived. **Colour literals belong in `theme.ts` and nowhere else**; `src/theme.test.ts` fails the build otherwise, and also enforces 4.5:1 text contrast on every theme. Build translucent colours with `withAlpha(colors.token, a)`. Use `colors.ink` — not `colors.white` — for neutral veils and hairlines: it flips with the theme's `scheme`, so a light theme's hairlines stay visible. Themes are Premium; free users render the default palette while their choice is preserved in the profile. Design rules are in `design-system.md`.

## Conventions and gotchas

- Import via the `@/*` alias (→ `src/*`); tests may use either that or relative paths.
- `.env` is gitignored, so **EAS cloud builds do not see local `EXPO_PUBLIC_*` vars** — register them with `eas env:create` or the build ships without them. Never put a secret in an `EXPO_PUBLIC_*` var (that includes the Supabase `service_role` key); Edge Function secrets go through `supabase secrets set`.
- The app must keep working with zero external services configured — guard every Supabase/RevenueCat call on `isSupabaseConfigured` / `isRevenueCatConfigured` (or the null `supabase` client).
- Purchases and native notification behavior do not work in Expo Go; use a development build (`npm run beta:android` then `npm run dev-client`).
- `docs/mvp-freeze.md` records the frozen 1.0 scope and its release checklist.
