import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Speech from 'expo-speech';
import { authService } from '../services/authService';

const OPENWEATHER_API_KEY = 'f27bb27155756a143de2cf7edfa95e0f'; // Your API key here

const FALLBACK_CITY = 'Chennai';

export default function WeatherAlerts() {
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [climateType, setClimateType] = useState('');
  const [cropSuggestion, setCropSuggestion] = useState('');
  const [irrigationAdvice, setIrrigationAdvice] = useState('');
  const [spokenMessage, setSpokenMessage] = useState('');
  const [userLocation, setUserLocation] = useState<string | null>(null);

  useEffect(() => {
    fetchUserLocationAndWeather();
  }, []);

  const fetchUserLocationAndWeather = async () => {
    try {
      // Get user data (token, id, etc.)
      const userData = await authService.getUserData();

      if (!userData.user_id || !userData.access_token) {
        setUserLocation(FALLBACK_CITY);
        fetchWeather(FALLBACK_CITY);
        return;
      }

      // Fetch profile from backend to get location
      const response = await fetch(`http://localhost:8000/auth/profile`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${userData.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const profileData = await response.json();
        let location = FALLBACK_CITY;

        if (profileData.farmer_details && profileData.farmer_details.location) {
          location = profileData.farmer_details.location;
        }

        setUserLocation(location);
        fetchWeather(location);
      } else {
        setUserLocation(FALLBACK_CITY);
        fetchWeather(FALLBACK_CITY);
      }
    } catch (error) {
      setUserLocation(FALLBACK_CITY);
      fetchWeather(FALLBACK_CITY);
    }
  };

  const fetchWeather = async (cityName: string) => {
    try {
      setLoading(true);
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${OPENWEATHER_API_KEY}&units=metric`
      );
      const data = await res.json();
      setWeatherData(data);

      const temp = data.main.temp;
      const condition = data.weather[0].main.toLowerCase();
      const humidity = data.main.humidity;

      let climate = '';
      if (temp > 30 && humidity < 50) climate = 'Arid (Dry)';
      else if (temp > 25 && humidity >= 60) climate = 'Tropical';
      else if (temp < 20) climate = 'Cool/Temperate';
      else climate = 'Moderate';

      setClimateType(climate);

      let crop = '';
      if (climate === 'Tropical') crop = 'Rice, Sugarcane, Banana';
      else if (climate === 'Arid (Dry)') crop = 'Millets, Pulses, Cotton';
      else if (climate === 'Cool/Temperate') crop = 'Wheat, Barley, Apples';
      else crop = 'Maize, Groundnut, Vegetables';

      setCropSuggestion(crop);

      let irrigation = '';
      if (condition.includes('rain')) {
        irrigation = `It's currently raining in ${cityName}. Avoid irrigation today.`;
      } else if (temp > 35) {
        irrigation = `High temperature in ${cityName}. Use drip irrigation and mulch to retain soil moisture.`;
      } else {
        irrigation = `Weather is stable in ${cityName}. Proceed with regular irrigation.`;
      }

      setIrrigationAdvice(irrigation);

      const fullMessage = `${irrigation} Based on the ${climate} climate, suitable crops include: ${crop}.`;
      setSpokenMessage(fullMessage);
      Speech.speak(fullMessage);
    } catch (error) {
      setIrrigationAdvice('Failed to retrieve weather data.');
      setCropSuggestion('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.bubbleBackground} />
      <Text style={styles.title}>🌦️ Weather & Climate Alerts</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#90EE90" />
      ) : (
        <>
          <View style={styles.infoBox}>
            <Text style={styles.label}>City:</Text>
            <Text style={styles.value}>{weatherData?.name}</Text>
            <Text style={styles.label}>Temperature:</Text>
            <Text style={styles.value}>{weatherData?.main?.temp} °C</Text>
            <Text style={styles.label}>Condition:</Text>
            <Text style={styles.value}>{weatherData?.weather?.[0]?.main}</Text>
            <Text style={styles.label}>Humidity:</Text>
            <Text style={styles.value}>{weatherData?.main?.humidity}%</Text>
            <Text style={styles.label}>Inferred Climate:</Text>
            <Text style={styles.value}>{climateType}</Text>
          </View>

          <View style={styles.suggestionBox}>
            <Text style={styles.adviceHeader}>💧 Irrigation Advice:</Text>
            <Text style={styles.adviceText}>{irrigationAdvice}</Text>

            <Text style={[styles.adviceHeader, { marginTop: 20 }]}>🌾 Crop Suggestion:</Text>
            <Text style={styles.adviceText}>{cropSuggestion}</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={() => Speech.speak(spokenMessage)}
          >
            <Text style={styles.buttonText}>🔊 Hear Advice Again</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    padding: 24,
    justifyContent: 'center',
  },
  bubbleBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'radial-gradient(circle at 20% 20%, #2c3e50, transparent 50%), radial-gradient(circle at 80% 80%, #34495e, transparent 50%)',
    opacity: 0.2,
    zIndex: -1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#90EE90',
    textAlign: 'center',
    marginBottom: 30,
  },
  infoBox: {
    backgroundColor: '#262626',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#444',
  },
  label: {
    fontWeight: '600',
    fontSize: 16,
    color: '#A5D6A7',
  },
  value: {
    fontSize: 16,
    marginBottom: 8,
    color: '#E0E0E0',
  },
  suggestionBox: {
    backgroundColor: '#f2f9f2',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  adviceHeader: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#2E7D32',
    marginBottom: 6,
  },
  adviceText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#2E7D32',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
