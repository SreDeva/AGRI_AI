import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity, Alert, Image, Modal, TextInput } from 'react-native';
import { Card, Title, Paragraph, Text, Button, ActivityIndicator, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/contexts/AuthContext';
import api, { PlantDiagnosisResponse, DiagnosisHistoryItem } from '@/services/api';

// Interface for diagnosis state
interface DiagnosisState {
  isLoading: boolean;
  result: PlantDiagnosisResponse | null;
  error: string | null;
  selectedImage: string | null;
}

export default function DiagnoseScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // State management
  const [diagnosisState, setDiagnosisState] = useState<DiagnosisState>({
    isLoading: false,
    result: null,
    error: null,
    selectedImage: null,
  });
  
  const [history, setHistory] = useState<DiagnosisHistoryItem[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showInputModal, setShowInputModal] = useState(false);
  const [inputData, setInputData] = useState({
    cropType: '',
    symptoms: '',
    location: '',
  });

  // Load diagnosis history on component mount
  useEffect(() => {
    loadDiagnosisHistory();
    
    // Check if user is authenticated
    if (!user) {
      Alert.alert(
        'Authentication Required',
        'Please log in to use the diagnosis feature.',
        [
          { text: 'Cancel', onPress: () => router.back() },
          { text: 'Log In', onPress: () => router.push('/auth/login') }
        ]
      );
    }
  }, [user]);

  const loadDiagnosisHistory = async () => {
    try {
      const historyData = await api.aiAPI.getDiagnosisHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load diagnosis history:', error);
    }
  };

  const resetDiagnosisState = () => {
    setDiagnosisState({
      isLoading: false,
      result: null,
      error: null,
      selectedImage: null,
    });
    setShowResultModal(false);
    setShowInputModal(false);
    setInputData({ cropType: '', symptoms: '', location: '' });
  };

  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaLibraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaLibraryStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Camera and media library permissions are required to capture and select images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const processImage = async (imageUri: string) => {
    try {
      setDiagnosisState(prev => ({ ...prev, selectedImage: imageUri }));
      setShowInputModal(true);
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process the selected image');
    }
  };

  const handleCameraCapture = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images', // Fixed deprecated usage
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera capture error:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const handleGallerySelect = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images', // Fixed deprecated usage
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery selection error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const submitDiagnosis = async () => {
    if (!diagnosisState.selectedImage) {
      Alert.alert('Error', 'Please select an image first');
      return;
    }

    setDiagnosisState(prev => ({ ...prev, isLoading: true, error: null }));
    setShowInputModal(false);

    try {
      console.log('Starting diagnosis submission...');
      console.log('Image URI:', diagnosisState.selectedImage);
      console.log('Input data:', inputData);
      
      // Create FormData for multipart/form-data request
      const formData = new FormData();
      
      // Add image file - React Native format
      formData.append('image', {
        uri: diagnosisState.selectedImage,
        type: 'image/jpeg',
        name: 'plant_image.jpg',
      } as any);

      // Add optional form fields
      if (inputData.cropType) {
        formData.append('crop_type', inputData.cropType);
      }
      if (inputData.symptoms) {
        formData.append('symptoms', inputData.symptoms);
      }
      if (inputData.location) {
        formData.append('location', inputData.location);
      }

      console.log('FormData created, calling API...');
      const result = await api.aiAPI.diagnosePlant(formData);
      console.log('API call successful:');
      
      setDiagnosisState(prev => ({
        ...prev,
        isLoading: false,
        result,
        error: null,
      }));

      // Save to history
      await api.aiAPI.saveDiagnosisToHistory(result, diagnosisState.selectedImage);
      await loadDiagnosisHistory();

      setShowResultModal(true);
    } catch (error) {
      console.error('Diagnosis error:', error);
      console.error('Error details:', {
        message: (error as any)?.message || 'Unknown error',
        stack: (error as any)?.stack,
        name: (error as any)?.name
      });
      
      const errorMessage = error instanceof Error ? error.message : 'Diagnosis failed';
      
      setDiagnosisState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      // Handle specific error types
      if (errorMessage.includes('Authentication') || errorMessage.includes('403')) {
        Alert.alert(
          'Authentication Required', 
          'Please log in again to use this feature.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Log In', onPress: () => router.push('/auth/login') }
          ]
        );
      } else if (errorMessage.includes('422')) {
        Alert.alert(
          'Invalid Request', 
          'There was an issue with the image or form data. Please try again.',
          [{ text: 'OK' }]
        );
      } else if (errorMessage.includes('Network')) {
        Alert.alert(
          'Network Error', 
          'Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert('Diagnosis Failed', errorMessage);
      }
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#757575';
    }
  };

  const getConditionIcon = (isHealthy: boolean, condition: string) => {
    if (isHealthy) return 'leaf-outline';
    if (condition.toLowerCase().includes('pest')) return 'bug-outline';
    if (condition.toLowerCase().includes('disease')) return 'medical-outline';
    return 'warning-outline';
  };

  const getConditionColor = (isHealthy: boolean) => {
    return isHealthy ? '#4CAF50' : '#F44336';
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#2196F3', '#42A5F5', '#64B5F6']}
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
            <Text style={styles.pageText}>📷 Diagnose Crop</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.backButton}
            onPress={resetDiagnosisState}
            activeOpacity={0.7}
          >
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>AI-Powered</Text>
          <Text style={styles.welcomeSubtext}>Crop Disease Detection 🔍</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading Indicator */}
        {diagnosisState.isLoading && (
          <Card style={styles.card} elevation={4}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196F3" />
                <Text style={styles.loadingText}>Analyzing your crop image...</Text>
                <Text style={styles.loadingSubtext}>This may take a few moments</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* How It Works Card */}
        {!diagnosisState.isLoading && !diagnosisState.result && (
          <Card style={styles.card} elevation={4}>
            <Card.Content style={styles.cardContent}>
              <Title style={styles.cardTitle}>How It Works</Title>
              <Paragraph style={styles.cardDescription}>
                Our AI analyzes your crop photos to detect diseases, pests, and deficiencies instantly.
              </Paragraph>
              
              <View style={styles.stepsList}>
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <Text style={styles.stepText}>Take a clear photo of affected plant parts</Text>
                </View>
                
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={styles.stepText}>AI analyzes the image for issues</Text>
                </View>
                
                <View style={styles.stepItem}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={styles.stepText}>Get diagnosis and treatment recommendations</Text>
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Start Diagnosis Card */}
        {!diagnosisState.isLoading && !diagnosisState.result && (
          <Card style={styles.card} elevation={4}>
            <Card.Content style={styles.cardContent}>
              <Title style={styles.cardTitle}>Start Diagnosis</Title>
              <Paragraph style={styles.cardDescription}>
                Choose how you want to capture or select your crop image.
              </Paragraph>
              
              <View style={styles.buttonContainer}>
                <Button
                  mode="contained"
                  onPress={handleCameraCapture}
                  style={styles.primaryButton}
                  buttonColor="#2196F3"
                  textColor="#FFFFFF"
                  icon="camera"
                  disabled={diagnosisState.isLoading}
                >
                  Take Photo
                </Button>
                
                <Button
                  mode="outlined"
                  onPress={handleGallerySelect}
                  style={styles.secondaryButton}
                  textColor="#2196F3"
                  icon="image"
                  disabled={diagnosisState.isLoading}
                >
                  Choose from Gallery
                </Button>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Diagnosis History Card */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.historyHeader}>
              <Title style={styles.cardTitle}>Recent Diagnoses</Title>
              {history.length > 0 && (
                <TouchableOpacity onPress={() => api.aiAPI.clearDiagnosisHistory().then(loadDiagnosisHistory)}>
                  <Text style={styles.clearText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {history.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="document-outline" size={48} color="#CCCCCC" />
                <Text style={styles.emptyHistoryText}>No diagnoses yet</Text>
                <Text style={styles.emptyHistorySubtext}>Start by taking a photo of your crop</Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {history.slice(0, 5).map((item) => (
                  <View key={item.id} style={styles.historyItem}>
                    <Ionicons 
                      name={getConditionIcon(item.is_healthy, item.condition)} 
                      size={24} 
                      color={getConditionColor(item.is_healthy)} 
                    />
                    <View style={styles.historyContent}>
                      <Text style={styles.historyTitle}>
                        {item.crop_type} - {item.condition}
                      </Text>
                      <Text style={styles.historyDate}>{formatDate(item.date)}</Text>
                    </View>
                    <Chip 
                      style={[styles.urgencyChip, { backgroundColor: getUrgencyColor(item.urgency) }]}
                      textStyle={styles.urgencyText}
                    >
                      {item.urgency}
                    </Chip>
                  </View>
                ))}
                {history.length > 5 && (
                  <TouchableOpacity style={styles.showMoreButton}>
                    <Text style={styles.showMoreText}>Show more ({history.length - 5} more)</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Input Modal */}
      <Modal
        visible={showInputModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInputModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Additional Information</Text>
            <Text style={styles.modalSubtitle}>Help improve diagnosis accuracy (optional)</Text>
            
            {diagnosisState.selectedImage && (
              <Image source={{ uri: diagnosisState.selectedImage }} style={styles.previewImage} />
            )}
            
            <TextInput
              style={styles.input}
              placeholder="Crop type (e.g., Tomato, Rice, Wheat)"
              value={inputData.cropType}
              onChangeText={(text) => setInputData(prev => ({ ...prev, cropType: text }))}
            />
            
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Observed symptoms (e.g., yellow spots, wilting leaves)"
              value={inputData.symptoms}
              onChangeText={(text) => setInputData(prev => ({ ...prev, symptoms: text }))}
              multiline
              numberOfLines={3}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Location (e.g., California, USA)"
              value={inputData.location}
              onChangeText={(text) => setInputData(prev => ({ ...prev, location: text }))}
            />
            
            <View style={styles.modalButtons}>
              <Button
                mode="outlined"
                onPress={() => setShowInputModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={submitDiagnosis}
                style={styles.modalButton}
                buttonColor="#2196F3"
              >
                Analyze
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      {/* Result Modal */}
      <Modal
        visible={showResultModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.resultModal}>
            <View style={styles.resultModalContent}>
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Diagnosis Result</Text>
                <TouchableOpacity onPress={() => setShowResultModal(false)}>
                  <Ionicons name="close" size={24} color="#757575" />
                </TouchableOpacity>
              </View>
              
              {diagnosisState.result && (
                <>
                  <View style={styles.diagnosisCard}>
                    <Text style={styles.primaryDiagnosis}>{diagnosisState.result.primary_diagnosis}</Text>
                    <View style={styles.confidenceRow}>
                      <Text style={styles.confidenceLabel}>Confidence: </Text>
                      <Chip style={styles.confidenceChip}>
                        {diagnosisState.result.confidence}
                      </Chip>
                      <Chip 
                        style={[styles.urgencyChip, { backgroundColor: getUrgencyColor(diagnosisState.result.urgency) }]}
                        textStyle={styles.urgencyText}
                      >
                        {diagnosisState.result.urgency} urgency
                      </Chip>
                    </View>
                  </View>

                  {diagnosisState.result.recommendations.length > 0 && (
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionTitle}>🔧 Treatment Recommendations</Text>
                      {diagnosisState.result.recommendations.map((rec, index) => (
                        <Text key={index} style={styles.listItem}>• {rec}</Text>
                      ))}
                    </View>
                  )}

                  {diagnosisState.result.preventive_measures.length > 0 && (
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionTitle}>🛡️ Preventive Measures</Text>
                      {diagnosisState.result.preventive_measures.map((measure, index) => (
                        <Text key={index} style={styles.listItem}>• {measure}</Text>
                      ))}
                    </View>
                  )}

                  {diagnosisState.result.fertilizer_advice && (
                    <View style={styles.sectionCard}>
                      <Text style={styles.sectionTitle}>🌱 Fertilizer Advice</Text>
                      <Text style={styles.adviceText}>{diagnosisState.result.fertilizer_advice}</Text>
                    </View>
                  )}
                </>
              )}
              
              <Button
                mode="contained"
                onPress={resetDiagnosisState}
                style={styles.doneButton}
                buttonColor="#2196F3"
              >
                Done
              </Button>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E3F2FD',
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
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.1)',
    marginBottom: 18,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1565C0',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  stepsList: {
    marginTop: 10,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  stepText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 12,
  },
  primaryButton: {
    paddingVertical: 8,
    borderRadius: 12,
  },
  secondaryButton: {
    paddingVertical: 8,
    borderRadius: 12,
    borderColor: '#2196F3',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  clearText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 30,
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 10,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  historyList: {
    marginTop: 15,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  historyContent: {
    flex: 1,
    marginLeft: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  historyStatus: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
  },
  urgencyChip: {
    marginLeft: 8,
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  showMoreButton: {
    alignItems: 'center',
    padding: 10,
  },
  showMoreText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 20,
    alignSelf: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#F9F9F9',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  resultModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  resultModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginTop: 50,
    minHeight: '90%',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  diagnosisCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  primaryDiagnosis: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  confidenceLabel: {
    fontSize: 16,
    color: '#666',
  },
  confidenceChip: {
    backgroundColor: '#2196F3',
    marginRight: 10,
  },
  sectionCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  listItem: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 5,
  },
  adviceText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  analysisText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  doneButton: {
    marginTop: 20,
    paddingVertical: 8,
  },
});
