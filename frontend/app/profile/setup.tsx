import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, ScrollView, StatusBar, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Divider,
  HelperText,
  Chip,
  ActivityIndicator,
  IconButton,
  Text,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { authAPI, userAPI, SignupRequest } from '@/services/api_dev';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileSetupScreen() {
  const [formData, setFormData] = useState({
    // Personal Information
    name: '',
    email: '',
    age: '',
    gender: '',
    education_level: '',
    
    // Farm Information
    farm_name: '',
    farm_size: '',
    location: '',
    experience: '',
    farm_type: '',
    farm_ownership: '',
    soil_type: '',
    climate_zone: '',
    primary_crop: '',
    farming_method: '',
    irrigation_type: '',
    marketing_channel: '',
    annual_income: '',
    
    // Arrays
    crops: [] as string[],
    livestock: [] as string[],
    equipment: [] as string[],
    challenges: [] as string[],
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const router = useRouter();
  const { phone, otp } = useLocalSearchParams<{ phone?: string; otp?: string }>();

  // Enum options based on backend model
  const genderOptions = ['Male', 'Female', 'Other'];
  const educationLevels = ['Elementary', 'Higher Secondary', 'Graduate', 'Post Graduate', 'Diploma', 'Others'];
  const farmTypes = ['Small Scale (0-2 acres)', 'Medium Scale (2-10 acres)', 'Large Scale (10+ acres)'];
  const farmOwnership = ['Own Land', 'Rented', 'Sharecropping', 'Leased'];
  const soilTypes = ['Red Soil', 'Black Soil', 'Alluvial Soil', 'Clay Soil', 'Sandy Soil', 'Loamy Soil'];
  const climateZones = ['Tropical', 'Subtropical', 'Temperate', 'Arid', 'Semi-Arid'];
  const farmingMethods = ['Traditional', 'Organic', 'Integrated', 'Precision'];
  const irrigationTypes = ['Rain Fed', 'Bore Well', 'Canal', 'Drip Irrigation', 'Sprinkler'];
  const marketingChannels = ['Local Market', 'Wholesale', 'Direct to Consumer', 'Online Platform', 'Cooperative', 'Mandis'];
  
  const cropOptions = ['Rice', 'Wheat', 'Corn', 'Cotton', 'Sugarcane', 'Soybeans', 'Barley', 'Millet', 'Vegetables', 'Fruits', 'Pulses', 'Spices'];
  const livestockOptions = ['Cattle', 'Buffalo', 'Goats', 'Sheep', 'Poultry', 'Ducks', 'Pigs', 'Fish'];
  const equipmentOptions = ['Tractor', 'Harvester', 'Plow', 'Seeder', 'Sprayer', 'Irrigation System', 'Thresher', 'Cultivator'];
  const challengeOptions = ['Pest Control', 'Disease Management', 'Water Scarcity', 'Soil Quality', 'Weather Conditions', 'Market Access', 'Labor Shortage', 'Cost Management'];

  const steps = [
    'Personal Info',
    'Farm Details',
    'Farm Specs',
    'Resources'
  ];

  useEffect(() => {
    loadExistingProfile();
  }, []);

  const loadExistingProfile = async () => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated first
      const isAuth = await authAPI.isAuthenticated();
      console.log('User authenticated:', isAuth);
      
      if (!isAuth) {
        console.log('User not authenticated, starting fresh');
        return;
      }
      
      const token = await authAPI.getStoredToken();
      console.log('Stored token:', token ? token.substring(0, 20) + '...' : 'none');
      
      const userData = await authAPI.getCurrentUser();
      console.log('User data loaded:', userData);
      
      // Pre-fill form with existing data
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        age: userData.age?.toString() || '',
        gender: userData.gender || '',
        education_level: userData.education_level || '',
        farm_name: userData.farm_name || '',
        farm_size: userData.farm_size || '',
        location: userData.location || '',
        experience: userData.experience?.toString() || '',
        farm_type: userData.farm_type || '',
        farm_ownership: userData.farm_ownership || '',
        soil_type: userData.soil_type || '',
        climate_zone: userData.climate_zone || '',
        primary_crop: userData.primary_crop || '',
        farming_method: userData.farming_method || '',
        irrigation_type: userData.irrigation_type || '',
        marketing_channel: userData.marketing_channel || '',
        annual_income: userData.annual_income || '',
        crops: userData.crops || [],
        livestock: userData.livestock || [],
        equipment: userData.equipment || [],
        challenges: userData.challenges || [],
      });
    } catch (error) {
      // If user doesn't exist, it might be a new signup
      console.log('No existing profile found, starting fresh:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getCurrentLocation = async () => {
    try {
      setIsGettingLocation(true);

      // Request permission to access location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow location access to automatically detect your village/town name. This helps us provide accurate weather information for your area.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Settings', 
              onPress: () => {
                // On Android, this will open app settings
                if (Platform.OS === 'android') {
                  Location.requestForegroundPermissionsAsync();
                }
              }
            }
          ]
        );
        return;
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // Reverse geocode to get address
      const [address] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address) {
        // Construct location string with village/town and district
        let locationString = '';
        
        if (address.district) {
          locationString = address.district;
        } else if (address.city) {
          locationString = address.city;
        } else if (address.subregion) {
          locationString = address.subregion;
        }
        
        if (address.region && locationString !== address.region) {
          locationString += `, ${address.region}`;
        }

        if (locationString) {
          updateFormData('location', locationString);
          Alert.alert(
            'Location Detected', 
            `Found: ${locationString}\n\nThis will be used for weather information and local agricultural insights.`
          );
        } else {
          Alert.alert(
            'Location Found',
            'Location detected but unable to determine village/town name. Please enter your location manually.'
          );
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please check your GPS settings and try again, or enter your location manually.'
      );
    } finally {
      setIsGettingLocation(false);
    }
  };

  const validateStep = (step: number) => {
    const newErrors: any = {};

    if (step === 0) {
      // Personal Information
      if (!formData.name.trim()) newErrors.name = 'Name is required';
      if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
    }
    // Other steps are optional for better user experience

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleSaveProfile();
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    
    try {
      // Check if user is already authenticated (existing user updating profile)
      const isAuth = await authAPI.isAuthenticated();
      
      if (isAuth) {
        // Existing user - update profile
        const updateData: Partial<SignupRequest> = {
          name: formData.name || undefined,
          email: formData.email || undefined,
          age: formData.age ? parseInt(formData.age) : undefined,
          gender: formData.gender || undefined,
          education_level: formData.education_level || undefined,
          farm_name: formData.farm_name || undefined,
          farm_size: formData.farm_size || undefined,
          location: formData.location || undefined,
          experience: formData.experience ? parseInt(formData.experience) : undefined,
          farm_type: formData.farm_type || undefined,
          farm_ownership: formData.farm_ownership || undefined,
          soil_type: formData.soil_type || undefined,
          climate_zone: formData.climate_zone || undefined,
          primary_crop: formData.primary_crop || undefined,
          farming_method: formData.farming_method || undefined,
          irrigation_type: formData.irrigation_type || undefined,
          marketing_channel: formData.marketing_channel || undefined,
          annual_income: formData.annual_income || undefined,
          crops: formData.crops,
          livestock: formData.livestock,
          equipment: formData.equipment,
          challenges: formData.challenges,
        };

        console.log('Updating existing user profile...');
        console.log('Update data:', updateData);

        const updatedUser = await userAPI.updateProfile(updateData);
        
        console.log('=== PROFILE UPDATE DEBUG ===');
        console.log('Updated user response:', JSON.stringify(updatedUser, null, 2));
        console.log('Profile complete after update:', updatedUser.is_profile_complete);
        console.log('============================');
        
        Alert.alert(
          'Success',
          'Profile updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.replace('./profile')
            }
          ]
        );
      } else {
        // New user signup - create account with profile data
        if (!phone || !otp) {
          Alert.alert('Error', 'Missing phone number or OTP. Please restart the signup process.');
          return;
        }

        const signupData: SignupRequest = {
          phone_number: phone,
          otp_code: otp,
          name: formData.name,
          email: formData.email || undefined,
          age: formData.age ? parseInt(formData.age) : undefined,
          gender: formData.gender || undefined,
          education_level: formData.education_level || undefined,
          farm_name: formData.farm_name || undefined,
          farm_size: formData.farm_size || undefined,
          location: formData.location || undefined,
          experience: formData.experience ? parseInt(formData.experience) : undefined,
          farm_type: formData.farm_type || undefined,
          farm_ownership: formData.farm_ownership || undefined,
          soil_type: formData.soil_type || undefined,
          climate_zone: formData.climate_zone || undefined,
          primary_crop: formData.primary_crop || undefined,
          farming_method: formData.farming_method || undefined,
          irrigation_type: formData.irrigation_type || undefined,
          marketing_channel: formData.marketing_channel || undefined,
          annual_income: formData.annual_income || undefined,
          crops: formData.crops,
          livestock: formData.livestock,
          equipment: formData.equipment,
          challenges: formData.challenges,
        };

        console.log('Creating new user account with data:', signupData);
        const response = await authAPI.signup(signupData);
        console.log('Account created successfully:', response);
        
        Alert.alert(
          'Welcome to AGRI AI!',
          'Your account has been created successfully.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)')
            }
          ]
        );
      }
      
    } catch (error) {
      console.error('Profile save error:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormData = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: undefined }));
    }
  };

  const toggleArrayItem = (field: string, item: string) => {
    const currentArray = formData[field as keyof typeof formData] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter(i => i !== item)
      : [...currentArray, item];
    updateFormData(field, newArray);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderPersonalInfo();
      case 1:
        return renderFarmDetails();
      case 2:
        return renderFarmSpecs();
      case 3:
        return renderResources();
      default:
        return renderPersonalInfo();
    }
  };

  const renderPersonalInfo = () => (
    <>
      <TextInput
        label="Full Name"
        value={formData.name}
        onChangeText={(text) => updateFormData('name', text)}
        mode="outlined"
        style={styles.input}
        error={!!errors.name}
        disabled={isSaving}
        left={<TextInput.Icon icon="account" />}
      />
      <HelperText type="error" visible={!!errors.name}>
        {errors.name}
      </HelperText>
      
      <TextInput
        label="Email Address (Optional)"
        value={formData.email}
        onChangeText={(text) => updateFormData('email', text)}
        mode="outlined"
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        error={!!errors.email}
        disabled={isSaving}
        left={<TextInput.Icon icon="email" />}
      />
      <HelperText type="error" visible={!!errors.email}>
        {errors.email}
      </HelperText>
      
      <TextInput
        label="Age (Optional)"
        value={formData.age}
        onChangeText={(text) => updateFormData('age', text)}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        disabled={isSaving}
        left={<TextInput.Icon icon="calendar" />}
      />
      
      <ThemedText style={styles.sectionLabel}>Gender (Optional)</ThemedText>
      <View style={styles.chipContainer}>
        {genderOptions.map((gender) => (
          <Chip
            key={gender}
            selected={formData.gender === gender}
            onPress={() => updateFormData('gender', gender)}
            style={styles.chip}
            disabled={isSaving}
          >
            {gender}
          </Chip>
        ))}
      </View>
      
      <ThemedText style={styles.sectionLabel}>Education Level (Optional)</ThemedText>
      <View style={styles.chipContainer}>
        {educationLevels.map((level) => (
          <Chip
            key={level}
            selected={formData.education_level === level}
            onPress={() => updateFormData('education_level', level)}
            style={styles.chip}
            disabled={isSaving}
          >
            {level}
          </Chip>
        ))}
      </View>
    </>
  );

  const renderFarmDetails = () => (
    <>
      <TextInput
        label="Farm Name (Optional)"
        value={formData.farm_name}
        onChangeText={(text) => updateFormData('farm_name', text)}
        mode="outlined"
        style={styles.input}
        disabled={isSaving}
        left={<TextInput.Icon icon="barn" />}
      />
      
      <TextInput
        label="Farm Size (acres, Optional)"
        value={formData.farm_size}
        onChangeText={(text) => updateFormData('farm_size', text)}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        disabled={isSaving}
        left={<TextInput.Icon icon="terrain" />}
      />
      
      {/* Location input with automatic detection */}
      <View style={styles.locationContainer}>
        <TextInput
          label="Location (Village/Town)"
          value={formData.location}
          onChangeText={(text) => updateFormData('location', text)}
          mode="outlined"
          style={styles.locationInput}
          disabled={isSaving}
          left={<TextInput.Icon icon="map-marker" />}
          placeholder="e.g., Kumbakonam, Thanjavur, Tamil Nadu"
        />
        <IconButton
          icon="crosshairs-gps"
          size={24}
          mode="contained"
          containerColor="#4CAF50"
          iconColor="#FFFFFF"
          onPress={getCurrentLocation}
          disabled={isSaving || isGettingLocation}
          style={styles.locationButton}
        />
      </View>
      
      <HelperText type="info" style={styles.locationHelper}>
        💡 Tap the GPS button to automatically detect your location. Used for weather info and local insights.
      </HelperText>
      
      <TextInput
        label="Years of Experience (Optional)"
        value={formData.experience}
        onChangeText={(text) => updateFormData('experience', text)}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        disabled={isSaving}
        left={<TextInput.Icon icon="star" />}
      />
      
      <ThemedText style={styles.sectionLabel}>Farm Type (Optional)</ThemedText>
      <View style={styles.chipContainer}>
        {farmTypes.map((type) => (
          <Chip
            key={type}
            selected={formData.farm_type === type}
            onPress={() => updateFormData('farm_type', type)}
            style={styles.chip}
            disabled={isSaving}
          >
            {type}
          </Chip>
        ))}
      </View>
      
      <ThemedText style={styles.sectionLabel}>Farm Ownership (Optional)</ThemedText>
      <View style={styles.chipContainer}>
        {farmOwnership.map((ownership) => (
          <Chip
            key={ownership}
            selected={formData.farm_ownership === ownership}
            onPress={() => updateFormData('farm_ownership', ownership)}
            style={styles.chip}
            disabled={isSaving}
          >
            {ownership}
          </Chip>
        ))}
      </View>
    </>
  );

  const renderFarmSpecs = () => (
    <>
      <ThemedText style={styles.sectionLabel}>Soil Type (Optional)</ThemedText>
      <View style={styles.chipContainer}>
        {soilTypes.map((soil) => (
          <Chip
            key={soil}
            selected={formData.soil_type === soil}
            onPress={() => updateFormData('soil_type', soil)}
            style={styles.chip}
            disabled={isSaving}
          >
            {soil}
          </Chip>
        ))}
      </View>
      
      <ThemedText style={styles.sectionLabel}>Climate Zone (Optional)</ThemedText>
      <View style={styles.chipContainer}>
        {climateZones.map((climate) => (
          <Chip
            key={climate}
            selected={formData.climate_zone === climate}
            onPress={() => updateFormData('climate_zone', climate)}
            style={styles.chip}
            disabled={isSaving}
          >
            {climate}
          </Chip>
        ))}
      </View>
      
      <ThemedText style={styles.sectionLabel}>Primary Crop (Optional)</ThemedText>
      <View style={styles.chipContainer}>
        {cropOptions.map((crop) => (
          <Chip
            key={crop}
            selected={formData.primary_crop === crop}
            onPress={() => updateFormData('primary_crop', crop)}
            style={styles.chip}
            disabled={isSaving}
          >
            {crop}
          </Chip>
        ))}
      </View>
      
      <ThemedText style={styles.sectionLabel}>Farming Method (Optional)</ThemedText>
      <View style={styles.chipContainer}>
        {farmingMethods.map((method) => (
          <Chip
            key={method}
            selected={formData.farming_method === method}
            onPress={() => updateFormData('farming_method', method)}
            style={styles.chip}
            disabled={isSaving}
          >
            {method}
          </Chip>
        ))}
      </View>
      
      <ThemedText style={styles.sectionLabel}>Irrigation Type (Optional)</ThemedText>
      <View style={styles.chipContainer}>
        {irrigationTypes.map((irrigation) => (
          <Chip
            key={irrigation}
            selected={formData.irrigation_type === irrigation}
            onPress={() => updateFormData('irrigation_type', irrigation)}
            style={styles.chip}
            disabled={isSaving}
          >
            {irrigation}
          </Chip>
        ))}
      </View>
      
      <ThemedText style={styles.sectionLabel}>Marketing Channel (Optional)</ThemedText>
      <View style={styles.chipContainer}>
        {marketingChannels.map((channel) => (
          <Chip
            key={channel}
            selected={formData.marketing_channel === channel}
            onPress={() => updateFormData('marketing_channel', channel)}
            style={styles.chip}
            disabled={isSaving}
          >
            {channel}
          </Chip>
        ))}
      </View>
      
      <TextInput
        label="Annual Income (₹, Optional)"
        value={formData.annual_income}
        onChangeText={(text) => updateFormData('annual_income', text)}
        mode="outlined"
        keyboardType="numeric"
        style={styles.input}
        disabled={isSaving}
        left={<TextInput.Icon icon="currency-inr" />}
      />
    </>
  );

  const renderResources = () => (
    <>
      <ThemedText style={styles.sectionLabel}>Crops Grown (Optional)</ThemedText>
      <View style={styles.chipContainer}>
        {cropOptions.map((crop) => (
          <Chip
            key={crop}
            selected={formData.crops.includes(crop)}
            onPress={() => toggleArrayItem('crops', crop)}
            style={styles.chip}
            disabled={isSaving}
          >
            {crop}
          </Chip>
        ))}
      </View>
      
      <ThemedText style={styles.sectionLabel}>Livestock (Optional)</ThemedText>
      <View style={styles.chipContainer}>
        {livestockOptions.map((livestock) => (
          <Chip
            key={livestock}
            selected={formData.livestock.includes(livestock)}
            onPress={() => toggleArrayItem('livestock', livestock)}
            style={styles.chip}
            disabled={isSaving}
          >
            {livestock}
          </Chip>
        ))}
      </View>
      
      <ThemedText style={styles.sectionLabel}>Equipment Available (Optional)</ThemedText>
      <View style={styles.chipContainer}>
        {equipmentOptions.map((equipment) => (
          <Chip
            key={equipment}
            selected={formData.equipment.includes(equipment)}
            onPress={() => toggleArrayItem('equipment', equipment)}
            style={styles.chip}
            disabled={isSaving}
          >
            {equipment}
          </Chip>
        ))}
      </View>
      
      <ThemedText style={styles.sectionLabel}>Current Challenges (Optional)</ThemedText>
      <View style={styles.chipContainer}>
        {challengeOptions.map((challenge) => (
          <Chip
            key={challenge}
            selected={formData.challenges.includes(challenge)}
            onPress={() => toggleArrayItem('challenges', challenge)}
            style={styles.chip}
            disabled={isSaving}
          >
            {challenge}
          </Chip>
        ))}
      </View>
    </>
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        
        {/* Header with Gradient Background */}
        <LinearGradient
          colors={['#4CAF50', '#66BB6A', '#81C784']}
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
              <Text style={styles.pageText}>🌾 Profile Setup</Text>
            </View>
            
            <View style={styles.placeholder} />
          </View>
          
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeText}>Loading...</Text>
            <Text style={styles.welcomeSubtext}>Setting up your profile ⚙️</Text>
          </View>
        </LinearGradient>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#4CAF50', '#66BB6A', '#81C784']}
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
            <Text style={styles.pageText}>🌾 Profile Setup</Text>
          </View>
          
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Complete Profile</Text>
          <Text style={styles.welcomeSubtext}>Step {currentStep + 1} of {steps.length}: {steps[currentStep]} 📝</Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                index <= currentStep ? styles.progressDotActive : styles.progressDotInactive
              ]}
            />
          ))}
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card} elevation={4}>
            <Card.Content style={styles.cardContent}>
              {/* Step Content */}
              {renderStep()}
              
              {/* Navigation Buttons */}
              <View style={styles.navigationButtons}>
                {currentStep > 0 && (
                  <Button
                    mode="outlined"
                    onPress={handleBack}
                    style={styles.backButtonNav}
                    disabled={isSaving}
                    icon="arrow-left"
                    buttonColor="#FFFFFF"
                    textColor="#4CAF50"
                  >
                    Back
                  </Button>
                )}
                
                <Button
                  mode="contained"
                  onPress={handleNext}
                  style={styles.nextButton}
                  loading={isSaving}
                  disabled={isSaving}
                  icon={currentStep === steps.length - 1 ? "check" : "arrow-right"}
                  buttonColor="#4CAF50"
                >
                  {isSaving ? 'Saving...' : currentStep === steps.length - 1 ? 'Save Profile' : 'Next'}
                </Button>
              </View>
              
              <View style={styles.skipContainer}>
                <Button
                  mode="text"
                  onPress={() => router.replace('/profile')}
                  disabled={isSaving}
                  textColor="#666"
                >
                  Skip for now
                </Button>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E8',
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
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotActive: {
    backgroundColor: '#FFFFFF',
  },
  progressDotInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '600',
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
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  cardContent: {
    padding: 20,
  },
  input: {
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
    gap: 8,
  },
  locationInput: {
    flex: 1,
  },
  locationButton: {
    marginTop: 8,
  },
  locationHelper: {
    marginBottom: 8,
    fontSize: 12,
    color: '#4CAF50',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#2E7D32',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 16,
  },
  backButtonNav: {
    flex: 1,
    paddingVertical: 8,
    borderColor: '#4CAF50',
  },
  nextButton: {
    flex: 2,
    paddingVertical: 8,
  },
  skipContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
});
