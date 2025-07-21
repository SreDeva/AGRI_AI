import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import { useRouter } from 'expo-router';
import LeaseCard from '../../components/LeaseCard';
import { authService } from '../../services/authService';

interface Expert {
  id: string;
  name: string;
  experience: number;
  spoken_language: string;
}
interface Lease {
  _id: string;
  area: string;
  location: string;
  leaseRate: number;
}

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000'; // FastAPI backend
const LEASE_API_URL = process.env.EXPO_PUBLIC_LEASE_API_URL || 'http://localhost:8081'; // Node.js lease service

export default function AdminPage() {
  const [name, setName] = useState('');
  const [experience, setExperience] = useState('');
  const [language, setLanguage] = useState('');
  const [experts, setExperts] = useState<Expert[]>([]);
  const [loadingExperts, setLoadingExperts] = useState(false);

  const [area, setArea] = useState('');
  const [location, setLocation] = useState('');
  const [leaseRate, setLeaseRate] = useState('');
  const [leases, setLeases] = useState<Lease[]>([]);
  const [loadingLeases, setLoadingLeases] = useState(false);

  const router = useRouter();

  // Helper function to get auth headers
  const getAuthHeaders = async () => {
    try {
      console.log('🔑 Getting auth headers...');
      const userData = await authService.getUserData();
      console.log('👤 User data:', userData);

      const token = userData?.access_token;
      if (!token) {
        console.error('❌ No access token found in user data');
        throw new Error('No access token found');
      }

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      console.log('✅ Auth headers prepared:', { ...headers, Authorization: 'Bearer [REDACTED]' });
      return headers;
    } catch (error) {
      console.error('❌ Error getting auth headers:', error);
      Alert.alert('Authentication Error', 'Please login again');
      router.replace('/login');
      throw error;
    }
  };

  // Fetch experts & leases
  const fetchExperts = async () => {
    setLoadingExperts(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/experts/`);
      // The API returns paginated data with experts array
      const expertsData = res.data.experts || res.data;
      setExperts(expertsData);
      console.log('✅ Fetched experts:', expertsData);
    } catch (err: any) {
      console.error('❌ Fetch experts error:', err);
      if (err.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please login again');
        router.replace('/login');
      } else {
        Alert.alert('Error', 'Failed to fetch experts');
      }
    } finally {
      setLoadingExperts(false);
    }
  };
  const fetchLeases = async () => {
    setLoadingLeases(true);
    try {
      const res = await axios.get(`${LEASE_API_URL}/leases`);
      setLeases(res.data);
      console.log('✅ Fetched leases:', res.data);
    } catch (err: any) {
      console.error('❌ Fetch leases error:', err);
      Alert.alert('Error', 'Failed to fetch leases');
    } finally {
      setLoadingLeases(false);
    }
  };

  // Test admin verification
  const testAdminVerification = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(`${API_BASE_URL}/auth/verify-admin`, { headers });
      console.log('🔐 Admin verification test:', response.data);
      Alert.alert(
        'Admin Verification',
        `Is Admin: ${response.data.is_admin}\nPhone: ${response.data.phone_number}`
      );
    } catch (error: any) {
      console.error('❌ Admin verification test failed:', error);
      Alert.alert('Error', 'Admin verification failed');
    }
  };

  useEffect(() => {
    fetchExperts();
    fetchLeases();

    // Debug: Check current user data and admin status
    const checkUserData = async () => {
      try {
        const userData = await authService.getUserData();
        console.log('🔍 Current user data in admin:', userData);

        // Test admin verification endpoint
        try {
          const headers = await getAuthHeaders();
          const adminVerifyResponse = await axios.get(`${API_BASE_URL}/auth/verify-admin`, { headers });
          console.log('🔐 Admin verification response:', adminVerifyResponse.data);
        } catch (adminError) {
          console.error('❌ Admin verification failed:', adminError);
        }
      } catch (error) {
        console.error('❌ Error getting user data:', error);
      }
    };
    checkUserData();
  }, []);

  // Expert handlers
  const addExpert = async () => {
    if (!name || !experience || !language) {
      Alert.alert('Validation Error', 'Please fill name, experience & language.');
      return;
    }
    try {
      const headers = await getAuthHeaders();
      const expertData = {
        name,
        experience: Number(experience),
        spoken_language: language,
      };

      console.log('📤 Creating expert:', expertData);
      const response = await axios.post(`${API_BASE_URL}/experts/`, expertData, { headers });
      console.log('✅ Expert created:', response.data);

      setName('');
      setExperience('');
      setLanguage('');
      fetchExperts();
      Alert.alert('Success', 'Expert added successfully!');
    } catch (error: any) {
      console.error('❌ Add expert failed:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: error.config
      });

      if (error.response?.status === 403) {
        Alert.alert('Access Denied', 'Admin access required to add experts.');
      } else if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please login again.');
        router.replace('/login');
      } else if (error.response?.status === 422) {
        const errorMsg = error.response?.data?.detail || 'Validation error';
        Alert.alert('Validation Error', `${errorMsg}`);
      } else {
        const errorMsg = error.response?.data?.detail || error.message || 'Unknown error';
        Alert.alert('Error', `Failed to add expert: ${errorMsg}`);
      }
    }
  };

  const removeExpert = async (id: string) => {
    try {
      const headers = await getAuthHeaders();
      console.log('🗑️ Deleting expert:', id);

      await axios.delete(`${API_BASE_URL}/experts/${id}`, { headers });
      console.log('✅ Expert deleted successfully');

      fetchExperts();
      Alert.alert('Success', 'Expert removed successfully!');
    } catch (error: any) {
      console.error('❌ Remove expert failed:', error);
      if (error.response?.status === 403) {
        Alert.alert('Access Denied', 'Admin access required to remove experts.');
      } else if (error.response?.status === 401) {
        Alert.alert('Authentication Error', 'Please login again.');
        router.replace('/login');
      } else {
        Alert.alert('Error', 'Failed to remove expert. Please try again.');
      }
    }
  };

  // Lease handlers
  const addLease = async () => {
    if (!area || !location || !leaseRate) {
      Alert.alert('Validation Error', 'Please fill all lease fields.');
      return;
    }
    try {
      const leaseData = {
        area,
        location,
        leaseRate: Number(leaseRate),
      };

      console.log('📤 Creating lease:', leaseData);
      await axios.post(`${LEASE_API_URL}/leases`, leaseData);
      console.log('✅ Lease created successfully');

      setArea('');
      setLocation('');
      setLeaseRate('');
      fetchLeases();
      Alert.alert('Success', 'Lease added successfully!');
    } catch (error: any) {
      console.error('❌ Add lease failed:', error);
      Alert.alert('Error', 'Failed to add lease. Please try again.');
    }
  };

  const removeLease = async (id: string) => {
    try {
      console.log('🗑️ Deleting lease:', id);
      await axios.delete(`${LEASE_API_URL}/leases/${id}`);
      console.log('✅ Lease deleted successfully');

      fetchLeases();
      Alert.alert('Success', 'Lease removed successfully!');
    } catch (error: any) {
      console.error('❌ Remove lease failed:', error);
      Alert.alert('Error', 'Failed to remove lease. Please try again.');
    }
  };

  const goToDashboard = () => {
    router.push('/(tabs)/dashboard');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🌿 Admin Panel</Text>

      {/* Admin Verification Test */}
      <View style={styles.testSection}>
        <Button title="🔐 Test Admin Access" onPress={testAdminVerification} color="#9C27B0" />
      </View>

      {/* Botanists */}
      <Text style={styles.sectionTitle}>Add Expert</Text>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Experience (years)"
        value={experience}
        onChangeText={setExperience}
        style={styles.input}
        keyboardType="numeric"
      />
      <TextInput
        placeholder="Language"
        value={language}
        onChangeText={setLanguage}
        style={styles.input}
      />
      <Button title="Add Expert" onPress={addExpert} />

      <Text style={styles.sectionTitle}>Registered Experts</Text>
      {loadingExperts ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2F6D3E" />
          <Text style={styles.loadingText}>Loading experts...</Text>
        </View>
      ) : experts.length === 0 ? (
        <Text style={styles.emptyText}>No experts registered yet.</Text>
      ) : (
        experts.map((e) => (
          <View key={e.id} style={styles.card}>
            <Text style={styles.bold}>{e.name}</Text>
            <Text>Experience: {e.experience} yrs</Text>
            <Text>Language: {e.spoken_language}</Text>
            <Button title="❌ Delete Expert" color="red" onPress={() => removeExpert(e.id)} />
          </View>
        ))
      )}

      {/* Leases */}
      <Text style={styles.sectionTitle}>Manage Land Leases</Text>
      <TextInput
        placeholder="Area"
        value={area}
        onChangeText={setArea}
        style={styles.input}
      />
      <TextInput
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
        style={styles.input}
      />
      <TextInput
        placeholder="Lease Rate"
        value={leaseRate}
        onChangeText={setLeaseRate}
        style={styles.input}
        keyboardType="numeric"
      />
      <Button title="Add Lease" onPress={addLease} />

      {leases.map((l) => (
        <LeaseCard
          key={l._id}
          id={l._id}
          area={l.area}
          location={l.location}
          leaseRate={l.leaseRate}
          onRemove={removeLease}
        />
      ))}

      <View style={{ marginTop: 30 }}>
        <Button title="📊 View Dashboard" onPress={goToDashboard} color="#2F6D3E" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#1e4d2b',
  },
  sectionTitle: {
    fontSize: 18,
    marginTop: 20,
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginVertical: 8,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  card: {
    padding: 12,
    marginVertical: 8,
    backgroundColor: '#e7f5e6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cde0cd',
  },
  bold: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  testSection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
});
