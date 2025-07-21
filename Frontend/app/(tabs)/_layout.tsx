// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const scheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: scheme === 'dark' ? '#fff' : '#2f95dc',
        tabBarStyle: Platform.select({ ios:{ position:'absolute' }, default: {} }),
      }}
    >
      {/* Farmer Tab */}
      <Tabs.Screen
        name="farmer"
        options={{
          title: 'Farmer',
          tabBarIcon: ({ color, size }) => <Ionicons name="leaf" size={size} color={color} />,
        }}
      />
      
      {/* Household Tab */}
      <Tabs.Screen
        name="household-app"
        options={{
          title: 'Household',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />

      {/* Dashboard Tab */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart-outline" size={size} color={color} />,
        }}
      />

      {/* Admin Tab */}
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" size={size} color={color} />,
        }}
      />

      {/* Ask Question Tab */}
      <Tabs.Screen
        name="ask-question"
        options={{
          title: 'Ask AI',
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}