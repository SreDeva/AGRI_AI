// AskQuestion.tsx

import React, { useState, useEffect } from 'react';
import { View, Button, Image, StyleSheet, Text, Platform, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

// REMOVED: Unnecessary imports for extendable-media-recorder
// import { MediaRecorder, register } from 'extendable-media-recorder';
// import { connect } from 'extendable-media-recorder-wav-encoder';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUri?: string;
  imageUri?: string;
}

// --- Constants for Sarvam API ---
const SARVAM_API_KEY = 'sk_saeeog0v_lOjJPExQHFTY83DR5FbvqEgf'; // Your provided API key
const SARVAM_STT_URL = 'https://api.sarvam.ai/speech-to-text';
const SARVAM_TTS_URL = 'https://api.sarvam.ai/text-to-speech';
// ----------------------------------

// Ensure this points to your backend server's IP address, not localhost, when testing on a real device.
const API_BASE_URL = 'http://localhost:8000';

export default function AskQuestion() {
  const [image, setImage] = useState<string | null>(null);
  // MODIFIED: State to hold the Expo AV Recording object
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  // MODIFIED: This will now store the file URI (e.g., 'file://...')
  const [audioURI, setAudioURI] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [loadingText, setLoadingText] = useState('Sending...');

  // REMOVED: Unused state variables related to MediaRecorder
  // const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  // const [audioBlobs, setAudioBlobs] = useState<Blob[]>([]);
  // const [capturedStream, setCapturedStream] = useState<MediaStream | null>(null);
  // const [isRecorderInitialized, setIsRecorderInitialized] = useState(false);

  useEffect(() => {
    // Permissions requests are correct, no changes needed here.
    (async () => {
      await ImagePicker.requestCameraPermissionsAsync();
      await Audio.requestPermissionsAsync();
    })();
  }, []);

  const openCamera = async () => {
    const result = await ImagePicker.launchCameraAsync({
      quality: 1,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  // --- REWRITTEN AUDIO LOGIC USING EXPO-AV ---

  const startRecording = async () => {
    try {
      // Request permissions if not already granted
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Microphone permission is required to record audio!');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');

      // Use HIGH_QUALITY preset and convert to WAV in processing
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      console.log('Recording started in WAV format');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Failed to start recording.');
    }
  };

  const stopRecording = async () => {
    if (!recording) {
      return;
    }

    console.log('Stopping recording..');
    setRecording(null);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ // Good practice to reset the mode
      allowsRecordingIOS: false,
    });
    const uri = recording.getURI();
    setAudioURI(uri); // The result is a file URI!
    console.log('Recording stopped and stored at', uri);
  };

  // --- END OF REWRITTEN AUDIO LOGIC ---

  const playAudio = async (uri: string) => {
    try {
      console.log('🔊 Attempting to play audio from URI:', uri);

      if (sound) {
        await sound.unloadAsync();
      }

      // Check if URI is valid
      if (!uri || typeof uri !== 'string') {
        console.error('❌ Invalid audio URI:', uri);
        return;
      }

      // For web, try to play directly with HTML5 audio first
      if (Platform.OS === 'web') {
        try {
          const audio = new (window as any).Audio(uri);
          audio.onloadeddata = () => console.log('✅ Audio loaded successfully');
          audio.onerror = (e: any) => console.error('❌ HTML5 Audio error:', e);
          await audio.play();
          console.log('✅ HTML5 audio playback started');
          return;
        } catch (webError) {
          console.warn('⚠️ HTML5 audio failed, trying Expo Audio:', webError);
        }
      }

      // Fallback to Expo Audio
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      await newSound.playAsync();
      console.log('✅ Expo audio playback started');
    } catch (err) {
      console.error('❌ Error playing audio:', err);
      console.error('❌ Audio URI that failed:', uri);
      // Don't throw error, just log it so the app continues working
    }
  };

  // Helper function to process image-only uploads
  const processImageOnly = async () => {
    if (!image) return;

    setLoading(true);
    setLoadingText('Analyzing image...');

    try {
      // Create FormData for image upload
      const formData = new FormData();

      // Convert image URI to blob
      const response = await fetch(image);
      const imageBlob = await response.blob();

      // Append image to form data
      formData.append('image', imageBlob, 'plant_image.jpg');

      console.log('📤 Sending image to backend for analysis...');

      // Send to image analysis endpoint
      const analysisResponse = await fetch(`${API_BASE_URL}/ai-assistant/image-analysis`, {
        method: 'POST',
        body: formData,
      });

      if (!analysisResponse.ok) {
        throw new Error(`Image analysis failed: ${analysisResponse.statusText}`);
      }

      const analysisResult = await analysisResponse.json();
      console.log('🔍 Image analysis result:', analysisResult);

      // Add user's image message to chat
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: 'Uploaded an image for analysis',
        timestamp: new Date(),
        imageUri: image,
      };
      console.log('➕ Adding user message to chat:', userMessage);
      setMessages(prev => {
        const newMessages = [...prev, userMessage];
        console.log('📝 Updated messages after user message:', newMessages);
        return newMessages;
      });

      // Add assistant's analysis response
      const analysisContent = analysisResult.final_reply || analysisResult.image_analysis || 'Image analysis completed.';

      console.log('🤖 Analysis content:', analysisContent);

      // Generate TTS for the analysis result
      setLoadingText('Generating audio response...');
      let audioUrl = null;

      try {
        const ttsResponse = await fetch(SARVAM_TTS_URL, {
          method: 'POST',
          headers: {
            'api-subscription-key': SARVAM_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: analysisContent,
            target_language_code: 'ta-IN', // Tamil for TTS output
            output_format: 'wav'
          }),
        });

        if (ttsResponse.ok) {
          const ttsResult = await ttsResponse.json();
          console.log('🔊 TTS Result for image analysis:', ttsResult);

          // Try different possible response formats
          if (ttsResult.audios && ttsResult.audios[0]) {
            audioUrl = ttsResult.audios[0];
          } else if (ttsResult.audio) {
            audioUrl = ttsResult.audio;
          } else if (ttsResult.url) {
            audioUrl = ttsResult.url;
          }
        } else {
          console.warn('🔊 TTS failed for image analysis:', ttsResponse.statusText);
        }
      } catch (ttsError) {
        console.warn('🔊 TTS error for image analysis:', ttsError);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: analysisContent,
        timestamp: new Date(),
        audioUri: audioUrl,
      };
      console.log('➕ Adding assistant message to chat:', assistantMessage);
      setMessages(prev => {
        const newMessages = [...prev, assistantMessage];
        console.log('📝 Updated messages after assistant message:', newMessages);
        console.log('📊 Total messages count:', newMessages.length);
        return newMessages;
      });

      // Auto-play the audio response if available
      if (audioUrl) {
        console.log('🔊 Auto-playing TTS audio for image analysis response');
        await playAudio(audioUrl);
      } else {
        console.log('⚠️ No TTS audio available for image analysis response');
      }

      // Clear inputs after successful analysis
      setImage(null);
      setAudioURI(null);

    } catch (err) {
      console.error('❌ Image processing error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      Alert.alert('Error', errorMessage || 'Failed to process image.');
    } finally {
      setLoading(false);
      setLoadingText('Sending...');
    }
  };

  // Helper function to process audio-only uploads
  const processAudioOnly = async () => {
    if (!audioURI) return;

    setLoading(true);

    try {
      // 🎙️ VOICE MODE: Enable real STT and TTS
      const USE_DUMMY_TEXT = false; // Using real voice input now
      const SKIP_TTS = false; // Using real voice output now

      let transcript;

      if (USE_DUMMY_TEXT) {
        // Use dummy text to test backend integration
        transcript = "Hello, I need help with my crops";
        console.log('🚧 Using dummy transcript for testing:', transcript);

        // Add user's dummy message to chat
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'user',
          content: `Testing with: "${transcript}"`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
      } else {
        // ✅ Step 1: Transcribe Audio to Text (STT) using Sarvam API
        setLoadingText('Transcribing audio...');

        console.log('🎤 Preparing audio for STT...');
        console.log('Audio URI:', audioURI);

        if (!audioURI) {
          throw new Error('Audio URI is null');
        }

        const formData = new FormData();
        const response = await fetch(audioURI);
        const audioBlob = await response.blob();

        console.log('Audio blob size:', audioBlob.size);
        console.log('Audio blob type:', audioBlob.type);

        // Convert all audio to WAV format for consistent Sarvam API processing
        let processedBlob = audioBlob;
        let fileName = 'audio.wav';

        console.log('🔄 Converting audio to WAV format for Sarvam API...');

        // Create a new blob with WAV MIME type
        processedBlob = new Blob([audioBlob], { type: 'audio/wav' });

        console.log('✅ Audio converted to WAV format');
        console.log('Final blob size:', processedBlob.size);
        console.log('Final blob type:', processedBlob.type);

        formData.append('file', processedBlob, fileName);
        // Add language specification for Tamil
        formData.append('language_code', 'ta-IN'); // Tamil (India)
        console.log('📤 Sending to Sarvam STT with filename:', fileName, 'and language: ta-IN');

        const sttResponse = await fetch(SARVAM_STT_URL, {
          method: 'POST',
          headers: {
            'api-subscription-key': SARVAM_API_KEY,
          },
          body: formData,
        });

        console.log('🎤 STT Response status:', sttResponse.status);

        if (!sttResponse.ok) {
          const errorText = await sttResponse.json();
          console.error('🎤 STT Error response:', errorText);
          throw new Error(`STT failed (${sttResponse.status}): ${JSON.stringify(errorText)}`);
        }

        const sttResult = await sttResponse.json();
        console.log('🎤 STT Result:', sttResult);

        transcript = sttResult.transcript;

        if (!transcript || transcript.trim() === '') {
          throw new Error('STT failed: No transcript received or transcript is empty');
        }

        console.log('🎤 Final transcript:', transcript);

        // Add user's transcribed message to chat
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          type: 'user',
          content: `You said: "${transcript}"`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
      }

      // ✅ Step 2: Send transcript to YOUR backend to get AI reply
      setLoadingText('Getting AI reply...');
      console.log('🤖 Sending to backend:', transcript);

      const backendResponse = await fetch(`${API_BASE_URL}/ai-assistant/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: transcript }),
      });

      console.log('🤖 Backend response status:', backendResponse.status);

      if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error('🤖 Backend error response:', errorText);
        throw new Error(`Backend failed (${backendResponse.status}): ${errorText}`);
      }

      const backendResult = await backendResponse.json();
      const replyText = backendResult.reply;

      if (SKIP_TTS) {
        // 🚧 TEMPORARY: Skip TTS and just show text response
        console.log('🚧 Skipping TTS, showing text response only');

        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: replyText,
          timestamp: new Date(),
          audioUri: undefined, // No audio
        };
        setMessages(prev => [...prev, assistantMessage]);

        // Clear inputs after successful flow
        setImage(null);
        setAudioURI(null);
        return;
      }

      // ✅ Step 3: Convert AI's text reply to Speech (TTS) using Sarvam API
      setLoadingText('Generating audio reply...');
      const ttsResponse = await fetch(SARVAM_TTS_URL, {
        method: 'POST',
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: replyText,
          target_language_code: 'ta-IN', // Tamil (India) for TTS output
          output_format: 'wav' // Request WAV format for consistency
        }),
      });

      if (!ttsResponse.ok) {
        throw new Error(`Sarvam TTS failed: ${ttsResponse.statusText}`);
      }

      const ttsResult = await ttsResponse.json();
      console.log('🔊 TTS Result:', ttsResult);
      console.log('🔊 TTS Result keys:', Object.keys(ttsResult));

      // Try different possible response formats
      let replyAudioUrl = null;
      if (ttsResult.audios && ttsResult.audios[0]) {
        replyAudioUrl = ttsResult.audios[0];
        console.log('🔊 Found audio in audios[0]:', replyAudioUrl);
      } else if (ttsResult.audio) {
        replyAudioUrl = ttsResult.audio;
        console.log('🔊 Found audio in audio field:', replyAudioUrl);
      } else if (ttsResult.url) {
        replyAudioUrl = ttsResult.url;
        console.log('🔊 Found audio in url field:', replyAudioUrl);
      } else {
        console.warn('🔊 No audio URL found in TTS response');
      }

      // Add assistant's message
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: replyText,
        timestamp: new Date(),
        audioUri: replyAudioUrl,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Play the audio if available
      if (replyAudioUrl) {
        await playAudio(replyAudioUrl);
      } else {
        console.warn('No audio URL received from TTS');
      }

      // Clear inputs after successful flow
      setImage(null);
      setAudioURI(null);

    } catch (err) {
      console.error('❌ Voice processing error:', err);

      // If STT fails, offer text input as fallback
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage && errorMessage.includes('STT failed')) {
        Alert.alert(
          'Voice Recognition Failed',
          'Would you like to type your question instead?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Type Question',
              onPress: () => {
                // Use prompt for text input as fallback
                const textInput = prompt('Please type your question:');
                if (textInput) {
                  processTextInput(textInput);
                }
                setRecording(null);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', errorMessage || 'An unexpected error occurred.');
      }
    } finally {
      setLoading(false);
      setLoadingText('Sending...'); // Reset loading text
    }
  };

  // --- REWRITTEN sendToBackend FUNCTION ---
  const sendToBackend = async () => {
    // Check if we have either audio or image
    if (!audioURI && !image) {
      Alert.alert('Error', 'Please record audio or select an image first');
      return;
    }

    // If we only have an image (no audio), process image only
    if (image && !audioURI) {
      await processImageOnly();
      return;
    }

    // If we only have audio (no image), process audio only
    if (audioURI && !image) {
      await processAudioOnly();
      return;
    }

    // If we have both audio and image, we could combine them (future enhancement)
    if (audioURI && image) {
      Alert.alert(
        'Multiple Inputs',
        'You have both audio and image. Which would you like to process?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Process Audio', onPress: () => processAudioOnly() },
          { text: 'Process Image', onPress: () => processImageOnly() },
        ]
      );
      return;
    }

  };

  // Helper function to process text input directly
  const processTextInput = async (text: string) => {
    setLoading(true);
    try {
      // Add user message
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'user',
        content: `You typed: "${text}"`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);

      // Get AI response
      setLoadingText('Getting AI reply...');
      const backendResponse = await fetch(`${API_BASE_URL}/ai-assistant/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      if (!backendResponse.ok) {
        throw new Error('Failed to get reply from backend.');
      }

      const backendResult = await backendResponse.json();
      const replyText = backendResult.reply;

      // Add AI response (text only for typed input)
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: replyText,
        timestamp: new Date(),
        audioUri: undefined,
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Clear inputs
      setImage(null);
      setAudioURI(null);
    } catch (err) {
      console.error('❌ Text processing error:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      Alert.alert('Error', errorMessage || 'Failed to process text input.');
    } finally {
      setLoading(false);
      setLoadingText('Sending...');
    }
  };

  // --- UI AND RENDERING LOGIC (UNCHANGED) ---
  const renderMessage = (message: ChatMessage) => {
    console.log('🎨 Rendering message:', message);
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        message.type === 'user' ? styles.userMessage : styles.assistantMessage
      ]}>
        {/* Message Header */}
        <View style={styles.messageHeader}>
          <Text style={styles.messageAuthor}>
            {message.type === 'user' ? '👤 You' : '🤖 AI Assistant'}
          </Text>
          <Text style={styles.timestamp}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        {/* Message Content */}
        <Text style={styles.messageText}>{message.content}</Text>

        {/* Image Display */}
        {message.imageUri && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: message.imageUri }}
              style={styles.messageImage}
              resizeMode="contain"
            />
            <Text style={styles.imageCaption}>📷 Uploaded Image</Text>
          </View>
        )}

        {/* Audio Controls */}
        {message.audioUri && (
          <View style={styles.audioControls}>
            <TouchableOpacity
              style={styles.audioButton}
              onPress={() => playAudio(message.audioUri!)}
            >
              <Text style={styles.audioButtonText}>🔊 Play Audio</Text>
            </TouchableOpacity>
            <Text style={styles.audioHint}>Tap to hear the response</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* ... (Your JSX for camera, buttons, and chat display is correct and remains unchanged) ... */}
      <Text style={styles.title}>Ask a Question</Text>
      <Text style={styles.instructionText}>
        📷 Take a photo of your plant or crop, or 🎙️ record your question (or both!)
      </Text>

      <TouchableOpacity style={styles.actionButton} onPress={openCamera}>
        <Text style={styles.buttonText}>📷 Take a Photo</Text>
      </TouchableOpacity>

      {image && <Image source={{ uri: image }} style={styles.image} />}

      <TouchableOpacity style={styles.actionButton} onPress={recording ? stopRecording : startRecording}>
        <Text style={styles.buttonText}>
          🎙 {recording ? 'Stop Recording' : 'Record Audio'}
        </Text>
      </TouchableOpacity>

      {audioURI && !recording && <Text style={styles.audioStatus}>🎧 Audio recorded ✅</Text>}
      {image && <Text style={styles.imageStatus}>📷 Image selected ✅</Text>}

      <TouchableOpacity
        style={[styles.submitButton, (loading || (!image && !audioURI)) && styles.disabledButton]} 
        onPress={sendToBackend}
        disabled={loading || (!image && !audioURI)}
      >
        <Text style={styles.submitText}>
          {loading ? loadingText : 'Send'}
        </Text>
      </TouchableOpacity>

      {/* Chat Messages Section */}
      <View style={styles.chatSection}>
        <Text style={styles.chatSectionTitle}>💬 AI Assistant Chat</Text>
        <ScrollView
          style={styles.chatContainer}
          showsVerticalScrollIndicator={false}
          ref={(ref) => {
            // Auto-scroll to bottom when new messages arrive
            if (ref && messages.length > 0) {
              setTimeout(() => ref.scrollToEnd({ animated: true }), 100);
            }
          }}
        >
          {(() => {
            console.log('🔍 Rendering chat - messages.length:', messages.length);
            console.log('🔍 Messages array:', messages);
            return messages.length === 0 ? (
              <View style={styles.emptyChatContainer}>
                <Text style={styles.emptyChatText}>
                  🤖 Hi! I'm your AI agricultural assistant. Upload an image of your plant or record your question to get started!
                </Text>
              </View>
            ) : (
              messages.map(renderMessage)
            );
          })()}
        </ScrollView>
      </View>
    </View>
  );
}

// Styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2FAF6',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 30,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  actionButton: {
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
    width: 200,
    height: 200,
    marginVertical: 20,
    borderRadius: 15,
    borderColor: '#CCC',
    borderWidth: 1,
  },
  audioStatus: {
    fontSize: 16,
    color: '#4CAF50',
    marginBottom: 20,
  },
  imageStatus: {
    fontSize: 16,
    color: '#FF9800',
    marginBottom: 20,
  },
  submitButton: {
    width: '90%',
    paddingVertical: 15,
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#A5D6A7',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  chatSection: {
    flex: 1,
    marginTop: 20,
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chatSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 12,
    textAlign: 'center',
  },
  chatContainer: {
    flex: 1,
    maxHeight: 300, // Limit height to prevent taking too much space
    width: '100%',
  },
  emptyChatContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  emptyChatText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  messageContainer: {
    padding: 12,
    marginVertical: 4,
    borderRadius: 12,
    maxWidth: '80%',
  },
  userMessage: {
    backgroundColor: '#E8F5E8',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    elevation: 1,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageAuthor: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    lineHeight: 22,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  messageImage: {
    width: 250,
    height: 200,
    borderRadius: 12,
    marginBottom: 4,
  },
  imageCaption: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  audioControls: {
    alignItems: 'center',
    marginTop: 8,
  },
  audioHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  audioButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  audioButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});