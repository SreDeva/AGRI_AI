import React, { useState } from 'react';
import { StyleSheet, View, Alert, KeyboardAvoidingView, Platform, StatusBar, TouchableOpacity, ScrollView } from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Divider,
  HelperText,
  ActivityIndicator,
  Text,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { authAPI, formatPhoneNumber } from '@/services/api_dev';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string }>({});
  const router = useRouter();

  const validatePhone = (phoneNumber: string) => {
    // Basic phone validation - can be enhanced
    const phoneRegex = /^[+]?[1-9][\d]{9,14}$/;
    return phoneRegex.test(phoneNumber.replace(/\s/g, ''));
  };

  const handleSendOTP = async () => {
    setErrors({});
    
    if (!phone.trim()) {
      setErrors({ phone: 'Phone number is required' });
      return;
    }

    if (!validatePhone(phone)) {
      setErrors({ phone: 'Please enter a valid phone number' });
      return;
    }

    setIsLoading(true);
    
    try {
      // Format and send OTP
      const formattedPhone = formatPhoneNumber(phone);
      await authAPI.sendOTP(formattedPhone);
      
      Alert.alert(
        'OTP Sent',
        'We have sent a verification code to your phone number.',
        [
          {
            text: 'OK',
            onPress: () => router.push({
              pathname: './verify-otp',
              params: { phone: formattedPhone, isLogin: 'true' }
            })
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToSignup = () => {
    router.push('./signup');
  };

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
            <Text style={styles.pageText}>🌾 AGRI AI</Text>
          </View>
          
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.welcomeSubtext}>Sign in to continue your farming journey 🚜</Text>
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
              <TextInput
                label="Phone Number"
                value={phone}
                onChangeText={setPhone}
                mode="outlined"
                placeholder="+1234567890"
                keyboardType="phone-pad"
                style={styles.input}
                error={!!errors.phone}
                disabled={isLoading}
                left={<TextInput.Icon icon="phone" />}
              />
              <HelperText type="error" visible={!!errors.phone}>
                {errors.phone}
              </HelperText>
              
              <Button
                mode="contained"
                onPress={handleSendOTP}
                style={styles.button}
                loading={isLoading}
                disabled={isLoading}
                icon="send"
                buttonColor="#4CAF50"
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </Button>
              
              <Divider style={styles.divider} />
              
              <View style={styles.signupContainer}>
                <ThemedText style={styles.signupText}>
                  Don't have an account?
                </ThemedText>
                <Button
                  mode="text"
                  onPress={navigateToSignup}
                  disabled={isLoading}
                  textColor="#4CAF50"
                >
                  Sign Up
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 20,
    flexGrow: 1,
    justifyContent: 'center',
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
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 16,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  signupText: {
    marginRight: 8,
    color: '#666',
  },
});
