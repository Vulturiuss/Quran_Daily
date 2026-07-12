import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowLeft, Search } from 'lucide-react-native';

import { AppScreen } from '@/components/AppScreen';
import { SurahRow } from '@/components/SurahRow';
import { IconButton, Pill, ScreenTitle } from '@/components/ui';
import { surahs } from '@/data/surahs';
import { useTheme } from '@/providers/ThemeProvider';
import { useQuranStore } from '@/store/useQuranStore';
import { Palette, radius, spacing, typography } from '@/theme';
import { SurahStatus } from '@/types';
import { goBackOrReplace } from '@/utils/navigation';

type Filter = 'all' | SurahStatus;

export default function LibraryScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const progress = useQuranStore((state) => state.progress);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const knownCount = Object.values(progress).filter(
    (item) => item.status === 'known',
  ).length;
  const learningCount = Object.values(progress).filter(
    (item) => item.status === 'learning',
  ).length;

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
        action={
          <IconButton
            icon={ArrowLeft}
            label="Retour"
            onPress={() => goBackOrReplace('/(tabs)')}
          />
        }
        title="Bibliothèque"
        subtitle={`${knownCount} connues · ${learningCount} en apprentissage`}
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
      <View style={styles.resultRow}>
        <Text style={styles.resultCount}>{filtered.length} sourates</Text>
        <Text style={styles.resultHint}>
          {filter === 'all' ? 'Choisis ton prochain pas' : 'Filtre actif'}
        </Text>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={filtered}
        initialNumToRender={14}
        keyExtractor={(item) => String(item.number)}
        renderItem={({ item }) => (
          <SurahRow
            onPress={() => router.push(`/surah/${item.number}` as never)}
            progress={progress[item.number]}
            surah={item}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </AppScreen>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
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
  resultRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.lg,
  },
  resultCount: {
    color: colors.textMuted,
    fontFamily: typography.bold,
    fontSize: 12,
  },
  resultHint: {
    color: colors.textFaint,
    fontFamily: typography.medium,
    fontSize: 11,
  },
  list: {
    paddingBottom: 120,
  },
  });
}
