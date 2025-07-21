import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useNavigation, NavigationProp, ParamListBase } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';

const { width, height } = Dimensions.get('window');

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
        Animated.timing(translateY, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
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
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        transform: [{ translateY }],
        opacity,
      }}
    />
  );
}

export default function Farmer() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [city, setCity] = useState<string | null>(null);

  useEffect(() => {
    const fetchCity = async () => {
      try {
        const res = await axios.get('http://localhost:8081/usercity'); // Replace with your backend
        setCity(res.data?.city || 'Chennai');
      } catch (err) {
        console.error('City fetch failed:', err);
        setCity('Chennai');
      }
    };
    fetchCity();
  }, []);

  return (
    <View style={styles.outerContainer}>
      <View style={styles.bubbles}>
        {[...Array(30)].map((_, i) => (
          <Bubble key={i} delay={Math.random() * 5000} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.title}>👨‍🌾 Farmer Dashboard</Text>
        <Text style={styles.subtitle}>How can I help you today?</Text>

        <View style={styles.buttonGrid}>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('ask-question')}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={30} color="#3B7A57" />
            <Text style={styles.buttonText}>Ask a Question</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('plant-camera')}
          >
            <MaterialCommunityIcons name="leaf" size={30} color="#3B7A57" />
            <Text style={styles.buttonText}>Plant Identification</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, !city && { opacity: 0.6 }]}
            disabled={!city}
            onPress={() => navigation.navigate('weather-alerts', { city })}
          >
            <Ionicons name="cloudy-outline" size={30} color="#3B7A57" />
            <Text style={styles.buttonText}>Weather Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <FontAwesome5 name="user-md" size={30} color="#3B7A57" />
            <Text style={styles.buttonText}>Call Expert</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button}>
            <Ionicons name="people-outline" size={30} color="#3B7A57" />
            <Text style={styles.buttonText}>Community</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#0B0F1C',
    position: 'relative',
  },
  bubbles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  scrollContainer: {
    zIndex: 1,
    margin: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 24,
    borderColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#A0F4D4',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 30,
    textAlign: 'center',
  },
  buttonGrid: {
    width: '100%',
    alignItems: 'center',
  },
  button: {
    width: '90%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.07)',
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 18,
    marginLeft: 12,
    color: '#A0F4D4',
    fontWeight: '600',
  },
});
