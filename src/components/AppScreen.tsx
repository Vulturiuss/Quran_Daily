import { ReactNode } from 'react';
import {
  Image,
  ScrollView,
  ScrollViewProps,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@/theme';
import { ornamentalPatternSource } from '@/components/OrnamentalCard';

interface AppScreenProps {
  children: ReactNode;
  scroll?: boolean;
  decorated?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  refreshControl?: ScrollViewProps['refreshControl'];
}

export function AppScreen({
  children,
  scroll = true,
  decorated = true,
  contentStyle,
  refreshControl,
}: AppScreenProps) {
  if (!scroll) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        {decorated ? (
          <>
            <Image
              resizeMode="cover"
              source={ornamentalPatternSource}
              style={styles.pattern}
            />
            <View pointerEvents="none" style={styles.vignette} />
          </>
        ) : null}
        <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {decorated ? (
        <>
          <Image
            resizeMode="cover"
            source={ornamentalPatternSource}
            style={styles.pattern}
          />
          <View pointerEvents="none" style={styles.vignette} />
        </>
      ) : null}
      <ScrollView
        contentContainerStyle={[styles.content, contentStyle]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={refreshControl}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.backgroundDeep,
  },
  pattern: {
    bottom: 0,
    left: 0,
    opacity: 0.035,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  vignette: {
    backgroundColor: 'rgba(7,24,16,0.35)',
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  flex: {
    flex: 1,
  },
  content: {
    alignSelf: 'center',
    maxWidth: layout.contentMaxWidth,
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    width: '100%',
  },
});
