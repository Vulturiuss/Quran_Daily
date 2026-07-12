import { useMemo } from 'react';
import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';
import { Palette, typography } from '@/theme';

interface ArabicTextProps {
  children: string;
  size?: number;
  style?: StyleProp<TextStyle>;
}

export function ArabicText({ children, size = 31, style }: ArabicTextProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Text style={[styles.text, { fontSize: size, lineHeight: size * 1.85 }, style]}>{children}</Text>
  );
}

function createStyles(colors: Palette) {
  return StyleSheet.create({
  text: {
    color: colors.text,
    fontFamily: typography.arabic,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  });
}
