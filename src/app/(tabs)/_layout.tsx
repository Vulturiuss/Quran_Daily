import { Tabs } from 'expo-router';
import { BarChart3, BookOpen, GraduationCap, Home, Settings } from 'lucide-react-native';

import { colors, typography } from '@/theme';

const icons = {
  index: Home,
  learn: GraduationCap,
  library: BookOpen,
  stats: BarChart3,
  settings: Settings,
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
            backgroundColor: colors.backgroundDeep,
            borderTopColor: colors.border,
            height: 82,
            paddingBottom: 14,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontFamily: typography.bold,
            fontSize: 11,
          },
          tabBarIcon: ({ color, size }) => <Icon color={color} size={size} strokeWidth={2.2} />,
        };
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
      <Tabs.Screen name="learn" options={{ title: 'Apprendre' }} />
      <Tabs.Screen name="library" options={{ title: 'Sourates' }} />
      <Tabs.Screen name="stats" options={{ title: 'Progrès' }} />
      <Tabs.Screen name="settings" options={{ title: 'Réglages' }} />
    </Tabs>
  );
}
