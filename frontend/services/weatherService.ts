import AsyncStorage from '@react-native-async-storage/async-storage';
// Weather Service for Frontend
import { cacheService, WeatherCacheKey } from './cacheService';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://10.0.2.2:8000';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface FarmingTip {
  type: 'warning' | 'alert' | 'info' | 'recommendation';
  icon: string;
  message: string;
  color: string;
  source: 'ai' | 'rule-based';
  priority: number;
}

export interface WeatherApiResponse {
  location: {
    latitude: number;
    longitude: number;
  };
  date_range: {
    start: string;
    end: string;
  };
  open_meteo: any;
  nasa_power: any;
  farming_tips: FarmingTip[];
  weather_summary?: string;
}

export interface WeatherRequest {
  latitude: number;
  longitude: number;
  start?: string;
  end?: string;
  crop_type?: string;
  include_farming_tips?: boolean;
}

class WeatherService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  /**
   * Fetch weather data from backend with farming tips and caching
   */
  async getWeatherData(request: WeatherRequest, forceRefresh: boolean = false): Promise<WeatherApiResponse> {
    const cacheKey: WeatherCacheKey = {
      latitude: request.latitude,
      longitude: request.longitude,
      cropType: request.crop_type,
    };

    // Try to get from cache first (unless force refresh is requested)
    if (!forceRefresh) {
      const cachedData = await cacheService.getWeatherData(cacheKey);
      if (cachedData) {
        console.log('Returning cached weather data');
        return cachedData;
      }
    }

    // Fetch fresh data from API
    console.log('Fetching fresh weather data from API');
    try {
      // Get access token from AsyncStorage
      let accessToken: string | null = null;
      try {
        accessToken = await AsyncStorage.getItem('access_token');
      } catch (err) {
        console.warn('Failed to get access token:', err);
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await fetch(`${this.baseUrl}/api/v1/weather/weather-data`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          latitude: request.latitude,
          longitude: request.longitude,
          start: request.start,
          end: request.end,
          crop_type: request.crop_type,
          include_farming_tips: request.include_farming_tips ?? true,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // Cache the fresh data
      await cacheService.setWeatherData(cacheKey, data);
      return data;
    } catch (error) {
      console.error('Weather API error:', error);
      // If API fails, try to return cached data as fallback
      const cachedData = await cacheService.getWeatherData(cacheKey);
      if (cachedData) {
        console.log('API failed, returning cached data as fallback');
        return cachedData;
      }
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch weather data');
    }
  }

  /**
   * Check if cached weather data exists for a location
   */
  async hasCachedWeatherData(location: LocationCoordinates, cropType?: string): Promise<boolean> {
    const cacheKey: WeatherCacheKey = {
      latitude: location.latitude,
      longitude: location.longitude,
      cropType,
    };
    return await cacheService.hasValidWeatherData(cacheKey);
  }

  /**
   * Clear weather cache for a specific location
   */
  async clearLocationCache(location: LocationCoordinates, cropType?: string): Promise<void> {
    const cacheKey: WeatherCacheKey = {
      latitude: location.latitude,
      longitude: location.longitude,
      cropType,
    };
    await cacheService.removeWeatherData(cacheKey);
  }

  /**
   * Clear all weather cache data
   */
  async clearAllCache(): Promise<void> {
    await cacheService.clearAllWeatherCache();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    return await cacheService.getCacheStats();
  }

  /**
   * Clean expired cache entries
   */
  async cleanExpiredCache(): Promise<number> {
    return await cacheService.cleanExpiredEntries();
  }

  /**
   * Get current location using device GPS
   */
  async getCurrentLocation(): Promise<LocationCoordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error(`Geolocation error: ${error.message}`));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000, // 1 minute
        }
      );
    });
  }

  /**
   * Parse NASA POWER data to extract meaningful information
   */
  parseNASAData(data: any) {
    if (!data?.properties?.parameter) return null;

    const params = data.properties.parameter;
    // Filter out invalid dates (fill_value -999)
    const dates = Object.keys(params.T2M || {});
    const validDates = dates.filter(date => params.T2M[date] !== -999.0);
    if (validDates.length === 0) return null;

    // Use the latest valid date
    const latestDate = validDates[validDates.length - 1];

    return {
      date: latestDate,
      temperature: params.T2M?.[latestDate] ?? null,
      temperatureMax: params.T2M_MAX?.[latestDate] ?? null,
      temperatureMin: params.T2M_MIN?.[latestDate] ?? null,
      humidity: params.RH2M?.[latestDate] ?? null,
      windSpeed: params.WS2M?.[latestDate] ?? null, // m/s, convert to km/h in frontend
      precipitation: params.PRECTOTCORR?.[latestDate] ?? null,
      soilWetness: params.GWETTOP?.[latestDate] ?? null, // 0..1
      rootZoneWetness: params.GWETROOT?.[latestDate] ?? null,
      dewPoint: params.T2MDEW?.[latestDate] ?? null,
      wetBulbTemp: params.T2MWET?.[latestDate] ?? null,
      allSkyPAR: params.ALLSKY_SFC_PAR_TOT?.[latestDate] ?? null,
      clearSkyPAR: params.CLRSKY_SFC_PAR_TOT?.[latestDate] ?? null,
    };
  }

  /**
   * Parse Open-Meteo data to extract meaningful information
   */
  parseOpenMeteoData(data: any) {
    if (!data?.current || !data?.hourly) return null;

    const current = data.current;
    const hourly = data.hourly;

    // Get "today" (first 24 hours of hourly arrays)
    const todayTemps = hourly.temperature_2m?.slice(0, 24) || [];
    const todayHumidity = hourly.relative_humidity_2m?.slice(0, 24) || [];
    const todayWind = hourly.wind_speed_10m?.slice(0, 24) || [];

    return {
      current: {
        temperature: current.temperature_2m ?? null,
        windSpeed: current.wind_speed_10m ?? null,
        time: current.time ?? null,
      },
      today: {
        temperatureMax: todayTemps.length > 0 ? Math.max(...todayTemps) : null,
        temperatureMin: todayTemps.length > 0 ? Math.min(...todayTemps) : null,
        humidityAvg: todayHumidity.length > 0 ? Math.round(todayHumidity.reduce((a: number, b: number) => a + b, 0) / todayHumidity.length) : null,
        windSpeedAvg: todayWind.length > 0 ? Math.round(todayWind.reduce((a: number, b: number) => a + b, 0) / todayWind.length) : null,
      },
      hourly: Array.isArray(hourly.time) ? hourly.time.map((time: string, idx: number) => ({
        time,
        temperature: hourly.temperature_2m?.[idx] ?? null,
        humidity: hourly.relative_humidity_2m?.[idx] ?? null,
        windSpeed: hourly.wind_speed_10m?.[idx] ?? null,
      })) : [],
      daily: this.groupHourlyToDaily(hourly),
    };
  }

  /**
   * Group hourly data into daily forecasts (7 days max)
   */
  private groupHourlyToDaily(hourly: any) {
    if (!hourly?.time || !hourly?.temperature_2m) return [];

    const dailyData = [];
    const hoursPerDay = 24;
    const totalDays = Math.min(7, Math.floor(hourly.time.length / hoursPerDay));

    for (let i = 0; i < totalDays; i++) {
      const dayStart = i * hoursPerDay;
      const dayEnd = dayStart + hoursPerDay;

      const dayTemps = hourly.temperature_2m.slice(dayStart, dayEnd);
      const dayHumidity = hourly.relative_humidity_2m?.slice(dayStart, dayEnd) || [];
      const dayWind = hourly.wind_speed_10m?.slice(dayStart, dayEnd) || [];

      if (dayTemps.length === 0) continue;

      const date = new Date(hourly.time[dayStart]);
      dailyData.push({
        date: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dateFormatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        temperatureMax: Math.max(...dayTemps),
        temperatureMin: Math.min(...dayTemps),
        humidityAvg: dayHumidity.length > 0 ? Math.round(dayHumidity.reduce((a: number, b: number) => a + b, 0) / dayHumidity.length) : null,
        windSpeedAvg: dayWind.length > 0 ? Math.round(dayWind.reduce((a: number, b: number) => a + b, 0) / dayWind.length) : null,
      });
    }
    return dailyData;
  }

  /**
   * Parse farming tips array
   */
  parseFarmingTips(tips: any): FarmingTip[] {
    if (!Array.isArray(tips)) return [];
    return tips.map((tip) => ({
      type: tip.type || 'info',
      icon: tip.icon || 'bulb-outline',
      message: tip.message || '',
      color: tip.color || '#8BC34A',
      source: tip.source || 'ai',
      priority: typeof tip.priority === 'number' ? tip.priority : 2,
    }));
  }

  /**
   * Parse weather summary string (strip formatting)
   */
  parseWeatherSummary(summary: string | undefined): string {
    if (!summary) return '';
    return summary.replace(/`/g, '').replace(/\n/g, ' ').trim();
  }
}

export const weatherService = new WeatherService();
export default weatherService;