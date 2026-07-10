# Beta device pass

Date cible: 2026-07-10
App: Quran Daily
Bundle/app id: `com.qurandaily.app`
Scheme: `qurandaily`

## Prerequis

- EAS CLI authentifie sur le compte du projet.
- Android physique avec compte test Google Play si achat reel teste.
- iPhone physique enregistre dans Apple Developer pour un dev build iOS.
- `.env` configure avec les cles Supabase et RevenueCat de test.
- `supabase/schema.sql` applique.
- `supabase/functions/revenuecat-webhook` deployee si le test paywall doit synchroniser `profiles.subscription_tier`.
- Maestro installe localement pour les flows e2e appareil.

## Validations automatiques avant appareil

```powershell
npm.cmd run typecheck
npm.cmd test
npx.cmd expo-doctor
npx.cmd expo install --check
```

## Builds de developpement

```powershell
npm run beta:android
npm run beta:ios
npm run beta:ios-simulator
```

Installer le build genere sur chaque appareil, puis lancer Metro:

```powershell
npm run dev-client
```

## Passe appareil manuelle

### Android

- Onboarding local: prenom, sourates connues, sourate suivante, objectif, rappel.
- Permission notifications: accepter, refuser, puis reactiver depuis reglages systeme.
- Session quotidienne: apprentissage jusqu'a l'ecran de fin.
- Audio: lecture, pause, repetition x3, changement de recitateur premium bloque/debloque.
- Paywall: page premium, selection d'offre, restauration, annulation utilisateur.
- Auth: inscription, connexion, deconnexion, suppression locale.
- Sync: terminer une session, synchroniser, reinstaller ou changer d'appareil, verifier la restauration.
- Reset: reglages, reinitialisation, retour onboarding.

### iOS

- Reprendre la meme matrice Android.
- Verifier le prompt notification iOS et le retour depuis notification.
- Verifier Apple Sign In si active dans Supabase/Auth.
- Verifier que l'achat ne s'ouvre pas dans Expo Go mais uniquement dans le dev build.

## Flows Maestro

Les flows sont dans `e2e/maestro`.

```powershell
npm run e2e:maestro
```

Flow auth/sync avec compte test:

```powershell
maestro test e2e/maestro/auth-sync.yaml -e TEST_EMAIL="qa@example.com" -e TEST_PASSWORD="secret123"
```

## Critere de gel beta

- Tous les checks automatiques passent.
- Android dev build installe et ouvre l'app.
- iOS dev build installe et ouvre l'app.
- Au moins un compte Supabase test synchronise une session complete.
- Paywall affiche les offres RevenueCat de test ou le message de configuration attendu.
- Aucun blocage critique sur onboarding, session, complete, reset.
