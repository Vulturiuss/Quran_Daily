export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  symbol: string;
}

export const badges: BadgeDefinition[] = [
  { id: 'first_session', title: 'Premier pas', description: 'Terminer sa première session', symbol: '✦' },
  { id: 'streak_3', title: 'Première étincelle', description: 'Atteindre 3 jours de suite', symbol: '◆' },
  { id: 'streak_7', title: 'En feu', description: 'Atteindre 7 jours de suite', symbol: '◇' },
  { id: 'streak_30', title: 'Lunaire', description: 'Atteindre 30 jours de suite', symbol: '☾' },
  { id: 'surah_1', title: 'Une sourate ancrée', description: 'Mémoriser une sourate complète', symbol: '۞' },
  { id: 'surah_10', title: "Juz' Amma", description: 'Mémoriser 10 sourates', symbol: '✧' },
  { id: 'xp_1000', title: 'Récitant assidu', description: 'Atteindre 1 000 XP', symbol: '★' },
  { id: 'perfect_10', title: 'Perfectionniste', description: 'Réussir 10 sessions parfaites', symbol: '◎' },
];

export const badgeById = Object.fromEntries(badges.map((badge) => [badge.id, badge]));
