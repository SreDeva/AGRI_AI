import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function MarketScreen() {
  const router = useRouter();

  const marketData = [
    {
      crop: 'Wheat',
      currentPrice: '₹2,150',
      change: '+5.2%',
      trend: 'up',
      emoji: '🌾',
      color: '#4CAF50',
    },
    {
      crop: 'Rice',
      currentPrice: '₹3,200',
      change: '-2.1%',
      trend: 'down',
      emoji: '🍚',
      color: '#F44336',
    },
    {
      crop: 'Corn',
      currentPrice: '₹1,850',
      change: '+8.5%',
      trend: 'up',
      emoji: '🌽',
      color: '#4CAF50',
    },
    {
      crop: 'Tomato',
      currentPrice: '₹4,500',
      change: '+12.3%',
      trend: 'up',
      emoji: '🍅',
      color: '#4CAF50',
    },
    {
      crop: 'Onion',
      currentPrice: '₹3,800',
      change: '-4.7%',
      trend: 'down',
      emoji: '🧅',
      color: '#F44336',
    },
  ];

  const mandis = [
    { name: 'Azadpur Mandi', location: 'Delhi', distance: '45 km' },
    { name: 'Koyambedu Market', location: 'Chennai', distance: '12 km' },
    { name: 'Vashi APMC', location: 'Mumbai', distance: '78 km' },
  ];

  const alerts = [
    'Tomato prices up 15% this week',
    'New government procurement scheme announced',
    'Monsoon forecast affects crop prices',
  ];

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
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.pageStatus}>
            <Text style={styles.pageText}>📈 Market Prices</Text>
          </View>
          
          <TouchableOpacity style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Live Market</Text>
          <Text style={styles.welcomeSubtext}>Real-time crop prices & trends 💹</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Market Alerts */}
        <Card style={styles.alertsCard} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.alertsTitle}>🚨 Market Alerts</Title>
            {alerts.map((alert, index) => (
              <View key={index} style={styles.alertItem}>
                <Ionicons name="warning" size={16} color="#FF9800" />
                <Text style={styles.alertText}>{alert}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Current Prices */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Today's Prices (per quintal)</Title>
            <Text style={styles.lastUpdated}>Last updated: 2 minutes ago</Text>
            
            <View style={styles.pricesList}>
              {marketData.map((item, index) => (
                <View key={index} style={styles.priceItem}>
                  <View style={styles.cropInfo}>
                    <Text style={styles.cropEmoji}>{item.emoji}</Text>
                    <View style={styles.cropDetails}>
                      <Text style={styles.cropName}>{item.crop}</Text>
                      <Text style={styles.cropPrice}>{item.currentPrice}</Text>
                    </View>
                  </View>
                  
                  <View style={[styles.changeContainer, { backgroundColor: item.color }]}>
                    <Ionicons 
                      name={item.trend === 'up' ? 'trending-up' : 'trending-down'} 
                      size={16} 
                      color="#FFFFFF" 
                    />
                    <Text style={styles.changeText}>{item.change}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Nearby Mandis */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Nearby Markets</Title>
            
            <View style={styles.mandisList}>
              {mandis.map((mandi, index) => (
                <TouchableOpacity key={index} style={styles.mandiItem}>
                  <View style={styles.mandiInfo}>
                    <Ionicons name="location" size={24} color="#4CAF50" />
                    <View style={styles.mandiDetails}>
                      <Text style={styles.mandiName}>{mandi.name}</Text>
                      <Text style={styles.mandiLocation}>{mandi.location} • {mandi.distance}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#4CAF50" />
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Price Analysis */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Price Analysis</Title>
            
            <View style={styles.analysisGrid}>
              <View style={styles.analysisItem}>
                <Ionicons name="trending-up" size={24} color="#4CAF50" />
                <Text style={styles.analysisLabel}>Best Performers</Text>
                <Text style={styles.analysisValue}>Tomato, Corn</Text>
              </View>
              
              <View style={styles.analysisItem}>
                <Ionicons name="trending-down" size={24} color="#F44336" />
                <Text style={styles.analysisLabel}>Price Drops</Text>
                <Text style={styles.analysisValue}>Rice, Onion</Text>
              </View>
              
              <View style={styles.analysisItem}>
                <Ionicons name="bar-chart" size={24} color="#FF9800" />
                <Text style={styles.analysisLabel}>Avg. Change</Text>
                <Text style={styles.analysisValue}>+3.8%</Text>
              </View>
              
              <View style={styles.analysisItem}>
                <Ionicons name="calendar" size={24} color="#2196F3" />
                <Text style={styles.analysisLabel}>Weekly Trend</Text>
                <Text style={styles.analysisValue}>Positive</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Quick Actions</Title>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="notifications" size={24} color="#4CAF50" />
                <Text style={styles.actionText}>Price Alerts</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="analytics" size={24} color="#4CAF50" />
                <Text style={styles.actionText}>Historical Data</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="calculator" size={24} color="#4CAF50" />
                <Text style={styles.actionText}>Profit Calculator</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share" size={24} color="#4CAF50" />
                <Text style={styles.actionText}>Share Prices</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F5E8',
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
  refreshButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  welcomeSection: {
    marginTop: 20,
    alignItems: 'center',
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
    borderColor: 'rgba(76, 175, 80, 0.1)',
    marginBottom: 18,
  },
  alertsCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    elevation: 4,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#FF9800',
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 15,
  },
  alertsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 15,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#666',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  pricesList: {
    marginTop: 10,
  },
  priceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  cropInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  cropEmoji: {
    fontSize: 32,
    marginRight: 15,
  },
  cropDetails: {
    flex: 1,
  },
  cropName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cropPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4CAF50',
    marginTop: 2,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  mandisList: {
    marginTop: 10,
  },
  mandiItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  mandiInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mandiDetails: {
    marginLeft: 12,
    flex: 1,
  },
  mandiName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  mandiLocation: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  analysisGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analysisItem: {
    width: '48%',
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  analysisLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  analysisValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
});
