# MVP freeze

Date: 2026-07-10
Nom: Quran Daily MVP
Version app: `1.0.0`

## Perimetre gele

- Onboarding complet avec choix du rythme, sourates connues, sourate suivante et rappels.
- Home orientee retention: streak, mission du jour, progression, prochaine recompense.
- Revision quotidienne dediee: sourates dues, derniere revision, difficulte, temps estime.
- Apprentissage guide: etude, test memoire, validation.
- Fin de session: XP, streak, badges, partage, prochaine session.
- Bibliotheque 114 sourates hors ligne.
- Audio Quran.com avec cache et recitateurs.
- Supabase optionnel: auth, sync snapshot, suppression compte.
- RevenueCat optionnel: paywall, restore, droits premium/famille.
- Famille: espace parent/enfant via RPC Supabase.
- Legal: confidentialite et conditions.

## Checks de gel

```powershell
npm.cmd run typecheck
npm.cmd test
npx.cmd expo-doctor
npx.cmd expo install --check
```

Etat attendu:

- TypeScript: OK
- Tests unitaires/metier: OK
- Expo Doctor: 21/21
- Expo dependencies: up to date

## Points hors gel

- Validation finale achats stores Apple/Google sur comptes test.
- Validation iOS physique hors Windows.
- Validation audio et notifications sur vrais appareils.
- Audit `npm audit` des vulnerabilites moderees.
- Event analytics PostHog.
- Widget iOS/Android.
