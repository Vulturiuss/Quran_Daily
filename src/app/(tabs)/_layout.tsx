import { Tabs } from 'expo-router';
import {
  BarChart3,
  GraduationCap,
  Home,
  RotateCcw,
  UserRound,
} from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { IslamicStar } from '@/components/IslamicOrnaments';
import { colors, typography } from '@/theme';

const icons = {
  index: Home,
  learn: GraduationCap,
  review: RotateCcw,
  stats: BarChart3,
  settings: UserRound,
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => {
        const Icon = icons[route.name as keyof typeof icons] ?? Home;
        return {
          headerShown: false,
          tabBarActiveTintColor: colors.gold,
          tabBarInactiveTintColor: colors.textFaint,
          tabBarStyle: {
            backgroundColor: 'rgba(9,28,19,0.98)',
            borderColor: colors.borderStrong,
            borderRadius: 25,
            borderTopColor: colors.borderStrong,
            borderWidth: 1,
            bottom: 12,
            elevation: 12,
            height: 72,
            left: 14,
            paddingBottom: 9,
            paddingTop: 7,
            position: 'absolute',
            right: 14,
            shadowColor: '#000000',
            shadowOffset: { height: 8, width: 0 },
            shadowOpacity: 0.35,
            shadowRadius: 16,
          },
          tabBarLabelStyle: {
            fontFamily: typography.bold,
            fontSize: 10,
          },
          tabBarItemStyle: {
            borderRadius: 19,
            marginHorizontal: 2,
          },
          tabBarActiveBackgroundColor: 'rgba(212,163,115,0.1)',
          tabBarIcon: ({ color, focused, size }) => (
            <View style={styles.tabIcon}>
              <Icon color={color} size={size} strokeWidth={focused ? 2.5 : 2} />
              {focused ? (
                <View style={styles.activeMark}>
                  <IslamicStar color={colors.goldSoft} size={8} />
                </View>
              ) : null}
            </View>
          ),
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Aujourd’hui' }} />
      <Tabs.Screen name="review" options={{ title: 'Réviser' }} />
      <Tabs.Screen name="learn" options={{ title: 'Apprendre' }} />
      <Tabs.Screen name="stats" options={{ title: 'Progrès' }} />
      <Tabs.Screen name="settings" options={{ title: 'Profil' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    alignItems: 'center',
    height: 29,
    justifyContent: 'center',
    width: 34,
  },
  activeMark: {
    bottom: -6,
    position: 'absolute',
  },
});
