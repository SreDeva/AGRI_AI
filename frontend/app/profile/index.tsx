import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Alert, ScrollView, StatusBar, TouchableOpacity, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Button,
  Card,
  Title,
  Paragraph,
  Divider,
  List,
  Avatar,
  FAB,
  ActivityIndicator,
  Appbar,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { authAPI, userAPI } from '@/services/api_dev';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface UserData {
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

export default function ProfileScreen() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, logout: authLogout } = useAuth();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      
      // Use user data from AuthContext if available
      if (user) {
        setUserData(user);
      } else {
        // Fallback to API call
        const userData = await authAPI.getCurrentUser();
        setUserData(userData);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile. Please try again.');
      console.error('Profile load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authLogout();
              router.replace('/auth/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          }
        }
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/profile/setup');
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.loadingText}>Loading profile...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (!userData) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Failed to load profile</ThemedText>
          <Button mode="contained" onPress={loadUserProfile}>
            Retry
          </Button>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with Gradient Background - matching home page */}
      <LinearGradient
        colors={['#4CAF50', '#66BB6A', '#81C784']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statusRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.pageStatus}>
            <Text style={styles.pageText}>🌱 My Profile</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.settingsContainer}
            onPress={handleEditProfile}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* User Info in Header */}
        <View style={styles.welcomeSection}>
          <View style={styles.userHeaderInfo}>
            <Avatar.Text
              size={60}
              label={userData.name ? userData.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
              style={styles.headerAvatar}
              labelStyle={styles.headerAvatarLabel}
            />
            <View style={styles.userDetails}>
              <Text style={styles.welcomeText}>{userData.name || 'User'}</Text>
              <Text style={styles.welcomeSubtext}>📱 {userData.phone_number}</Text>
            </View>
          </View>
        </View>
      </LinearGradient>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Farm Information Card */}
        <Card style={styles.infoCard} elevation={3}>
          <Card.Content>
            <Title style={styles.sectionTitle}>🌾 Farm Information</Title>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Farm Name"
              description={userData.farm_name || 'Not specified'}
              left={props => <List.Icon {...props} icon="barn" color="#4CAF50" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <List.Item
              title="Farm Size"
              description={userData.farm_size || 'Not specified'}
              left={props => <List.Icon {...props} icon="terrain" color="#4CAF50" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <List.Item
              title="Farm Type"
              description={userData.farm_type || 'Not specified'}
              left={props => <List.Icon {...props} icon="nature" color="#4CAF50" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <List.Item
              title="Primary Crop"
              description={userData.primary_crop || 'Not specified'}
              left={props => <List.Icon {...props} icon="grain" color="#4CAF50" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <List.Item
              title="Experience"
              description={userData.experience ? `${userData.experience} years` : 'Not specified'}
              left={props => <List.Icon {...props} icon="star" color="#4CAF50" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
          </Card.Content>
        </Card>

        {/* Technical Details Card */}
        <Card style={styles.infoCard} elevation={3}>
          <Card.Content>
            <Title style={styles.sectionTitle}>⚙️ Technical Details</Title>
            <Divider style={styles.divider} />
            
            <List.Item
              title="Soil Type"
              description={userData.soil_type || 'Not specified'}
              left={props => <List.Icon {...props} icon="earth" color="#8D6E63" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <List.Item
              title="Climate Zone"
              description={userData.climate_zone || 'Not specified'}
              left={props => <List.Icon {...props} icon="weather-sunny" color="#FFC107" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <List.Item
              title="Farming Method"
              description={userData.farming_method || 'Not specified'}
              left={props => <List.Icon {...props} icon="leaf" color="#4CAF50" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
            <List.Item
              title="Irrigation Type"
              description={userData.irrigation_type || 'Not specified'}
              left={props => <List.Icon {...props} icon="water" color="#1976D2" />}
              titleStyle={styles.listTitle}
              descriptionStyle={styles.listDescription}
            />
          </Card.Content>
        </Card>

        {/* Resources Card */}
        {(userData.crops && userData.crops.length > 0) || 
         (userData.livestock && userData.livestock.length > 0) || 
         (userData.equipment && userData.equipment.length > 0) ? (
          <Card style={styles.infoCard} elevation={3}>
            <Card.Content>
              <Title style={styles.sectionTitle}>📦 Resources</Title>
              <Divider style={styles.divider} />
              
              {userData.crops && userData.crops.length > 0 && (
                <List.Item
                  title="Crops"
                  description={userData.crops.join(', ')}
                  left={props => <List.Icon {...props} icon="sprout" color="#4CAF50" />}
                  titleStyle={styles.listTitle}
                  descriptionStyle={styles.listDescription}
                />
              )}
              
              {userData.livestock && userData.livestock.length > 0 && (
                <List.Item
                  title="Livestock"
                  description={userData.livestock.join(', ')}
                  left={props => <List.Icon {...props} icon="cow" color="#8D6E63" />}
                  titleStyle={styles.listTitle}
                  descriptionStyle={styles.listDescription}
                />
              )}
              
              {userData.equipment && userData.equipment.length > 0 && (
                <List.Item
                  title="Equipment"
                  description={userData.equipment.join(', ')}
                  left={props => <List.Icon {...props} icon="tractor" color="#FF8F00" />}
                  titleStyle={styles.listTitle}
                  descriptionStyle={styles.listDescription}
                />
              )}
            </Card.Content>
          </Card>
        ) : null}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleEditProfile}
            style={styles.actionButton}
            buttonColor="#4CAF50"
            textColor="#FFFFFF"
            icon="pencil"
          >
            Edit Profile
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutButton}
            textColor="#4CAF50"
            icon="logout"
          >
            Logout
          </Button>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon="pencil"
        style={styles.fab}
        color="#FFFFFF"
        onPress={handleEditProfile}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E8', // Light green background matching home page
  },
  // Header styles matching home page exactly
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
  backButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  settingsContainer: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  welcomeSection: {
    marginTop: 20,
    alignItems: 'flex-start',
  },
  userHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  headerAvatar: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    elevation: 3,
  },
  headerAvatarLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: 'center',
  },
  // Enhanced Card Styles matching home page
  infoCard: {
    marginBottom: 18,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    color: '#2E7D32',
  },
  divider: {
    marginBottom: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
  },
  listDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  buttonContainer: {
    marginTop: 20,
    gap: 16,
    paddingHorizontal: 4,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 15,
    elevation: 2,
    backgroundColor: '#4CAF50',
  },
  logoutButton: {
    paddingVertical: 12,
    borderRadius: 15,
    borderColor: '#4CAF50',
    borderWidth: 2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
    borderRadius: 28,
    elevation: 6,
  },
});
