import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Title } from 'react-native-paper';
import { ThemedView } from '@/components/ThemedView';

export default function IndexScreen() {
  // This is a fallback loading screen
  // The actual routing is handled in _layout.tsx
  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" style={styles.spinner} />
        <Title style={styles.title}>AGRI AI</Title>
        <Title style={styles.subtitle}>Loading...</Title>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
});
