# Quran Daily

Application mobile Expo de mémorisation progressive du Coran, construite à partir de
`quran_daily_specs.md`.

## Fonctionnalités livrées

- onboarding en cinq étapes;
- catalogue et texte complet des 114 sourates;
- 6 236 versets en arabe Uthmani, translittération et traduction française hors ligne;
- audio verset par verset Quran.com avec Mishary, Husary, Minshawi et Sudais;
- téléchargement temporaire des audios sur mobile et cache des références par récitateur;
- session quotidienne: révision SRS, apprentissage, validation et récapitulatif;
- persistance locale avec Zustand et AsyncStorage;
- compte Supabase facultatif avec synchronisation offline-first;
- paywall RevenueCat, restauration des achats et droits Premium;
- XP, niveaux, streak, badges et statistiques sur sept jours;
- rappels locaux configurables;
- interface Expo Router pour Android, iOS et web;
- thème vert nuit/or, polices Amiri et Nunito, RTL natif;
- icône Quran Daily 1024x1024.

## Démarrage

```bash
npm install
npm start
```

Puis utiliser `a` pour Android, `i` pour iOS sur macOS, ou `w` pour le web.

## Vérification

```bash
npm run check
npx expo-doctor
npx expo export --platform web
```

## Architecture

- `src/app`: routes et écrans Expo Router;
- `src/components`: composants d’interface;
- `src/store`: état persistant et orchestration des sessions;
- `src/utils/srs.ts`: répétition espacée inspirée de SM-2;
- `src/data`: métadonnées, versets hors ligne et badges;
- `src/services/quranApi.ts`: résolution et cache des audios Quran.com;
- `scripts/sync-quran-data.mjs`: régénération reproductible du corpus;
- `supabase/schema.sql`: schéma backend prêt à appliquer.

## Services externes

Le MVP est local-first pour les textes et fonctionne sans compte tiers. Supabase, RevenueCat,
PostHog et les widgets natifs nécessitent des projets et clés appartenant au propriétaire de
l’application. Les variables attendues sont documentées dans `.env.example`.

### Supabase

La synchronisation ne remplace jamais le stockage local. Les changements sont enregistrés
immédiatement dans AsyncStorage, marqués en attente, puis fusionnés avec un instantané privé
Supabase au retour du réseau. L’application fonctionne sans compte et sans variables Supabase.

1. Créer un projet Supabase.
2. Exécuter `supabase/schema.sql` dans le SQL Editor.
3. Créer un fichier `.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=votre-cle-publique
```

4. Redémarrer Expo:

```bash
npx expo start --clear
```

La clé publique/publishable peut être embarquée dans l’application car les accès sont protégés
par les politiques RLS. Ne jamais utiliser la clé `service_role` dans Expo.

### RevenueCat

L’application reste complètement déverrouillée si aucune clé RevenueCat n’est fournie. Dès que
RevenueCat est configuré, l’offre gratuite donne accès à Al-Fatiha et aux neuf dernières sourates,
à trois révisions quotidiennes, à Mishary et au streak. L’entitlement `premium` débloque les
114 sourates, les récitateurs alternatifs et les statistiques détaillées.

Configuration recommandée dans RevenueCat:

1. Créer les applications iOS et Android avec `com.qurandaily.app`.
2. Créer l’entitlement `premium`.
3. Créer les produits mensuel et annuel dans le Test Store, App Store Connect et Google Play.
4. Attacher ces produits à `premium`.
5. Créer une offering et la définir comme offering courante.
6. Pendant le développement, ajouter la clé Test Store:

```bash
EXPO_PUBLIC_REVENUECAT_TEST_KEY=...
EXPO_PUBLIC_REVENUECAT_PREMIUM_ENTITLEMENT=premium
```

Les achats réels ne fonctionnent pas dans Expo Go. Créer un development build:

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile development
npm run dev-client
```

Sur iOS, utiliser `--platform ios` ou le profil `ios-simulator`. L’offre Famille reste désactivée
avec `EXPO_PUBLIC_ENABLE_FAMILY_PLAN=false` tant que les profils enfants ne sont pas livrés.

Les audios nécessitent une connexion lors de la première lecture. Pour régénérer le corpus depuis
les API officielles Quran.com:

```bash
npm run sync:quran
```

Sources de contenu: API Quran.com v4, texte Uthmani, traduction française Muhammad Hamidullah
(ressource 31), translittération (ressource 57), récitations Quran.com/QuranicAudio.

Ne jamais placer de clé secrète dans une variable `EXPO_PUBLIC_*`.
