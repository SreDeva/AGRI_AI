// Cache Testing Utilities for Weather App
import { cacheService } from '../services/cacheService';
import { weatherService } from '../services/weatherService';

/**
 * Test cache functionality
 */
export class CacheTester {
  static async testCacheOperations() {
    console.log('=== Cache Testing Started ===');
    
    const testLocation = {
      latitude: 13.0827,
      longitude: 80.2707,
    };
    
    try {
      // 1. Test cache stats (should be empty initially)
      let stats = await cacheService.getCacheStats();
      console.log('Initial cache stats:', stats);
      
      // 2. Test storing weather data
      console.log('Testing cache storage...');
      const mockWeatherData = {
        location: testLocation,
        date_range: {
          start: '2025-08-06',
          end: '2025-08-06',
        },
        open_meteo: { current: { temperature_2m: 28.5 } },
        nasa_power: { temperature: 29.0 },
        farming_tips: [
          {
            type: 'info' as const,
            icon: 'sunny',
            message: 'Test farming tip for cache validation',
            color: '#8BC34A',
            source: 'ai' as const,
            priority: 1,
          }
        ],
        weather_summary: 'Test weather summary for cache validation'
      };
      
      await cacheService.setWeatherData(
        { 
          latitude: testLocation.latitude, 
          longitude: testLocation.longitude, 
          cropType: 'rice' 
        },
        mockWeatherData
      );
      
      // 3. Test cache retrieval
      console.log('Testing cache retrieval...');
      const cachedData = await cacheService.getWeatherData({
        latitude: testLocation.latitude,
        longitude: testLocation.longitude,
        cropType: 'rice'
      });
      
      if (cachedData) {
        console.log('✅ Cache retrieval successful');
        console.log('Cached farming tips count:', cachedData.farming_tips?.length || 0);
      } else {
        console.log('❌ Cache retrieval failed');
      }
      
      // 4. Test cache stats after storing data
      stats = await cacheService.getCacheStats();
      console.log('Cache stats after storing data:', stats);
      
      // 5. Test weather service cache integration
      console.log('Testing WeatherService cache integration...');
      const hasCached = await weatherService.hasCachedWeatherData(testLocation, 'rice');
      console.log('Has cached data via WeatherService:', hasCached);
      
      // 6. Test cache cleaning
      console.log('Testing cache cleaning...');
      const cleanedCount = await weatherService.cleanExpiredCache();
      console.log('Cleaned expired entries:', cleanedCount);
      
      console.log('=== Cache Testing Completed ===');
      return true;
    } catch (error) {
      console.error('Cache testing failed:', error);
      return false;
    }
  }
  
  /**
   * Test cache expiry functionality
   */
  static async testCacheExpiry() {
    console.log('=== Cache Expiry Testing Started ===');
    
    const testLocation = {
      latitude: 12.9716,
      longitude: 77.5946, // Bangalore coordinates
    };
    
    try {
      // Store data with short TTL (1 second)
      const shortTTL = 1000; // 1 second
      const mockData = {
        location: testLocation,
        date_range: { start: '2025-08-06', end: '2025-08-06' },
        open_meteo: {},
        nasa_power: {},
        farming_tips: [],
      };
      
      await cacheService.setWeatherData(
        { latitude: testLocation.latitude, longitude: testLocation.longitude },
        mockData,
        shortTTL
      );
      
      // Immediately check if data exists
      let cachedData = await cacheService.getWeatherData({
        latitude: testLocation.latitude,
        longitude: testLocation.longitude,
      });
      console.log('Data immediately after caching:', cachedData ? 'Found' : 'Not found');
      
      // Wait for expiry
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Check if data has expired
      cachedData = await cacheService.getWeatherData({
        latitude: testLocation.latitude,
        longitude: testLocation.longitude,
      });
      console.log('Data after expiry:', cachedData ? 'Found (should not happen)' : 'Expired correctly ✅');
      
      console.log('=== Cache Expiry Testing Completed ===');
    } catch (error) {
      console.error('Cache expiry testing failed:', error);
    }
  }
  
  /**
   * Test location matching functionality
   */
  static async testLocationMatching() {
    console.log('=== Location Matching Testing Started ===');
    
    const baseLocation = { latitude: 13.0827, longitude: 80.2707 };
    const nearbyLocation = { latitude: 13.0830, longitude: 80.2710 }; // Very close
    const farLocation = { latitude: 13.1000, longitude: 80.3000 }; // Far away
    
    try {
      // Store data for base location
      const mockData = {
        location: baseLocation,
        date_range: { start: '2025-08-06', end: '2025-08-06' },
        open_meteo: {},
        nasa_power: {},
        farming_tips: [],
      };
      
      await cacheService.setWeatherData(
        { latitude: baseLocation.latitude, longitude: baseLocation.longitude },
        mockData
      );
      
      // Test exact match
      let data = await cacheService.getWeatherData({
        latitude: baseLocation.latitude,
        longitude: baseLocation.longitude,
      });
      console.log('Exact location match:', data ? 'Found ✅' : 'Not found ❌');
      
      // Test nearby match (should find due to rounding)
      data = await cacheService.getWeatherData({
        latitude: nearbyLocation.latitude,
        longitude: nearbyLocation.longitude,
      });
      console.log('Nearby location match:', data ? 'Found ✅' : 'Not found ❌');
      
      // Test far location (should not find)
      data = await cacheService.getWeatherData({
        latitude: farLocation.latitude,
        longitude: farLocation.longitude,
      });
      console.log('Far location match:', data ? 'Found ❌' : 'Not found ✅');
      
      console.log('=== Location Matching Testing Completed ===');
    } catch (error) {
      console.error('Location matching testing failed:', error);
    }
  }
}

// Export individual test functions for easier use
export const testCacheOperations = CacheTester.testCacheOperations;
export const testCacheExpiry = CacheTester.testCacheExpiry;
export const testLocationMatching = CacheTester.testLocationMatching;
