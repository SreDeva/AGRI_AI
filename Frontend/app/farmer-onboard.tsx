import React, { useState, useEffect, useRef } from 'react';
import {
  ScrollView,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  View,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import InputWithMic from '../components/InputWithMic';
import * as ImagePicker from 'expo-image-picker';

const { height, width } = Dimensions.get('window');

// Animated bubble background
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
        backgroundColor: 'rgba(255,255,255,0.08)',
        transform: [{ translateY }],
        opacity,
      }}
    />
  );
}

// Mock submit function - replace with actual API call
async function submitFarmerDetails(data: any): Promise<void> {
  console.log('Submitting farmer data:', data);
}

export default function FarmerOnboard() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const router = useRouter();

  const [name, setName] = useState('');
  const [hometown, setHometown] = useState('');
  const [landArea, setLandArea] = useState('');
  const [soilImg, setSoilImg] = useState<string | null>(null);
  const [lastCrop, setLastCrop] = useState('');
  const [gender, setGender] = useState('');
  const [language, setLanguage] = useState('');

  const pickImage = async () => {
    const res = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!res.canceled && res.assets.length > 0) {
      setSoilImg(res.assets[0].uri);
    }
  };

  const submit = async () => {
    await submitFarmerDetails({
      phone,
      name,
      hometown,
      landArea,
      soilImg,
      lastCrop,
      gender,
      language,
    });
    router.replace('/(tabs)/farmer');
  };

  return (
    <View style={styles.outerContainer}>
      {/* Bubble Background */}
      <View style={styles.bubbles}>
        {[...Array(25)].map((_, i) => (
          <Bubble key={i} delay={Math.random() * 5000} />
        ))}
      </View>

      {/* Form */}
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>🧑‍🌾 Farmer Details</Text>

        <InputWithMic
          placeholder="Name"
          voicePrompt="What is your name?"
          value={name}
          onChange={setName}
        />
        <InputWithMic
          placeholder="Hometown"
          voicePrompt="Where do you live?"
          value={hometown}
          onChange={setHometown}
        />
        <InputWithMic
          placeholder="Land Area"
          voicePrompt="How much land do you have?"
          value={landArea}
          onChange={setLandArea}
          keyboardType="numeric"
        />

        <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
          <Text style={styles.imageButtonText}>
            {soilImg ? '✅ Soil Image Captured' : '📷 Capture Soil Image'}
          </Text>
        </TouchableOpacity>

        <InputWithMic
          placeholder="Last Crop Grown"
          voicePrompt="Last crop grown"
          value={lastCrop}
          onChange={setLastCrop}
        />
        <InputWithMic
          placeholder="Gender"
          voicePrompt="What is your gender?"
          value={gender}
          onChange={setGender}
        />
        <InputWithMic
          placeholder="Language Preference"
          voicePrompt="Your preferred language"
          value={language}
          onChange={setLanguage}
        />

        <TouchableOpacity style={styles.submitButton} onPress={submit}>
          <Text style={styles.submitText}>✅ Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#0f2027',
    position: 'relative',
  },
  bubbles: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  container: {
    zIndex: 1,
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Frosted white background
    margin: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ccc',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1a202c',
    marginBottom: 20,
  },
  imageButton: {
    backgroundColor: '#edf7ee',
    padding: 16,
    borderRadius: 10,
    marginVertical: 15,
    borderColor: '#2F6D3E',
    borderWidth: 1,
  },
  imageButtonText: {
    color: '#2F6D3E',
    fontSize: 16,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#2F6D3E',
    padding: 18,
    borderRadius: 10,
    marginTop: 25,
    width: '60%',
    alignItems: 'center',
  },
  submitText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
  },
});
