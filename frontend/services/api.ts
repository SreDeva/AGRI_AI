import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_BASE_URL = 'http://10.0.2.2:8000/api/v1'; // Use Android emulator IP

// Safe AsyncStorage wrapper with fallback
const safeAsyncStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.warn('AsyncStorage getItem failed:', error);
      return null;
    }
  },
  
  async setItem(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.warn('AsyncStorage setItem failed:', error);
    }
  },
  
  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.warn('AsyncStorage removeItem failed:', error);
    }
  }
};

// Types for API requests and responses
export interface SendOTPRequest {
  phone_number: string;
}

export interface VerifyOTPRequest {
  phone_number: string;
  otp_code: string;
}

export interface SignupRequest {
  phone_number: string;
  otp_code: string;
  name: string;
  email?: string;
  age?: number;
  gender?: string;
  education_level?: string;
  farm_name?: string;
  farm_size?: string;
  location?: string;
  experience?: number;
  farm_type?: string;
  farm_ownership?: string;
  soil_type?: string;
  climate_zone?: string;
  primary_crop?: string;
  farming_method?: string;
  irrigation_type?: string;
  marketing_channel?: string;
  annual_income?: string;
  crops?: string[];
  livestock?: string[];
  equipment?: string[];
  challenges?: string[];
}

export interface LoginRequest {
  phone_number: string;
  otp_code: string;
}

// Plant diagnosis types
export interface PlantDiagnosisRequest {
  image: File | Blob;
  crop_type?: string;
  symptoms?: string;
  location?: string;
}

export interface PlantDiagnosisResponse {
  success: boolean;
  primary_diagnosis: string;
  confidence: string;
  crop_type?: string;
  condition?: string;
  is_healthy: boolean;
  similar_cases: Array<{
    crop: string;
    condition: string;
    similarity: string;
  }>;
  recommendations: string[];
  preventive_measures: string[];
  fertilizer_advice: string;
  urgency: string;
  llm_analysis: string;
  processing_info: Record<string, any>;
}

export interface DiagnosisHistoryItem {
  id: string;
  crop_type: string;
  condition: string;
  is_healthy: boolean;
  date: string;
  urgency: string;
  image_url?: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    phone_number: string;
    name?: string;
    email?: string;
    age?: number;
    gender?: string;
    education_level?: string;
    farm_name?: string;
    farm_size?: string;
    location?: string;
    experience?: number;
    farm_type?: string;
    farm_ownership?: string;
    soil_type?: string;
    climate_zone?: string;
    primary_crop?: string;
    farming_method?: string;
    irrigation_type?: string;
    marketing_channel?: string;
    annual_income?: string;
    crops?: string[];
    livestock?: string[];
    equipment?: string[];
    challenges?: string[];
    is_phone_verified?: boolean;
    is_profile_complete?: boolean;
    role?: string;
  };
}

export interface MessageResponse {
  message: string;
  success: boolean;
}

// API Helper function
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const token = await safeAsyncStorage.getItem('access_token');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Authentication API functions
export const authAPI = {
  // Send OTP to phone number
  sendOTP: async (phoneNumber: string): Promise<MessageResponse> => {
    return apiRequest('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
  },

  // Verify OTP
  verifyOTP: async (phoneNumber: string, otpCode: string): Promise<MessageResponse> => {
    return apiRequest('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phoneNumber,
        otp_code: otpCode,
      }),
    });
  },

  // User signup
  signup: async (userData: SignupRequest): Promise<AuthResponse> => {
    const response = await apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    // Store token in AsyncStorage
    if (response.access_token) {
      await safeAsyncStorage.setItem('access_token', response.access_token);
      await safeAsyncStorage.setItem('user_data', JSON.stringify(response.user));
    }
    
    return response;
  },

  // User login
  login: async (loginData: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
    
    // Store token in AsyncStorage
    if (response.access_token) {
      await safeAsyncStorage.setItem('access_token', response.access_token);
      await safeAsyncStorage.setItem('user_data', JSON.stringify(response.user));
    }
    
    return response;
  },

  // Get current user info
  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    return apiRequest('/auth/me');
  },

  // Logout
  logout: async (): Promise<void> => {
    await safeAsyncStorage.removeItem('access_token');
    await safeAsyncStorage.removeItem('user_data');
  },
};

// User API functions
export const userAPI = {
  // Update user profile
  updateProfile: async (profileData: Partial<SignupRequest>): Promise<AuthResponse['user']> => {
    return apiRequest('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Get user profile
  getProfile: async (): Promise<AuthResponse['user']> => {
    return apiRequest('/users/profile');
  },
};

// AI API functions
export const aiAPI = {
  // Plant disease diagnosis
  diagnosePlant: async (formData: FormData): Promise<PlantDiagnosisResponse> => {
    // Get the correct token from AsyncStorage
    const token = await safeAsyncStorage.getItem('access_token');
    
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }
    
    const response = await fetch(`${API_BASE_URL}/ai/diagnose`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type header - let browser set it for FormData
      },
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Authentication failed. Please log in again.');
      }
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return response.json();
  },

  // Get diagnosis history (simulated for now - can be stored locally or on server)
  getDiagnosisHistory: async (): Promise<DiagnosisHistoryItem[]> => {
    try {
      const history = await safeAsyncStorage.getItem('diagnosisHistory');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.warn('Failed to get diagnosis history:', error);
      return [];
    }
  },

  // Save diagnosis to history
  saveDiagnosisToHistory: async (diagnosis: PlantDiagnosisResponse, imageUri?: string): Promise<void> => {
    try {
      const historyItem: DiagnosisHistoryItem = {
        id: Date.now().toString(),
        crop_type: diagnosis.crop_type || 'Unknown',
        condition: diagnosis.condition || diagnosis.primary_diagnosis,
        is_healthy: diagnosis.is_healthy,
        date: new Date().toISOString(),
        urgency: diagnosis.urgency,
        image_url: imageUri,
      };

      const existingHistory = await aiAPI.getDiagnosisHistory();
      const updatedHistory = [historyItem, ...existingHistory.slice(0, 49)]; // Keep last 50 items
      
      await safeAsyncStorage.setItem('diagnosisHistory', JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('Failed to save diagnosis to history:', error);
    }
  },

  // Clear diagnosis history
  clearDiagnosisHistory: async (): Promise<void> => {
    try {
      await safeAsyncStorage.removeItem('diagnosisHistory');
    } catch (error) {
      console.warn('Failed to clear diagnosis history:', error);
    }
  },
};

// Utility functions
export const formatPhoneNumber = (phone: string): string => {
  // Remove spaces and special characters
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');
  
  // Add country code if not present
  if (!cleaned.startsWith('+')) {
    // Assuming Indian numbers, add +91
    if (cleaned.length === 10) {
      cleaned = '+91' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
};

export default { authAPI, userAPI, aiAPI };
