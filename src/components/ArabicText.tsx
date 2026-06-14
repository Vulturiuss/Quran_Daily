import { StyleProp, StyleSheet, Text, TextStyle } from 'react-native';

import { colors, typography } from '@/theme';

interface ArabicTextProps {
  children: string;
  size?: number;
  style?: StyleProp<TextStyle>;
}

export function ArabicText({ children, size = 31, style }: ArabicTextProps) {
  return (
    <Text style={[styles.text, { fontSize: size, lineHeight: size * 1.85 }, style]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.text,
    fontFamily: typography.arabic,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
