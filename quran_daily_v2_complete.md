# 📱 QURAN DAILY — Cahier des Charges V2.0
### Version Commercialisable — Document Complet pour Développement
**Version :** 2.0  
**Date :** Juin 2026  
**Statut :** Basé sur le MVP validé — Prêt pour production

> Ce document intègre toutes les observations du MVP fonctionnel testé sur Android. Chaque section tient compte de ce qui existe déjà et de ce qui reste à construire pour une version commercialisable.

---

## Table des Matières

1. [État du MVP & Delta V2.0](#1-état-du-mvp--delta-v20)
2. [Vision & Positionnement](#2-vision--positionnement)
3. [Analyse de Marché](#3-analyse-de-marché)
4. [Modèle Économique](#4-modèle-économique)
5. [Architecture Fonctionnelle Complète](#5-architecture-fonctionnelle-complète)
6. [Onboarding — Spécifications Détaillées](#6-onboarding--spécifications-détaillées)
7. [Home Dashboard — Spécifications Détaillées](#7-home-dashboard--spécifications-détaillées)
8. [Module Révision — Spécifications Détaillées](#8-module-révision--spécifications-détaillées)
9. [Module Apprentissage — Spécifications Détaillées](#9-module-apprentissage--spécifications-détaillées)
10. [Écran Fin de Session — Spécifications Détaillées](#10-écran-fin-de-session--spécifications-détaillées)
11. [Bibliothèque des Sourates](#11-bibliothèque-des-sourates)
12. [Statistiques & Progression](#12-statistiques--progression)
13. [Système de Gamification Complet](#13-système-de-gamification-complet)
14. [Réglages & Profil](#14-réglages--profil)
15. [Page Abonnement Premium](#15-page-abonnement-premium)
16. [Système de Notifications & Widget](#16-système-de-notifications--widget)
17. [Fonctionnalités Manquantes à Développer](#17-fonctionnalités-manquantes-à-développer)
18. [Spécifications Techniques](#18-spécifications-techniques)
19. [Base de Données & Modèles](#19-base-de-données--modèles)
20. [Design System](#20-design-system)
21. [Plan de Lancement Commercial](#21-plan-de-lancement-commercial)
22. [Projections Financières](#22-projections-financières)
23. [Checklist App Store / Google Play](#23-checklist-app-store--google-play)

---

## 1. État du MVP & Delta V2.0

### 1.1 Ce qui existe et fonctionne ✅

| Fonctionnalité | Statut | Qualité |
|---|---|---|
| Onboarding 5 étapes | ✅ Complet | Excellent |
| Home Dashboard (session faite / à faire) | ✅ Complet | Très bien |
| Écran révision active (Bien/À revoir/Oubliée) | ✅ Complet | Excellent |
| Écran apprentissage verset par verset | ✅ Complet | Très bien |
| Mode test mémoire (texte masqué) | ✅ Complet | Excellent |
| Écran fin de session (+XP, streak, détails) | ✅ Complet | Très bien |
| Bibliothèque 114 sourates avec filtres | ✅ Complet | Excellent |
| Statistiques complètes (graphique activité 7j/30j) | ✅ Complet | Excellent |
| Système de badges (15+ badges) | ✅ Complet | Très bien |
| Réglages (objectif, notifs, récitateur, freeze) | ✅ Complet | Très bien |
| Page Premium avec paywall | ✅ Complet | Bien |
| Système XP et niveaux | ✅ Complet | Très bien |
| Algorithme SRS (répétition espacée) | ✅ Complet | Excellent |
| Audio récitation par récitateur | ✅ Complet | Très bien |
| Freeze de streak automatique | ✅ Complet | Très bien |

### 1.2 Ce qui manque pour la version commercialisable ❌

| Fonctionnalité | Priorité | Impact |
|---|---|---|
| Prix affiché sur page Premium | 🔴 Bloquant | Conversion directe |
| Bouton partage fin de session | 🔴 Critique | Acquisition organique |
| Translittération dans la révision | 🔴 Critique | Accessibilité |
| Animation confetti fin de session | 🟡 Important | Rétention émotionnelle |
| Aperçu session J+1 sur écran fin | 🟡 Important | Rétention |
| Compteur visuel "Répéter ×3" | 🟡 Important | UX apprentissage |
| Widget iOS & Android | 🟡 Important | Engagement passif |
| Écran partage (carte stylée) | 🟡 Important | Acquisition virale |
| Écran détail d'une sourate | 🟢 Nice-to-have | Enrichissement |
| Mode famille / comptes enfants | 🟢 V2.1 | Revenu additionnel |
| Classement amis / social | 🟢 V2.1 | Engagement social |
| Police arabe premium (Amiri) | 🟢 Nice-to-have | Qualité visuelle |
| Heure de rappel personnalisable (time picker) | 🟢 Nice-to-have | Personnalisation |
| Onboarding : écran inscription/connexion | 🔴 Bloquant | Persistance données |

### 1.3 Bugs & Incohérences à Corriger

- **"1 restants"** (image 3) → corriger en "1 restant" (accord grammatical)
- **Paywall trop précoce** sur l'onglet "Apprendre" : l'écran de paywall bloque avant même que l'utilisateur ait choisi une sourate. Il faut que le paywall n'apparaisse que si l'utilisateur tente d'accéder à une sourate Premium spécifique, pas à l'entrée de l'onglet.
- **Page "Premium actif"** (image 11) : la page est vide après souscription. Ajouter date de renouvellement, bouton "Gérer dans le store", et récapitulatif des avantages actifs.
- **Barre de progression à 67%** sur l'onglet Apprendre : "Progression" sans label de contexte. Remplacer par "Al-Asr — 2 sur 3 versets mémorisés".
- **Récitateurs non-Premium** (image 10) : les récitateurs 2-6 s'affichent sans cadenas ni label Premium sur la page des réglages, mais bloquent quand même. Ajouter l'icône couronne Premium visible.

---

## 2. Vision & Positionnement

### 2.1 Le Problème Réel

Les musulmans modernes ont un paradoxe avec leur téléphone : c'est l'objet qu'ils ont en main le plus souvent, mais il est devenu leur principal ennemi de pratique religieuse. TikTok s'ouvre en 1 seconde, la récitation attendra.

Trois obstacles concrets :
- **L'oubli structurel** : sans système de rappel intelligent, les sourates apprises s'effacent
- **L'abandon rapide** : les apps gratuites ne créent pas d'ancrage psychologique (pas de coût = pas d'engagement)
- **La distraction systémique** : ouvrir une app coranique sur le même téléphone que TikTok, c'est lutter contre une plateforme optimisée pour capter l'attention

### 2.2 La Solution

**Quran Daily** transforme le téléphone de source de distraction en outil de connection spirituelle quotidienne. Elle adopte les mêmes mécaniques d'engagement que les apps qui "capturent" l'attention (streaks, XP, badges, notifications intelligentes) mais les met au service de la récitation.

**Principe fondamental :** l'utilisateur paie, donc il revient. Le prix est une feature, pas un obstacle.

### 2.3 Proposition de Valeur

> *"Récite chaque jour. N'oublie jamais."*

- **Pour soi** : une routine de 3-15 min/jour, guidée, sans effort de planification
- **Contre l'oubli** : algorithme de répétition espacée qui programme automatiquement les révisions
- **Contre la distraction** : expérience 100% in-app, 0 lien externe pendant une session
- **Pour durer** : gamification inspirée de Duolingo — streak, XP, niveaux, badges

### 2.4 Positionnement Concurrentiel

| App | Forces | Faiblesses | Notre différence |
|---|---|---|---|
| Quran.com | Contenu complet, gratuit | Lecture passive, pas de mémorisation guidée | Apprentissage actif + SRS |
| Muslim Pro | Tout-en-un, grande base users | Trop généraliste, UX datée | Ultra-focalisé, moderne |
| Tarteel | IA de récitation vocale | Intimidant, complexe, anglais uniquement | Simple, progressif, français |
| Iqra | Interface épurée | Pas de gamification, pas de SRS | Engagement long terme |
| Duolingo | Gamification parfaite | Pas de Coran | Même mécanique, contenu islamique |

**Notre niche** : musulmans francophones, 18-45 ans, pratiquants modérés, qui veulent une routine structurée et sont prêts à payer pour un outil de qualité.

---

## 3. Analyse de Marché

### 3.1 Taille du Marché Adressable

**Marché global :**
- 1,8 milliard de musulmans dans le monde
- Marché des apps islamiques estimé à +900M$ (croissance ~15%/an)
- Pénétration smartphone dans les pays musulmans : 70%+

**Marché cible prioritaire (francophone) :**
- France : ~5,7 millions de musulmans
- Belgique + Suisse : ~1,2 million
- Canada (Québec + diaspora) : ~1,3 million
- Afrique francophone (Maroc, Algérie, Tunisie, Sénégal, Côte d'Ivoire) : ~80 millions
- **Total francophone accessible via App Store/Play Store : ~15-20 millions**

**Marché secondaire (expansion rapide) :**
- Anglophone (UK, USA, Canada anglophone) : ~8 millions de musulmans
- L'app étant déjà en français, une version anglaise représente un x3-4 du marché

### 3.2 Personas Détaillés

**Persona 1 — "Zay, le Connecté" (cible principale)**
- Homme ou femme, 20-35 ans, né en France
- Pratiquant mais non hafiz (connaît Al-Fatiha, les Mu'awwidhatein, quelques courtes)
- Passe 3-4h/jour sur son téléphone (TikTok, Instagram, YouTube)
- Veut progresser dans sa récitation mais manque de structure
- Prêt à payer 3-5€/mois pour un outil sérieux
- Motivé par la honte positive ("j'ai téléchargé 3 apps et abandonné chaque fois")
- **Acquisition** : TikTok/Reels islamiques, bouche-à-oreille communautaire

**Persona 2 — "Le Parent Motivé", 35-50 ans**
- Parent de 2-4 enfants, veut qu'ils apprennent le Coran
- Budget éducation enfants non-limité (comparaison : cours particuliers à 30-50€/h)
- Cherche un outil digital de qualité pour compléter le maktab (école coranique)
- **Acquisition** : groupes WhatsApp parents, pages Facebook communautaires, mosquées
- **Produit** : abonnement Famille (V2.1)

**Persona 3 — "Le Revenant", 30-50 ans**
- A appris des sourates enfant à l'école coranique, les a oubliées
- Ressent une culpabilité spirituelle et veut renouer
- Cherche un outil bienveillant, pas culpabilisant
- **Message clé** : "Recommence là où tu en es. Sans jugement."
- **Acquisition** : contenu YouTube/podcasts islamiques pour adultes

**Persona 4 — "L'Expatrié", 25-45 ans**
- Vit dans un pays non-musulman, peu de ressources communautaires locales
- Cherche à maintenir sa pratique de manière autonome
- Forte motivation, prêt à payer
- **Acquisition** : diaspora africaine, maghrebine, moyen-orientale dans pays occidentaux

### 3.3 Stratégie d'Acquisition par Canal

**Canal 1 — Créateurs de Contenu (0€ à court terme)**
- Identifier 10-20 micro-influenceurs islamiques (10K-200K abonnés) sur TikTok/Instagram/YouTube
- Offrir l'accès Premium gratuit + accord d'affiliation (15-20% des revenus générés)
- Format : témoignage authentique, routine matinale, "day in my life"
- **ROI estimé** : 50-200 téléchargements par créateur par publication
- **Priorité** : créateurs francophones (France, Maroc, Algérie, Sénégal)

**Canal 2 — Meta Ads (200-500€/mois)**
- Ciblage : intérêts Islam/Coran/mosquée/Ramadan, 18-45 ans, FR/BE/MA/DZ/SN
- Format vidéo 15s : screen recording de l'app en action + témoignage voix off
- Message A/B test : "Ne perds plus tes sourates" vs "5 min/jour pour progresser"
- **CAC cible** : 2-5€ par installation, 15-30€ par abonné Premium
- Augmenter le budget après validation du funnel de conversion

**Canal 3 — ASO (App Store Optimization)**
- Mots-clés cibles FR : "apprendre coran", "mémorisation sourates", "quran français", "hifz app", "révision coran"
- Mots-clés EN : "quran memorization", "learn surah", "hifz app", "quran daily"
- Titre : "Quran Daily — Mémorise le Coran"
- Sous-titre : "Révision guidée & apprentissage SRS"
- Screenshots : 6 écrans clés avec texte d'accroche
- **Objectif** : top 3 sur "mémorisation coran" en FR

**Canal 4 — Communautés (gratuit)**
- Groupes Facebook islamiques FR (200K+ membres cumulés)
- Serveurs Discord islamiques
- Sous-reddit r/islam, r/learnquran
- Présentation dans des mosquées (poster QR code)

**Canal 5 — Ramadan Push (fenêtre annuelle clé)**
- Le Ramadan est la période de pic d'utilisation des apps islamiques (x5-10 les téléchargements)
- Campagne spéciale : "Apprends une nouvelle sourate ce Ramadan"
- Offre : 1 mois Premium gratuit pour les nouveaux inscrits pendant Ramadan
- Budget pub x3 pendant le mois de Ramadan

---

## 4. Modèle Économique

### 4.1 Grille Tarifaire

#### 🆓 Gratuit
- Onboarding complet
- 5 sourates courtes disponibles pour apprentissage (An-Nas, Al-Falaq, Al-Ikhlas, Al-Fatiha, Al-Kawthar)
- Révision quotidienne limitée à 3 sourates connues
- 1 récitateur (Mishary Al-Afasy)
- Statistiques basiques : streak actuel, record, nombre de sourates
- Graphique activité 7 jours uniquement
- 1 freeze de streak par mois
- Badges : "Premier pas" uniquement débloquable
- Publicités légères (inter-sessions uniquement, jamais pendant révision/apprentissage)

#### ⭐ Premium — 2,99€/mois ou 19,99€/an *(économie 44%)*
- 114 sourates complètes
- Révisions quotidiennes illimitées
- 6 récitateurs au choix
- Statistiques complètes (graphiques, XP, niveaux, temps de récitation)
- Tous les badges débloquables
- 3 freezes de streak par mois (recharge mensuelle)
- Mode hors-ligne complet (audio pré-chargé)
- 0 publicité
- Accès prioritaire aux nouvelles fonctionnalités

#### 👨‍👩‍👧 Famille — 5,99€/mois ou 39,99€/an *(V2.1)*
- Tout Premium
- Jusqu'à 5 comptes liés
- Dashboard parent (voir progression de chaque enfant)
- Mode enfant : interface simplifiée, animations plus colorées, progression plus lente
- Notifications parent quand un enfant complète sa session
- Classement familial hebdomadaire

### 4.2 Justification du Prix

- **Comparaison** : Duolingo Plus = 6,99€/mois, Netflix = 5,99€, Spotify = 5,99€
- **Ancrage psychologique** : moins cher qu'un café, plus utile
- **Prix Islam** : cours coranique particulier = 20-50€/h vs 2,99€/mois
- **Argument clé** : "Le prix crée l'engagement. Gratis = abandonne en 3 jours."
- **Prix annuel** : inciter à l'annuel (meilleure rétention, LTV plus haute)
- La comparaison mensuel/annuel doit être bien visible sur la page Premium

### 4.3 Stratégie de Monétisation Secondaire (V2.1+)

- **Partenariats mosquées** : licences institutionnelles pour cours collectifs
- **Contenu exclusif** : séries thématiques (sourates de la prière du vendredi, Juz' Amma complet guidé)
- **Merchandise** : si communauté active (produits physiques via Printful)

---

## 5. Architecture Fonctionnelle Complète

### 5.1 Carte de Navigation

```
QURAN DAILY
│
├── ONBOARDING (hors-session, première ouverture)
│   ├── Écran 1/5 — Bienvenue + prénom
│   ├── Écran 2/5 — Que connais-tu déjà ? (sélection sourates)
│   ├── Écran 3/5 — Ta prochaine sourate (choix)
│   ├── Écran 4/5 — Ton rythme quotidien (3/5/10/15 min)
│   ├── Écran 5/5 — Protège ton rendez-vous (notifications)
│   └── → Inscription / Connexion (email, Google, Apple)
│
├── TAB 1 — ACCUEIL (/)
│   ├── État A : Session à faire
│   │   ├── Carte "Session du jour" (nb sourates + versets)
│   │   └── CTA "Commencer ma session"
│   ├── État B : Session déjà faite
│   │   ├── Carte "Rendez-vous tenu" + icône succès
│   │   ├── CTA "Faire une session bonus"
│   │   └── CTA "Voir ma progression"
│   ├── Section "En apprentissage"
│   │   └── Carte sourate en cours (progression % + versets)
│   └── Section "Ton élan"
│       ├── Streak, sourates connues, XP
│       ├── Niveau actuel + XP avant prochain niveau
│       ├── Protection streak (nb freezes)
│       └── Hadith / citation islamique (rotation)
│
├── TAB 2 — APPRENDRE (/learn)
│   ├── Sourate en cours (carte détaillée)
│   │   ├── Progression versets (2/3 — 67%)
│   │   ├── Rythme (1 verset/jour)
│   │   ├── CTA "Lancer ma session"
│   │   └── Aperçu prochain verset (avec boutons Écouter + Masquer)
│   ├── Section "Méthode du jour"
│   │   ├── Carte "Écoute & répète"
│   │   └── Carte "Récite de mémoire"
│   └── [si sourate terminée] → Proposition prochaine sourate
│
├── SESSION — Révision (/session/review)
│   ├── Header : "RÉVISION — Sourate X sur Y" + barre progression
│   ├── Nom sourate (FR + Arabe + nb versets)
│   ├── Texte arabe complet (tous les versets)
│   ├── Bouton "Écouter" par verset (numéroté)
│   ├── Toggle translittération (⚠️ MANQUANT — à ajouter)
│   └── Évaluation : "Comment t'en souviens-tu ?"
│       ├── ✅ Bien → intervalle SRS augmente
│       ├── 😅 À revoir → intervalle SRS réduit
│       └── ❌ Oubliée → retour à 1 jour
│
├── SESSION — Apprentissage (/session/learn)
│   ├── Header : "APPRENTISSAGE — Verset X sur Y"
│   ├── Nom sourate + numéro verset
│   ├── Carte verset
│   │   ├── Numéro + bouton "Écouter"
│   │   ├── Texte arabe (grand)
│   │   ├── Traduction française
│   │   └── Translittération (italique)
│   ├── Bouton "Répéter ×3" (avec compteur visuel ⚠️ à améliorer)
│   ├── Info pédagogique ("Lis et écoute trois fois avant de masquer")
│   └── CTA "Tester ma mémoire" → Mode masqué
│       ├── Texte arabe remplacé par "• • •"
│       ├── Boutons "Écouter" + "Révéler"
│       ├── Info "Récite maintenant. Révèle pour corriger."
│       ├── CTA principal "✅ Je peux le réciter"
│       └── CTA secondaire "↺ Revoir le verset"
│
├── SESSION — Fin (/session/complete)
│   ├── Animation confetti (⚠️ MANQUANT — à ajouter)
│   ├── Titre "Session accomplie"
│   ├── Citation islamique inspirante (rotation)
│   ├── Badge XP total gagné (+130 XP)
│   ├── Streak mis à jour (X jours de régularité)
│   ├── Stats session (révisions / versets / durée)
│   ├── Détail XP par action
│   ├── [si badge débloqué] → Pop-up badge
│   ├── CTA "Partager ma session" (⚠️ MANQUANT — à ajouter)
│   ├── Aperçu session de demain (⚠️ MANQUANT — à ajouter)
│   └── CTA "Retour à l'accueil"
│
├── TAB 3 — SOURATES (/library)
│   ├── Barre de recherche
│   ├── Filtres : Toutes / En cours / Connues / À apprendre
│   ├── Liste 114 sourates
│   │   ├── Numéro (badge coloré)
│   │   ├── Nom FR + Arabe + nb versets
│   │   ├── Icône statut (✓ connue / barre progression / 🔒 Premium)
│   │   └── Chevron → détail sourate
│   └── [tap] → Écran détail sourate (⚠️ à compléter)
│       ├── Texte complet (tous versets)
│       ├── Bouton audio (lecture complète)
│       ├── Traduction verset par verset
│       ├── Translittération
│       └── CTA "Commencer à apprendre cette sourate"
│
├── TAB 4 — PROGRÈS (/stats)
│   ├── Titre "Ta progression"
│   ├── Métriques : streak actuel / record / sourates
│   ├── Carte niveau (numéro + nom FR/AR + XP total + XP avant prochain)
│   ├── Graphique activité
│   │   ├── Toggle 7j / 30j
│   │   └── Barres XP par jour
│   ├── Vue d'ensemble (temps récitation / sessions terminées / XP semaine / freezes)
│   └── Section Badges
│       ├── Badges débloqués (en or)
│       └── Badges à débloquer (grisés + condition)
│
└── TAB 5 — RÉGLAGES (/settings)
    ├── Profil (prénom, compte connecté)
    ├── Objectif quotidien (3/5/10/15 min avec détail révisions+versets)
    ├── Rappels
    │   ├── Toggle notification quotidienne
    │   ├── Choix heure (07:00 / 12:30 / 20:00 / 22:00) + time picker custom
    │   └── Freeze de streak (nb disponibles + info recharge)
    ├── Récitateur (6 choix + bouton Aperçu)
    ├── Abonnement (statut + CTA gérer)
    └── Données & confidentialité
        ├── Info source données (Quran.com)
        ├── Politique de confidentialité
        ├── Conditions d'utilisation
        └── Réinitialiser l'application (avec confirmation)
```

---

## 6. Onboarding — Spécifications Détaillées

### 6.1 Vue d'Ensemble

L'onboarding actuel (5 étapes) est excellent. Il est à conserver tel quel avec quelques ajouts.

**Ce qui existe et fonctionne :**
- Barre de progression 1/5 → 5/5 visible en haut
- Écran 1 : Bienvenue + "Récite chaque jour. N'oublie jamais." + Bismillah + champ prénom
- Écran 2 : "Que connais-tu déjà ?" + liste sourates avec checkboxes + boutons "Aucune" / "Les essentielles"
- Écran 3 : "Ta prochaine sourate" + 2 suggestions de sourates courtes à apprendre
- Écran 4 : "Ton rythme quotidien" + 4 options (3/5/10/15 min) avec noms (Doucement/Régulier/Soutenu/Intensif)
- Écran 5 : "Protège ton rendez-vous" + toggle notif + choix heure + récapitulatif + "C'est parti !"

**Ce qu'il faut ajouter :**

### 6.2 Ajout Obligatoire — Écran de Compte (après écran 5)

```
ÉCRAN 6/6 (nouveau) — Crée ton compte

[Icône utilisateur doré]

Sauvegarde ta progression

Ta progression sera synchronisée entre tes appareils
et ne sera jamais perdue.

[Continuer avec Google]    ← bouton blanc avec logo Google
[Continuer avec Apple]     ← bouton blanc avec logo Apple
[Continuer avec email]     ← bouton vert secondaire

━━━━━━━━━━━━━━━━━━━━

[Continuer sans compte →]  ← lien texte discret
"Tes données seront stockées uniquement sur cet appareil."
```

**Règles :**
- Ne pas forcer l'inscription. Permettre de continuer sans compte.
- Afficher les avantages du compte (sync, pas de perte de données)
- Si l'utilisateur clique "sans compte" → afficher une alerte douce : "Sans compte, si tu changes de téléphone tu perdras ta progression. Tu pourras toujours créer un compte plus tard dans les réglages."

### 6.3 Détails Techniques Onboarding

- Les données saisies pendant l'onboarding (prénom, sourates, objectif, heure notif) doivent être sauvegardées localement AVANT la création de compte, puis synchronisées après.
- La sélection "Les essentielles" doit pré-cocher : Al-Fatiha + An-Nas + Al-Falaq + Al-Ikhlas + Al-Kawthar (les 5 sourates les plus connues statistiquement)
- L'écran 3 ("Ta prochaine sourate") doit exclure les sourates déjà cochées à l'écran 2
- L'objectif sélectionné à l'écran 4 doit se retrouver pré-réglé dans les Réglages

---

## 7. Home Dashboard — Spécifications Détaillées

### 7.1 État A — Session Non Faite

```
┌─────────────────────────────────────┐
│ Assalamu alaykum,               🔥2 ⚙️│
│ [Prénom]                             │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ SESSION DU JOUR           📖     │ │
│ │ 3 minutes pour avancer           │ │
│ │                                  │ │
│ │  [2]           [1]               │ │
│ │  sourates      versets           │ │
│ │  à revoir      à apprendre       │ │
│ │                                  │ │
│ │  [▶ Commencer ma session]        │ │
│ └──────────────────────────────────┘ │
│                                      │
│ En apprentissage          Continuer  │
│ ┌──────────────────────────────────┐ │
│ │ 103  Al-Asr          العصر      │ │
│ │      Le Temps · verset 3/3       │ │
│ │ Progression              67%     │ │
│ │ ████████████░░░░░░               │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Ton élan                             │
│ ┌────────┐ ┌────────┐ ┌────────┐   │
│ │   🔥   │ │   📖   │ │   ⭐   │   │
│ │   2    │ │   7    │ │  670   │   │
│ │ jours  │ │sourates│ │   XP   │   │
│ └────────┘ └────────┘ └────────┘   │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 🏅 NIVEAU 3 · Apprenant · متعلم │ │
│ │ ████░░░░░░░░░░░░░░ 830 XP avant │ │
│ │                    Mémorisateur  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ 🛡️ Protection streak             │ │
│ │ 3 freezes disponibles            │ │
│ └──────────────────────────────────┘ │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ✨ Une intention simple          │ │
│ │ « Les œuvres les plus aimées     │ │
│ │ sont les plus régulières, même   │ │
│ │ si elles sont peu nombreuses. »  │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 🏠 Apprendre 📖 Sourates 📊 ⚙️     │
└─────────────────────────────────────┘
```

### 7.2 État B — Session Déjà Faite (✅ Existe)

La carte change de "SESSION DU JOUR" à "RENDEZ-VOUS TENU" avec :
- Icône checkmark doré
- Titre "Belle constance."
- Récapitulatif rapide (X sourates révisées, Y versets appris)
- Bouton "Faire une session bonus" (même session, xp bonus réduit)
- Bouton "Voir ma progression" → tab Progrès

### 7.3 Logique de la Carte "Session du Jour"

La session du jour est calculée automatiquement à chaque ouverture :
```
session = {
  seuratesToReview: getSurahsDueForReview(today),  // SRS algorithm
  versesToLearn: getUserDailyGoalVerses(),           // depuis les réglages
  estimatedMinutes: calculateDuration(session)
}
```

- Le nombre de sourates à revoir varie selon le SRS (peut être 0 certains jours)
- Si 0 sourates à revoir + 0 versets à apprendre → afficher "Ta progression est à jour ! Reviens demain." avec option "Session bonus"
- Le temps estimé est calculé (~30s par verset de révision, ~2min par verset à apprendre)

### 7.4 Citations (Rotation)

Stocker une liste de 20+ hadith/citations courtes (avec source), afficher en rotation aléatoire, jamais deux fois de suite la même. Exemples :
- *"Les œuvres les plus aimées d'Allah sont les plus régulières, même si elles sont peu nombreuses."* — Muslim
- *"Récitez le Coran, car il viendra intercéder pour ses compagnons au Jour de la Résurrection."* — Muslim
- *"Le meilleur d'entre vous est celui qui apprend le Coran et l'enseigne."* — Bukhari
- *"Celui qui récite le Coran avec aisance sera avec les scribes nobles et vertueux."* — Muslim

---

## 8. Module Révision — Spécifications Détaillées

### 8.1 Flux de Révision

```
1. Sélection automatique des sourates dues (SRS)
   └── Ordre : la plus ancienne en révision en premier

2. Pour chaque sourate :
   a. Affichage du nom (FR + Arabe + nb versets)
   b. Affichage du texte arabe complet (tous versets)
   c. Bouton "Écouter" par verset (numéro en badge)
   d. Toggle "Translittération" (afficher/masquer) ← À AJOUTER
   e. Toggle "Traduction" (afficher/masquer) ← À AJOUTER
   f. Bouton "Écouter tout" (lecture complète) ← OPTIONNEL
   g. Question : "Comment t'en souviens-tu ?"
      ├── ✅ Bien
      ├── 😅 À revoir
      └── ❌ Oubliée
   h. Phrase explicative : "Ton choix ajuste la prochaine révision."

3. Après toutes les sourates → Session de révision terminée
   └── Si session d'apprentissage suit → enchaîner automatiquement
   └── Sinon → écran fin de session
```

### 8.2 Algorithme SRS — Spécification Technique

Basé sur **SM-2** (Anki, SuperMemo) :

```javascript
function updateSRS(surahProgress, rating) {
  // rating: 'good' | 'review' | 'forgotten'
  
  let { ease_factor, review_interval_days } = surahProgress;
  
  switch(rating) {
    case 'good':
      review_interval_days = Math.round(review_interval_days * ease_factor);
      ease_factor = Math.min(ease_factor + 0.1, 3.0);
      break;
    case 'review':
      review_interval_days = Math.max(1, Math.round(review_interval_days * 0.5));
      ease_factor = Math.max(ease_factor - 0.15, 1.3);
      break;
    case 'forgotten':
      review_interval_days = 1;
      ease_factor = Math.max(ease_factor - 0.3, 1.3);
      break;
  }
  
  // Plafonner à 30 jours max (pour ne jamais dépasser 1 mois sans révision)
  review_interval_days = Math.min(review_interval_days, 30);
  
  const next_review_at = addDays(today, review_interval_days);
  
  return { ease_factor, review_interval_days, next_review_at };
}
```

**Règles SRS :**
- Intervalle initial (première révision d'une sourate nouvellement "connue") : 1 jour
- Intervalle max : 30 jours
- Facteur ease initial : 2.5
- Facteur ease min : 1.3 (ne jamais descendre sous ça)
- Une sourate "oubliée" repart toujours à 1 jour d'intervalle

### 8.3 Composant Visuel — Carte de Révision

```
┌─────────────────────────────────────┐
│ RÉVISION                        [✕] │
│ Sourate 1 sur 2                     │
│ ████████████░░░░░░░░░░░░░░  1/2    │
│                                     │
│          An-Nasr                    │
│         النصر                       │
│         3 versets                   │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │                   [▶ Écouter] 1 │ │
│ │  إِذَا جَاءَ نَصْرُ اللَّهِ    │ │
│ │  وَالْفَتْحُ                    │ │
│ │─────────────────────────────────│ │
│ │                   [▶ Écouter] 2 │ │
│ │  وَرَأَيْتَ النَّاسَ           │ │
│ │  يَدْخُلُونَ فِي دِينِ         │ │
│ │  اللَّهِ أَفْوَاجًا            │ │
│ │─────────────────────────────────│ │
│ │                   [▶ Écouter] 3 │ │
│ │  فَسَبِّحْ بِحَمْدِ رَبِّكَ   │ │
│ │  وَاسْتَغْفِرْهُ               │ │
│ │  إِنَّهُ كَانَ تَوَّابًا       │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [👁 Translittération] [🌐 Traduction]│
│                                     │
│ Comment t'en souviens-tu ?          │
│ ┌──────┐  ┌──────────┐  ┌────────┐ │
│ │  ✓   │  │    ~     │  │   ✗    │ │
│ │ Bien │  │ À revoir │  │Oubliée │ │
│ └──────┘  └──────────┘  └────────┘ │
│                                     │
│ Ton choix ajuste la prochaine       │
│ révision automatiquement.           │
└─────────────────────────────────────┘
```

---

## 9. Module Apprentissage — Spécifications Détaillées

### 9.1 Flux d'Apprentissage

```
1. Sélection du verset à apprendre (suite de la sourate en cours)

2. Étape A — Lecture guidée :
   a. Afficher verset (arabe + traduction + translittération)
   b. Bouton "Écouter" (lecture une fois)
   c. Bouton "Répéter ×3" avec compteur visuel décrémentant
   d. Note pédagogique : "Lis et écoute trois fois avant de masquer"
   e. CTA "Tester ma mémoire" → passe à l'étape B

3. Étape B — Test de mémoire :
   a. Texte arabe remplacé par "• • •" (3 points animés)
   b. Bouton "Écouter" toujours disponible (aide audio)
   c. Bouton "Révéler" (affiche le texte arabe 3s puis remasque)
   d. Note : "Récite maintenant de mémoire. Révèle seulement pour te corriger."
   e. CTA principal "✅ Je peux le réciter" → valide et passe au verset suivant
   f. CTA secondaire "↺ Revoir le verset" → retour à l'étape A

4. Si verset validé :
   - Incrémenter verses_learned pour cette sourate
   - Mettre à jour le % de progression
   - Si dernier verset → sourate complète → trigger célébration

5. Si sourate complète :
   a. Animation de célébration (confetti + son)
   b. "Tu connais maintenant [Nom Sourate] !" 
   c. La sourate passe au statut "known" et intègre le SRS
   d. Proposition de la prochaine sourate à apprendre
```

### 9.2 Compteur Visuel "Répéter ×3" (À Améliorer)

**Comportement attendu :**
- Bouton affiche "🔁 Répéter ×3"
- Chaque tap lance la lecture audio du verset
- Le compteur décrémente : ×3 → ×2 → ×1 → ✅
- Quand ×1 → ✅, le bouton change en "✅ Répété 3 fois" (vert, non-cliquable)
- Le CTA "Tester ma mémoire" s'illumine (sort du grisé)
- L'utilisateur peut cliquer "Tester ma mémoire" avant les 3 répétitions (pas de blocage)

```javascript
// Exemple de state management
const [repeatCount, setRepeatCount] = useState(3);
const [isReady, setIsReady] = useState(false);

const handleRepeat = () => {
  playAudio(verseAudioUrl);
  const newCount = repeatCount - 1;
  setRepeatCount(newCount);
  if (newCount === 0) setIsReady(true);
};
```

### 9.3 Onglet "Apprendre" — Page Principale

Cette page (actuellement `/learn`) doit être enrichie :

```
┌─────────────────────────────────────┐
│ Apprendre                           │
│ Un verset après l'autre, avec       │
│ calme et répétition.                │
│                                     │
│ ┌──────────────────────────────────┐│
│ │ SOURATE EN COURS                 ││
│ │ Al-Asr        العصر              ││
│ │ Le Temps                         ││
│ │                                  ││
│ │ 2 sur 3 versets mémorisés   67%  ││
│ │ ████████████████░░░░             ││
│ │                                  ││
│ │ 🎯 1 verset/jour · 1 restant     ││
│ │                                  ││
│ │ [▶ Lancer ma session]            ││
│ └──────────────────────────────────┘│
│                                     │
│ Prochain verset                     │
│ ┌──────────────────────────────────┐│
│ │ 3           [▶ Écouter] [Masquer]││
│ │                                  ││
│ │ إِلَّا الَّذِينَ آمَنُوا       ││
│ │ وَعَمِلُوا الصَّالِحَاتِ       ││
│ │ وَتَوَاصَوْا بِالْحَقِّ        ││
│ │ وَتَوَاصَوْا بِالصَّبْرِ       ││
│ │                                  ││
│ │ sauf ceux qui croient et         ││
│ │ accomplissent les bonnes œuvres, ││
│ │ s'enjoignent mutuellement...     ││
│ │                                  ││
│ │ Illa allatheena amanoo...        ││
│ └──────────────────────────────────┘│
│                                     │
│ Méthode du jour                     │
│ ┌──────────────┐ ┌────────────────┐│
│ │ 🔁 Écoute   │ │ 🧠 Récite de  ││
│ │ & répète    │ │ mémoire       ││
│ │ Lis 3 fois  │ │ Valide quand  ││
│ │ avant de    │ │ ça vient sans ││
│ │ masquer     │ │ effort        ││
│ └──────────────┘ └────────────────┘│
└─────────────────────────────────────┘
```

---

## 10. Écran Fin de Session — Spécifications Détaillées

### 10.1 Layout Complet

```
┌─────────────────────────────────────┐
│                                     │
│      [ANIMATION CONFETTI]           │
│   ✨ étoiles + croissants dorés     │
│                                     │
│         ○ [✓] ○                    │
│    (cercle doré avec checkmark)     │
│                                     │
│    Session accomplie                │
│                                     │
│  ✦ Une petite étape répétée devient │
│    une vraie transformation.        │
│                                     │
│        ⭐ +130 XP ⭐               │
│        (badge animé, pop)           │
│                                     │
│    🔥 2 jours de régularité         │
│                                     │
│  ┌────────┐ ┌────────┐ ┌────────┐  │
│  │   1    │ │   1    │ │  5 min │  │
│  │révisions│ │ verset │ │ durée  │  │
│  └────────┘ └────────┘ └────────┘  │
│                                     │
│  Détail XP :                        │
│  Révisions              +10 XP      │
│  Versets appris         +20 XP      │
│  Session du jour        +50 XP      │
│  Session parfaite       +50 XP      │
│  ──────────────────────────────     │
│  Total                 +130 XP      │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ [📤 Partager ma session]    │   │← À AJOUTER
│  └──────────────────────────────┘   │
│                                     │
│  ┌──────────────────────────────┐   │
│  │ Demain : 2 sourates à revoir │   │← À AJOUTER
│  │ + 1 verset Al-Asr           │   │
│  └──────────────────────────────┘   │
│                                     │
│  [→ Retour à l'accueil]             │
└─────────────────────────────────────┘
```

### 10.2 Animation Confetti

```javascript
// Particules : étoiles ★ + croissants ☽ + petits points
// Couleurs : or (#D4AF37) + blanc (#F5F5F0) + vert clair (#81C784)
// Durée : 2 secondes
// Déclenchement : dès l'arrivée sur l'écran (pas au tap)
// Librairie recommandée : react-native-confetti-cannon ou lottie-react-native
```

### 10.3 Carte de Partage (À Développer)

Quand l'utilisateur tape "Partager ma session", générer une image partageable :

```
┌──────────────────────────────┐
│        QURAN DAILY           │
│                              │
│   🌙  Session accomplie      │
│                              │
│   ✅ Al-Ikhlas — Apprise !  │
│   🔥 7 jours de suite        │
│   ⭐ 670 XP au total         │
│                              │
│   "Récite chaque jour.       │
│    N'oublie jamais."         │
│                              │
│ [Logo] quranDaily.app        │
└──────────────────────────────┘
```

- Fond : gradient vert foncé → vert émeraude
- Accents : dorés
- Exporté en PNG, partageable via le share sheet natif (WhatsApp, Instagram Stories, etc.)
- Librairie : `react-native-view-shot` pour capturer la vue en image

### 10.4 Badge Débloqué — Pop-up

Si un badge est débloqué pendant cette session, afficher une pop-up AVANT l'écran de fin :

```
┌─────────────────────────────────┐
│           NOUVEAU BADGE !       │
│                                 │
│         ⭐ "En Feu" ⭐          │
│                                 │
│    7 jours de régularité        │
│    accomplis. Que Allah te      │
│    facilite la continuité.      │
│                                 │
│         [Super !]               │
└─────────────────────────────────┘
```

---

## 11. Bibliothèque des Sourates

### 11.1 Écran Liste — Améliorations

Ce qui existe est très bien. Ajouter :
- **Compteur filtré** visible ("6 connues", "2 en cours", etc.)
- **Indicateur de progression** sur les sourates "en cours" (barre dorée partielle visible dans la liste)
- **Ordre de tri** : par défaut ordre numérique (1→114), option "par longueur" (courte→longue pour débutants)

### 11.2 Écran Détail Sourate (⚠️ À Créer)

Accessible en tappant sur n'importe quelle sourate dans la liste.

```
┌─────────────────────────────────────┐
│ ← Al-Ikhlas                    ✅   │
│                                     │
│          سورة الإخلاص              │
│      L'Intégrité Divine             │
│   Mecquoise · 4 versets             │
│                                     │
│ [▶ Écouter la sourate complète]    │
│ [Récitateur : Mishary Al-Afasy ▼]  │
│                                     │
│ ──────────────────────────────────  │
│ 1  قُلْ هُوَ اللَّهُ أَحَدٌ       │
│    Dis : "Il est Allah, l'Unique"   │
│    Qul huwa Allahu ahad             │
│                          [▶ 1]      │
│ ──────────────────────────────────  │
│ 2  اللَّهُ الصَّمَدُ               │
│    Allah, l'Absolu                  │
│    Allahu assamad                   │
│                          [▶ 2]      │
│ ──────────────────────────────────  │
│ 3  لَمْ يَلِدْ وَلَمْ يُولَدْ     │
│    Il n'a pas engendré et           │
│    n'a pas été engendré             │
│    Lam yalid walam yulad            │
│                          [▶ 3]      │
│ ──────────────────────────────────  │
│ 4  وَلَمْ يَكُن لَّهُ كُفُوًا     │
│    أَحَدٌ                          │
│    Et il n'a pas d'égal             │
│    Walam yakun lahu kufuwan ahad    │
│                          [▶ 4]      │
│ ──────────────────────────────────  │
│                                     │
│ Statut : ✅ Connue                  │
│ Prochaine révision : dans 7 jours  │
│                                     │
│ [Réviser maintenant]                │
└─────────────────────────────────────┘
```

---

## 12. Statistiques & Progression

### 12.1 Écran Complet (Version Premium)

Ce qui existe est excellent. Compléter avec :

**Section "Vue d'ensemble" — manquant :**
- Temps total de récitation (lifetime)
- Nombre total de sessions terminées
- Meilleure série de sessions parfaites

**Section badges — amélioration :**
- Trier par : débloqués en premier, puis par catégorie
- Ajouter une progress bar sur les badges à débloquer (ex: "En Feu : 4/7 jours")

### 12.2 Niveaux et Progression

| Niveau | Nom FR | Nom AR | XP requis | XP cumulés |
|---|---|---|---|---|
| 1 | Débutant | مبتدئ | 0 | 0 |
| 2 | Récitant | قارئ | 200 | 200 |
| 3 | Apprenant | متعلم | 400 | 600 |
| 4 | Mémorisateur | محفّظ | 900 | 1 500 |
| 5 | Gardien | حارس | 1 500 | 3 000 |
| 6 | Maître | أستاذ | 3 000 | 6 000 |
| 7 | Lumière | نور | 6 000 | 12 000 |
| 8 | Hafiz | حافظ | 13 000 | 25 000 |

### 12.3 Graphique d'Activité

- Vue 7 jours : barres XP pour chaque jour de la semaine (M/M/J/V/S/D/L)
- Vue 30 jours : barres hebdomadaires ou points sur courbe
- Couleur barre : dorée (#D4AF37)
- Jours sans activité : barre minimale avec point orange (streak freeze utilisé) ou vide
- Tooltip au tap : "Lundi · 360 XP · 2 sessions"

---

## 13. Système de Gamification Complet

### 13.1 Gains XP

| Action | XP |
|---|---|
| Compléter la session du jour | +50 XP |
| Session parfaite (tout "Bien") | +50 XP bonus |
| Réviser une sourate (évaluation "Bien") | +15 XP |
| Réviser une sourate (évaluation "À revoir") | +5 XP |
| Réviser une sourate (évaluation "Oubliée") | +2 XP |
| Apprendre un nouveau verset | +20 XP |
| Compléter une sourate entière | +200 XP |
| Maintenir un streak de 7 jours | +100 XP bonus |
| Maintenir un streak de 30 jours | +500 XP bonus |
| Faire une session bonus | +25 XP max |

### 13.2 Liste Complète des Badges

#### Catégorie Régularité
| Badge | Condition | Icône |
|---|---|---|
| Premier pas | Terminer sa première session | ✨ |
| Première étincelle | 3 jours consécutifs | 🔥 |
| En feu | 7 jours consécutifs | 🔥🔥 |
| Lunaire | 30 jours consécutifs | 🌙 |
| Constant | 100 jours consécutifs | ⭐ |
| Légende | 365 jours consécutifs | 👑 |

#### Catégorie Mémorisation
| Badge | Condition | Icône |
|---|---|---|
| Premier pas (mémo) | Mémoriser une sourate complète | 📖 |
| Juz' Amma | Mémoriser 10 sourates | 📚 |
| Pèlerin | Mémoriser 25 sourates | 🕌 |
| Hafiz en chemin | Mémoriser 50 sourates | 🎯 |
| Hafiz | Mémoriser les 114 sourates | 💎 |

#### Catégorie Spéciale
| Badge | Condition | Icône |
|---|---|---|
| Fajr | Session complétée avant 7h | 🌅 |
| Isha | Session complétée après 22h | 🌙 |
| Éclair | Session terminée en moins de 3 min | ⚡ |
| Perfectionniste | 10 sessions parfaites consécutives | 🎯 |
| Famille | Tous membres famille actifs 7 jours | 🤝 |

### 13.3 Streak & Freeze

**Règles du streak :**
- Streak = nombre de jours consécutifs avec au moins une session complète
- Le jour commence à minuit et se termine à 23:59 (heure locale de l'utilisateur)
- Un freeze s'utilise automatiquement si l'utilisateur manque un jour (sans qu'il ait à faire quoi que ce soit)
- Le freeze consommé s'affiche dans l'historique (icône bouclier sur le graphique)

**Attribution des freezes :**
- Gratuit : 1 freeze par mois (recharge le 1er du mois)
- Premium : 3 freezes par mois

**Notification de streak en danger :**
- 2 heures avant minuit si session non faite → notification push
- Message : "⚠️ Ton streak de X jours se termine dans 2 heures !"

---

## 14. Réglages & Profil

### 14.1 Structure Complète des Réglages

```
Réglages

[Profil]
├── Prénom + statut compte (connecté / non-connecté)
└── → Écran profil (email, changer mot de passe, déconnexion)

[Objectif quotidien]
├── Sélecteur : 3 min / 5 min / 10 min / 15 min
└── Détail : X révisions · Y versets

[Rappels]
├── Toggle "Notification quotidienne"
├── Heure du rappel : boutons rapides (07:00 / 12:30 / 20:00 / 22:00)
│   └── + option "Autre heure" → time picker natif
└── Freeze de streak : nb disponibles + info recharge mensuelle

[Récitateur]
├── Voix préférée (info)
├── Mishary Rashid Al-Afasy [sélectionné] [▶ Aperçu] ← Gratuit
├── Mahmoud Khalil Al-Husary [👑 Premium] [▶ Aperçu]
├── Mohamed Siddiq Al-Minshawi [👑 Premium] [▶ Aperçu]
├── Abdul Rahman Al-Sudais [👑 Premium] [▶ Aperçu]
├── Abu Bakr Al-Shatri [👑 Premium] [▶ Aperçu]
└── Saud Al-Shuraym [👑 Premium] [▶ Aperçu]

[Abonnement]
├── Si Gratuit → "Passer à Premium" + CTA "Découvrir les offres"
└── Si Premium → "Quran Daily Premium · Actif" + CTA "Gérer mon abonnement"
    └── → Écran détail abonnement : date renouvellement + avantages

[Données & Confidentialité]
├── Info source (Quran.com)
├── Politique de confidentialité → webview
├── Conditions d'utilisation → webview
└── Réinitialiser l'application ← avec dialog de confirmation
    Dialog : "Attention, cette action supprimera toute ta progression locale.
    Tu pourras la récupérer si tu as un compte connecté."
    [Annuler] [Réinitialiser]
```

### 14.2 Écran Profil (⚠️ À Créer)

```
← Profil

[Avatar générique ou initiales]
[Prénom]
[email@exemple.com]

[Modifier le prénom]
[Changer le mot de passe]

───────────────────────────────

[Se déconnecter]  ← bouton rouge/discret
```

---

## 15. Page Abonnement Premium

### 15.1 Layout (⚠️ Ajouter le Prix)

```
← Quran Daily Premium
   Un parcours complet pour apprendre sans limite.

┌──────────────────────────────────────┐
│           ✦ Tout le Coran,           │
│             à ton rythme             │
│                                      │
│   Débloque l'intégralité du parcours │
│   et soutiens le développement       │
│   de Quran Daily.                    │
└──────────────────────────────────────┘

✅ Les 114 sourates et leur apprentissage guidé
✅ Tous les récitateurs disponibles
✅ Révisions quotidiennes illimitées
✅ Statistiques détaillées et tous les badges
✅ 3 freezes de streak par mois
✅ Aucune publicité pendant ton parcours
✅ Mode hors-ligne complet

────────────────────────────────────────

CHOISIR TON ABONNEMENT

┌───────────────────────────────────┐
│ 💎 Annuel                    ⭐   │  ← badge "Recommandé"
│ 19,99€/an                        │
│ soit 1,67€/mois · Économise 44%  │
│                                  │
│ [Commencer avec l'annuel]        │← CTA principal (doré)
└───────────────────────────────────┘

┌───────────────────────────────────┐
│ Mensuel                          │
│ 2,99€/mois                       │
│ Résiliable à tout moment         │
│                                  │
│ [Commencer avec le mensuel]      │← CTA secondaire (vert)
└───────────────────────────────────┘

🔒 Le paiement est traité par Apple ou Google.
   L'abonnement se renouvelle automatiquement
   jusqu'à son annulation dans les réglages du store.

[Conditions d'utilisation] [Confidentialité]
[Restaurer mes achats]
```

### 15.2 Règles d'Affichage du Paywall

- Le paywall s'affiche quand l'utilisateur tente d'accéder à une **sourate spécifique Premium** (pas à l'entrée de l'onglet)
- Sur l'écran paywall contextuel (depuis une sourate) : afficher le nom de la sourate en question
- Ne jamais interrompre une session en cours pour afficher le paywall
- Le prix doit être visible sans scroll
- Sur iOS, utiliser StoreKit pour les prix locaux (RevenueCat gère ça automatiquement)

---

## 16. Système de Notifications & Widget

### 16.1 Notifications Push

**Type 1 — Rappel quotidien** (heure choisie par l'utilisateur)
```javascript
const dailyMessages = [
  { title: "Quran Daily", body: "🌙 Ta session du jour t'attend. 5 minutes pour ton âme." },
  { title: "Quran Daily", body: "📖 N'oublie pas ta récitation du jour." },
  { title: "Quran Daily", body: `🔥 ${streak} jours de régularité ! Continue sur ta lancée.` },
  { title: "Quran Daily", body: "⭐ Commence ta journée avec le Coran. Tu ne le regretteras pas." },
  { title: "Quran Daily", body: "💪 Hier tu l'as fait. Aujourd'hui aussi tu peux." },
];
```

**Type 2 — Alerte streak en danger** (2h avant minuit si session non faite)
```javascript
{ 
  title: "⚠️ Streak en danger",
  body: `Ton streak de ${streak} jours se termine dans 2 heures. Ne laisse pas tomber !`
}
```

**Type 3 — Félicitations** (immédiat, événement)
```javascript
// Badge débloqué
{ title: "🏅 Nouveau badge !", body: `"En Feu" débloqué — 7 jours d'affilée !` }
// Sourate apprise
{ title: "📖 Sourate apprise !", body: `Tu connais maintenant Al-Ikhlas. Barakallahu fik !` }
// Anniversaire streak
{ title: `🔥 ${streak} jours !`, body: "Un mois de régularité. C'est extraordinaire." }
```

**Règles techniques :**
- Notifications planifiées localement (Expo Notifications LocalNotification) — pas besoin de serveur
- Respecter les heures calmes : jamais entre 23h et 7h sauf si l'utilisateur a choisi ces heures
- Un seul rappel par jour maximum (éviter le spam)
- L'alerte streak est conditionnelle : uniquement si session non faite à l'heure J-2h avant minuit

### 16.2 Widget iOS & Android

**Widget Petit (2×2 — iOS / Android)**
```
┌────────────────┐
│  🌙 Quran Daily│
│                │
│  🔥 42 jours   │
│  [Session →]   │
└────────────────┘
```

**Widget Moyen (4×2 — iOS / Android)**
```
┌───────────────────────────────┐
│ Quran Daily           🔥 42   │
│                               │
│ Aujourd'hui : An-Nasr + 1 v.  │
│ ████████░░░░ Session du jour  │
│                               │
│       [▶ Commencer]           │
└───────────────────────────────┘
```

**Widget Grand (4×4 — iOS uniquement)**
```
┌───────────────────────────────┐
│ Quran Daily           🔥 42   │
│                               │
│ إِلَّا الَّذِينَ آمَنُوا    │
│ sauf ceux qui croient...      │
│ Verset du jour (Al-Asr 3)     │
│                               │
│ Aujourd'hui : 2 rév. + 1 v.   │
│ ████████████░░ 75%             │
│                               │
│         [▶ Commencer]         │
└───────────────────────────────┘
```

**Implémentation :**
- iOS : WidgetKit via module natif Expo (ex: `expo-apple-targets`)
- Android : Glance Widgets ou module natif
- Les données du widget se rafraîchissent toutes les 15 minutes ou à chaque ouverture de l'app
- Tap sur le widget → ouvre directement la session

---

## 17. Fonctionnalités Manquantes à Développer

### 17.1 Liste Priorisée

**🔴 Bloquant avant lancement**

1. **Écran de compte (inscription/connexion)** — sans ça, l'utilisateur perd tout si il change de téléphone
   - Email + Google Sign-In + Apple Sign-In
   - Option "continuer sans compte"
   - Synchronisation données onboarding → Supabase

2. **Prix affiché sur la page Premium**
   - Afficher mensuel ET annuel avec économie calculée
   - Via RevenueCat : récupérer les prix localisés du store

3. **Translittération dans la révision**
   - Toggle visible (bouton discret sous la carte arabe)
   - Sauvegarde de la préférence utilisateur

4. **Fix grammatical** : "1 restant" (pas "restants")

5. **Fix paywall** : afficher le paywall sur la sourate spécifique, pas à l'entrée de l'onglet "Apprendre"

**🟡 Important pour la rétention (dans les 2 premières semaines post-lancement)**

6. **Animation confetti fin de session**

7. **Bouton partage + carte générée**

8. **Aperçu session J+1 en fin de session**

9. **Compteur visuel ×3 dans l'apprentissage**

10. **Écran détail d'une sourate** (depuis la bibliothèque)

11. **Heure de rappel customisable** (time picker, pas seulement les 4 options fixes)

**🟢 V2.1 (1-2 mois post-lancement)**

12. **Mode Famille** (comptes enfants, dashboard parent)

13. **Widget iOS & Android**

14. **Classement amis** (partage de code d'invitation, voir le streak des amis)

15. **Mode hors-ligne complet** (audio pré-chargé pour les sourates Premium)

16. **Police Amiri** pour le texte arabe (meilleure qualité typographique)

---

## 18. Spécifications Techniques

### 18.1 Stack Technologique

```
Frontend Mobile :
├── React Native + Expo (SDK 51+)
├── Expo Router (navigation)
├── Zustand (state management)
├── React Native Reanimated 3 (animations)
├── Expo AV ou react-native-track-player (audio)
└── react-native-view-shot (génération carte partage)

Backend :
├── Supabase (PostgreSQL + Auth + Realtime)
├── Auth : email/password + Google OAuth + Apple Sign-In
└── Edge Functions (calcul SRS côté serveur si nécessaire)

Paiement :
├── RevenueCat (gestion abonnements iOS + Android)
├── iOS : StoreKit 2
└── Android : Google Play Billing v5

Notifications :
└── Expo Notifications (FCM pour Android, APNs pour iOS)

Widget :
├── iOS : expo-apple-targets (WidgetKit)
└── Android : Module natif React Native (Glance)

Analytics :
└── PostHog (open-source, RGPD-compliant)

Data Coran :
├── Bundled JSON (textes arabes + traductions FR + translittérations)
└── API Quran.com (audios récitateurs, streaming)
    └── Endpoint : https://api.quran.com/api/v4
```

### 18.2 Sources de Données Coran

**API Quran.com (gratuite)**
- Texte arabe : `/verses/by_chapter/{id}?language=fr&words=true`
- Traduction FR : `?translations=31` (Muhammad Hamidullah)
- Translittération : `?fields=text_uthmani_simple`
- Audio : `https://audio.qurancdn.com/wbw/{récitateur}/{sourate}/{verset}.mp3`

**Bundled JSON (local, inclus dans l'app)**
- Taille estimée : ~5MB pour les 114 sourates (texte arabe + FR + translitt)
- Avantage : fonctionne hors-ligne dès le premier lancement, pas de dépendance réseau
- Structure :
```json
{
  "surah_number": 1,
  "name_arabic": "الفاتحة",
  "name_english": "Al-Fatiha",
  "name_french": "L'Ouverture",
  "total_verses": 7,
  "revelation_type": "meccan",
  "verses": [
    {
      "verse_number": 1,
      "text_arabic": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      "text_french": "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux",
      "transliteration": "Bismillahi arrahmani arraheem"
    }
  ]
}
```

### 18.3 Architecture du Projet

```
src/
├── app/                          # Expo Router
│   ├── (tabs)/
│   │   ├── index.tsx             # Home
│   │   ├── learn.tsx             # Apprendre
│   │   ├── library.tsx           # Sourates
│   │   ├── stats.tsx             # Progrès
│   │   └── settings.tsx          # Réglages
│   ├── session/
│   │   ├── review.tsx            # Révision active
│   │   ├── learn.tsx             # Apprentissage actif
│   │   └── complete.tsx          # Fin de session
│   ├── onboarding/
│   │   ├── welcome.tsx           # Écran 1/5
│   │   ├── known-surahs.tsx      # Écran 2/5
│   │   ├── next-surah.tsx        # Écran 3/5
│   │   ├── daily-goal.tsx        # Écran 4/5
│   │   ├── notifications.tsx     # Écran 5/5
│   │   └── account.tsx           # Écran 6 — inscription
│   ├── surah/
│   │   └── [id].tsx              # Détail d'une sourate
│   ├── subscription.tsx          # Page Premium
│   └── profile.tsx               # Profil utilisateur
│
├── components/
│   ├── ArabicText.tsx            # Texte arabe (RTL, Amiri font)
│   ├── VerseCard.tsx             # Carte verset
│   ├── SurahCard.tsx             # Carte sourate (liste)
│   ├── StreakBadge.tsx           # Badge 🔥 animé
│   ├── XPBar.tsx                 # Barre XP + niveau
│   ├── SessionSummary.tsx        # Carte session du jour
│   ├── Confetti.tsx              # Animation confetti
│   ├── ShareCard.tsx             # Carte partageable
│   ├── BadgeUnlocked.tsx         # Pop-up badge débloqué
│   ├── AudioPlayer.tsx           # Player audio verset
│   └── ProgressBar.tsx           # Barre progression
│
├── hooks/
│   ├── useSession.ts             # Logique session du jour
│   ├── useSRS.ts                 # Algorithme SRS
│   ├── useStreak.ts              # Streak + freeze
│   ├── useXP.ts                  # XP + niveaux
│   ├── useBadges.ts              # Badges
│   ├── useSubscription.ts        # RevenueCat
│   ├── useAudio.ts               # Audio
│   └── useQuranData.ts           # Données sourates
│
├── stores/
│   ├── userStore.ts              # Profil + préférences
│   ├── progressStore.ts          # Progression sourates
│   ├── sessionStore.ts           # Session en cours
│   └── gamificationStore.ts      # XP, streak, badges
│
├── services/
│   ├── supabase.ts               # Client Supabase
│   ├── quranApi.ts               # Client Quran.com
│   ├── notifications.ts          # Expo Notifications
│   └── revenuecat.ts             # RevenueCat
│
├── data/
│   ├── quran_complete.json       # 114 sourates bundled
│   ├── badges.ts                 # Définitions badges
│   ├── levels.ts                 # Définitions niveaux
│   └── quotes.ts                 # Citations islamiques
│
└── utils/
    ├── srs.ts                    # Algorithme SM-2
    ├── arabic.ts                 # Utilitaires arabe
    ├── date.ts                   # Dates + streaks
    └── xp.ts                    # Calcul XP
```

---

## 19. Base de Données & Modèles

### 19.1 Schéma SQL Complet (Supabase)

```sql
-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profils utilisateurs
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT,
  display_name TEXT NOT NULL DEFAULT 'Utilisateur',
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'premium', 'family')),
  subscription_expires_at TIMESTAMPTZ,
  revenuecat_user_id TEXT,
  family_id UUID,
  is_parent BOOLEAN DEFAULT false,
  daily_goal_minutes INT NOT NULL DEFAULT 5
    CHECK (daily_goal_minutes IN (3, 5, 10, 15)),
  daily_goal_reviews INT NOT NULL DEFAULT 2,
  daily_goal_verses INT NOT NULL DEFAULT 2,
  preferred_reciter TEXT NOT NULL DEFAULT 'mishary',
  notification_enabled BOOLEAN DEFAULT true,
  notification_time TIME DEFAULT '20:00',
  timezone TEXT DEFAULT 'Europe/Paris',
  language TEXT DEFAULT 'fr',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progression par sourate
CREATE TABLE surah_progress (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  surah_number INT NOT NULL CHECK (surah_number BETWEEN 1 AND 114),
  status TEXT NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked', 'learning', 'known')),
  verses_learned INT NOT NULL DEFAULT 0,
  total_verses INT NOT NULL,
  last_reviewed_at TIMESTAMPTZ,
  next_review_at TIMESTAMPTZ,
  review_interval_days INT NOT NULL DEFAULT 1,
  ease_factor FLOAT NOT NULL DEFAULT 2.5
    CHECK (ease_factor BETWEEN 1.3 AND 3.0),
  review_count INT NOT NULL DEFAULT 0,
  started_learning_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, surah_number)
);

-- Sessions quotidiennes
CREATE TABLE daily_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  duration_seconds INT DEFAULT 0,
  xp_earned INT NOT NULL DEFAULT 0,
  surahs_reviewed INT NOT NULL DEFAULT 0,
  verses_learned INT NOT NULL DEFAULT 0,
  is_perfect BOOLEAN NOT NULL DEFAULT false,
  is_bonus BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, session_date)
);

-- Streaks
CREATE TABLE streaks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_session_date DATE,
  freeze_count INT NOT NULL DEFAULT 1
    CHECK (freeze_count >= 0),
  freeze_last_reset DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- XP et niveaux
CREATE TABLE user_xp (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  total_xp INT NOT NULL DEFAULT 0,
  current_level INT NOT NULL DEFAULT 1,
  weekly_xp INT NOT NULL DEFAULT 0,
  week_start DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges débloqués
CREATE TABLE user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Groupes famille (V2.1)
CREATE TABLE families (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT,
  owner_id UUID REFERENCES profiles(id),
  invite_code TEXT UNIQUE DEFAULT
    UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6)),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les performances
CREATE INDEX idx_surah_progress_user_id ON surah_progress(user_id);
CREATE INDEX idx_surah_progress_next_review ON surah_progress(next_review_at);
CREATE INDEX idx_daily_sessions_user_date ON daily_sessions(user_id, session_date);
CREATE INDEX idx_user_badges_user_id ON user_badges(user_id);

-- Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE surah_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Policies (utilisateur voit uniquement ses données)
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own progress"
  ON surah_progress FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own sessions"
  ON daily_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own streak"
  ON streaks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own xp"
  ON user_xp FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own badges"
  ON user_badges FOR ALL USING (auth.uid() = user_id);
```

### 19.2 Types TypeScript

```typescript
// types/index.ts

export type SubscriptionTier = 'free' | 'premium' | 'family';
export type SurahStatus = 'locked' | 'learning' | 'known';
export type ReviewRating = 'good' | 'review' | 'forgotten';

export interface Profile {
  id: string;
  displayName: string;
  subscriptionTier: SubscriptionTier;
  subscriptionExpiresAt?: Date;
  dailyGoalMinutes: 3 | 5 | 10 | 15;
  dailyGoalReviews: number;
  dailyGoalVerses: number;
  preferredReciter: ReciterId;
  notificationEnabled: boolean;
  notificationTime: string; // "HH:MM"
  timezone: string;
  language: 'fr' | 'en' | 'ar';
  onboardingCompleted: boolean;
}

export interface Surah {
  number: number;           // 1-114
  nameArabic: string;       // الفاتحة
  nameTranslit: string;     // Al-Fatiha
  nameFrench: string;       // L'Ouverture
  totalVerses: number;
  revelationType: 'meccan' | 'medinan';
  juzNumber: number;
  isPremium: boolean;       // free: 1,108,109,112,113,114 | rest: premium
}

export interface Verse {
  surahNumber: number;
  verseNumber: number;
  textArabic: string;
  textFrench: string;
  transliteration: string;
  audioUrl?: string;
}

export interface SurahProgress {
  userId: string;
  surahNumber: number;
  status: SurahStatus;
  versesLearned: number;
  totalVerses: number;
  lastReviewedAt?: Date;
  nextReviewAt?: Date;
  reviewIntervalDays: number;
  easeFactor: number;
  reviewCount: number;
  startedLearningAt?: Date;
  completedAt?: Date;
}

export interface DailySession {
  id: string;
  userId: string;
  sessionDate: string;      // YYYY-MM-DD
  completed: boolean;
  completedAt?: Date;
  durationSeconds: number;
  xpEarned: number;
  surahsReviewed: number;
  versesLearned: number;
  isPerfect: boolean;
  isBonus: boolean;
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate?: string;
  freezeCount: number;
}

export interface UserXP {
  totalXP: number;
  currentLevel: number;
  weeklyXP: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'regularity' | 'memorization' | 'special';
  condition: BadgeCondition;
}

export interface BadgeCondition {
  type: 'streak' | 'surahs_learned' | 'session_time' | 'perfect_sessions' | 'special';
  threshold?: number;
}

export type ReciterId =
  | 'mishary'
  | 'husary'
  | 'minshawi'
  | 'sudais'
  | 'shatri'
  | 'shuraym';

export interface Reciter {
  id: ReciterId;
  name: string;
  description: string;
  isPremium: boolean;
  audioBaseUrl: string;
}

export interface SessionPlan {
  surahsToReview: number[];
  surahToLearn?: number;
  versesToLearn: number[];
  estimatedMinutes: number;
}
```

---

## 20. Design System

### 20.1 Couleurs

```css
/* Fond & Structure */
--color-bg-primary: #1A3A2A;       /* Fond principal (vert nuit) */
--color-bg-secondary: #2D5A3D;     /* Cartes, sections */
--color-bg-tertiary: #3A6B4A;      /* Cartes internes, inputs */
--color-bg-elevated: #4A7A5A;      /* Hover states */

/* Accents */
--color-gold: #D4AF37;             /* Or islamique — CTA, titres, accents */
--color-gold-light: #E8CC6B;       /* Or clair — hover, lumineux */
--color-gold-dark: #B8941F;        /* Or sombre — pressed state */

/* Texte */
--color-text-primary: #F5F5F0;     /* Blanc cassé — texte principal */
--color-text-secondary: #B8D4C0;   /* Vert clair — texte secondaire */
--color-text-disabled: #6B9A7B;    /* Texte désactivé */
--color-text-arabic: #FFFFFF;      /* Blanc pur — texte arabe */

/* Statuts */
--color-success: #81C784;          /* Vert succès ("Bien") */
--color-warning: #FFB74D;          /* Orange ("À revoir") */
--color-error: #E57373;            /* Rouge ("Oubliée") */
--color-premium: #D4AF37;          /* Or — éléments Premium */

/* Boutons */
--color-cta-primary: #D4AF37;      /* CTA principal (or) */
--color-cta-secondary: #2D5A3D;    /* CTA secondaire (vert) */
--color-cta-text: #1A3A2A;         /* Texte sur CTA primaire */
```

### 20.2 Typographie

```
Texte Arabe :
  Font : Amiri (Google Fonts) ou Scheherazade New
  Direction : RTL
  Tailles : 28px (verset principal) / 22px (liste) / 18px (compact)
  Color : --color-text-arabic
  Line-height : 1.8 (l'arabe a besoin de plus d'espace vertical)

Interface Générale :
  Font : Nunito (Google Fonts)
  Regular (400) : texte courant
  SemiBold (600) : labels, sous-titres
  Bold (700) : titres, chiffres importants
  ExtraBold (800) : titres écrans principaux

Translittération :
  Font : Nunito Italic
  Taille : 14px
  Color : --color-text-secondary
```

### 20.3 Composants UI — Règles

**Boutons :**
- CTA principal : fond or (#D4AF37), texte vert foncé, border-radius 16px, height 56px
- CTA secondaire : fond vert (#2D5A3D), texte blanc, même radius
- Bouton texte : pas de fond, texte or
- Bouton danger : fond transparent, texte rouge, border rouge

**Cartes :**
- Background : --color-bg-secondary
- Border-radius : 16px
- Padding : 16px
- Ombre : légère (elevation 2), pas d'ombre forte
- Cartes interactives : légère surbrillance au tap (--color-bg-elevated)

**Inputs :**
- Background : --color-bg-tertiary
- Border : 1px solid --color-bg-elevated
- Focus border : 1px solid --color-gold
- Border-radius : 12px
- Padding : 14px 16px

**Bottom Navigation :**
- Background : --color-bg-secondary
- Icône active : --color-gold
- Icône inactive : --color-text-disabled
- Label active : --color-gold, 600 weight
- Label inactive : --color-text-disabled

**Badges (pill) :**
- Actif (sélectionné) : fond or, texte vert foncé
- Inactif : fond --color-bg-tertiary, texte --color-text-secondary
- Border-radius : 20px (pill shape)

### 20.4 Animations

```javascript
// Durées standardisées
const ANIMATION = {
  fast: 150,      // Taps, micro-interactions
  normal: 300,    // Transitions d'écrans
  slow: 500,      // Célébrations, badges
};

// Confetti fin de session
// Librairie : lottie-react-native (fichier .json à créer)
// Particules : ★ étoiles + ☽ croissants + • points
// Couleurs : or + blanc + vert clair
// Durée : 2 secondes, fade out progressif

// Badge débloqué
// Scale : 0 → 1.2 → 1.0 (bounce)
// Avec son : "ding" court et doux

// XP pop
// Texte "+130 XP" : scale up + fade out vers le haut

// Streak flamme
// Légère animation de danse (react-native-reanimated, withRepeat)
```

---

## 21. Plan de Lancement Commercial

### 21.1 Pré-Lancement (Jours 1-7)

**Jour 1-2 : Infrastructure**
- [ ] Supabase : créer le projet, appliquer le schéma SQL
- [ ] RevenueCat : configurer les produits (mensuel + annuel)
- [ ] Apple Developer : créer les produits In-App Purchase
- [ ] Google Play : créer les produits In-App Purchase
- [ ] Domaine : acquérir qurandaily.app (ou .fr pour FR)

**Jour 3-4 : Développement des manquants critiques**
- [ ] Écran inscription/connexion (post-onboarding)
- [ ] Afficher les prix sur la page Premium (RevenueCat getOfferings())
- [ ] Translittération toggleable dans la révision
- [ ] Fix "1 restant" (accord)
- [ ] Fix paywall contextuel (sourate, pas onglet)

**Jour 5-6 : Polish & Tests**
- [ ] Animation confetti (Lottie)
- [ ] Bouton partage + génération carte image
- [ ] Aperçu session J+1 sur écran fin
- [ ] Tests end-to-end sur iPhone et Android réel
- [ ] Tests achat in-app (mode sandbox)

**Jour 7 : Soumission**
- [ ] Screenshots 6.7" iPhone + 5.5" iPhone
- [ ] Screenshots Android téléphone 6.7"
- [ ] Descriptions App Store (FR + EN)
- [ ] Privacy Policy en ligne (obligatoire Apple)
- [ ] Terms of Service en ligne
- [ ] Soumettre Apple (prévoir 1-3 jours de review)
- [ ] Publier Google Play (review 24-48h)

### 21.2 Lancement (Jour 8-14)

**Contenu réseaux sociaux :**
- [ ] Vidéo de démo TikTok/Instagram (30s, screen recording + voix off)
- [ ] Post de lancement LinkedIn/Twitter/Facebook
- [ ] Contacter 10 micro-influenceurs islamiques (offrir accès Premium)
- [ ] Poster dans 5-10 groupes Facebook islamiques FR
- [ ] Sous-reddit r/islam, r/learnquran

**Monitoring :**
- [ ] PostHog configuré (events : session_started, session_completed, paywall_viewed, subscription_started)
- [ ] Alertes Supabase (erreurs, surcharge)
- [ ] Monitoring RevenueCat (conversions, churns)

### 21.3 Post-Lancement (Semaines 2-4)

**Analyse des données :**
- Taux de conversion Free → Premium cible : 5-10%
- DAU/MAU ratio cible : >25% (si <20%, problème de rétention)
- Streak moyen à J7 : >3 jours (si <3, revoir les notifications)
- Sessions/user/semaine cible : >4

**Optimisation en continu :**
- A/B test : prix paywall (2,49€ vs 2,99€ vs 3,49€)
- A/B test : message notification (4 variantes)
- Collecter les reviews App Store et répondre à toutes

---

## 22. Projections Financières

### 22.1 Modèle de Croissance

**Hypothèses :**
- CAC (coût acquisition client) : 3-8€ par install via Meta Ads
- Taux conversion install → Premium : 5% (conservateur) à 12% (optimiste)
- Prix moyen réel : 2,20€/mois (mix mensuel/annuel, ~40% optent pour l'annuel)
- Churn mensuel : 10-15% (normal pour apps bien gamifiées)

**Scénario Réaliste (objectif 12 mois) :**

| Mois | Installs | Abonnés | MRR | Charges | Bénéfice |
|---|---|---|---|---|---|
| 1 | 800 | 60 | 132€ | 250€ | -118€ |
| 2 | 2 000 | 200 | 440€ | 350€ | +90€ |
| 3 | 4 000 | 450 | 990€ | 500€ | +490€ |
| 4 | 6 000 | 720 | 1 584€ | 600€ | +984€ |
| 6 | 12 000 | 1 500 | 3 300€ | 800€ | +2 500€ |
| 9 | 25 000 | 3 000 | 6 600€ | 1 200€ | +5 400€ |
| 12 | 50 000 | 5 500 | 12 100€ | 1 800€ | +10 300€ |

**Break-even :** ~120 abonnés Premium actifs

**Ramadan Boost :** multiplier les installs par 4-6 pendant le mois de Ramadan (campagne dédiée à prévoir)

### 22.2 Charges Détaillées

| Poste | M1 | M3 | M6 | M12 |
|---|---|---|---|---|
| Supabase | 0€ | 25€ | 50€ | 100€ |
| RevenueCat (3% fees) | 4€ | 30€ | 99€ | 363€ |
| Apple Developer | 8€ | 8€ | 8€ | 8€ |
| Meta Ads | 200€ | 400€ | 600€ | 1 200€ |
| Créateurs contenu | 0€ | 0€ | 0€ | 100€ |
| Domaine + hosting LP | 5€ | 5€ | 5€ | 5€ |
| PostHog | 0€ | 0€ | 0€ | 50€ |
| **Total** | **217€** | **468€** | **762€** | **1 826€** |

### 22.3 KPIs à Surveiller

| KPI | Objectif M1 | Objectif M3 | Objectif M6 |
|---|---|---|---|
| Installs | 500 | 4 000 | 12 000 |
| DAU/MAU | >20% | >28% | >35% |
| Streak moyen (actifs) | 3 j | 7 j | 12 j |
| Taux conversion | 5% | 7% | 9% |
| Churn mensuel | <20% | <15% | <12% |
| Rating App Store | >4.0 | >4.3 | >4.5 |
| Sessions/user/semaine | 3 | 5 | 6 |
| MRR | 150€ | 800€ | 3 000€ |

---

## 23. Checklist App Store / Google Play

### 23.1 Apple App Store

**Assets requis :**
- [ ] Icône 1024×1024px (PNG, fond uni, pas de transparence, pas d'arrondi)
- [ ] 3 screenshots minimum iPhone 6.7" (1290×2796px)
- [ ] 3 screenshots minimum iPhone 5.5" (1242×2208px)
- [ ] (Optionnel) Screenshots iPad 12.9" (2048×2732px)
- [ ] Preview vidéo (15-30s, format App Preview)

**Métadonnées :**
- [ ] Nom : "Quran Daily — Mémorise le Coran" (max 30 chars)
- [ ] Sous-titre : "Révision guidée · Streaks · Progrès" (max 30 chars)
- [ ] Description (max 4 000 chars) — FR + EN
- [ ] Mots-clés ASO (max 100 chars) : "coran,sourates,mémorisation,hifz,quran,islam,récitation,apprendre,revision,musulman"
- [ ] URL Support : support@qurandaily.app
- [ ] URL Marketing (optionnel) : qurandaily.app
- [ ] URL Politique de Confidentialité : qurandaily.app/privacy (OBLIGATOIRE pour apps avec IAP)

**In-App Purchase :**
- [ ] Créer "Quran Daily Premium Mensuel" (auto-renewing subscription)
- [ ] Créer "Quran Daily Premium Annuel" (auto-renewing subscription)
- [ ] Localisation des prix (EUR, MAD, DZD...)
- [ ] Description IAP FR + EN

**Informations légales :**
- [ ] Catégorie principale : Éducation
- [ ] Catégorie secondaire : Référence
- [ ] Classification d'âge : 4+ (aucun contenu restreint)
- [ ] Copyright : © 2026 [Ton nom/société]

**Review Guidelines :**
- [ ] L'app ne contient pas d'images offensantes
- [ ] Pas de contenu politique ou de prosélytisme
- [ ] Les IAP sont clairement présentés
- [ ] L'option "Continuer sans compte" fonctionne
- [ ] "Restaurer mes achats" fonctionne

### 23.2 Google Play Store

**Assets requis :**
- [ ] Icône 512×512px (PNG, fond non-transparent)
- [ ] Feature Graphic 1024×500px (bandeau en haut de la fiche)
- [ ] 4 screenshots téléphone (1080×1920px minimum)
- [ ] (Optionnel) Screenshots tablette

**Métadonnées :**
- [ ] Titre (max 30 chars) : "Quran Daily — Mémorise le Coran"
- [ ] Description courte (max 80 chars) : "Révise tes sourates chaque jour. Mémorise le Coran verset par verset."
- [ ] Description longue (max 4 000 chars)
- [ ] Catégorie : Éducation
- [ ] Tags : religion, islam, coran, education, memorization

**Configuration technique :**
- [ ] Politique de confidentialité obligatoire (URL)
- [ ] Déclaration sur la collecte de données (Data Safety)
- [ ] Target SDK : 34+
- [ ] Permissions déclarées et justifiées (notifications uniquement)

**In-App Purchase Play :**
- [ ] Créer les abonnements dans Google Play Console
- [ ] Configurer RevenueCat avec la clé API Google Play
- [ ] Tester avec comptes test Google Play

---

*Document Quran Daily V2.0 — Prêt pour production*  
*Basé sur le MVP validé Android · Juin 2026*
