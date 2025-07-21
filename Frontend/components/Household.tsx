import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import PlantCamera from './PlantCamera';
import AskQuestion from './AskQuestion';

export default function Household() {
  const [mode, setMode] = useState<'home' | 'plant' | 'help' | 'bot'>('home');

  useEffect(() => {
    if (mode === 'home') {
      Speech.speak('Welcome to Household Gardener! Tap an option.');
    }
  }, [mode]);

  const renderContent = () => {
    if (mode === 'plant') return <PlantCamera />;
    if (mode === 'help') return <AskQuestion />;
    if (mode === 'bot') {
      return (
        <View style={styles.botContainer}>
          <Text style={styles.botText}>
            🤖 Learning Bot coming soon! Tap below to chat:
          </Text>
          <TouchableOpacity
            style={styles.botButton}
            onPress={() =>
              Speech.speak('Hello! Ask me anything about your garden.')
            }>
            <Text style={styles.botButtonText}>Chat with Bot</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.menuContainer}>
        {[
          { key: 'plant', label: '📷 Plant Identification' },
          { key: 'help', label: '🧠 Personalized Help' },
          { key: 'bot', label: '🤖 Learning Bot' },
        ].map((item) => (
          <TouchableOpacity
            key={item.key}
            style={styles.menuButton}
            activeOpacity={0.7}
            onPress={() => setMode(item.key as any)}>
            <Text style={styles.menuText}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>🪴 Household Gardener</Text>
      {renderContent()}
      {mode !== 'home' && (
        <TouchableOpacity style={styles.backButton} onPress={() => setMode('home')}>
          <Text style={styles.backText}>← Back to Menu</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#F3F9F7',
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2F6D3E',
    marginBottom: 20,
  },
  menuContainer: {
    width: '100%',
    marginTop: 20,
  },
  menuButton: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 14,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  menuText: {
    fontSize: 18,
    color: '#2F6D3E',
    fontWeight: '600',
  },
  botContainer: {
    marginTop: 40,
    alignItems: 'center',
    width: '100%',
  },
  botText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  botButton: {
    backgroundColor: '#E3E7FF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  botButtonText: {
    color: '#1A237E',
    fontSize: 16,
    fontWeight: '500',
  },
  backButton: {
    marginTop: 30,
  },
  backText: {
    fontSize: 16,
    color: '#555',
    textDecorationLine: 'underline',
  },
});
