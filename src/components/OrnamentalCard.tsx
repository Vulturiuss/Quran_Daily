import { ReactNode, useMemo } from 'react';
import {
  Image,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { AndalusianArch } from '@/components/IslamicOrnaments';
import { useTheme } from '@/providers/ThemeProvider';
import { Palette, radius, spacing } from '@/theme';

const patternSource = require('../../assets/andalusian-pattern-v1.jpg');

export function OrnamentalCard({
  children,
  style,
  contentStyle,
  compact = false,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  compact?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={[styles.shell, style]}>
      <Image
        resizeMode="cover"
        source={patternSource}
        style={styles.pattern}
      />
      <LinearGradient
        colors={[
          'rgba(7,25,17,0.18)',
          'rgba(16,52,35,0.7)',
          'rgba(8,29,19,0.94)',
        ]}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        start={{ x: 0, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={styles.arch}>
        <AndalusianArch />
      </View>
      <View style={[styles.content, compact && styles.contentCompact, contentStyle]}>
        {children}
      </View>
    </View>
  );
}

export const ornamentalPatternSource = patternSource;

function createStyles(colors: Palette) {
  return StyleSheet.create({
  shell: {
    backgroundColor: colors.surface,
    borderColor: 'rgba(232,204,107,0.46)',
    borderRadius: radius.lg,
    borderWidth: 1,
    elevation: 6,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { height: 8, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
  },
  pattern: {
    bottom: 0,
    left: 0,
    opacity: 0.05,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  arch: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  contentCompact: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },
  });
}
