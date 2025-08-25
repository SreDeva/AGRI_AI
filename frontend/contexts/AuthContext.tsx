import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
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
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = '@agri_ai_token';
const USER_KEY = '@agri_ai_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      setIsLoading(true);

      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        const userData = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(userData);
        setIsAuthenticated(true);
        console.log('✅ Auth restored:', userData.name || userData.phone_number);
        await verifyTokenWithBackend(storedToken);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('💥 Auth load error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const verifyTokenWithBackend = async (authToken: string) => {
    try {
      const response = await fetch('http://10.0.2.2:8000/api/v1/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
        console.log('✅ Token verified');
      } else {
        console.log('❌ Token expired, logging out');
        await logout();
      }
    } catch (error) {
      console.warn('⚠️ Offline mode, using cached data');
    }
  };

  const login = async (authToken: string, userData: User) => {
    try {
      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);

      await AsyncStorage.setItem(TOKEN_KEY, authToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      console.log('✅ Login successful:', userData.name || userData.phone_number);
    } catch (error) {
      console.error('💥 Login error:', error);
    }
  };

  const logout = async () => {
    try {
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
      await clearStoredAuth();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('💥 Logout error:', error);
    }
  };

  const updateUser = async (userData: User) => {
    try {
      setUser(userData);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      console.log('✅ User updated');
    } catch (error) {
      console.error('💥 User update error:', error);
    }
  };

  const clearStoredAuth = async () => {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  };

  const checkAuthStatus = async () => {
    await loadStoredAuth();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
