import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import InputWithMic from '../components/InputWithMic';
import { authService } from '../services/authService';

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

export default function Login() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    return cleanPhone.length >= 10;
  };

  const handleLogin = async () => {
    const digits = phone.replace(/\D/g, '');

    if (!validatePhoneNumber(digits)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid phone number with at least 10 digits.');
      return;
    }

    // Admin shortcut
    if (digits === '9677473350') {
      router.replace('/(tabs)/admin');
      return;
    }

    setLoading(true);

    try {
      const result = await authService.login(digits);

      if (!result) {
        Alert.alert('Login Failed', 'Unable to connect to server. Please try again.');
        return;
      }

      if (!result.success) {
        Alert.alert('Login Failed', result.message);
        return;
      }

      await authService.saveUserData({
        user_id: result.user_id,
        phone_number: digits,
        access_token: result.access_token,
        user_role: result.user_role,
      });

      switch (result.redirect_to) {
        case 'roles':
          router.replace('/role-selection');
          break;
        case 'onboarding':
          router.replace('/farmer-onboard');
          break;
        case 'home':
          router.replace('/(tabs)/farmer');
          break;
        default:
          router.replace('/role-selection');
      }

    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.outerContainer}>
      {/* Animated bubbles background */}
      <View style={styles.bubbles}>
        {[...Array(25)].map((_, i) => (
          <Bubble key={i} delay={Math.random() * 5000} />
        ))}
      </View>

      {/* Foreground form */}
      <View style={styles.container}>
        <Text style={styles.title}>📞 Enter Phone Number</Text>

        <InputWithMic
          placeholder="Phone Number"
          voicePrompt="Please say your phone number"
          value={phone}
          onChange={setPhone}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.buttonText}>➡️ Next</Text>
          )}
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
    backdropFilter: 'blur(20px)',
  },
  title: {
    fontSize: 22,
    color: '#1a202c',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: '#2F6D3E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#1e4d2b',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
    borderColor: '#81C784',
  },
});
