export interface LegalSection {
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export const legalUpdatedAt = '15 juin 2026';
export const developerName =
  process.env.EXPO_PUBLIC_DEVELOPER_NAME?.trim() || 'Quran Daily';
export const supportEmail =
  process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || undefined;
export const supportContact =
  supportEmail || 'adresse de support à configurer avant publication';

export const privacySections: LegalSection[] = [
  {
    title: 'Responsable et portée',
    paragraphs: [
      `${developerName} édite l’application Quran Daily. Cette politique explique les données utilisées par l’application mobile et ses services connectés facultatifs.`,
      `Contact pour toute question relative aux données : ${supportContact}.`,
    ],
  },
  {
    title: 'Données stockées sur l’appareil',
    paragraphs: [
      'Quran Daily conserve localement ton prénom d’affichage, tes objectifs, ta progression, tes sessions, ton streak, tes statistiques, tes préférences et les autorisations de notification.',
      'Le texte des 114 sourates est inclus dans l’application. Certains fichiers et liens audio peuvent être mis en cache pour faciliter la lecture.',
    ],
  },
  {
    title: 'Compte et synchronisation Supabase',
    paragraphs: [
      'La création d’un compte est facultative. Lorsque tu crées un compte, Supabase traite ton adresse e-mail, les informations nécessaires à l’authentification et une copie synchronisée de ta progression.',
      'Ces données servent uniquement à sécuriser ton compte et à retrouver ta progression sur plusieurs appareils.',
    ],
  },
  {
    title: 'Espace Famille et profils enfants',
    paragraphs: [
      'Avec Premium Famille, chaque membre utilise son propre compte et conserve une progression séparée. Un code d’invitation permet de rejoindre volontairement un espace familial.',
      'Le parent gestionnaire peut consulter pour chaque enfant le streak, les sourates et versets mémorisés, les XP, le temps de récitation, la sourate en cours et l’historique des sessions. Il n’accède ni au mot de passe, ni aux données d’authentification, ni aux réglages privés de l’enfant.',
      'Le parent peut retirer un enfant de la famille et l’enfant peut quitter la famille. Ces actions conservent le compte et la progression personnelle, mais retirent l’accès Premium partagé et le suivi parental.',
    ],
  },
  {
    title: 'Abonnements et services tiers',
    paragraphs: [
      'Les paiements sont traités par Apple ou Google. Quran Daily ne reçoit pas les données complètes de ta carte bancaire.',
      'RevenueCat traite les informations techniques nécessaires pour vérifier le statut de l’abonnement et restaurer les achats.',
      'La lecture audio peut contacter les services Quran.com et verses.quran.com. Comme pour tout service internet, ces fournisseurs peuvent recevoir des données techniques de connexion telles que l’adresse IP.',
    ],
  },
  {
    title: 'Notifications',
    paragraphs: [
      'Les rappels quotidiens et les alertes de streak sont programmés localement sur l’appareil. Quran Daily n’utilise pas ces rappels pour suivre ton activité en dehors de l’application.',
    ],
  },
  {
    title: 'Partage, publicité et analyse',
    paragraphs: [
      'La version actuelle ne vend pas tes données personnelles et n’intègre ni publicité ni outil d’analyse comportementale.',
      'Les données sont transmises uniquement aux prestataires nécessaires décrits ci-dessus lorsque tu utilises leurs fonctionnalités.',
    ],
  },
  {
    title: 'Conservation et suppression',
    paragraphs: [
      'Les données locales restent sur l’appareil jusqu’à leur réinitialisation, la suppression du compte depuis l’application ou la désinstallation.',
      'Les données synchronisées restent associées au compte jusqu’à sa suppression. La suppression depuis l’écran Compte efface le compte Supabase et les données cloud associées, puis réinitialise les données locales.',
      'La suppression du compte n’annule pas automatiquement un abonnement géré par Apple ou Google.',
    ],
  },
  {
    title: 'Sécurité et tes choix',
    paragraphs: [
      'Les échanges avec Supabase, RevenueCat et Quran.com utilisent des connexions chiffrées. Aucun système ne peut toutefois garantir une sécurité absolue.',
      'Tu peux utiliser l’application sans compte, désactiver les notifications, te déconnecter, réinitialiser les données locales ou supprimer ton compte depuis les réglages.',
    ],
  },
  {
    title: 'Évolutions',
    paragraphs: [
      'Cette politique peut évoluer si les fonctionnalités ou les prestataires changent. La date de mise à jour affichée en haut du document sera alors modifiée.',
    ],
  },
];

export const termsSections: LegalSection[] = [
  {
    title: 'Objet du service',
    paragraphs: [
      'Quran Daily propose des outils de récitation, de mémorisation, de révision espacée et de suivi de progression autour du Coran.',
      'L’application peut être utilisée localement sans compte. Certaines fonctions nécessitent internet, un compte facultatif ou un abonnement.',
    ],
  },
  {
    title: 'Compte',
    paragraphs: [
      'Tu es responsable de la confidentialité de tes identifiants et de l’exactitude des informations fournies.',
      'Tu peux supprimer ton compte depuis l’écran Compte. Cette action est définitive pour les données synchronisées et la progression locale.',
    ],
  },
  {
    title: 'Contenu religieux et pédagogique',
    paragraphs: [
      'Quran Daily est un outil pédagogique et ne remplace pas l’accompagnement d’un enseignant qualifié ou d’une autorité religieuse.',
      'Malgré les contrôles effectués, une erreur de texte, de traduction, de translittération ou de synchronisation audio reste possible. Signale toute anomalie à l’adresse de support.',
    ],
  },
  {
    title: 'Abonnements',
    paragraphs: [
      'Les offres payantes, leurs prix et leur durée sont affichés avant l’achat. Le paiement, le renouvellement, l’annulation et les remboursements sont gérés par Apple ou Google selon leurs propres règles.',
      'La suppression du compte Quran Daily ne résilie pas un abonnement actif. Celui-ci doit être géré dans les réglages du store concerné.',
      'L’offre Famille permet au parent gestionnaire d’inviter jusqu’à quatre profils enfants. Chaque membre doit utiliser son propre compte. Le partage d’identifiants entre membres n’est pas nécessaire et reste déconseillé.',
    ],
  },
  {
    title: 'Utilisation acceptable',
    paragraphs: [
      'Tu t’engages à ne pas contourner les restrictions d’accès, perturber le service, tenter d’accéder aux comptes d’autres utilisateurs ou utiliser l’application à des fins illégales.',
    ],
  },
  {
    title: 'Disponibilité',
    paragraphs: [
      'Les fonctions locales restent conçues pour fonctionner hors ligne. Les comptes, la synchronisation, les achats et certains audios dépendent de services tiers et peuvent être temporairement indisponibles.',
      'Le service peut évoluer, être corrigé ou interrompu lorsque cela est nécessaire à sa sécurité ou à son amélioration.',
    ],
  },
  {
    title: 'Propriété et licences',
    paragraphs: [
      'L’interface, le code, la marque et les éléments graphiques de Quran Daily sont protégés par les droits applicables.',
      'Les textes, traductions, translittérations et audios issus de Quran.com restent soumis aux droits et conditions de leurs auteurs et fournisseurs respectifs.',
    ],
  },
  {
    title: 'Responsabilité',
    paragraphs: [
      'Quran Daily est fourni avec un objectif d’aide à l’apprentissage. Dans les limites permises par la loi, le service ne garantit pas une disponibilité continue ni l’absence totale d’erreurs.',
    ],
  },
  {
    title: 'Contact et modifications',
    paragraphs: [
      `Pour toute question : ${supportContact}.`,
      'Ces conditions peuvent être mises à jour lorsque le service évolue. La poursuite de l’utilisation après publication d’une nouvelle version vaut acceptation dans les limites prévues par la loi.',
    ],
  },
];
