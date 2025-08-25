import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeatherApiResponse, LocationCoordinates } from './weatherService';

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  location: LocationCoordinates;
}

export interface WeatherCacheKey {
  latitude: number;
  longitude: number;
  cropType?: string;
}

class CacheService {
  private readonly CACHE_PREFIX = 'weather_cache_';
  private readonly DEFAULT_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds
  private readonly LOCATION_THRESHOLD = 0.01; // ~1km radius for location matching

  /**
   * Generate a cache key based on location and optional parameters
   */
  private generateCacheKey(key: WeatherCacheKey): string {
    const roundedLat = Math.round(key.latitude * 100) / 100; // Round to 2 decimal places
    const roundedLon = Math.round(key.longitude * 100) / 100;
    const cropType = key.cropType || 'default';
    return `${this.CACHE_PREFIX}${roundedLat}_${roundedLon}_${cropType}`;
  }

  /**
   * Check if two locations are within the threshold distance
   */
  private isLocationMatch(loc1: LocationCoordinates, loc2: LocationCoordinates): boolean {
    const latDiff = Math.abs(loc1.latitude - loc2.latitude);
    const lonDiff = Math.abs(loc1.longitude - loc2.longitude);
    return latDiff <= this.LOCATION_THRESHOLD && lonDiff <= this.LOCATION_THRESHOLD;
  }

  /**
   * Store weather data in cache
   */
  async setWeatherData(
    key: WeatherCacheKey,
    data: WeatherApiResponse,
    ttl: number = this.DEFAULT_TTL
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(key);
      const cacheEntry: CacheEntry<WeatherApiResponse> = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + ttl,
        location: {
          latitude: key.latitude,
          longitude: key.longitude,
        },
      };

      await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
      console.log(`Weather data cached for location: ${key.latitude}, ${key.longitude}`);
    } catch (error) {
      console.error('Error storing weather data in cache:', error);
    }
  }

  /**
   * Get weather data from cache
   */
  async getWeatherData(key: WeatherCacheKey): Promise<WeatherApiResponse | null> {
    try {
      const cacheKey = this.generateCacheKey(key);
      const cachedData = await AsyncStorage.getItem(cacheKey);

      if (!cachedData) {
        console.log('No cached data found for location');
        return null;
      }

      const cacheEntry: CacheEntry<WeatherApiResponse> = JSON.parse(cachedData);

      // Check if cache has expired
      if (Date.now() > cacheEntry.expiry) {
        console.log('Cached data expired, removing from cache');
        await this.removeWeatherData(key);
        return null;
      }

      // Verify location match (in case of rounded coordinates)
      if (!this.isLocationMatch(cacheEntry.location, { latitude: key.latitude, longitude: key.longitude })) {
        console.log('Location mismatch in cached data');
        return null;
      }

      console.log(`Retrieved cached weather data for location: ${key.latitude}, ${key.longitude}`);
      return cacheEntry.data;
    } catch (error) {
      console.error('Error retrieving weather data from cache:', error);
      return null;
    }
  }

  /**
   * Remove weather data from cache
   */
  async removeWeatherData(key: WeatherCacheKey): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(key);
      await AsyncStorage.removeItem(cacheKey);
      console.log(`Removed cached data for location: ${key.latitude}, ${key.longitude}`);
    } catch (error) {
      console.error('Error removing weather data from cache:', error);
    }
  }

  /**
   * Check if weather data exists and is valid in cache
   */
  async hasValidWeatherData(key: WeatherCacheKey): Promise<boolean> {
    const data = await this.getWeatherData(key);
    return data !== null;
  }

  /**
   * Clear all weather cache data
   */
  async clearAllWeatherCache(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const weatherCacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      if (weatherCacheKeys.length > 0) {
        await AsyncStorage.multiRemove(weatherCacheKeys);
        console.log(`Cleared ${weatherCacheKeys.length} cached weather entries`);
      }
    } catch (error) {
      console.error('Error clearing weather cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    validEntries: number;
    expiredEntries: number;
  }> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const weatherCacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      let validEntries = 0;
      let expiredEntries = 0;

      for (const key of weatherCacheKeys) {
        try {
          const cachedData = await AsyncStorage.getItem(key);
          if (cachedData) {
            const cacheEntry: CacheEntry<WeatherApiResponse> = JSON.parse(cachedData);
            if (Date.now() <= cacheEntry.expiry) {
              validEntries++;
            } else {
              expiredEntries++;
            }
          }
        } catch (error) {
          expiredEntries++; // Count parsing errors as expired
        }
      }

      return {
        totalEntries: weatherCacheKeys.length,
        validEntries,
        expiredEntries,
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { totalEntries: 0, validEntries: 0, expiredEntries: 0 };
    }
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredEntries(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const weatherCacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      const expiredKeys: string[] = [];

      for (const key of weatherCacheKeys) {
        try {
          const cachedData = await AsyncStorage.getItem(key);
          if (cachedData) {
            const cacheEntry: CacheEntry<WeatherApiResponse> = JSON.parse(cachedData);
            if (Date.now() > cacheEntry.expiry) {
              expiredKeys.push(key);
            }
          } else {
            expiredKeys.push(key); // Remove keys with no data
          }
        } catch (error) {
          expiredKeys.push(key); // Remove keys with parsing errors
        }
      }

      if (expiredKeys.length > 0) {
        await AsyncStorage.multiRemove(expiredKeys);
        console.log(`Cleaned ${expiredKeys.length} expired cache entries`);
      }

      return expiredKeys.length;
    } catch (error) {
      console.error('Error cleaning expired cache entries:', error);
      return 0;
    }
  }
}

export const cacheService = new CacheService();
export default cacheService;
