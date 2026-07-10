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
  { id: 'streak_100', title: 'Constant', description: 'Atteindre 100 jours de suite', symbol: '★' },
  { id: 'streak_365', title: 'Légende', description: 'Atteindre 365 jours de suite', symbol: '✺' },
  { id: 'surah_1', title: 'Première sourate', description: 'Mémoriser une sourate complète', symbol: '۞' },
  { id: 'surah_10', title: "Juz' Amma", description: 'Mémoriser 10 sourates', symbol: '✧' },
  { id: 'surah_25', title: 'Pèlerin', description: 'Mémoriser 25 sourates', symbol: '◈' },
  { id: 'surah_50', title: 'Hafiz en chemin', description: 'Mémoriser 50 sourates', symbol: '♛' },
  { id: 'surah_114', title: 'Hafiz', description: 'Mémoriser les 114 sourates', symbol: '❖' },
  { id: 'fajr', title: 'Fajr', description: 'Terminer une session avant 7 h', symbol: '☀' },
  { id: 'isha', title: 'Isha', description: 'Terminer une session après 22 h', symbol: '☽' },
  { id: 'lightning', title: 'Éclair', description: 'Terminer une session en moins de 3 minutes', symbol: 'ϟ' },
  { id: 'perfect_10', title: 'Perfectionniste', description: 'Réussir 10 sessions parfaites de suite', symbol: '◎' },
];

export const badgeById = Object.fromEntries(badges.map((badge) => [badge.id, badge]));
