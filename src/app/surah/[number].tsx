import { FlatList, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  BookOpenCheck,
  Check,
  Crown,
  GraduationCap,
  MapPin,
  Wifi,
} from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { ArabicText } from '@/components/ArabicText';
import { VerseCard } from '@/components/VerseCard';
import { Card, IconButton, PrimaryButton, ProgressBar, SectionHeader } from '@/components/ui';
import { getSurah } from '@/data/surahs';
import { getVerses } from '@/data/verses';
import { useQuranAudio } from '@/providers/AudioProvider';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { reciters, ReciterId } from '@/services/quranApi';
import { isFreeSurah } from '@/services/subscription';
import { useQuranStore } from '@/store/useQuranStore';
import { colors, radius, spacing, typography } from '@/theme';

export default function SurahDetailScreen() {
  const params = useLocalSearchParams<{ number: string }>();
  const number = Number(params.number);
  const surah = getSurah(number);
  const verses = getVerses(number);
  const progress = useQuranStore((state) => state.progress[number]);
  const preferredReciter = useQuranStore((state) => state.profile.preferredReciter);
  const setLearningSurah = useQuranStore((state) => state.setLearningSurah);
  const markSurahKnown = useQuranStore((state) => state.markSurahKnown);
  const { error: audioError } = useQuranAudio();
  const { configured, isPremium, loading } = useSubscription();
  const premiumLocked =
    configured && !loading && !isPremium && !isFreeSurah(number);

  if (!surah) {
    return (
      <AppScreen>
        <Text style={styles.error}>Sourate introuvable.</Text>
      </AppScreen>
    );
  }

  if (premiumLocked) {
    return (
      <AppScreen>
        <View style={styles.topBar}>
          <IconButton icon={ArrowLeft} label="Retour" onPress={() => router.back()} />
          <Text style={styles.headerLabel}>Sourate {surah.number}</Text>
          <View style={styles.placeholder} />
        </View>
        <Card gradient style={styles.lockedCard}>
          <View style={styles.lockedIcon}>
            <Crown color={colors.gold} size={31} />
          </View>
          <ArabicText size={40} style={styles.arabicName}>
            {surah.name}
          </ArabicText>
          <Text style={styles.name}>{surah.nameTranslit}</Text>
          <Text style={styles.lockedText}>
            Cette sourate fait partie du parcours Premium avec les 114 sourates, les
            récitateurs et les statistiques complètes.
          </Text>
          <PrimaryButton
            icon={Crown}
            label="Découvrir Premium"
            onPress={() => router.push('/subscription')}
          />
        </Card>
      </AppScreen>
    );
  }

  const value = progress ? progress.versesLearned / progress.totalVerses : 0;
  const effectiveReciter =
    configured && !loading && !isPremium ? 'mishary' : preferredReciter;
  const reciter =
    reciters[effectiveReciter as ReciterId] ?? reciters.mishary;

  function chooseForLearning() {
    setLearningSurah(number);
    router.replace('/learn');
  }

  const header = (
    <>
      <Card gradient style={styles.hero}>
        <View style={styles.numberMark}>
          <Text style={styles.number}>{surah.number}</Text>
        </View>
        <ArabicText size={43} style={styles.arabicName}>
          {surah.name}
        </ArabicText>
        <Text style={styles.name}>{surah.nameTranslit}</Text>
        <Text style={styles.translation}>{surah.nameFr}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <BookOpenCheck color={colors.gold} size={17} />
            <Text style={styles.metaText}>{surah.totalVerses} versets</Text>
          </View>
          <View style={styles.metaItem}>
            <MapPin color={colors.gold} size={17} />
            <Text style={styles.metaText}>
              {surah.revelationType === 'meccan' ? 'Mecquoise' : 'Médinoise'}
            </Text>
          </View>
        </View>
        {progress ? (
          <View style={styles.progressBlock}>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabel}>
                {progress.status === 'known'
                  ? 'Sourate connue'
                  : progress.status === 'learning'
                    ? 'En apprentissage'
                    : 'À apprendre'}
              </Text>
              <Text style={styles.progressValue}>{Math.round(value * 100)}%</Text>
            </View>
            <ProgressBar
              color={progress.status === 'known' ? colors.success : colors.gold}
              value={value}
            />
          </View>
        ) : null}
      </Card>

      <View style={styles.actions}>
        {progress?.status !== 'known' ? (
          <PrimaryButton
            icon={GraduationCap}
            label={
              progress?.status === 'learning'
                ? 'Continuer cette sourate'
                : 'Apprendre cette sourate'
            }
            onPress={chooseForLearning}
          />
        ) : null}
        {progress?.status !== 'known' ? (
          <PrimaryButton
            icon={Check}
            label="Je la connais déjà"
            onPress={() => markSurahKnown(number)}
            variant="surface"
          />
        ) : null}
      </View>

      <View style={styles.audioInfo}>
        <Wifi color={colors.success} size={17} />
        <Text style={styles.audioInfoText}>
          Audio Quran.com · {reciter.name}. Les récitateurs alternatifs sont mis en cache après
          leur première écoute; le fichier est téléchargé temporairement sur mobile avant lecture.
        </Text>
      </View>

      {audioError ? <Text style={styles.audioError}>{audioError}</Text> : null}
      <SectionHeader title={`Texte complet · ${verses.length} versets`} />
    </>
  );

  return (
    <AppScreen scroll={false} contentStyle={styles.screen}>
      <View style={styles.topBar}>
        <IconButton icon={ArrowLeft} label="Retour" onPress={() => router.back()} />
        <Text style={styles.headerLabel}>Sourate {surah.number}</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        contentContainerStyle={styles.list}
        data={verses}
        initialNumToRender={6}
        keyExtractor={(verse) => verse.verseKey}
        ListHeaderComponent={header}
        maxToRenderPerBatch={8}
        removeClippedSubviews
        renderItem={({ item }) => (
          <View style={styles.verse}>
            <VerseCard verse={item} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        windowSize={7}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 0,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  headerLabel: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 13,
  },
  placeholder: {
    width: 44,
  },
  list: {
    paddingBottom: 110,
  },
  hero: {
    alignItems: 'center',
  },
  numberMark: {
    alignItems: 'center',
    borderColor: colors.gold,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  number: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  arabicName: {
    color: colors.goldSoft,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  name: {
    color: colors.text,
    fontFamily: typography.extraBold,
    fontSize: 27,
    marginTop: spacing.xs,
  },
  translation: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginTop: spacing.lg,
  },
  metaItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  progressBlock: {
    marginTop: spacing.lg,
    width: '100%',
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  progressValue: {
    color: colors.gold,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  audioInfo: {
    alignItems: 'flex-start',
    backgroundColor: 'rgba(129,199,132,0.08)',
    borderColor: 'rgba(129,199,132,0.22)',
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
  },
  audioInfoText: {
    color: colors.textMuted,
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 11,
    lineHeight: 17,
  },
  audioError: {
    color: colors.error,
    fontFamily: typography.medium,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  verse: {
    marginBottom: spacing.sm,
  },
  error: {
    color: colors.error,
    fontFamily: typography.bold,
    marginTop: spacing.xl,
  },
  lockedCard: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: spacing.xl,
  },
  lockedIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(212,175,55,0.13)',
    borderRadius: radius.pill,
    height: 66,
    justifyContent: 'center',
    width: 66,
  },
  lockedText: {
    color: colors.textMuted,
    fontFamily: typography.regular,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: spacing.xl,
    marginTop: spacing.md,
    maxWidth: 330,
    textAlign: 'center',
  },
});
