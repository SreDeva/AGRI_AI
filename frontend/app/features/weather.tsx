import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity, ActivityIndicator, Alert, Modal } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { weatherService, WeatherApiResponse, FarmingTip, LocationCoordinates } from '../../services/weatherService';

export default function WeatherScreen() {
  const router = useRouter();
  const [weatherData, setWeatherData] = useState<WeatherApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<LocationCoordinates | null>(null);
  const [selectedTip, setSelectedTip] = useState<FarmingTip | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    requestLocationPermission();
    
    // Clean expired cache entries on app start
    weatherService.cleanExpiredCache().then((cleanedCount) => {
      if (cleanedCount > 0) {
        console.log(`Cleaned ${cleanedCount} expired cache entries on app start`);
      }
    });
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeatherData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  // Handle screen focus - only update cache stats, don't fetch new data
  useFocusEffect(
    React.useCallback(() => {
      if (location) {
        // Don't fetch new data when screen is focused, only use cache
        console.log('Weather screen focused - using cached data only');
      }
    }, [location])
  );

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Location permission is required. Using default location.',
          [{ text: 'OK', onPress: () => useDefaultLocation() }]
        );
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (error) {
      useDefaultLocation();
    }
  };

  const useDefaultLocation = () => {
    setLocation({
      latitude: 13.0827,
      longitude: 80.2707,
    });
  };

  const fetchWeatherData = async (forceRefresh: boolean = false) => {
    if (!location) return;
    
    try {
      setLoading(true);
      
      // Check if we have cached data for initial load
      if (isInitialLoad && !forceRefresh) {
        const hasCachedData = await weatherService.hasCachedWeatherData(location, 'rice');
        if (hasCachedData) {
          console.log('Found cached data for initial load');
        } else {
          console.log('No cached data found, fetching from API');
        }
      }
      
      // Fetch from backend (with cache integration)
      const response = await weatherService.getWeatherData({
        latitude: location.latitude,
        longitude: location.longitude,
        include_farming_tips: true,
        crop_type: 'rice', // Default crop type
      }, forceRefresh);
      
      setWeatherData(response);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      Alert.alert(
        'Weather Data Error',
        'Failed to load weather data. Please check your internet connection and try again.',
        [{ text: 'Retry', onPress: () => fetchWeatherData(forceRefresh) }]
      );
    } finally {
      setLoading(false);
    }
  };

  // Parse and combine backend data
  const getCurrentWeatherData = () => {
    if (!weatherData) return null;
    // Prefer Open-Meteo
    if (weatherData.open_meteo) {
      const parsed = weatherService.parseOpenMeteoData(weatherData.open_meteo);
      if (parsed) {
        return {
          temperature: parsed.current.temperature,
          humidity: parsed.today.humidityAvg,
          windSpeed: parsed.current.windSpeed,
          maxTemp: parsed.today.temperatureMax,
          minTemp: parsed.today.temperatureMin,
          source: 'Open-Meteo'
        };
      }
    }
    // Fallback NASA POWER
    if (weatherData.nasa_power) {
      const parsed = weatherService.parseNASAData(weatherData.nasa_power);
      if (parsed) {
        return {
          temperature: parsed.temperature,
          humidity: parsed.humidity,
          windSpeed: parsed.windSpeed ? parsed.windSpeed * 3.6 : null, // m/s to km/h
          precipitation: parsed.precipitation,
          maxTemp: parsed.temperatureMax,
          minTemp: parsed.temperatureMin,
          soilWetness: parsed.soilWetness ? parsed.soilWetness * 100 : null, // 0..1 to %
          source: 'NASA POWER'
        };
      }
    }
    return null;
  };

  const getHourlyForecast = () => {
    if (!weatherData?.open_meteo) return [];
    const parsed = weatherService.parseOpenMeteoData(weatherData.open_meteo);
    if (!parsed || !parsed.hourly) return [];
    return parsed.hourly.map((hour: any) => ({
      time: hour.time ? new Date(hour.time).getHours() + ':00' : '--:--',
      temperature: hour.temperature,
      humidity: hour.humidity,
      windSpeed: hour.windSpeed,
    }));
  };

  const getDailyForecast = () => {
    if (!weatherData?.open_meteo) return [];
    const parsed = weatherService.parseOpenMeteoData(weatherData.open_meteo);
    if (!parsed || !parsed.daily) return [];
    return parsed.daily.map((day: any) => ({
      day: day.day,
      date: day.dateFormatted,
      maxTemp: day.temperatureMax,
      minTemp: day.temperatureMin,
      avgHumidity: day.humidityAvg,
      avgWind: day.windSpeedAvg
    }));
  };

  const getNASADetails = () => {
    if (!weatherData?.nasa_power) return null;
    const parsed = weatherService.parseNASAData(weatherData.nasa_power);
    return parsed || null;
  };

  const farmingTips = weatherService.parseFarmingTips(weatherData?.farming_tips ?? []);
  const weatherSummary = weatherService.parseWeatherSummary(weatherData?.weather_summary);

  const currentWeather = getCurrentWeatherData();
  const hourlyForecast = getHourlyForecast();
  const dailyForecast = getDailyForecast();
  const nasaDetails = getNASADetails();

  const handleTipPress = (tip: FarmingTip) => {
    setSelectedTip(tip);
    setModalVisible(true);
  };
  const closeModal = () => {
    setModalVisible(false);
    setSelectedTip(null);
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Loading weather data...</Text>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <LinearGradient
        colors={['#FF9800', '#FFB74D', '#FFCC02']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statusRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.pageStatus}>
            <Text style={styles.pageText}>🌤️ Weather Today</Text>
          </View>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            {currentWeather?.temperature !== null && currentWeather?.temperature !== undefined ? `${Math.round(currentWeather.temperature)}°C` : '--°C'}
          </Text>
          <Text style={styles.welcomeSubtext}>
            {currentWeather?.source ? `Data from ${currentWeather.source} • Perfect for farming` : 'Loading weather data...'}
          </Text>
        </View>
      </LinearGradient>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Weather Summary */}
        {weatherSummary && (
          <Card style={styles.card} elevation={4}>
            <Card.Content style={styles.cardContent}>
              <Paragraph style={styles.cardDescription}>{weatherSummary}</Paragraph>
            </Card.Content>
          </Card>
        )}

        {/* Current Weather */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Current Weather</Title>
            <Paragraph style={styles.cardDescription}>
              Real-time weather conditions for agricultural planning
            </Paragraph>
            {currentWeather && (
              <View style={styles.weatherDetails}>
                <View style={styles.weatherItem}>
                  <Ionicons name="thermometer-outline" size={24} color="#FF9800" />
                  <Text style={styles.weatherLabel}>Temperature</Text>
                  <Text style={styles.weatherValue}>
                    {currentWeather.temperature !== null && currentWeather.temperature !== undefined
                      ? `${Math.round(currentWeather.temperature)}°C`
                      : '--'}
                  </Text>
                </View>
                <View style={styles.weatherItem}>
                  <Ionicons name="water-outline" size={24} color="#2196F3" />
                  <Text style={styles.weatherLabel}>Humidity</Text>
                  <Text style={styles.weatherValue}>
                    {currentWeather.humidity !== null && currentWeather.humidity !== undefined
                      ? `${Math.round(currentWeather.humidity)}%`
                      : '--'}
                  </Text>
                </View>
                <View style={styles.weatherItem}>
                  <Ionicons name="leaf-outline" size={24} color="#4CAF50" />
                  <Text style={styles.weatherLabel}>Wind Speed</Text>
                  <Text style={styles.weatherValue}>
                    {currentWeather.windSpeed !== null && currentWeather.windSpeed !== undefined
                      ? `${Math.round(currentWeather.windSpeed)} km/h`
                      : '--'}
                  </Text>
                </View>
              </View>
            )}
            {/* NASA POWER extra */}
            {nasaDetails && (
              <View style={styles.additionalDataContainer}>
                <Title style={styles.sectionTitle}>NASA POWER Details</Title>
                <View style={styles.additionalDataRow}>
                  {nasaDetails.precipitation !== null && nasaDetails.precipitation !== undefined && (
                    <View style={styles.dataItem}>
                      <Ionicons name="rainy-outline" size={20} color="#2196F3" />
                      <Text style={styles.dataLabel}>Precipitation</Text>
                      <Text style={styles.dataValue}>{nasaDetails.precipitation.toFixed(2)} mm</Text>
                    </View>
                  )}
                  {nasaDetails.soilWetness !== null && nasaDetails.soilWetness !== undefined && (
                    <View style={styles.dataItem}>
                      <Ionicons name="water" size={20} color="#8BC34A" />
                      <Text style={styles.dataLabel}>Soil Wetness</Text>
                      <Text style={styles.dataValue}>{Math.round(nasaDetails.soilWetness * 100)}%</Text>
                    </View>
                  )}
                </View>
                <View style={styles.tempRangeContainer}>
                  <View style={styles.tempRangeItem}>
                    <Ionicons name="arrow-up" size={16} color="#FF5722" />
                    <Text style={styles.tempRangeLabel}>
                      Max: {nasaDetails.temperatureMax !== null && nasaDetails.temperatureMax !== undefined
                        ? `${Math.round(nasaDetails.temperatureMax)}°C`
                        : '--'}
                    </Text>
                  </View>
                  <View style={styles.tempRangeItem}>
                    <Ionicons name="arrow-down" size={16} color="#2196F3" />
                    <Text style={styles.tempRangeLabel}>
                      Min: {nasaDetails.temperatureMin !== null && nasaDetails.temperatureMin !== undefined
                        ? `${Math.round(nasaDetails.temperatureMin)}°C`
                        : '--'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Hourly Forecast */}
        {hourlyForecast.length > 0 && (
          <Card style={styles.card} elevation={4}>
            <Card.Content style={styles.cardContent}>
              <Title style={styles.cardTitle}>24-Hour Forecast</Title>
              <Paragraph style={styles.cardDescription}>Hourly weather conditions for today</Paragraph>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                <View style={styles.hourlyContainer}>
                  {hourlyForecast.slice(0, 12).map((hour: any, index: number) => (
                    <View key={index} style={styles.hourlyItem}>
                      <Text style={styles.hourlyTime}>{hour.time}</Text>
                      <Ionicons name="partly-sunny-outline" size={20} color="#FF9800" />
                      <Text style={styles.hourlyTemp}>
                        {hour.temperature !== null && hour.temperature !== undefined ? `${Math.round(hour.temperature)}°` : '--'}
                      </Text>
                      <Text style={styles.hourlyDetail}>
                        {hour.humidity !== null && hour.humidity !== undefined ? `${Math.round(hour.humidity)}%` : '--'}
                      </Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </Card.Content>
          </Card>
        )}

        {/* Daily Forecast */}
        {dailyForecast.length > 0 && (
          <Card style={styles.card} elevation={4}>
            <Card.Content style={styles.cardContent}>
              <Title style={styles.cardTitle}>7-Day Forecast</Title>
              <Paragraph style={styles.cardDescription}>Plan your farming activities for the week ahead</Paragraph>
              <View style={styles.forecastList}>
                {dailyForecast.map((day, index) => (
                  <View key={index} style={styles.forecastItem}>
                    <View style={styles.dayInfo}>
                      <Text style={styles.dayText}>{day.day}</Text>
                      <Text style={styles.dateText}>{day.date}</Text>
                    </View>
                    <Ionicons name="partly-sunny-outline" size={20} color="#FF9800" />
                    <View style={styles.tempRange}>
                      <Text style={styles.maxTempText}>
                        {day.maxTemp !== null && day.maxTemp !== undefined && day.maxTemp !== '--'
                          ? `${Math.round(day.maxTemp)}°`
                          : '--'}
                      </Text>
                      <Text style={styles.minTempText}>
                        {day.minTemp !== null && day.minTemp !== undefined && day.minTemp !== '--'
                          ? `${Math.round(day.minTemp)}°`
                          : '--'}
                      </Text>
                    </View>
                    <View style={styles.extraInfo}>
                      <Text style={styles.extraInfoText}>
                        {(day.avgHumidity !== null && day.avgHumidity !== undefined && day.avgHumidity !== '--'
                          ? `${day.avgHumidity}%` : '--') +
                          ' • ' +
                          (day.avgWind !== null && day.avgWind !== undefined && day.avgWind !== '--'
                            ? `${day.avgWind}km/h` : '--')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Farming Tips */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>🌱 Farming Tips</Title>
            <Paragraph style={styles.cardDescription}>
              AI-powered weather recommendations for agricultural planning
            </Paragraph>
            <View style={styles.tipsContainer}>
              {farmingTips.length > 0 ? farmingTips.map((tip: FarmingTip, idx: number) => (
                <TouchableOpacity key={idx} onPress={() => handleTipPress(tip)}>
                  <Card style={styles.tipCard} elevation={2}>
                    <Card.Content style={styles.tipCardContent}>
                      <View style={styles.tipHeader}>
                        <Ionicons name={tip.icon as any} size={28} color={tip.color || "#8BC34A"} />
                        <View style={styles.tipHeaderText}>
                          <Text style={[styles.tipType, { color: tip.color || "#8BC34A" }]}>
                            {tip.type ? tip.type.charAt(0).toUpperCase() + tip.type.slice(1) : 'Tip'}
                          </Text>
                          <Text style={[styles.tipSource, { color: tip.color || "#8BC34A" }]}>
                            {tip.source === 'ai' ? '🤖 AI Powered' : '📋 Rule Based'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.tipMessage} numberOfLines={3}>{tip.message}</Text>
                      <Text style={styles.tapToExpandText}>Tap to read full tip...</Text>
                    </Card.Content>
                  </Card>
                </TouchableOpacity>
              )) : (
                <View style={styles.noTipsContainer}>
                  <Ionicons name="information-circle-outline" size={32} color="#757575" />
                  <Text style={styles.noTipsText}>No farming tips available at the moment</Text>
                  <Text style={styles.noTipsSubtext}>Check back later for personalized recommendations</Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={() => fetchWeatherData(true)}
          style={styles.refreshButton}
          icon="refresh"
        >
          Refresh Weather Data
        </Button>
      </ScrollView>
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTip && (
              <>
                <View style={styles.modalHeader}>
                  <View style={styles.modalTipHeader}>
                    <Ionicons name={selectedTip.icon as any} size={32} color={selectedTip.color || "#8BC34A"} />
                    <View style={styles.modalTipHeaderText}>
                      <Text style={[styles.modalTipType, { color: selectedTip.color || "#8BC34A" }]}>
                        {selectedTip.type ? selectedTip.type.charAt(0).toUpperCase() + selectedTip.type.slice(1) : 'Tip'}
                      </Text>
                      <Text style={[styles.modalTipSource, { color: selectedTip.color || "#8BC34A" }]}>
                        {selectedTip.source === 'ai' ? '🤖 AI Powered' : '📋 Rule Based'}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                    <Ionicons name="close" size={28} color="#666" />
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.modalBody}>
                  <Text style={styles.modalTipMessage}>
                    {selectedTip.message}
                  </Text>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF3E0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
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
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 20,
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
    borderColor: 'rgba(255, 152, 0, 0.1)',
    marginBottom: 18,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E65100',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  weatherDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  weatherItem: {
    alignItems: 'center',
    flex: 1,
  },
  weatherLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  weatherValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  additionalDataContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E65100',
    marginBottom: 15,
  },
  additionalDataRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  dataItem: {
    alignItems: 'center',
    flex: 1,
  },
  dataLabel: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  dataValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 2,
  },
  tempRangeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  tempRangeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tempRangeLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  horizontalScroll: {
    marginTop: 15,
  },
  hourlyContainer: {
    flexDirection: 'row',
    gap: 15,
    paddingHorizontal: 5,
  },
  hourlyItem: {
    alignItems: 'center',
    minWidth: 60,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
  },
  hourlyTime: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  hourlyTemp: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  hourlyDetail: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  forecastList: {
    marginTop: 15,
  },
  forecastItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dayInfo: {
    flex: 1,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  tempRange: {
    alignItems: 'flex-end',
    minWidth: 60,
  },
  maxTempText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
  },
  minTempText: {
    fontSize: 14,
    color: '#666',
  },
  extraInfo: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  extraInfoText: {
    fontSize: 11,
    color: '#999',
    textAlign: 'right',
  },
  tempText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF9800',
  },
  tipsContainer: {
    marginTop: 10,
  },
  tipSource: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  tipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.1)',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipCardContent: {
    padding: 16,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  tipType: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  tipMessage: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    textAlign: 'left',
  },
  tapToExpandText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  noTipsContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noTipsText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'center',
  },
  noTipsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  refreshButton: {
    marginTop: 20,
    marginHorizontal: 20,
    backgroundColor: '#FF9800',
    borderRadius: 12,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
    width: '90%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTipHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  modalTipType: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalTipSource: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalTipMessage: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    textAlign: 'left',
  },
});