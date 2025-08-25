import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { authAPI, formatPhoneNumber } from '@/services/api_dev';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ phone?: string }>({});
  const router = useRouter();

  const validatePhone = (phone: string) => {
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');
    return cleaned.length >= 10;
  };

  const handleSendOTP = async () => {
    setErrors({});
    
    if (!phoneNumber.trim()) {
      setErrors({ phone: 'Phone number is required' });
      return;
    }

    if (!validatePhone(phoneNumber)) {
      setErrors({ phone: 'Please enter a valid phone number' });
      return;
    }

    setIsLoading(true);
    
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      await authAPI.sendOTP(formattedPhone);
      
      Alert.alert(
        'OTP Sent',
        'Please check your phone for the verification code.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to OTP verification page
              router.push({
                pathname: '/auth/verify-otp',
                params: { phone: formattedPhone, isLogin: 'false' }
              });
            }
          }
        ]
      );
      
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
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
            <Text style={styles.pageText}>🌾 AGRI AI</Text>
          </View>
          
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Join AGRI AI</Text>
          <Text style={styles.welcomeSubtext}>Create your account to start smart farming 🌱</Text>
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
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                mode="outlined"
                placeholder="+91 9876543210"
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
              
              <View style={styles.loginContainer}>
                <ThemedText style={styles.loginText}>
                  Already have an account?
                </ThemedText>
                <Button
                  mode="text"
                  onPress={() => router.push('/auth/login')}
                  disabled={isLoading}
                  textColor="#4CAF50"
                >
                  Sign In
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
    paddingVertical: 8,
    marginTop: 16,
  },
  divider: {
    marginVertical: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  loginText: {
    marginRight: 8,
    color: '#666',
  },
});

