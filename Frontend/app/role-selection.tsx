// app/role-selection.tsx

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const { height, width } = Dimensions.get('window');

// Bubble animation component
function Bubble({ delay }: { delay: number }) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -height,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 8000,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
  }, []);

  const size = Math.random() * 20 + 10;
  const left = Math.random() * width;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: -50,
        left,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        transform: [{ translateY }],
        opacity,
      }}
    />
  );
}

export default function RoleSelection() {
  const { phone, exists } = useLocalSearchParams<{ phone?: string; exists?: string }>();
  const router = useRouter();

  const choose = (role: 'farmer' | 'household') => {
    if (!phone) return;

    if (exists === 'true') {
      router.replace({
        pathname: role === 'farmer' ? '/(tabs)/farmer' : '/(tabs)/household-app',
      });
    } else {
      router.push({
        pathname: role === 'farmer' ? '/farmer-onboard' : '/household-onboard',
        params: { phone },
      });
    }
  };

  return (
    <View style={styles.outerContainer}>
      <View style={styles.bubbles}>
        {[...Array(25)].map((_, i) => (
          <Bubble key={i} delay={Math.random() * 5000} />
        ))}
      </View>

      <View style={styles.container}>
        <Text style={styles.title}>👤 Choose Your Role</Text>

        <TouchableOpacity style={styles.button} onPress={() => choose('farmer')}>
          <Text style={styles.buttonText}>👨‍🌾 Farmer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => choose('household')}>
          <Text style={styles.buttonText}>🌿 Household</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#0f2027',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bubbles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  container: {
    zIndex: 1,
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    color: '#1a202c',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#2F6D3E',
    padding: 16,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#1e4d2b',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
