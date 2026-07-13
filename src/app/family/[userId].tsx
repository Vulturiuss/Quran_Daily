import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  BellRing,
  BookOpen,
  Clock3,
  Flame,
  GraduationCap,
  Star,
  UserRound,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import {
  MetricStrip,
  ProgressRing,
} from '@/components/HabitProgress';
import { OrnamentalCard } from '@/components/OrnamentalCard';
import {
  Card,
  Eyebrow,
  IconButton,
  PrimaryButton,
  ProgressBar,
  ScreenTitle,
  SectionHeader,
} from '@/components/ui';
import { getSurah } from '@/data/surahs';
import { useFamily } from '@/providers/FamilyProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { sendFamilyNudge } from '@/services/family';
import { Palette, radius, spacing, typography, withAlpha } from '@/theme';
import { goBackOrReplace } from '@/utils/navigation';
import { buildActivitySeries } from '@/utils/statistics';

export default function FamilyMemberScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { context, members, loading } = useFamily();
  const [nudging, setNudging] = useState(false);
  const [nudgeFeedback, setNudgeFeedback] = useState<string>();
  const member = members.find(
    (candidate) => candidate.userId === userId && candidate.role === 'child',
  );

  if (loading) {
    return (
      <AppScreen>
        <Card style={styles.centerCard}>
          <Text style={styles.muted}>Chargement de la progression…</Text>
        </Card>
      </AppScreen>
    );
  }

  if (context?.role !== 'parent' || !member) {
    return (
      <AppScreen>
        <ScreenTitle
          action={
            <IconButton
              icon={ArrowLeft}
              label="Retour"
              onPress={() => goBackOrReplace('/family' as never)}
            />
          }
          title="Progression"
        />
        <Card style={styles.centerCard}>
          <Text style={styles.title}>Profil indisponible</Text>
          <Text style={styles.muted}>
            Ce profil n’appartient pas à ton espace familial.
          </Text>
        </Card>
      </AppScreen>
    );
  }

  const learningSurah = getSurah(member.learningSurah);
  const learningProgress = member.learningTotalVerses
    ? member.learningVersesLearned / member.learningTotalVerses
    : 0;
  const activity = buildActivitySeries(member.history, 7);
  const maxXP = Math.max(50, ...activity.map((point) => point.xp));
  const recentSessions = [...member.history]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const child = member;

  // A reminder is not a punishment, and it is not a remote control. It can be
  // sent once every few hours, only to a child who has not done their session
  // yet, and it says nothing more than "we are thinking of you".
  async function handleNudge() {
    setNudging(true);
    setNudgeFeedback(undefined);
    const result = await sendFamilyNudge(child.userId);
    setNudging(false);

    if (result.error) {
      setNudgeFeedback(result.error);
      return;
    }
    if (result.data === 'rate_limited') {
      setNudgeFeedback('Tu as déjà envoyé un rappel récemment.');
      return;
    }
    if (result.data === 'no_device') {
      setNudgeFeedback(
        `${child.displayName} n’a pas encore activé les notifications.`,
      );
      return;
    }
    setNudgeFeedback('Rappel envoyé.');
  }

  return (
    <AppScreen>
      <ScreenTitle
        action={
          <IconButton
            icon={ArrowLeft}
            label="Retour"
            onPress={() => goBackOrReplace('/family' as never)}
          />
        }
        subtitle="Une vue de soutien, sans comparaison."
        title="Progression enfant"
      />

      <OrnamentalCard contentStyle={styles.hero}>
        <View style={styles.avatar}>
          <UserRound color={colors.gold} size={29} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>Profil enfant</Text>
          <Text style={styles.name}>{member.displayName}</Text>
          <Text style={styles.updated}>
            {member.snapshotUpdatedAt
              ? `Synchronisé le ${new Date(member.snapshotUpdatedAt).toLocaleDateString('fr-FR')}`
              : 'Aucune progression synchronisée'}
          </Text>
        </View>
      </OrnamentalCard>

      <SectionHeader title="Aujourd’hui" />
      <Card
        style={[
          styles.todayCard,
          member.todayCompleted ? styles.todayDone : styles.todayPending,
        ]}
      >
        <View style={styles.todayIcon}>
          <Clock3
            color={member.todayCompleted ? colors.success : colors.warning}
            size={22}
          />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.todayTitle}>
            {member.todayCompleted ? 'Routine terminée' : 'Routine à faire'}
          </Text>
          <Text style={styles.todayText}>
            {member.todayCompleted
              ? `${member.todayMinutes} min de travail · ${member.todayReviews} révision${member.todayReviews > 1 ? 's' : ''} · ${member.todayVersesLearned} verset${member.todayVersesLearned > 1 ? 's' : ''} · +${member.todayXPEarned} XP`
              : 'Aucune session synchronisée aujourd’hui.'}
          </Text>
          {member.todayCompleted ? (
            // The time is what makes the rest meaningful: it is measured on the
            // text itself and validated by the server, so it cannot be earned by
            // tapping through.
            <Text style={styles.verifiedNote}>
              Temps réellement passé sur le texte, vérifié.
            </Text>
          ) : null}
        </View>
      </Card>

      {!member.todayCompleted ? (
        <Card style={styles.nudgeCard}>
          <View style={styles.nudgeTop}>
            <View style={styles.nudgeIcon}>
              <BellRing color={colors.gold} size={20} />
            </View>
            <View style={styles.heroCopy}>
              <Eyebrow>Un geste, pas une pression</Eyebrow>
              <Text style={styles.nudgeTitle}>
                Envoyer un rappel à {member.displayName}
              </Text>
            </View>
          </View>
          <Text style={styles.nudgeText}>
            Une notification douce, pour lui rappeler que sa session l’attend.
            Un rappel toutes les six heures au maximum : au-delà, ce ne serait
            plus un rappel.
          </Text>
          <PrimaryButton
            icon={BellRing}
            label="Envoyer un rappel"
            loading={nudging}
            onPress={() => void handleNudge()}
            variant="surface"
          />
          {nudgeFeedback ? (
            <Text style={styles.nudgeFeedback}>{nudgeFeedback}</Text>
          ) : null}
        </Card>
      ) : null}

      <SectionHeader title="Parcours global" />
      <Card style={styles.globalCard}>
        <ProgressRing label="du parcours" value={member.knownSurahs / 114} />
        <View style={styles.globalCopy}>
          <Text style={styles.globalValue}>{member.knownSurahs}/114</Text>
          <Text style={styles.globalLabel}>sourates mémorisées</Text>
          <Text style={styles.globalDetail}>
            {member.versesLearned} versets appris au total
          </Text>
        </View>
      </Card>

      <MetricStrip
        items={[
          { icon: Flame, label: 'jours de suite', value: member.currentStreak },
          { icon: Star, label: 'XP gagnés', value: member.totalXP },
          { icon: Clock3, label: 'minutes vécues', value: member.totalMinutes },
        ]}
      />

      <SectionHeader title="Apprentissage en cours" />
      <Card style={styles.learningCard}>
        <View style={styles.learningHeader}>
          <View style={styles.learningIcon}>
            <GraduationCap color={colors.gold} size={22} />
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.learningName}>
              {learningSurah?.nameTranslit ?? 'Aucune sourate en cours'}
            </Text>
            <Text style={styles.learningMeta}>
              {learningSurah
                ? `${member.learningVersesLearned}/${member.learningTotalVerses} versets`
                : 'Le prochain choix apparaîtra après synchronisation.'}
            </Text>
          </View>
          {learningSurah ? (
            <Text style={styles.learningArabic}>{learningSurah.name}</Text>
          ) : null}
        </View>
        {learningSurah ? (
          <View style={styles.progress}>
            <ProgressBar value={learningProgress} />
          </View>
        ) : null}
      </Card>

      <SectionHeader title="Régularité sur 7 jours" />
      <Card>
        <View style={styles.chart}>
          {activity.map((point) => (
            <View key={point.date} style={styles.barColumn}>
              <Text style={styles.barValue}>{point.xp || ''}</Text>
              <View style={styles.barTrack}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${Math.max(
                        point.xp ? 12 : 3,
                        (point.xp / maxXP) * 100,
                      )}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel}>
                {new Intl.DateTimeFormat('fr-FR', {
                  weekday: 'narrow',
                }).format(new Date(`${point.date}T12:00:00`))}
              </Text>
            </View>
          ))}
        </View>
      </Card>

      <SectionHeader title="Dernières sessions" />
      {recentSessions.length ? (
        <Card style={styles.sessionsCard}>
          {recentSessions.map((session, index) => (
            <View
              key={session.date}
              style={[
                styles.sessionRow,
                index < recentSessions.length - 1 && styles.sessionDivider,
              ]}
            >
              <View style={styles.sessionIcon}>
                <BookOpen color={colors.gold} size={18} />
              </View>
              <View style={styles.heroCopy}>
                <Text style={styles.sessionDate}>
                  {new Date(`${session.date}T12:00:00`).toLocaleDateString(
                    'fr-FR',
                    { day: 'numeric', month: 'long' },
                  )}
                </Text>
                <Text style={styles.sessionMeta}>
                  {session.surahsReviewed} révisions · {session.versesLearned} versets
                </Text>
              </View>
              <Text style={styles.sessionXP}>+{session.xpEarned} XP</Text>
            </View>
          ))}
        </Card>
      ) : (
        <Card style={styles.centerCard}>
          <Text style={styles.muted}>Aucune session synchronisée pour le moment.</Text>
        </Card>
      )}
    </AppScreen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  centerCard: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  title: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 19,
  },
  muted: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  hero: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.12),
    borderRadius: radius.pill,
    height: 60,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 60,
  },
  heroCopy: {
    flex: 1,
  },
  eyebrow: {
    color: colors.gold,
    fontFamily: typography.extraBold,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  name: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 23,
    marginTop: 2,
  },
  updated: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
    marginTop: 3,
  },
  todayCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  todayDone: {
    borderColor: withAlpha(colors.success, 0.28),
  },
  todayPending: {
    borderColor: withAlpha(colors.warning, 0.3),
  },
  todayIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.ink, 0.06),
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    width: 46,
  },
  todayTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 16,
  },
  verifiedNote: {
    color: colors.textFaint,
    fontFamily: typography.regular,
    fontSize: 11,
    marginTop: 4,
  },
  todayText: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  nudgeCard: {
    gap: spacing.md,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  nudgeTop: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  nudgeIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.1),
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  nudgeTitle: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 16,
    marginTop: 2,
  },
  nudgeText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 12,
    lineHeight: 19,
  },
  nudgeFeedback: {
    color: colors.goldSoft,
    fontFamily: typography.medium,
    fontSize: 12,
    textAlign: 'center',
  },
  globalCard: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  globalCopy: {
    flex: 1,
  },
  globalValue: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 28,
  },
  globalLabel: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 13,
    marginTop: 2,
  },
  globalDetail: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  learningCard: {
    padding: spacing.md,
  },
  learningHeader: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  learningIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.1),
    borderRadius: radius.md,
    height: 46,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 46,
  },
  learningName: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 16,
  },
  learningMeta: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 11,
    marginTop: 2,
  },
  learningArabic: {
    color: colors.goldSoft,
    fontFamily: typography.arabic,
    fontSize: 24,
  },
  progress: {
    marginTop: spacing.md,
  },
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    height: 160,
    justifyContent: 'space-between',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValue: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 9,
    height: 17,
  },
  barTrack: {
    backgroundColor: withAlpha(colors.ink, 0.05),
    borderRadius: radius.pill,
    height: 105,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 18,
  },
  bar: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    width: 18,
  },
  barLabel: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 10,
    marginTop: spacing.sm,
  },
  sessionsCard: {
    padding: spacing.md,
  },
  sessionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 64,
  },
  sessionDivider: {
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  sessionIcon: {
    alignItems: 'center',
    backgroundColor: withAlpha(colors.gold, 0.1),
    borderRadius: radius.pill,
    height: 38,
    justifyContent: 'center',
    marginRight: spacing.md,
    width: 38,
  },
  sessionDate: {
    color: colors.text,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  sessionMeta: {
    color: colors.textMuted,
    fontFamily: typography.medium,
    fontSize: 10,
    marginTop: 2,
  },
  sessionXP: {
    color: colors.goldSoft,
    fontFamily: typography.extraBold,
    fontSize: 12,
  },
  });
}
