# 📱 QURAN DAILY — Cahier des Charges Complet
### Document de spécifications pour développement mobile (React Native / Flutter)
**Version :** 1.0  
**Date :** Juin 2026  
**Statut :** Prêt pour développement

---

## Table des Matières

1. [Vision & Concept](#1-vision--concept)
2. [Analyse de Marché](#2-analyse-de-marché)
3. [Modèle Économique](#3-modèle-économique)
4. [Architecture Fonctionnelle](#4-architecture-fonctionnelle)
5. [Spécifications UX/UI](#5-spécifications-uxui)
6. [Système de Gamification](#6-système-de-gamification)
7. [Système de Notifications & Widget](#7-système-de-notifications--widget)
8. [Spécifications Techniques](#8-spécifications-techniques)
9. [Base de Données & Modèles](#9-base-de-données--modèles)
10. [Écrans & Flux Utilisateur](#10-écrans--flux-utilisateur)
11. [Plan de Lancement 7 Jours](#11-plan-de-lancement-7-jours)
12. [Projections Financières](#12-projections-financières)

---

## 1. Vision & Concept

### 1.1 Le Problème

Les musulmans modernes veulent maintenir un lien avec le Coran mais font face à trois obstacles majeurs :

- **L'oubli** : pas de rappel naturel dans la journée pour réciter
- **La distraction** : le téléphone est un outil de distraction (TikTok, Instagram) plutôt que de spiritualité
- **L'abandon** : les apps gratuites/freemium ne créent pas assez d'engagement pour durer au-delà de 2-3 jours

### 1.2 La Solution

**Quran Daily** est une application mobile de mémorisation progressive du Coran, conçue comme Duolingo mais pour les sourates. Elle transforme le téléphone — source de distraction — en outil de connexion spirituelle quotidienne.

### 1.3 Proposition de Valeur Unique

> *"5 minutes par jour pour ne jamais oublier tes sourates"*

- Révision quotidienne des sourates déjà connues (algorithme de répétition espacée)
- Apprentissage progressif verset par verset d'une nouvelle sourate
- Expérience 100% in-app : pas de redirection, pas de distraction
- Gamification poussée pour créer une habitude durable
- Le prix (abonnement payant) crée une pression psychologique positive pour s'y tenir

### 1.4 Positionnement

| Concurrent | Faiblesse | Notre avantage |
|---|---|---|
| Quran.com | Lecture passive, pas de mémorisation guidée | Apprentissage actif + gamification |
| Muslim Pro | App fourre-tout, pas de focus mémorisation | Ultra-focalisé, expérience propre |
| Tarteel | IA complexe, intimidant pour débutants | Simple, progressif, accessible |
| Duolingo | Pas de Coran | Même mécanique, même engagement |

---

## 2. Analyse de Marché

### 2.1 Taille du Marché

- **1,8 milliard** de musulmans dans le monde
- **~5 millions** de musulmans en France
- **~250 millions** de musulmans en Europe et Amérique du Nord (cible principale app stores)
- Marché des apps islamiques : **+900M$** estimés, forte croissance post-COVID

### 2.2 Cible Principale

**Persona 1 — "Le Musulman Connecté"**
- 18-35 ans, né en France/Europe/Amérique du Nord
- Pratiquant mais pas hafiz (pas de mémorisation complète)
- Connaît quelques sourates (Al-Fatiha, Al-Ikhlas, Al-Falaq, An-Nas…)
- Veut progresser mais manque de structure et de motivation
- Très présent sur TikTok, Instagram, YouTube
- Prêt à payer pour un outil qui l'aide à progresser (comparable à Spotify, Netflix)

**Persona 2 — "Le Parent Motivé"**
- 30-50 ans
- Veut que ses enfants apprennent le Coran
- Cherche un outil éducatif digital de qualité
- Prêt à payer un abonnement famille (modèle comme celui de l'ami)

**Persona 3 — "Le Revenant"**
- 25-45 ans
- A appris des sourates enfant, les a oubliées
- Veut renouer avec sa pratique religieuse
- Motivé par la culpabilité positive et la nostalgie

### 2.3 Stratégie d'Acquisition

**Phase 1 — Créateurs de Contenu (Organique)**
- Partenariat avec des influenceurs islamiques sur TikTok/Instagram/YouTube (micro et macro)
- Format : témoignages authentiques, routines matinales, "day in my life" muslim
- Coût : offrir l'app gratuite + commission affiliation ou rémunération fixe

**Phase 2 — Publicité Payante (Meta Ads)**
- Ciblage : musulmans, intérêts Coran/Islam/mosquée
- Format : vidéo courte montrant l'app en action
- Message : "J'ai arrêté d'oublier mes sourates grâce à 5 min par jour"

**Phase 3 — ASO (App Store Optimization)**
- Mots-clés : "mémorisation coran", "apprendre sourates", "hifz app", "quran memorization"
- Reviews et ratings dès le lancement

---

## 3. Modèle Économique

### 3.1 Offres d'Abonnement

#### 🆓 Gratuit (Freemium)
- Accès aux 10 premières sourates courtes (Juz Amma partiel)
- Révision quotidienne basique (3 sourates max)
- Statistiques limitées (streak uniquement)
- Publicités légères (inter-sessions uniquement, jamais pendant la récitation)

#### ⭐ Premium Individuel — 2,99€/mois ou 19,99€/an
- Toutes les 114 sourates
- Révision illimitée
- Statistiques complètes et graphiques de progression
- Tous les badges et récompenses débloqués
- Mode hors-ligne complet
- Pas de publicités
- Audio de récitation par plusieurs récitateurs (Mishary, Al-Afasy, etc.)

#### 👨‍👩‍👧 Premium Famille — 5,99€/mois ou 39,99€/an
- Jusqu'à 5 comptes (1 parent + enfants)
- Tableau de bord parent : voir la progression des enfants
- Mode enfant adapté (plus lent, plus ludique, fond coloré)
- Notifications parent quand l'enfant complète sa session
- Classement familial (qui a le plus grand streak ?)

### 3.2 Projections de Revenus

| Utilisateurs Premium | MRR | ARR |
|---|---|---|
| 500 | 1 500€ | 18 000€ |
| 1 000 | 3 000€ | 36 000€ |
| 2 500 | 7 500€ | 90 000€ |
| 5 000 | 15 000€ | 180 000€ |
| 10 000 | 30 000€ | 360 000€ |

*Objectif réaliste à 6 mois : 1 000 abonnés Premium = 3 000€/mois*  
*Objectif 12 mois : 5 000 abonnés = 15 000€/mois*

### 3.3 Structure des Coûts

| Poste | Coût mensuel estimé |
|---|---|
| Serveur (Supabase/Firebase) | 25-50€ |
| App Store (Apple) | 8€/mois (~99$/an) |
| Google Play | 0€ (frais unique 20$) |
| Marketing (ads) | 200-500€ |
| Stripe/RevenueCat (fees) | ~3% des revenus |
| **Total charges** | **~300-600€/mois** |

**Break-even : ~200 abonnés Premium** (600€ charges / 3€ = 200 abonnés)

---

## 4. Architecture Fonctionnelle

### 4.1 Vue d'Ensemble des Modules

```
QURAN DAILY
├── 🏠 Home Dashboard
│   ├── Session du jour (sourate à réviser)
│   ├── Progression apprentissage sourate en cours
│   ├── Streak du jour
│   └── Résumé stats rapides
│
├── 📖 Module Révision
│   ├── Algorithme SRS (Spaced Repetition System)
│   ├── Sélection sourates connues à réviser
│   ├── Lecture in-app (texte arabe + translittération + traduction)
│   ├── Audio récitation (optionnel)
│   └── Validation (je la connais / je la révise encore)
│
├── 🎓 Module Apprentissage
│   ├── Sourate en cours d'apprentissage
│   ├── Affichage verset par verset
│   ├── Audio verset par verset (repeat mode)
│   ├── Test de mémorisation (cacher le texte)
│   └── Validation et passage au verset suivant
│
├── 📚 Bibliothèque Sourates
│   ├── Liste des 114 sourates
│   ├── Statut : "Connue" / "En cours" / "À apprendre"
│   ├── Choisir prochaine sourate à apprendre
│   └── Détails sourate (nb versets, révélation, signification)
│
├── 📊 Statistiques & Progression
│   ├── Streak actuel et record
│   ├── Sourates connues (liste)
│   ├── Graphique de révision (7j / 30j / all time)
│   ├── Temps total récité
│   └── Badges débloqués
│
├── 🏆 Gamification
│   ├── Système XP et niveaux
│   ├── Badges et trophées
│   ├── Classements (mondial, amis)
│   └── Défis hebdomadaires
│
├── ⚙️ Paramètres
│   ├── Objectif quotidien (nb de versets par session)
│   ├── Choix du récitateur
│   ├── Heure des rappels (notifications)
│   ├── Langue (FR / EN / AR)
│   ├── Mode nuit
│   └── Abonnement (gérer, annuler, upgrade)
│
└── 👨‍👩‍👧 Espace Famille (Premium Famille)
    ├── Dashboard parent
    ├── Gestion comptes enfants
    └── Rapports de progression
```

### 4.2 Flux Principal de l'Utilisateur

```
Ouverture app
    │
    ▼
[Session déjà faite aujourd'hui ?]
    │
    ├─ OUI → Écran récapitulatif + option "session bonus"
    │
    └─ NON → Dashboard avec session du jour
                │
                ▼
         [Révision d'abord]
         Sourates connues à réviser selon SRS
         (1 à 3 sourates selon objectif utilisateur)
                │
                ▼
         [Apprentissage ensuite]
         1 à 5 versets de la sourate en cours
         (selon objectif utilisateur)
                │
                ▼
         [Écran de fin de session]
         - Confetti + animation
         - XP gagnés
         - Streak mis à jour
         - Badge éventuel débloqué
```

---

## 5. Spécifications UX/UI

### 5.1 Principes de Design

- **Minimalisme spirituel** : fond sombre (vert nuit ou bleu nuit), dorures, typographie arabe soignée
- **0 distraction** : pendant une session, aucun lien externe, aucune pub, plein écran
- **Mobile-first** : tout doit être utilisable d'une main, en 5 minutes
- **Feedback immédiat** : chaque action génère une récompense visuelle ou sonore
- **Accessibilité** : texte arabe ajustable (3 tailles), mode clair/nuit

### 5.2 Palette de Couleurs

```
Primaire :      #1A3A2A  (Vert nuit profond — fond principal)
Secondaire :    #2D5A3D  (Vert émeraude — cartes, éléments)
Accent Or :     #D4AF37  (Or islamique — titres, accents, étoiles)
Accent Clair :  #E8F5E9  (Vert très clair — textes secondaires)
Blanc :         #F5F5F0  (Blanc cassé — texte arabe)
Erreur :        #E57373  (Rouge doux)
Succès :        #81C784  (Vert succès)
```

**Alternative thème clair (optionnelle) :**
```
Fond :          #FAFAF5
Primaire :      #2D5A3D
Texte :         #1A1A1A
```

### 5.3 Typographie

- **Texte Arabe** : `Amiri` ou `Scheherazade New` (Google Fonts, RTL natif)
- **Translittération** : `Roboto` ou `Nunito` — claire et légère
- **Traduction** : `Roboto` taille standard
- **UI Générale** : `Nunito` — ronde, moderne, friendly (comme Duolingo)

### 5.4 Icônes & Illustrations

- Style : ligne fine dorée sur fond sombre, motifs géométriques islamiques
- Pas de représentations humaines ou animales
- Icônes UI : Lucide Icons ou Phosphor Icons
- Illustrations : croissants, étoiles, motifs arabesque, mosquée stylisée

### 5.5 Animations

- **Confetti** à la fin d'une session : petits croissants et étoiles dorées
- **Flame animée** pour le streak (comme Duolingo)
- **Cercle de progression** qui se remplit (pour les versets)
- **Slide/Swipe** pour passer d'un verset à l'autre
- **Pulse doré** quand un badge est débloqué

---

## 6. Système de Gamification

### 6.1 Points XP

| Action | XP gagnés |
|---|---|
| Compléter sa session du jour | +50 XP |
| Réviser une sourate | +10 XP par sourate |
| Apprendre un nouveau verset | +20 XP |
| Valider une sourate complète apprise | +200 XP |
| Maintenir son streak (7 jours) | +100 XP bonus |
| Maintenir son streak (30 jours) | +500 XP bonus |
| Session parfaite (toutes sourates révisées sans erreur) | +50 XP bonus |

### 6.2 Niveaux

| Niveau | Nom | XP requis |
|---|---|---|
| 1 | Débutant (مبتدئ) | 0 XP |
| 2 | Récitant (قارئ) | 200 XP |
| 3 | Apprenant (متعلم) | 600 XP |
| 4 | Mémorisateur (حافظ) | 1 500 XP |
| 5 | Gardien (حارس) | 3 000 XP |
| 6 | Maître (أستاذ) | 6 000 XP |
| 7 | Lumière (نور) | 12 000 XP |
| 8 | Gardien du Coran (حافظ القرآن) | 25 000 XP |

### 6.3 Badges

#### Badges de Régularité
- 🔥 **Première étincelle** : 3 jours consécutifs
- 🔥🔥 **En feu** : 7 jours consécutifs
- 🌙 **Lunaire** : 30 jours consécutifs
- ⭐ **Constant** : 100 jours consécutifs
- 🌟 **Légende** : 365 jours consécutifs

#### Badges de Mémorisation
- 📖 **Premier pas** : 1ère sourate apprise
- 📚 **Juz' Amma** : 10 sourates courtes apprises
- 🕌 **Pèlerin** : 25 sourates apprises
- 👑 **Hafiz en chemin** : 50 sourates apprises
- 💎 **Hafiz** : 114 sourates apprises (toutes !)

#### Badges Spéciaux
- 🌄 **Fajr** : Session complétée avant 7h du matin
- 🌙 **Isha** : Session complétée après 22h
- ⚡ **Éclair** : Session complétée en moins de 3 minutes
- 🎯 **Perfectionniste** : 10 sessions parfaites d'affilée
- 🤝 **Famille** : 7 jours avec tous les membres de la famille actifs

### 6.4 Système de Streak

- Le **streak** est l'élément central (comme Duolingo)
- Visible en permanence dans l'header de l'app
- Une flamme animée qui grandit avec le streak
- **Freeze de streak** : 1 freeze gratuit par mois (Premium : 3 freezes)
- Notification de rappel de streak si l'utilisateur n'a pas fait sa session à l'heure définie

### 6.5 Classements

- **Classement mondial** : top 50 utilisateurs par XP de la semaine
- **Classement amis** : parmi les amis connectés (lien d'invitation)
- **Classement famille** (Premium Famille uniquement)
- Réinitialisation hebdomadaire (comme Duolingo)
- Protégé contre la triche : XP max par jour plafonné

---

## 7. Système de Notifications & Widget

### 7.1 Notifications Push

#### Rappel quotidien (configurable)
- Heure choisie par l'utilisateur lors de l'onboarding
- Message rotatif parmi une liste de messages inspirants :
  - *"🌙 Ta session du jour t'attend. 5 minutes pour ton âme."*
  - *"📖 N'oublie pas ta récitation du jour. Tu étais si régulier !"*
  - *"⭐ Streak en danger ! Fais ta session avant minuit."*
  - *"🔥 X jours de streak ! Ne laisse pas tomber maintenant."*

#### Rappel de streak (si session non faite)
- Envoyé 2h avant minuit si la session n'est pas complétée
- Message : *"⚠️ Ton streak de X jours se termine dans 2 heures !"*

#### Félicitations
- Quand un badge est débloqué : notification immédiate
- Quand une sourate est validée comme apprise
- Anniversaires de streak (7j, 30j, 100j)

#### Notifications famille (Premium Famille)
- Parent notifié quand l'enfant complète sa session
- Rappel si un enfant n'a pas fait sa session

### 7.2 Widget iOS & Android

**Widget petit (2x2)**
- Streak actuel (flamme + nombre)
- Bouton "Commencer la session"

**Widget moyen (4x2)**
- Streak actuel
- Sourate du jour à réviser
- Barre de progression session
- Bouton "Commencer"

**Widget grand (4x4)**
- Toutes les infos du widget moyen
- Un verset du jour (court, en arabe + traduction)
- Prochaine sourate à apprendre

> Le widget est critique : il permet à l'app d'être présente sur l'écran d'accueil sans que l'utilisateur ouvre TikTok avant.

---

## 8. Spécifications Techniques

### 8.1 Stack Recommandée

**Framework Mobile :** React Native (Expo) ou Flutter
- Recommandation : **React Native + Expo** pour rapidité de développement
- Cross-platform iOS + Android dès le départ

**Backend :** Supabase (PostgreSQL + Auth + Storage + Realtime)
- Authentification : email/password + Apple Sign In + Google Sign In
- Base de données : PostgreSQL
- Storage : fichiers audio des récitations

**Paiement :** RevenueCat
- Gestion unifiée des abonnements iOS (StoreKit) et Android (Play Billing)
- Dashboard analytics intégré
- Facile à implémenter, standard de l'industrie

**Notifications :** Expo Notifications (Firebase FCM en dessous)

**Analytics :** PostHog (open-source) ou Mixpanel

**Audio :** Expo AV ou react-native-track-player

**Contenu Arabe :** Intégration API Quran.com (gratuite) ou données locales (bundled)

### 8.2 Sources de Données Coran

**Option A — API Quran.com (recommandée)**
- API REST gratuite et complète
- Tous les textes arabes, translittérations, traductions (FR inclus)
- Fichiers audio de nombreux récitateurs
- Documentation : `https://api.quran.com/api/v4`

**Option B — Données locales bundled**
- Inclure les données JSON dans l'app
- Avantage : fonctionne hors-ligne dès le premier lancement
- Inclure les 114 sourates en arabe + traduction française + translittération

**Recommandation : Hybride**
- Bundler les données texte (léger, ~5MB)
- Streamer les audios via API ou CDN (lourds)
- Cache local des audios récemment écoutés

### 8.3 Algorithme SRS (Spaced Repetition System)

Basé sur l'algorithme **SM-2** (même base que Anki) :

```
Pour chaque sourate "connue" :
  - Intervalle initial : 1 jour
  - Si bien révisée : intervalle × facteur (facteur initial = 2.5)
  - Si mal révisée : retour à 1 jour
  - Intervalle max : 30 jours
  - Afficher en priorité : sourates dont l'intervalle est échu
```

Simplification pour UX :
- L'utilisateur valide chaque sourate révisée avec 3 boutons :
  - ✅ "Je la connais bien" → intervalle augmente
  - 😅 "À retravailler" → intervalle réduit de moitié
  - ❌ "Je l'ai oubliée" → retour à 1 jour

### 8.4 Architecture de l'App

```
src/
├── app/                    # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx       # Home Dashboard
│   │   ├── revise.tsx      # Module Révision
│   │   ├── learn.tsx       # Module Apprentissage
│   │   ├── library.tsx     # Bibliothèque Sourates
│   │   └── stats.tsx       # Statistiques
│   ├── session/
│   │   ├── review.tsx      # Écran révision active
│   │   └── learn.tsx       # Écran apprentissage actif
│   ├── onboarding/
│   │   ├── welcome.tsx
│   │   ├── select-surahs.tsx   # Sourates déjà connues
│   │   ├── set-goal.tsx        # Objectif quotidien
│   │   └── notifications.tsx   # Réglage notifications
│   └── settings/
│       ├── index.tsx
│       ├── subscription.tsx
│       └── family.tsx
│
├── components/
│   ├── ArabicText.tsx          # Composant texte arabe (RTL, font, taille)
│   ├── VerseCard.tsx           # Carte verset avec arabe + trad + audio
│   ├── StreakBadge.tsx         # Badge streak animé
│   ├── XPBar.tsx               # Barre XP et niveau
│   ├── SurahCard.tsx           # Carte sourate (liste bibliothèque)
│   ├── SessionComplete.tsx     # Écran fin de session (confetti)
│   ├── AudioPlayer.tsx         # Lecteur audio verset/sourate
│   └── ProgressCircle.tsx      # Cercle de progression
│
├── hooks/
│   ├── useSession.ts           # Logique session du jour
│   ├── useSRS.ts               # Algorithme répétition espacée
│   ├── useStreak.ts            # Gestion streak
│   ├── useXP.ts                # Gestion XP et niveaux
│   ├── useSubscription.ts      # RevenueCat
│   └── useAudio.ts             # Playback audio
│
├── stores/
│   ├── userStore.ts            # Zustand : profil utilisateur
│   ├── progressStore.ts        # Progression par sourate
│   └── sessionStore.ts         # Session du jour en cours
│
├── services/
│   ├── supabase.ts             # Client Supabase
│   ├── quranApi.ts             # Client API Quran.com
│   ├── notifications.ts        # Gestion notifications push
│   └── revenuecat.ts           # Abonnements
│
├── data/
│   ├── surahs.json             # Liste 114 sourates (metadata)
│   ├── quran_fr.json           # Textes arabes + traduction FR bundled
│   └── badges.ts               # Définition tous les badges
│
└── utils/
    ├── srs.ts                  # Algorithme SM-2
    ├── arabic.ts               # Utilitaires texte arabe
    └── date.ts                 # Gestion streaks et dates
```

---

## 9. Base de Données & Modèles

### 9.1 Tables Supabase

```sql
-- Utilisateurs (étend auth.users de Supabase)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 'free' | 'premium' | 'family'
  subscription_expires_at TIMESTAMPTZ,
  family_id UUID,
  is_parent BOOLEAN DEFAULT false,
  daily_goal_verses INT DEFAULT 3,      -- Nb versets à apprendre par jour
  daily_goal_reviews INT DEFAULT 3,     -- Nb sourates à réviser par jour
  preferred_reciter TEXT DEFAULT 'mishary', -- ID récitateur
  notification_time TIME DEFAULT '20:00', -- Heure rappel quotidien
  timezone TEXT DEFAULT 'Europe/Paris',
  language TEXT DEFAULT 'fr',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progression par sourate pour chaque utilisateur
CREATE TABLE surah_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  surah_number INT NOT NULL,            -- 1 à 114
  status TEXT DEFAULT 'locked',        -- 'locked' | 'learning' | 'known'
  verses_learned INT DEFAULT 0,        -- Nb versets mémorisés
  total_verses INT NOT NULL,           -- Nb total versets de la sourate
  -- SRS fields
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  review_interval_days INT DEFAULT 1,  -- Intervalle actuel SRS
  ease_factor FLOAT DEFAULT 2.5,       -- Facteur facilité SRS (SM-2)
  review_count INT DEFAULT 0,          -- Nb fois révisée
  -- Timestamps
  started_learning_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, surah_number)
);

-- Sessions quotidiennes
CREATE TABLE daily_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  duration_seconds INT DEFAULT 0,
  xp_earned INT DEFAULT 0,
  surahs_reviewed INT DEFAULT 0,
  verses_learned INT DEFAULT 0,
  is_perfect BOOLEAN DEFAULT false,    -- Session parfaite (tout bon)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_date)
);

-- Streaks
CREATE TABLE streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_session_date DATE,
  freeze_count INT DEFAULT 1,          -- Freeze disponibles
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- XP et niveaux
CREATE TABLE user_xp (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_xp INT DEFAULT 0,
  current_level INT DEFAULT 1,
  weekly_xp INT DEFAULT 0,             -- Reset chaque lundi
  week_start DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges débloqués
CREATE TABLE user_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,              -- ID du badge (ex: 'streak_7', 'surahs_10')
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Groupes famille
CREATE TABLE families (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT,
  owner_id UUID REFERENCES profiles(id),
  invite_code TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 9.2 Modèles Frontend (TypeScript)

```typescript
// Types principaux

interface Surah {
  number: number;          // 1-114
  name: string;            // Nom arabe (الفاتحة)
  nameTranslit: string;    // Translittération (Al-Fatiha)
  nameFr: string;          // Traduction française (L'Ouverture)
  totalVerses: number;     // Nombre de versets
  revelationType: 'meccan' | 'medinan';
  description?: string;    // Brève description
}

interface Verse {
  surahNumber: number;
  verseNumber: number;
  textArabic: string;      // Texte arabe complet
  textTranslit: string;    // Translittération
  textFr: string;          // Traduction française
  audioUrl?: string;       // URL audio du verset
}

interface UserSurahProgress {
  surahNumber: number;
  status: 'locked' | 'learning' | 'known';
  versesLearned: number;
  totalVerses: number;
  nextReviewAt?: Date;
  reviewIntervalDays: number;
  easeFactor: number;
}

interface DailySession {
  date: string;            // YYYY-MM-DD
  completed: boolean;
  surahsToReview: number[];     // Sourates à réviser aujourd'hui (SRS)
  currentLearningSurah?: number; // Sourate en cours d'apprentissage
  versesToLearn: number;        // Nb versets à apprendre aujourd'hui
}

interface UserStats {
  currentStreak: number;
  longestStreak: number;
  totalXP: number;
  currentLevel: number;
  weeklyXP: number;
  surahsKnown: number;
  totalSessions: number;
  badges: string[];
}
```

---

## 10. Écrans & Flux Utilisateur

### 10.1 Onboarding (5 écrans max)

**Écran 1 — Bienvenue**
- Logo + nom "Quran Daily"
- Tagline : "Récite chaque jour. N'oublie jamais."
- CTA : "Commencer" / "J'ai déjà un compte"

**Écran 2 — Sélection des sourates connues**
- Question : "Quelles sourates est-ce que tu connais déjà ?"
- Liste scrollable des sourates courtes (Juz Amma) avec checkboxes
- Boutons rapides : "Je ne connais rien encore" / "Je connais Al-Fatiha et les courtes"
- Ces sourates sont ajoutées directement en statut "known"

**Écran 3 — Choix de la sourate à apprendre**
- "Quelle sourate veux-tu apprendre en premier ?"
- Suggestions basées sur ce qui n'est pas encore coché
- Ou laisser l'app décider (ordre traditionnel : Al-Fatiha → Al-Nas → Al-Falaq…)

**Écran 4 — Objectif quotidien**
- Slider : "Combien de minutes par jour ?" (3min / 5min / 10min / 15min)
- Traduit en : X sourates à réviser + Y versets à apprendre
- Message rassurant : "5 minutes par jour, c'est déjà énorme. On commence petit."

**Écran 5 — Notifications**
- "À quelle heure veux-tu ton rappel quotidien ?"
- Time picker
- Activer/désactiver
- CTA : "C'est parti !" → Home Dashboard

### 10.2 Home Dashboard

```
┌─────────────────────────────────┐
│  Assalamu Alaykum, [Prénom]  🔥42│
│                                 │
│  ┌─────────────────────────┐   │
│  │  SESSION DU JOUR        │   │
│  │  3 sourates à réviser   │   │
│  │  2 versets à apprendre  │   │
│  │                         │   │
│  │  [COMMENCER MA SESSION] │   │
│  └─────────────────────────┘   │
│                                 │
│  En cours d'apprentissage :     │
│  📖 Al-Baqara — Verset 5/286   │
│  ████████░░░░░░░░  17%          │
│                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ 42   │ │  8   │ │ 350  │   │
│  │streak│ │connue│ │  XP  │   │
│  └──────┘ └──────┘ └──────┘   │
│                                 │
│  [Accès rapide]                 │
│  📚 Bibliothèque  📊 Stats      │
└─────────────────────────────────┘
```

### 10.3 Écran de Révision (Session Active)

```
┌─────────────────────────────────┐
│  ← Révision (2/3)          ❌  │
│  ▓▓▓▓▓▓▓▓▓▓▓░░░░░  2/3        │
│                                 │
│         Al-Ikhlas               │
│      سورة الإخلاص              │
│         (4 versets)             │
│                                 │
│  ┌─────────────────────────┐   │
│  │                         │   │
│  │  قُلْ هُوَ اللَّهُ أَحَدٌ │   │
│  │  اللَّهُ الصَّمَدُ       │   │
│  │  لَمْ يَلِدْ وَلَمْ     │   │
│  │  يُولَدْ               │   │
│  │  وَلَمْ يَكُن لَّهُ    │   │
│  │  كُفُوًا أَحَدٌ        │   │
│  │                         │   │
│  └─────────────────────────┘   │
│                                 │
│  [Voir traduction] [▶ Écouter] │
│                                 │
│  Comment tu t'en souviens ?     │
│  ┌──────┐ ┌──────┐ ┌──────┐   │
│  │  ✅  │ │  😅  │ │  ❌  │   │
│  │ Bien │ │Moyen │ │Oublié│   │
│  └──────┘ └──────┘ └──────┘   │
└─────────────────────────────────┘
```

### 10.4 Écran d'Apprentissage (Nouveau Verset)

```
┌─────────────────────────────────┐
│  ← Apprentissage           ❌  │
│  Al-Baqara — Verset 5          │
│  ▓▓▓▓▓▓▓░░░░░░░░░  1/2 versets│
│                                 │
│  ┌─────────────────────────┐   │
│  │  أُولَٰئِكَ عَلَىٰ      │   │
│  │  هُدًى مِّن رَّبِّهِمْ │   │
│  │  وَأُولَٰئِكَ هُمُ     │   │
│  │  الْمُفْلِحُونَ        │   │
│  └─────────────────────────┘   │
│                                 │
│  Ceux-là sont guidés par        │
│  leur Seigneur, et ce sont       │
│  eux les bienheureux.            │
│                                 │
│  Oulaa'ika 'alaa hudan min      │
│  Rabbihim wa oulaa'ika hum      │
│  al-muflihoon.                  │
│                                 │
│  [🔊 Répéter]  [🔊 Répéter ×3] │
│                                 │
│  ┌────────────────────────┐    │
│  │ Je peux le réciter ✅  │    │
│  └────────────────────────┘    │
│                                 │
│     [Répéter encore]            │
└─────────────────────────────────┘
```

### 10.5 Écran Fin de Session

```
┌─────────────────────────────────┐
│                                 │
│    🎉 Session complétée !       │
│                                 │
│         ✨ +50 XP ✨            │
│                                 │
│    🔥 42 jours de streak !      │
│                                 │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐     │
│  │ 3 │ │ 2 │ │ 5 │ │50 │     │
│  │rév│ │ver│ │min│ │XP │     │
│  └───┘ └───┘ └───┘ └───┘     │
│                                 │
│  🏅 Nouveau badge débloqué !    │
│  "En Feu" — 7 jours de suite   │
│                                 │
│                                 │
│  [Partager]  [Retour à l'accueil]│
└─────────────────────────────────┘
```

---

## 11. Plan de Lancement 7 Jours

### Jour 1 — Setup & Architecture
- [ ] Création projet React Native + Expo
- [ ] Configuration Supabase (auth, base de données)
- [ ] Configuration RevenueCat (abonnements)
- [ ] Intégration données Coran (bundled JSON + API Quran.com)
- [ ] Navigation de base (Expo Router)

### Jour 2 — Onboarding & Auth
- [ ] Écrans onboarding (5 screens)
- [ ] Sélection sourates connues
- [ ] Inscription / Connexion (email + Google + Apple)
- [ ] Initialisation profil Supabase

### Jour 3 — Module Révision
- [ ] Composant ArabicText (RTL, font Amiri)
- [ ] Composant VerseCard
- [ ] Logique SRS (algorithme SM-2)
- [ ] Écran révision active
- [ ] Boutons d'évaluation (Bien / Moyen / Oublié)

### Jour 4 — Module Apprentissage
- [ ] Écran apprentissage verset par verset
- [ ] Player audio (Expo AV)
- [ ] Progression dans la sourate
- [ ] Validation verset appris

### Jour 5 — Gamification & Stats
- [ ] Système XP et niveaux
- [ ] Système de streak
- [ ] Badges (logique + affichage)
- [ ] Dashboard stats
- [ ] Écran fin de session (animation confetti)
- [ ] Home Dashboard complet

### Jour 6 — Notifications & Widget & Paiement
- [ ] Notifications push (Expo Notifications)
- [ ] Widget iOS (WidgetKit via Expo)
- [ ] Widget Android
- [ ] Intégration paywall RevenueCat
- [ ] Écran abonnement (plans gratuit/premium/famille)
- [ ] Tests paiement sandbox

### Jour 7 — Polish & Lancement
- [ ] Mode nuit / mode clair
- [ ] Animations et transitions
- [ ] Tests sur iOS et Android
- [ ] Screenshots App Store / Play Store
- [ ] Soumission App Store & Google Play
- [ ] Page de lancement (landing page simple)
- [ ] Premier post sur les réseaux sociaux

---

## 12. Projections Financières

### 12.1 Scénarios de Croissance

#### Scénario Conservateur
| Mois | Utilisateurs | Taux Conversion | Abonnés Premium | MRR |
|---|---|---|---|---|
| 1 | 500 | 5% | 25 | 75€ |
| 2 | 1 500 | 6% | 90 | 270€ |
| 3 | 3 000 | 7% | 210 | 630€ |
| 6 | 8 000 | 8% | 640 | 1 920€ |
| 12 | 20 000 | 10% | 2 000 | 6 000€ |

#### Scénario Réaliste
| Mois | Utilisateurs | Taux Conversion | Abonnés Premium | MRR |
|---|---|---|---|---|
| 1 | 1 000 | 8% | 80 | 240€ |
| 2 | 3 000 | 9% | 270 | 810€ |
| 3 | 6 000 | 10% | 600 | 1 800€ |
| 6 | 15 000 | 10% | 1 500 | 4 500€ |
| 12 | 40 000 | 12% | 4 800 | 14 400€ |

#### Scénario Optimiste (Viral)
| Mois | Utilisateurs | Taux Conversion | Abonnés Premium | MRR |
|---|---|---|---|---|
| 1 | 5 000 | 10% | 500 | 1 500€ |
| 3 | 20 000 | 12% | 2 400 | 7 200€ |
| 6 | 50 000 | 12% | 6 000 | 18 000€ |
| 12 | 100 000 | 12% | 12 000 | 36 000€ |

### 12.2 Coûts Détaillés

| Poste | Mois 1 | Mois 3 | Mois 6 | Mois 12 |
|---|---|---|---|---|
| Supabase | 0€ | 25€ | 50€ | 100€ |
| RevenueCat (fees ~3%) | 7€ | 54€ | 135€ | 432€ |
| Marketing (Ads Meta) | 200€ | 400€ | 600€ | 1 000€ |
| Créateurs de contenu | 0€ | 200€ | 500€ | 1 000€ |
| Apple Developer | 8€ | 8€ | 8€ | 8€ |
| **Total** | **215€** | **687€** | **1 293€** | **2 540€** |

### 12.3 Break-Even Analysis

- **Break-even = Charges fixes / Prix moyen abonnement**
- Break-even mois 1 : 215€ / 3€ = **~72 abonnés**
- Break-even mois 6 : 1 293€ / 3€ = **~431 abonnés**

Objectif réaliste : **atteindre le break-even en mois 2-3**

### 12.4 Indicateurs Clés (KPIs)

| KPI | Cible M1 | Cible M3 | Cible M6 |
|---|---|---|---|
| Téléchargements | 1 000 | 6 000 | 15 000 |
| DAU/MAU ratio | >20% | >30% | >35% |
| Streak moyen (jours) | 3 | 7 | 14 |
| Taux de conversion Free→Premium | 5% | 8% | 10% |
| Churn mensuel | <15% | <12% | <10% |
| Rating App Store | >4.2 | >4.4 | >4.5 |
| Sessions / utilisateur / semaine | 4 | 5 | 6 |

---

## Annexes

### A. Liste des 114 Sourates (Priorité d'apprentissage)

L'app suggère par défaut l'ordre du plus court au plus long pour les débutants :

**Niveau 1 — Débutant (1-5 versets)**
An-Nas (114), Al-Falaq (113), Al-Ikhlas (112), Al-Masad (111), An-Nasr (110), Al-Kafirun (109), Al-Kawthar (108), Al-Ma'un (107), Quraysh (106), Al-Fil (105), Al-Asr (103), At-Takathur (102), Al-Qari'a (101), Al-Fatiha (1)

**Niveau 2 — Intermédiaire (6-20 versets)**
Al-Adiyat (100), Az-Zalzalah (99), Al-Bayyina (98), Al-Qadr (97), Al-'Alaq (96), At-Tin (95), Al-Inshirah (94), Ad-Duha (93), Al-Layl (92), Ash-Shams (91)...

**Niveau 3 — Avancé (21-100 versets)**
...

**Niveau 4 — Expert (100+ versets)**
Al-Baqara (286 versets), Al 'Imran (200 versets)...

### B. Récitateurs Disponibles

| ID | Nom | Style |
|---|---|---|
| `mishary` | Mishary Rashid Al-Afasy | Classique, très populaire |
| `sudais` | Abdul Rahman Al-Sudais | Voix de La Mecque |
| `minshawi` | Mohamed Siddiq Al-Minshawi | Tarteel (lent, pour apprentissage) |
| `husary` | Mahmoud Khalil Al-Husary` | Très clair, idéal débutants |
| `ghamdi` | Sa'd Al-Ghamdi | Populaire en France |

### C. Messages de Notification (Rotation)

```javascript
const notificationMessages = [
  "🌙 Ta session du jour t'attend. 5 minutes pour ton âme.",
  "📖 N'oublie pas tes sourates aujourd'hui.",
  "🔥 Garde ton streak vivant ! Tu es si régulier.",
  "⭐ \"Récite le Coran car il viendra intercéder pour ses compagnons.\" - Muslim",
  "🌅 Commence ta journée avec le Coran. Tu ne le regretteras pas.",
  "💪 Hier tu l'as fait. Aujourd'hui aussi tu peux.",
  "📚 Un verset à la fois. C'est comme ça qu'on mémorise le Livre d'Allah.",
  "🕌 Ta récompense t'attend. Juste 5 minutes.",
];
```

### D. Checklist Technique Avant Soumission App Store

- [ ] Icône app 1024x1024 (fond uni, pas de transparence)
- [ ] Screenshots iPhone 6.7" et 5.5"
- [ ] Screenshots iPad si supporté
- [ ] Privacy Policy URL (obligatoire pour abonnements)
- [ ] Terms of Service URL
- [ ] Description App Store en FR et EN (max 4000 chars)
- [ ] Mots-clés ASO (max 100 chars)
- [ ] Test complet sur device réel (pas que simulateur)
- [ ] Test paiement en mode sandbox
- [ ] Test notifications push
- [ ] Test widget iOS
- [ ] Support email configuré
- [ ] Entretien révision Apple (prévoir 1-3 jours)

---

*Document préparé pour Codex — Quran Daily v1.0*  
*Toutes les spécifications sont prêtes pour le développement. Commencer par l'architecture de base (Jour 1) et suivre le plan jour par jour.*
