import React, { useState, useRef, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  StatusBar, 
  TouchableOpacity, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking
} from 'react-native';
import { Card, Title, Paragraph, Text, Button, IconButton } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useAudioRecorder,
  useAudioRecorderState,
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
// WhatsApp-like audio playback state
type AudioPlaybackState = {
  messageId: string | null;
  isPlaying: boolean;
  progress: number; // 0 to 1
  duration: number;
  position: number;
};

// Message interface
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  audioUrl?: string;
  isLoading?: boolean;
  isPlaying?: boolean;
}

// API Configuration
// For Expo/React Native: Use your computer's IP address instead of localhost
const API_BASE_URL = __DEV__ 
  ? Platform.OS === 'android' 
    ? 'http://10.0.2.2:8000/api/v1/ai'  // Android emulator
    : Platform.OS === 'web'
    ? 'http://localhost:8000/api/v1/ai'  // Web browser
    : 'http://172.31.98.7:8000/api/v1/ai'  // iOS simulator/physical device - Your Wi-Fi IP
  : 'http://your-production-url.com/api/v1/ai';

// Your computer's IP addresses:
// Wi-Fi: 172.31.98.7 (recommended)
// Hamachi: 25.6.215.52

export default function AIAssistantScreen() {
  // WhatsApp-like audio playback state
  const [audioPlayback, setAudioPlayback] = useState<AudioPlaybackState>({
    messageId: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
    position: 0,
  });
  const [currentAudioUrl, setCurrentAudioUrl] = useState<string | null>(null);
  const audioPlayer = useAudioPlayer(currentAudioUrl ? { uri: currentAudioUrl } : null);
  const audioStatus = useAudioPlayerStatus(audioPlayer);
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI farming assistant. Ask me anything about agriculture, crops, or farming techniques. 🌾',
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');  
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Fetch chat history from backend on mount
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const accessToken = await AsyncStorage.getItem('access_token');
        const headers: any = {
          'Accept': 'application/json',
        };
        if (accessToken) {
          headers['Authorization'] = `Bearer ${accessToken}`;
        }
        const response = await fetch(`${API_BASE_URL}/history`, {
          method: 'GET',
          headers,
        });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        const data = await response.json();
        // Defensive check for chat history array
        if (data && Array.isArray(data.history)) {
          // Map backend history to Message[] with unique keys
          const mapped = data.history.map((msg: any, idx: number) => ({
            id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 6)}`,
            text: msg.text || '',
            isUser: !!msg.isUser,
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
            audioUrl: msg.audioUrl || undefined,
          }));
          // Only set if non-empty
          if (mapped.length > 0) {
            setMessages(prev => [
              ...prev,
              ...mapped
            ]);
          }
        }
      } catch (error) {
        console.error('Failed to fetch chat history:', error);
      }
    };
    fetchChatHistory();
  }, []);

  // Recorder setup using expo-audio
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);

  // Request permissions and set audio mode on mount
  useEffect(() => {
    (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        Alert.alert('Permission to access microphone was denied');
      }
      setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  // Scroll to bottom when new message is added
  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  // Send text message to AI
  const sendTextMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: 'Thinking...',
      isUser: false,
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      console.log('Sending request to:', `${API_BASE_URL}/query`);
      
      // Get access token from AsyncStorage
      const accessToken = await AsyncStorage.getItem('access_token');
      
      // Create FormData for the backend's expected format
      const formData = new FormData();
      formData.append('text', text.trim());
      formData.append('audio_response', 'false');

      console.log('Request payload: FormData with text and audio_response');

      const headers: any = {
        'Accept': 'application/json',
      };

      // Add authorization header if token exists
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        body: formData,
        headers,
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Response data:', data);

      // Defensive check for response data
      if (data && data.success && data.response_text) {
        const aiMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: data.response_text,
          isUser: false,
          timestamp: new Date(),
          audioUrl: data.audio_url || undefined, // Include audio URL if available
        };

        setMessages(prev => prev.slice(0, -1).concat([aiMessage]));
      } else {
        throw new Error(data?.detail || 'AI response was not successful or missing data');
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      
      let errorMsg = 'Sorry, I encountered an error. Please try again.';
      
      if (error.message?.includes('Network request failed')) {
        errorMsg = 'Cannot connect to AI server. Please check if the backend is running on port 8000.';
      } else if (error.message?.includes('timeout')) {
        errorMsg = 'Request timed out. The AI is taking too long to respond.';
      } else if (error.message?.includes('HTTP 404')) {
        errorMsg = 'AI endpoint not found. Please check the server configuration.';
      } else if (error.message?.includes('HTTP 503')) {
        errorMsg = 'AI models are not available. Please wait and try again.';
      } else if (error.message?.includes('HTTP 401')) {
        errorMsg = 'Authentication failed. Please log in again.';
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        text: errorMsg,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => prev.slice(0, -1).concat([errorMessage]));
      
      Alert.alert('Connection Error', `${errorMsg}\n\nAPI URL: ${API_BASE_URL}/query`);
    } finally {
      setIsLoading(false);
    }
  };

  // Test connection to backend
  const testConnection = async () => {
    try {
      Alert.alert('Testing...', `Trying to connect to: ${API_BASE_URL}/status`);
      
      // Get access token from AsyncStorage
      const accessToken = await AsyncStorage.getItem('access_token');
      
      const headers: any = {
        'Accept': 'application/json',
      };

      // Add authorization header if token exists
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
      
      const response = await fetch(`${API_BASE_URL}/status`, {
        method: 'GET',
        headers,
      });
      
      if (response.ok) {
        const data = await response.json();
        Alert.alert('✅ Connection Success!', 
          `Connected to AI server successfully!\n\n` +
          `System Ready: ${data?.system_ready || 'Unknown'}\n` +
          `Models Loaded: ${data?.models_loaded ? Object.values(data.models_loaded).filter(Boolean).length : 0}/${data?.models_loaded ? Object.keys(data.models_loaded).length : 0}\n` +
          `Languages: ${data?.supported_languages ? data.supported_languages.join(', ') : 'Unknown'}`
        );
      } else {
        Alert.alert('❌ Connection Failed', `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      Alert.alert('❌ Connection Error', `${error.message}\n\nURL: ${API_BASE_URL}/status`);
    }
  };

  // Handle quick questions
  const handleQuickQuestion = (question: string) => {
    sendTextMessage(question);
  };

// Start recording
  const startRecording = async () => {
    try {
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (error) {
      Alert.alert('Recording Failed', 'Could not start recording.');
    }
  };

  // Stop recording and send audio to backend
  const stopRecordingAndSend = async () => {
    try {
      await audioRecorder.stop();
      if (audioRecorder.uri) {
        await sendAudioMessage(audioRecorder.uri);
      } else {
        Alert.alert('No Recording', 'No audio was recorded.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  // Upload audio to backend (no change needed)
  const sendAudioMessage = async (audioUri: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: '[Voice message]',
      isUser: true,
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: 'Thinking...',
      isUser: false,
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setIsLoading(true);

    try {
      // Get access token from AsyncStorage
      const accessToken = await AsyncStorage.getItem('access_token');
      
      const formData = new FormData();
      formData.append('audio_file', {
        uri: audioUri,
        name: 'recording.m4a',
        type: 'audio/m4a',
      } as any);
      // Optionally: formData.append('audio_response', 'true');

      const headers: any = {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      };

      // Add authorization header if token exists
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/query`, {
        method: 'POST',
        body: formData,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      // Defensive check for response data
      if (data && data.success && data.response_text) {
        const aiMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: data.response_text,
          isUser: false,
          timestamp: new Date(),
          audioUrl: data.processing_info?.tts?.audio_path || undefined,
        };

        setMessages(prev => prev.slice(0, -1).concat([aiMessage]));
      } else {
        throw new Error(data?.detail || 'AI response was not successful or missing data');
      }
    } catch (error: any) {
      let errorMsg = 'Sorry, I encountered an error. Please try again.';
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        text: errorMsg,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => prev.slice(0, -1).concat([errorMessage]));
    } finally {
      setIsLoading(false);
    }
  };


  // WhatsApp-like audio playback logic

  const playAudio = async (audioUrl: string, messageId: string) => {
    try {
      // Stop any currently playing audio
      if (audioPlayer && audioStatus?.isLoaded) {
        await audioPlayer.pause();
      }

      const fullAudioUrl = audioUrl.startsWith('http')
        ? audioUrl
        : `${API_BASE_URL.replace('/ai', '')}${audioUrl}`;

      // Set the new audio URL to create a new player instance
      setCurrentAudioUrl(fullAudioUrl);
      setAudioPlayback({
        messageId,
        isPlaying: true,
        progress: 0,
        duration: 0,
        position: 0,
      });
      
      // Play will be handled by the useEffect that watches for currentAudioUrl changes
    } catch (error) {
      console.error('Audio play error:', error);
      Alert.alert('Error', 'Could not play audio');
      setAudioPlayback({
        messageId: null,
        isPlaying: false,
        progress: 0,
        duration: 0,
        position: 0,
      });
      setCurrentAudioUrl(null);
    }
  };

  const pauseAudio = async () => {
    if (audioPlayer && audioStatus?.isLoaded) {
      await audioPlayer.pause();
      setAudioPlayback((prev) => ({ ...prev, isPlaying: false }));
    }
  };

  // Update playback state from audioStatus
  useEffect(() => {
    if (!audioStatus || !audioPlayback.messageId) return;
    if (audioStatus.isLoaded) {
      setAudioPlayback((prev) => ({
        ...prev,
        isPlaying: audioStatus.playing || false,
        progress: audioStatus.duration ? audioStatus.currentTime / audioStatus.duration : 0,
        duration: audioStatus.duration || 0,
        position: audioStatus.currentTime || 0,
      }));
      if (audioStatus.didJustFinish) {
        setAudioPlayback({
          messageId: null,
          isPlaying: false,
          progress: 0,
          duration: audioStatus.duration || 0,
          position: 0,
        });
        setCurrentAudioUrl(null);
      }
    }
  }, [audioStatus, audioPlayback.messageId]);

  // Handle audio playback when URL changes
  useEffect(() => {
    const playNewAudio = async () => {
      if (currentAudioUrl && audioPlayer && audioPlayback.messageId) {
        try {
          // Wait a bit for the player to be ready
          await new Promise(resolve => setTimeout(resolve, 100));
          if (audioStatus?.isLoaded) {
            await audioPlayer.play();
          }
        } catch (error) {
          console.error('Error playing audio:', error);
          setAudioPlayback({
            messageId: null,
            isPlaying: false,
            progress: 0,
            duration: 0,
            position: 0,
          });
          setCurrentAudioUrl(null);
        }
      }
    };

    playNewAudio();
  }, [currentAudioUrl, audioPlayer, audioStatus?.isLoaded]);

  // Format timestamp
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Quick questions for easy access
  const quickQuestions = [
    "What's the best time to plant tomatoes?",
    "How to treat leaf spots on crops?",
    "Which fertilizer for wheat?",
    "How to improve soil drainage?",
    "When to harvest wheat?",
  ];

  return (
    <ThemedView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#FFC107', '#FFD54F', '#FFF176']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statusRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.pageStatus}>
            <Text style={styles.pageText}>🤖 AI Chat</Text>
            <TouchableOpacity 
              style={styles.testButton}
              onPress={testConnection}
            >
              <Ionicons name="wifi" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Chat with AI</Text>
          <Text style={styles.welcomeSubtext}>Your intelligent farming companion</Text>
        </View>
      </LinearGradient>
      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {(Array.isArray(messages) && messages.length > 0 ? messages : [])
            .filter(m => m && typeof m === 'object' && typeof m.id === 'string' && m.id.length > 0)
            .map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  message.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userMessage : styles.aiMessage,
                  ]}
                >
                  {message.isLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#FFC107" />
                      <Text style={styles.loadingText}>Thinking...</Text>
                    </View>
                  ) : (
                    <React.Fragment>
                      <Text style={[
                        styles.messageText,
                        message.isUser ? styles.userMessageText : styles.aiMessageText,
                      ]}>
                        {message.text || ''}
                      </Text>
                      {message.audioUrl && !message.isUser && (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <TouchableOpacity
                            style={styles.audioButton}
                            onPress={() =>
                              audioPlayback.messageId === message.id && audioPlayback.isPlaying
                                ? pauseAudio()
                                : playAudio(message.audioUrl!, message.id)
                            }
                          >
                            <Ionicons
                              name={
                                audioPlayback.messageId === message.id && audioPlayback.isPlaying
                                  ? 'pause-circle'
                                  : 'play-circle'
                              }
                              size={24}
                              color="#FFC107"
                            />
                            <Text style={styles.audioButtonText}>
                              {audioPlayback.messageId === message.id && audioPlayback.isPlaying
                                ? 'Pause'
                                : 'Play Audio'}
                            </Text>
                          </TouchableOpacity>
                          {/* Progress bar */}
                          {audioPlayback.messageId === message.id && (
                            <View style={{ marginLeft: 8, width: 60, height: 4, backgroundColor: '#FFE082', borderRadius: 2 }}>
                              <View
                                style={{
                                  width: `${Math.round(audioPlayback.progress * 100)}%`,
                                  height: 4,
                                  backgroundColor: '#FFC107',
                                  borderRadius: 2,
                                }}
                              />
                            </View>
                          )}
                        </View>
                      )}
                    </React.Fragment>
                  )}
                  <Text style={[
                    styles.timestamp,
                    message.isUser ? styles.userTimestamp : styles.aiTimestamp,
                  ]}>
                    {message.timestamp ? formatTime(message.timestamp) : ''}
                  </Text>
                </View>
              </View>
            ))}
        </ScrollView>

        {/* Quick Questions */}
        {messages.length <= 1 && (
          <ScrollView
            horizontal
            style={styles.quickQuestionsContainer}
            contentContainerStyle={styles.quickQuestionsContent}
            showsHorizontalScrollIndicator={false}
          >
            {quickQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQuestionButton}
                onPress={() => handleQuickQuestion(question)}
              >
                <Text style={styles.quickQuestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input Section */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask anything about farming..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={() => sendTextMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
          
        <TouchableOpacity
          style={[
            styles.micButton,
            recorderState.isRecording && styles.micButtonRecording,
          ]}
          onPress={recorderState.isRecording ? stopRecordingAndSend : startRecording}
          disabled={isLoading}
        >
          <Ionicons 
            name={recorderState.isRecording ? "stop" : "mic"} 
            size={24} 
            color="#FFFFFF" 
          />
        </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDE7',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  testButton: {
    marginLeft: 8,
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pageText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 48,
  },
  welcomeSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 15,
  },
  messagesContent: {
    paddingVertical: 20,
  },
  messageWrapper: {
    marginVertical: 4,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  aiMessageWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  userMessage: {
    backgroundColor: '#FFC107',
    borderBottomRightRadius: 5,
  },
  aiMessage: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 4,
  },
  userMessageText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  aiMessageText: {
    color: '#333333',
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
  },
  userTimestamp: {
    color: '#FFFFFF',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#666666',
  },
  audioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  audioButtonText: {
    color: '#FFC107',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: '#FFC107',
    fontSize: 16,
  },
  quickQuestionsContainer: {
    paddingVertical: 10,
    paddingLeft: 15,
  },
  quickQuestionsContent: {
    paddingRight: 15,
  },
  quickQuestionButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    elevation: 2,
  },
  quickQuestionText: {
    color: '#333333',
    fontSize: 14,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 15,
    paddingBottom: Platform.OS === 'ios' ? 35 : 15,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 193, 7, 0.2)',
    alignItems: 'flex-end',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 25,
    marginRight: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    maxHeight: 100,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFC107',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  micButtonRecording: {
    backgroundColor: '#FF5722',
  },
});
