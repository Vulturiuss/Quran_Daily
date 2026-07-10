import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Path,
  Pattern,
  Polygon,
  Rect,
} from 'react-native-svg';

import { colors, radius } from '@/theme';

export function IslamicStar({
  size = 24,
  color = colors.gold,
  opacity = 1,
}: {
  size?: number;
  color?: string;
  opacity?: number;
}) {
  return (
    <Svg height={size} viewBox="0 0 100 100" width={size}>
      <Polygon
        fill="none"
        opacity={opacity}
        points="50,5 61,28 85,15 72,39 95,50 72,61 85,85 61,72 50,95 39,72 15,85 28,61 5,50 28,39 15,15 39,28"
        stroke={color}
        strokeLinejoin="round"
        strokeWidth={4}
      />
      <Circle cx="50" cy="50" fill={color} opacity={opacity * 0.75} r="5" />
    </Svg>
  );
}

export function AndalusianArch({
  color = colors.goldSoft,
  opacity = 0.28,
}: {
  color?: string;
  opacity?: number;
}) {
  return (
    <Svg height="100%" preserveAspectRatio="none" viewBox="0 0 400 260" width="100%">
      <Path
        d="M18 258V112C18 69 52 36 96 36C139 36 174 19 200 2C226 19 261 36 304 36C348 36 382 69 382 112V258"
        fill="none"
        opacity={opacity}
        stroke={color}
        strokeWidth={1.35}
      />
      <Path
        d="M34 258V118C34 82 62 53 101 53C142 53 176 35 200 18C224 35 258 53 299 53C338 53 366 82 366 118V258"
        fill="none"
        opacity={opacity * 0.38}
        stroke={color}
        strokeWidth={1}
      />
    </Svg>
  );
}

export function AlhambraPattern({
  color = colors.goldSoft,
  opacity = 0.05,
}: {
  color?: string;
  opacity?: number;
}) {
  return (
    <Svg height="100%" width="100%">
      <Defs>
        <Pattern
          height="64"
          id="alhambra"
          patternUnits="userSpaceOnUse"
          width="64"
        >
          <G fill="none" opacity={Math.min(0.05, opacity)} stroke={color} strokeWidth={1}>
            <Polygon points="32,3 39,20 57,14 44,28 61,32 44,36 57,50 39,44 32,61 25,44 7,50 20,36 3,32 20,28 7,14 25,20" />
            <Rect height="18" transform="rotate(45 32 32)" width="18" x="23" y="23" />
          </G>
        </Pattern>
      </Defs>
      <Rect fill="url(#alhambra)" height="100%" width="100%" />
    </Svg>
  );
}

export function GeometricDivider({
  color = colors.gold,
}: {
  color?: string;
}) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no" style={styles.divider}>
      <View style={styles.dividerLine} />
      <IslamicStar color={color} opacity={0.8} size={17} />
      <View style={styles.dividerLine} />
    </View>
  );
}

export function PremiumBorder({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.premiumBorder, style]}>
      <View pointerEvents="none" style={styles.cornerTopLeft}>
        <Svg height="26" viewBox="0 0 26 26" width="26">
          <Path d="M1 25V8Q1 1 8 1H25" fill="none" stroke={colors.goldSoft} strokeWidth={1} />
          <Line opacity={0.55} stroke={colors.goldSoft} x1="7" x2="19" y1="7" y2="7" />
        </Svg>
      </View>
      <View pointerEvents="none" style={styles.cornerBottomRight}>
        <Svg height="26" viewBox="0 0 26 26" width="26">
          <Path d="M1 25V8Q1 1 8 1H25" fill="none" stroke={colors.goldSoft} strokeWidth={1} />
          <Line opacity={0.55} stroke={colors.goldSoft} x1="7" x2="19" y1="7" y2="7" />
        </Svg>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginVertical: 14,
  },
  dividerLine: {
    backgroundColor: colors.border,
    flex: 1,
    height: 1,
  },
  premiumBorder: {
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cornerTopLeft: {
    left: 7,
    position: 'absolute',
    top: 7,
  },
  cornerBottomRight: {
    bottom: 7,
    position: 'absolute',
    right: 7,
    transform: [{ rotate: '180deg' }],
  },
});
