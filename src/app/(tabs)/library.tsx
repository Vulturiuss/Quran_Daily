import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Search } from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { SurahRow } from '@/components/SurahRow';
import { Pill, ScreenTitle } from '@/components/ui';
import { surahs } from '@/data/surahs';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { isFreeSurah } from '@/services/subscription';
import { useQuranStore } from '@/store/useQuranStore';
import { colors, radius, spacing, typography } from '@/theme';
import { SurahStatus } from '@/types';

type Filter = 'all' | SurahStatus;

export default function LibraryScreen() {
  const progress = useQuranStore((state) => state.progress);
  const { configured, isPremium, loading } = useSubscription();
  const hasFullAccess = !configured || loading || isPremium;
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('fr');
    return surahs.filter((surah) => {
      const status = progress[surah.number]?.status ?? 'locked';
      const matchesFilter = filter === 'all' || status === filter;
      const matchesQuery =
        !normalized ||
        surah.nameTranslit.toLocaleLowerCase('fr').includes(normalized) ||
        surah.nameFr.toLocaleLowerCase('fr').includes(normalized) ||
        String(surah.number) === normalized;
      return matchesFilter && matchesQuery;
    });
  }, [filter, progress, query]);

  return (
    <AppScreen scroll={false} contentStyle={styles.screen}>
      <ScreenTitle
        title="Les sourates"
        subtitle="114 étapes, à parcourir sans se presser."
      />
      <View style={styles.searchBox}>
        <Search color={colors.textFaint} size={19} />
        <TextInput
          onChangeText={setQuery}
          placeholder="Rechercher une sourate"
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
          value={query}
        />
      </View>
      <View style={styles.filters}>
        <Pill label="Toutes" onPress={() => setFilter('all')} selected={filter === 'all'} />
        <Pill label="En cours" onPress={() => setFilter('learning')} selected={filter === 'learning'} />
        <Pill label="Connues" onPress={() => setFilter('known')} selected={filter === 'known'} />
        <Pill label="À apprendre" onPress={() => setFilter('locked')} selected={filter === 'locked'} />
      </View>
      <Text style={styles.resultCount}>{filtered.length} sourates</Text>
      <FlatList
        contentContainerStyle={styles.list}
        data={filtered}
        initialNumToRender={14}
        keyExtractor={(item) => String(item.number)}
        renderItem={({ item }) => (
          <SurahRow
            onPress={() =>
              !hasFullAccess && !isFreeSurah(item.number)
                ? router.push('/subscription')
                : router.push(`/surah/${item.number}` as never)
            }
            premiumLocked={!hasFullAccess && !isFreeSurah(item.number)}
            progress={progress[item.number]}
            surah={item}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    paddingBottom: 0,
  },
  searchBox: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    minHeight: 52,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    color: colors.text,
    flex: 1,
    fontFamily: typography.medium,
    fontSize: 14,
    marginLeft: spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  resultCount: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 12,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  list: {
    paddingBottom: 120,
  },
});
