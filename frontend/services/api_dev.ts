// Global storage that persists across hot reloads
declare global {
  var __AGRI_AI_STORAGE__: Map<string, string> | undefined;
}

if (!global.__AGRI_AI_STORAGE__) {
  global.__AGRI_AI_STORAGE__ = new Map<string, string>();
}

// Fallback storage for development when AsyncStorage fails
class FallbackStorage {
  private get storage(): Map<string, string> {
    return global.__AGRI_AI_STORAGE__!;
  }

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null;
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
    console.log(`📦 Fallback storage SET: ${key} = ${value.substring(0, 50)}...`);
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key);
    console.log(`🗑️ Fallback storage REMOVE: ${key}`);
  }
}

// Try to use AsyncStorage, fallback to in-memory storage if it fails
let storage: any;

try {
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  storage = {
    async getItem(key: string): Promise<string | null> {
      try {
        return await AsyncStorage.getItem(key);
      } catch (error) {
        console.warn('AsyncStorage getItem failed, using fallback');
        return fallbackStorage.getItem(key);
      }
    },

    async setItem(key: string, value: string): Promise<void> {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        console.warn('AsyncStorage setItem failed, using fallback');
        await fallbackStorage.setItem(key, value);
      }
    },

    async removeItem(key: string): Promise<void> {
      try {
        await AsyncStorage.removeItem(key);
      } catch (error) {
        console.warn('AsyncStorage removeItem failed, using fallback');
        await fallbackStorage.removeItem(key);
      }
    }
  };
} catch (error) {
  console.warn('AsyncStorage not available, using fallback storage');
  storage = new FallbackStorage();
}

const fallbackStorage = new FallbackStorage();

// API Configuration
const API_BASE_URL = 'http://10.0.2.2:8000/api/v1'; // Use Android emulator IP

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
  const token = await storage.getItem('access_token');
  console.log(`Making request to ${endpoint}, token: ${token ? token.substring(0, 20) + '...' : 'none'}`);
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    // For development, log errors and provide helpful messages
    console.error('API Request failed:', error);
    if (error instanceof Error && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Make sure the backend is running.');
    }
    throw error;
  }
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
    
    // Store token in storage
    if (response.access_token) {
      console.log(`Storing token: ${response.access_token.substring(0, 20)}...`);
      await storage.setItem('access_token', response.access_token);
      await storage.setItem('user_data', JSON.stringify(response.user));
      
      // Verify token was stored
      const storedToken = await storage.getItem('access_token');
      console.log(`Token verification - stored: ${storedToken ? storedToken.substring(0, 20) + '...' : 'none'}`);
    }
    
    return response;
  },

  // User login
  login: async (loginData: LoginRequest): Promise<AuthResponse> => {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(loginData),
    });
    
    // Store token in storage
    if (response.access_token) {
      await storage.setItem('access_token', response.access_token);
      await storage.setItem('user_data', JSON.stringify(response.user));
    }
    
    return response;
  },

  // Get current user info
  getCurrentUser: async (): Promise<AuthResponse['user']> => {
    const token = await storage.getItem('access_token');
    console.log(`getCurrentUser called, token available: ${!!token}`);
    return apiRequest('/auth/me');
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    const token = await storage.getItem('access_token');
    return !!token;
  },

  // Get stored token for debugging
  getStoredToken: async (): Promise<string | null> => {
    return storage.getItem('access_token');
  },

  // Logout
  logout: async (): Promise<void> => {
    await storage.removeItem('access_token');
    await storage.removeItem('user_data');
  },
};

// User API functions
export const userAPI = {
  // Update user profile
  updateProfile: async (profileData: Partial<SignupRequest>): Promise<AuthResponse['user']> => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },

  // Get user profile
  getProfile: async (): Promise<AuthResponse['user']> => {
    return apiRequest('/users/profile');
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

export default { authAPI, userAPI };
