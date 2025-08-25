import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, StatusBar, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  Divider,
  HelperText,
  Text,
} from 'react-native-paper';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { authAPI, SignupRequest } from '@/services/api_dev';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyOTPScreen() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [errors, setErrors] = useState<{ otp?: string }>({});
  const router = useRouter();
  const { phone, isLogin } = useLocalSearchParams<{ phone: string; isLogin?: string }>();
  const { login: authLogin } = useAuth();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateOTP = (otpCode: string) => {
    return /^\d{6}$/.test(otpCode);
  };

  const handleVerifyOTP = async () => {
    setErrors({});
    
    if (!otp.trim()) {
      setErrors({ otp: 'OTP is required' });
      return;
    }

    if (!validateOTP(otp)) {
      setErrors({ otp: 'Please enter a valid 6-digit OTP' });
      return;
    }

    setIsLoading(true);
    
    try {
      if (!phone) {
        throw new Error('Phone number is required');
      }

      if (isLogin === 'true') {
        // For login, attempt to login with OTP
        const response = await authAPI.login({
          phone_number: phone,
          otp_code: otp,
        });
        
        console.log('=== LOGIN DEBUG ===');
        console.log('Full login response:', JSON.stringify(response, null, 2));
        console.log('User object:', JSON.stringify(response.user, null, 2));
        console.log('Profile complete status:', response.user.is_profile_complete);
        console.log('User name:', response.user.name);
        console.log('User location:', response.user.location);
        console.log('User farm_type:', response.user.farm_type);
        console.log('==================');
        
        // Store authentication in context
        await authLogin(response.access_token, response.user);
        
        // Check if user's profile is complete
        if (response.user.is_profile_complete) {
          Alert.alert(
            'Login Successful',
            'Welcome back!',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/profile')
              }
            ]
          );
        } else {
          Alert.alert(
            'Profile Incomplete',
            'Please complete your profile to continue.',
            [
              {
                text: 'Complete Profile',
                onPress: () => router.replace('/profile/setup')
              }
            ]
          );
        }
      } else {
        // For signup, verify OTP and create user account
        console.log('Verifying OTP for signup...');
        await authAPI.verifyOTP(phone, otp);
        
        console.log('Creating user account...');
        // Create user account with minimal required data (just phone and OTP)
        // User will complete profile in the next step
        const signupData: SignupRequest = {
          phone_number: phone,
          otp_code: otp,
          name: 'User', // Temporary name, will be updated in profile setup
        };
        
        const response = await authAPI.signup(signupData);
        
        console.log('User account created:', response);
        
        // Store authentication in context
        await authLogin(response.access_token, response.user);
        
        Alert.alert(
          'Account Created',
          'Your account has been created successfully! Please complete your profile.',
          [
            {
              text: 'Complete Profile',
              onPress: () => router.push({
                pathname: '/profile/setup',
                params: { phone: phone, otp: otp }
              })
            }
          ]
        );
      }
      
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setIsResending(true);
    setCountdown(60);
    
    try {
      if (!phone) {
        throw new Error('Phone number is required');
      }
      
      await authAPI.sendOTP(phone);
      Alert.alert('Success', 'OTP sent successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to resend OTP. Please try again.');
    } finally {
      setIsResending(false);
    }
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
            <Text style={styles.pageText}>🔐 Verify OTP</Text>
          </View>
          
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Verify Phone</Text>
          <Text style={styles.welcomeSubtext}>Enter the 6-digit code sent to {phone} 📱</Text>
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
                label="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                mode="outlined"
                placeholder="123456"
                keyboardType="numeric"
                maxLength={6}
                style={styles.input}
                error={!!errors.otp}
                disabled={isLoading}
                left={<TextInput.Icon icon="lock" />}
              />
              <HelperText type="error" visible={!!errors.otp}>
                {errors.otp}
              </HelperText>
              
              <Button
                mode="contained"
                onPress={handleVerifyOTP}
                style={styles.button}
                loading={isLoading}
                disabled={isLoading}
                icon="check"
                buttonColor="#4CAF50"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </Button>
              
              <Divider style={styles.divider} />
              
              <View style={styles.resendContainer}>
                {countdown > 0 ? (
                  <ThemedText style={styles.countdownText}>
                    Resend OTP in {countdown}s
                  </ThemedText>
                ) : (
                  <Button
                    mode="text"
                    onPress={handleResendOTP}
                    disabled={isResending}
                    loading={isResending}
                    textColor="#4CAF50"
                  >
                    Resend OTP
                  </Button>
                )}
              </View>
              
              <Button
                mode="text"
                onPress={() => router.back()}
                disabled={isLoading}
                style={styles.backButtonNav}
                textColor="#666"
              >
                Back to Login
              </Button>
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
    paddingHorizontal: 20,
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
    textAlign: 'center',
  },
  button: {
    marginTop: 16,
    paddingVertical: 8,
  },
  divider: {
    marginVertical: 16,
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  countdownText: {
    opacity: 0.7,
    color: '#666',
  },
  backButtonNav: {
    marginTop: 8,
  },
});
