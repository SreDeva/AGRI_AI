import React from 'react';
import { ScrollView, StyleSheet, View, TouchableOpacity, StatusBar } from 'react-native';
import { Card, Title, Paragraph, Button, Chip, List, Text, Surface } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const router = useRouter();

  const handleFeaturePress = (feature: string) => {
    // Navigate to respective feature pages
    switch (feature) {
      case 'weather':
        router.push('/features/weather');
        break;
      case 'todo':
        router.push('/features/todo');
        break;
      case 'diagnose':
        router.push('/features/diagnose');
        break;
      case 'expert':
        router.push('/features/expert');
        break;
      case 'ai':
        router.push('/features/ai');
        break;
      case 'shop':
        router.push('/features/shop');
        break;
      case 'market':
        router.push('/features/market');
        break;
      case 'analytics':
        router.push('/features/analytics');
        break;
      case 'soil':
        router.push('/features/soil');
        break;
      case 'irrigation':
        router.push('/features/irrigation');
        break;
      case 'learning':
        router.push('/features/learning');
        break;
      default:
        console.log(`Feature ${feature} not implemented yet`);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#4CAF50', '#66BB6A', '#81C784']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statusRow}>
          <View style={styles.pageStatus}>
            <Text style={styles.pageText}>🌱 AgriSmart Home</Text>
          </View>
          <TouchableOpacity 
            style={styles.settingsContainer}
            onPress={() => router.push('/profile')}
            activeOpacity={0.7}
          >
            <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Welcome Message */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back, Farmer!</Text>
          <Text style={styles.welcomeSubtext}>Let's grow together today 🌾</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Feature Grid */}
        <View style={styles.featuresGrid}>
          {/* Weather Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeaturePress('weather')}
            activeOpacity={0.7}
          >
            <Card style={styles.card} elevation={2}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="partly-sunny-outline" size={48} color="#FF9800" />
                </View>
                <Title style={styles.cardTitle}>Weather Today</Title>
                <Paragraph style={styles.cardDescription}>
                  Tap to hear forecast
                </Paragraph>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* What to Do Today Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeaturePress('todo')}
            activeOpacity={0.7}
          >
            <Card style={styles.card} elevation={2}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="checkmark-circle-outline" size={48} color="#4CAF50" />
                </View>
                <Title style={styles.cardTitle}>What to Do Today</Title>
                <Paragraph style={styles.cardDescription}>
                  Water tomatoes Calendar
                </Paragraph>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Diagnose Crop Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeaturePress('diagnose')}
            activeOpacity={0.7}
          >
            <Card style={styles.card} elevation={2}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="camera-outline" size={48} color="#2196F3" />
                </View>
                <Title style={styles.cardTitle}>Diagnose Crop</Title>
                <Paragraph style={styles.cardDescription}>
                  Tap to scan with camera
                </Paragraph>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Talk to Expert Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeaturePress('expert')}
            activeOpacity={0.7}
          >
            <Card style={styles.card} elevation={2}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="call-outline" size={48} color="#9C27B0" />
                </View>
                <Title style={styles.cardTitle}>Talk to Expert</Title>
                <Paragraph style={styles.cardDescription}>
                  Book voice call
                </Paragraph>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* AI Assistant Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeaturePress('ai')}
            activeOpacity={0.7}
          >
            <Card style={styles.card} elevation={2}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="bulb-outline" size={48} color="#FFC107" />
                </View>
                <Title style={styles.cardTitle}>AI Assistant</Title>
                <Paragraph style={styles.cardDescription}>
                  Ask anything (voice)
                </Paragraph>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Buy Inputs Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeaturePress('shop')}
            activeOpacity={0.7}
          >
            <Card style={styles.card} elevation={2}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="storefront-outline" size={48} color="#FF5722" />
                </View>
                <Title style={styles.cardTitle}>Buy Inputs</Title>
                <Paragraph style={styles.cardDescription}>
                  Seeds, tools, etc.
                </Paragraph>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Market Prices Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeaturePress('market')}
            activeOpacity={0.7}
          >
            <Card style={styles.card} elevation={2}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="trending-up-outline" size={48} color="#4CAF50" />
                </View>
                <Title style={styles.cardTitle}>Market Prices</Title>
                <Paragraph style={styles.cardDescription}>
                  Live crop prices
                </Paragraph>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Farm Analytics Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeaturePress('analytics')}
            activeOpacity={0.7}
          >
            <Card style={styles.card} elevation={2}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="bar-chart-outline" size={48} color="#3F51B5" />
                </View>
                <Title style={styles.cardTitle}>Farm Analytics</Title>
                <Paragraph style={styles.cardDescription}>
                  Track your progress
                </Paragraph>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Soil Testing Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeaturePress('soil')}
            activeOpacity={0.7}
          >
            <Card style={styles.card} elevation={2}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="flask-outline" size={48} color="#8D6E63" />
                </View>
                <Title style={styles.cardTitle}>Soil Testing</Title>
                <Paragraph style={styles.cardDescription}>
                  Analyze soil health
                </Paragraph>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Irrigation Schedule Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeaturePress('irrigation')}
            activeOpacity={0.7}
          >
            <Card style={styles.card} elevation={2}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="water-outline" size={48} color="#1976D2" />
                </View>
                <Title style={styles.cardTitle}>Irrigation</Title>
                <Paragraph style={styles.cardDescription}>
                  Smart water schedule
                </Paragraph>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          {/* Learning Hub Card */}
          <TouchableOpacity 
            style={styles.featureCard}
            onPress={() => handleFeaturePress('learning')}
            activeOpacity={0.7}
          >
            <Card style={styles.card} elevation={2}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="library-outline" size={48} color="#FF9800" />
                </View>
                <Title style={styles.cardTitle}>Learning Hub</Title>
                <Paragraph style={styles.cardDescription}>
                  Farming tutorials
                </Paragraph>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E8', // Light green background
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
  pageStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
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
  welcomeText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  onlineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  erodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  erodeText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 6,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 4,
  },
  featureCard: {
    width: '49%',
    marginBottom: 18,
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
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  cardContent: {
    padding: 20,
    alignItems: 'flex-start',
    height: 170,
    justifyContent: 'space-between',
  },
  iconContainer: {
    marginBottom: 10,
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 6,
    lineHeight: 20,
  },
  cardDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 16,
    flexWrap: 'wrap',
  },
});
