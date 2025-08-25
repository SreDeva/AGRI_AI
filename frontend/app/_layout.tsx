import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { PaperProvider } from 'react-native-paper';
import React, { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { isLoading, isAuthenticated, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    console.log('🔄 Navigation check:', { isLoading, isAuthenticated, segments: segments.join('/') });
    
    if (!isLoading) {
      const inAuthGroup = segments[0] === 'auth';
      const inProfileGroup = segments[0] === 'profile';
      const inTabsGroup = segments[0] === '(tabs)';
      
      if (!isAuthenticated) {
        console.log('❌ Redirecting to login');
        if (!inAuthGroup) {
          router.replace('/auth/login');
        }
      } else {
        if (inAuthGroup) {
          // User is authenticated but in auth screens, redirect based on profile completion
          if (user?.is_profile_complete) {
            console.log('✅ Redirecting to home');
            router.replace('/(tabs)');
          } else {
            console.log('⚠️ Redirecting to setup');
            router.replace('/profile/setup');
          }
        } else if (inProfileGroup) {
          // User is trying to access profile pages - allow it
          console.log('📱 Allowing profile navigation');
          // Don't redirect, let them access profile
        } else if (segments.length <= 1) {
          // User is authenticated but not in any specific route (initial load)
          if (user?.is_profile_complete) {
            console.log('🏠 Redirecting to home');
            router.replace('/(tabs)');
          } else {
            console.log('⚠️ Redirecting to setup');
            router.replace('/profile/setup');
          }
        } else {
          // Allow other navigation for authenticated users
          console.log('🧭 Allowing general navigation');
        }
        // Allow navigation to profile pages without redirecting
      }
    }
  }, [isLoading, isAuthenticated, user?.is_profile_complete, segments, router]);

  return (
    <PaperProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
          <Stack.Screen name="auth/verify-otp" options={{ headerShown: false }} />
          <Stack.Screen name="profile/setup" options={{ headerShown: false }} />
          <Stack.Screen 
            name="profile/index" 
            options={{ 
              headerShown: false,
              title: 'Profile'
            }} 
          />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
