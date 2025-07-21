// services/authService.ts

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export interface LoginResponse {
  success: boolean;
  message: string;
  user_exists: boolean;
  redirect_to: string;
  access_token?: string;
  user_id?: string;
  user_role?: string;
}

export interface RoleSelectionResponse {
  success: boolean;
  message: string;
  redirect_to: string;
  access_token?: string;
  user_role?: string;
}

export interface OnboardingResponse {
  success: boolean;
  message: string;
  farmer_id?: string;
  access_token?: string;
  redirect_to: string;
}

export interface FarmerOnboardingData {
  name: string;
  age: number;
  location: string;
  farm_size: number;
  crops: string[];
  experience_years: number;
  education_level: string;
  annual_income?: number;
  has_irrigation: boolean;
  farming_type: string;
}

class AuthService {
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    try {
      // console.log('🌐 Making request to:', `${API_BASE_URL}${endpoint}`); // Enable for debugging
      // console.log('📤 Request options:', options); // Enable for debugging

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        // Try to get error details from response body
        let errorDetails = `HTTP error! status: ${response.status}`;
        try {
          const errorBody = await response.json();
          errorDetails += ` - ${JSON.stringify(errorBody)}`;
        } catch {
          // If response body is not JSON, try to get text
          try {
            const errorText = await response.text();
            errorDetails += ` - ${errorText}`;
          } catch {
            // If all else fails, just use the status
          }
        }
        throw new Error(errorDetails);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  async login(phoneNumber: string): Promise<LoginResponse> {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phoneNumber }),
    });
  }

  async selectRole(roleId: string, token: string): Promise<RoleSelectionResponse> {
    const requestData = { role: roleId };
    // console.log('🔄 selectRole - sending data:', requestData); // Enable for debugging

    return this.makeRequest('/auth/select-role', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestData),
    });
  }

  async onboardFarmer(data: FarmerOnboardingData, token: string): Promise<OnboardingResponse> {
    console.log('🚀 onboardFarmer called with data:', data);
    console.log('🚀 onboardFarmer token:', token ? 'Present' : 'Missing');

    const result = await this.makeRequest('/auth/onboard', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    console.log('🚀 onboardFarmer result:', result);
    return result;
  }

  async getUserProfile(token: string): Promise<any> {
    return this.makeRequest('/auth/profile', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  }

  // Storage methods using AsyncStorage
  async setItem(key: string, value: string): Promise<void> {
    try {
      // For web, use localStorage; for mobile, this would use AsyncStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      } else {
        // Fallback to in-memory storage for non-web environments
        if (!this.memoryStorage) {
          this.memoryStorage = {};
        }
        this.memoryStorage[key] = value;
      }
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
    }
  }

  async getItem(key: string): Promise<string | null> {
    try {
      // For web, use localStorage; for mobile, this would use AsyncStorage
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      } else {
        // Fallback to in-memory storage for non-web environments
        return this.memoryStorage?.[key] || null;
      }
    } catch (error) {
      console.error(`Error retrieving ${key}:`, error);
      return null;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      } else {
        if (this.memoryStorage) {
          delete this.memoryStorage[key];
        }
      }
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
    }
  }

  async clearAll(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        // Clear only our app's keys
        const keysToRemove = ['user_id', 'phone_number', 'access_token', 'user_role', 'farmer_id'];
        keysToRemove.forEach(key => window.localStorage.removeItem(key));
      } else {
        this.memoryStorage = {};
      }
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  private memoryStorage: { [key: string]: string } = {};

  // Auth helper methods
  async saveUserData(data: {
    user_id?: string;
    phone_number?: string;
    access_token?: string;
    user_role?: string;
    farmer_id?: string;
  }): Promise<void> {
    console.log('💾 Saving user data:', data);
    const promises = [];

    if (data.user_id) promises.push(this.setItem('user_id', data.user_id));
    if (data.phone_number) promises.push(this.setItem('phone_number', data.phone_number));
    if (data.access_token) promises.push(this.setItem('access_token', data.access_token));
    if (data.user_role) promises.push(this.setItem('user_role', data.user_role));
    if (data.farmer_id) promises.push(this.setItem('farmer_id', data.farmer_id));

    await Promise.all(promises);
    console.log('✅ User data saved successfully');
  }

  async getUserData(): Promise<{
    user_id: string | null;
    phone_number: string | null;
    access_token: string | null;
    user_role: string | null;
    farmer_id: string | null;
  }> {
    const [user_id, phone_number, access_token, user_role, farmer_id] = await Promise.all([
      this.getItem('user_id'),
      this.getItem('phone_number'),
      this.getItem('access_token'),
      this.getItem('user_role'),
      this.getItem('farmer_id'),
    ]);

    const userData = { user_id, phone_number, access_token, user_role, farmer_id };
    // console.log('📖 Retrieved user data:', userData); // Enable for debugging
    return userData;
  }

  async isAuthenticated(): Promise<boolean> {
    const { access_token, user_id } = await this.getUserData();
    return !!(access_token && user_id);
  }

  async logout(): Promise<void> {
    await this.clearAll();
  }
}

export const authService = new AuthService();
