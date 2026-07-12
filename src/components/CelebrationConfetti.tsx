import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { useTheme } from '@/providers/ThemeProvider';

// The particle layout is theme-independent; only the colour token is resolved at
// render time from the active palette.
const particles = [
  { left: '7%', symbol: '✦', tone: 'gold', delay: 0, drift: 18 },
  { left: '15%', symbol: '•', tone: 'success', delay: 140, drift: -15 },
  { left: '24%', symbol: '☾', tone: 'goldSoft', delay: 40, drift: 24 },
  { left: '33%', symbol: '✧', tone: 'text', delay: 220, drift: -20 },
  { left: '42%', symbol: '•', tone: 'gold', delay: 80, drift: 14 },
  { left: '51%', symbol: '✦', tone: 'success', delay: 180, drift: -12 },
  { left: '60%', symbol: '☾', tone: 'gold', delay: 20, drift: 22 },
  { left: '69%', symbol: '•', tone: 'text', delay: 260, drift: -18 },
  { left: '78%', symbol: '✧', tone: 'goldSoft', delay: 110, drift: 16 },
  { left: '87%', symbol: '✦', tone: 'gold', delay: 200, drift: -25 },
] as const;

export function CelebrationConfetti() {
  const { colors } = useTheme();
  const progress = useRef(particles.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animation = Animated.parallel(
      progress.map((value, index) =>
        Animated.sequence([
          Animated.delay(particles[index].delay),
          Animated.timing(value, {
            duration: 1700,
            toValue: 1,
            useNativeDriver: true,
          }),
        ]),
      ),
    );
    animation.start();
    return () => animation.stop();
  }, [progress]);

  return (
    <View pointerEvents="none" style={styles.layer}>
      {particles.map((particle, index) => {
        const value = progress[index];
        return (
          <Animated.Text
            key={`${particle.left}:${particle.symbol}`}
            style={[
              styles.particle,
              {
                color: colors[particle.tone],
                left: particle.left,
                opacity: value.interpolate({
                  inputRange: [0, 0.12, 0.78, 1],
                  outputRange: [0, 1, 0.9, 0],
                }),
                transform: [
                  {
                    translateY: value.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-30, 390],
                    }),
                  },
                  {
                    translateX: value.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, particle.drift, 0],
                    }),
                  },
                  {
                    rotate: value.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '300deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            {particle.symbol}
          </Animated.Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  layer: {
    height: 430,
    left: 0,
    overflow: 'hidden',
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 4,
  },
  particle: {
    fontSize: 22,
    position: 'absolute',
    top: 0,
  },
});
