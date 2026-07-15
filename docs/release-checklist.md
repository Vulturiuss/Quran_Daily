# Checklist de publication

Ce qui reste à faire **par toi** avant une soumission store. Le code est prêt ; ces
points demandent des identifiants ou des ressources que le dépôt ne peut pas contenir.

## 1. Variables d'environnement EAS (bloquant)

`.env` est gitignored : un build EAS ne le voit pas. Sans ces variables, l'app se
publie **entièrement déverrouillée** (pas de paywall, pas de compte, pas de sync).

`scripts/check-env.mjs` fait maintenant **échouer** un build `production` si elles
manquent (via le hook `eas-build-pre-install`), donc l'erreur est bruyante au lieu
d'être silencieuse. Le profil `preview` (APK de test) en est exempté : il ne passe
pas la revue des stores et Supabase seul suffit à garder `configured === true`.
Le script rejette aussi `EXPO_PUBLIC_REVENUECAT_TEST_KEY` en production (elle prime
sur la clé de plateforme et brancherait l'app sur le Test Store). Enregistre-les
une fois :

```bash
eas env:create --environment production   # répéter pour chaque variable
```

Variables exigées pour un build de release :

| Variable | Note |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | jamais la clé `service_role` |
| `EXPO_PUBLIC_REVENUECAT_IOS_KEY` | au moins une des deux clés plateforme |
| `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` | |
| `EXPO_PUBLIC_REVENUECAT_PREMIUM_ENTITLEMENT` | `premium` |
| `EXPO_PUBLIC_REVENUECAT_FAMILY_ENTITLEMENT` | `family` |
| `EXPO_PUBLIC_PRIVACY_URL` | URL **hébergée**, exigée par Apple et Google |
| `EXPO_PUBLIC_TERMS_URL` | idem |
| `EXPO_PUBLIC_SUPPORT_EMAIL` | sinon la politique de confidentialité affiche « adresse de support à configurer avant publication » |

Ne pas mettre `EXPO_PUBLIC_REVENUECAT_TEST_KEY` en production (clé Test Store).

## 2. `eas.json` → `submit.production` (bloquant)

Les valeurs `REMPLACER_PAR_*` sont des marqueurs, pas des identifiants :

- **iOS** : `appleId` (email du compte), `ascAppId` (identifiant App Store Connect),
  `appleTeamId`.
- **Android** : déposer le JSON du service account Google Play à
  `./google-play-service-account.json` (à **gitignorer**), ou pointer ailleurs.

## 3bis. Donner Premium à un testeur

Pas besoin de build spécial : créer un compte dans l’app, puis dans Supabase passer
`profiles.subscription_tier` de `free` à `premium` (ou `family`) pour cet utilisateur.
L’app le lit en temps réel (abonnement Realtime dans `SubscriptionProvider`).

Cela suppose que le build ait bien les variables Supabase — sans elles, `configured`
vaut `false` et l’app est déverrouillée pour tout le monde. C’est ce que `check-env`
empêche sur le profil `production` (le `preview` en est exempté volontairement).

## 3. Appliquer le nouveau schéma Supabase

`supabase/schema.sql` a changé (sécurité Famille). À rejouer dans le SQL Editor.
Il est idempotent, mais il **supprime** l'ancienne signature
`join_family_space(text, text)` : déployer le schéma **avant** l'app, sinon une
version installée continuera d'appeler l'ancienne fonction et recevra une erreur.

Changements : le rôle familial n'est plus accepté depuis le client (on rejoint
toujours comme enfant), une RPC `promote_family_member` réservée au propriétaire
la remplace, et le code d'invitation tourne automatiquement à chaque exclusion.

## 4. Ressources store (non bloquant techniquement)

- Captures d'écran iOS + Android, feature graphic 1024×500 (Play).
- Data Safety (Play) et Privacy Nutrition Labels (Apple) à remplir.
- Descriptions FR (l'app est mono-locale FR : pas d'i18n).

## 5. Hors périmètre, assumé

PostHog, widgets natifs, notifications push serveur, classement social, i18n EN.
Voir `docs/mvp-freeze.md`.
