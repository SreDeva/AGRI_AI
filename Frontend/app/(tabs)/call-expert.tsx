import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// API Configuration
const API_BASE_URL = 'http://127.0.0.1:8000';

interface Expert {
  id: string;
  name: string;
  experience: number;
  spoken_language: string;
}

interface ExpertListResponse {
  experts: Expert[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export default function CallExpertPage() {
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredExperts, setFilteredExperts] = useState<Expert[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  // Fetch experts from API
  const fetchExperts = async (page: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else if (page > 1) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`${API_BASE_URL}/experts/?page=${page}&per_page=10`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ExpertListResponse = await response.json();

      if (page === 1 || isRefresh) {
        setExperts(data.experts);
        setFilteredExperts(data.experts);
      } else {
        // Append new experts for pagination
        setExperts(prev => [...prev, ...data.experts]);
        setFilteredExperts(prev => [...prev, ...data.experts]);
      }

      setCurrentPage(data.page);
      setTotalPages(data.total_pages);

    } catch (error) {
      console.error('Error fetching experts:', error);
      Alert.alert(
        'Error',
        'Failed to load experts. Please check your internet connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Search experts
  const searchExperts = async (query: string) => {
    if (!query.trim()) {
      setFilteredExperts(experts);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/experts/search?q=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setFilteredExperts(data.experts);

    } catch (error) {
      console.error('Error searching experts:', error);
      // Fallback to local filtering
      const filtered = experts.filter(expert =>
        expert.name.toLowerCase().includes(query.toLowerCase()) ||
        expert.spoken_language.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredExperts(filtered);
    }
  };

  // Handle search input change
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);

    // Debounce search
    const timeoutId = setTimeout(() => {
      searchExperts(text);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  // Load more experts (pagination)
  const loadMoreExperts = () => {
    if (currentPage < totalPages && !loadingMore) {
      fetchExperts(currentPage + 1);
    }
  };

  // Make phone call
  const makeCall = (expertName: string) => {
    // For demo purposes, we'll show an alert
    // In a real app, you'd have phone numbers and use Linking.openURL(`tel:${phoneNumber}`)
    Alert.alert(
      'Call Expert',
      `Would you like to call ${expertName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => {
            // Demo phone number - replace with actual expert phone numbers
            const phoneNumber = '+919876543210';
            const url = Platform.OS === 'ios' ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
            Linking.openURL(url).catch(() => {
              Alert.alert('Error', 'Unable to make phone call');
            });
          }
        },
      ]
    );
  };

  // Get experience level badge color
  const getExperienceBadgeColor = (experience: number) => {
    if (experience >= 20) return '#FF6B35'; // Senior (Orange-Red)
    if (experience >= 10) return '#4ECDC4'; // Experienced (Teal)
    if (experience >= 5) return '#45B7D1';  // Intermediate (Blue)
    return '#96CEB4'; // Junior (Light Green)
  };

  // Get experience level text
  const getExperienceLevel = (experience: number) => {
    if (experience >= 20) return 'Senior Expert';
    if (experience >= 10) return 'Experienced';
    if (experience >= 5) return 'Intermediate';
    return 'Junior Expert';
  };

  useEffect(() => {
    fetchExperts();
  }, []);

  // Render expert card
  const renderExpertCard = (expert: Expert) => (
    <View key={expert.id} style={styles.expertCard}>
      <LinearGradient
        colors={['#ffffff', '#f8f9fa']}
        style={styles.cardGradient}
      >
        {/* Expert Avatar */}
        <View style={styles.avatarContainer}>
          <LinearGradient
            colors={[getExperienceBadgeColor(expert.experience), '#ffffff']}
            style={styles.avatar}
          >
            <Ionicons name="person" size={32} color="#ffffff" />
          </LinearGradient>

          {/* Experience Badge */}
          <View style={[styles.experienceBadge, { backgroundColor: getExperienceBadgeColor(expert.experience) }]}>
            <Text style={styles.experienceText}>{expert.experience}y</Text>
          </View>
        </View>

        {/* Expert Info */}
        <View style={styles.expertInfo}>
          <Text style={styles.expertName}>{expert.name}</Text>
          <Text style={styles.experienceLevel}>{getExperienceLevel(expert.experience)}</Text>

          <View style={styles.languageContainer}>
            <Ionicons name="language" size={16} color="#666" />
            <Text style={styles.languageText}>{expert.spoken_language}</Text>
          </View>
        </View>

        {/* Call Button */}
        <TouchableOpacity
          style={styles.callButton}
          onPress={() => makeCall(expert.name)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4CAF50', '#45A049']}
            style={styles.callButtonGradient}
          >
            <Ionicons name="call" size={20} color="#ffffff" />
            <Text style={styles.callButtonText}>Call</Text>
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading experts...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4CAF50', '#45A049']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Agricultural Experts</Text>
        <Text style={styles.headerSubtitle}>Connect with experienced professionals</Text>
      </LinearGradient>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search experts by name or language..."
            value={searchQuery}
            onChangeText={handleSearchChange}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setFilteredExperts(experts);
              }}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Experts List */}
      <ScrollView
        style={styles.expertsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchExperts(1, true)}
            colors={['#4CAF50']}
            tintColor="#4CAF50"
          />
        }
        onScroll={({ nativeEvent }) => {
          const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
          const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 20;

          if (isCloseToBottom && !loadingMore && currentPage < totalPages) {
            loadMoreExperts();
          }
        }}
        scrollEventThrottle={400}
      >
        {filteredExperts.length > 0 ? (
          <>
            {filteredExperts.map(renderExpertCard)}

            {/* Load More Indicator */}
            {loadingMore && (
              <View style={styles.loadMoreContainer}>
                <ActivityIndicator size="small" color="#4CAF50" />
                <Text style={styles.loadMoreText}>Loading more experts...</Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#ccc" />
            <Text style={styles.emptyTitle}>No experts found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try adjusting your search terms' : 'No experts available at the moment'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#e8f5e9',
    textAlign: 'center',
    opacity: 0.9,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 4,
  },
  expertsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  expertCard: {
    marginBottom: 16,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  cardGradient: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  experienceBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    minWidth: 32,
    alignItems: 'center',
  },
  experienceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  expertInfo: {
    flex: 1,
    marginRight: 16,
  },
  expertName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  experienceLevel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
    fontWeight: '500',
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontStyle: 'italic',
  },
  callButton: {
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  callButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  callButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadMoreText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
});
