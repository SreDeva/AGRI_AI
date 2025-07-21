import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';

export default function PlantCamera() {
  const [image, setImage] = useState<string | null>(null);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [audioURI, setAudioURI] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') alert('Camera permission is required!');

      const { status: micStatus } = await Audio.requestPermissionsAsync();
      if (micStatus !== 'granted') alert('Microphone permission is required!');
    })();
  }, []);

  const openCamera = async () => {
    setImage(null);
    setResponse(null);
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setImage(uri);

      // Simulate backend delay and response
      setLoading(true);
      setTimeout(() => {
        const mockResponse = 'This is a healthy tomato plant. Water twice a week and use compost.';
        setResponse(mockResponse);
        Speech.speak(mockResponse);
        setLoading(false);
      }, 2000);
    }
  };

  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
    } catch (error) {
      console.error('Recording error:', error);
    }
  };

  const stopRecording = async () => {
    if (recording) {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setAudioURI(uri);
      setRecording(null);
    }
  };

  const handleSubmit = () => {
    console.log('Submitting...');
    console.log('📸 Image URI:', image);
    console.log('🎤 Audio URI:', audioURI);
    // TODO: send image and audioURI to your backend here
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Plant Identification</Text>

      <TouchableOpacity style={styles.button} onPress={openCamera}>
        <Text style={styles.buttonText}>📷 Open Camera</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator size="large" color="#3B7A57" style={{ marginVertical: 20 }} />}
      
      {image && <Image source={{ uri: image }} style={styles.image} />}
      
      {response && (
        <View style={styles.responseBox}>
          <Text style={styles.responseText}>{response}</Text>
        </View>
      )}

      {/* Voice Recording Buttons */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: '#EAEFFF' }]}
        onPress={recording ? stopRecording : startRecording}
      >
        <Text style={styles.buttonText}>
          {recording ? '⏹️ Stop Recording' : '🎤 Record Voice'}
        </Text>
      </TouchableOpacity>

      {audioURI && <Text style={styles.recordedText}>🎧 Audio recorded successfully</Text>}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitText}>🚀 Send</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2FAF6',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B7A57',
    marginBottom: 30,
  },
  button: {
    width: '90%',
    paddingVertical: 15,
    backgroundColor: '#D7F2E3',
    borderRadius: 12,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
  },
  buttonText: {
    color: '#2E7D32',
    fontSize: 18,
    fontWeight: '600',
  },
  image: {
    width: 300,
    height: 300,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCC',
  },
  responseBox: {
    marginTop: 20,
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    borderColor: '#3B7A57',
    borderWidth: 1,
    width: '100%',
  },
  responseText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  recordedText: {
    color: '#555',
    fontSize: 16,
    marginBottom: 10,
  },
  submitButton: {
    width: '90%',
    paddingVertical: 14,
    backgroundColor: '#3B7A57',
    borderRadius: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  submitText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
