import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Switch } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function IrrigationScreen() {
  const router = useRouter();
  const [autoMode, setAutoMode] = React.useState(true);

  const irrigationZones = [
    {
      name: 'Zone 1 - Tomatoes',
      status: 'Active',
      moisture: '85%',
      lastWatered: '2 hours ago',
      nextScheduled: 'In 4 hours',
      color: '#4CAF50',
    },
    {
      name: 'Zone 2 - Wheat Field',
      status: 'Scheduled',
      moisture: '65%',
      lastWatered: '6 hours ago',
      nextScheduled: 'In 2 hours',
      color: '#FF9800',
    },
    {
      name: 'Zone 3 - Vegetables',
      status: 'Idle',
      moisture: '75%',
      lastWatered: '12 hours ago',
      nextScheduled: 'Tomorrow 6 AM',
      color: '#2196F3',
    },
  ];

  const todaySchedule = [
    { time: '06:00 AM', zone: 'Zone 1', duration: '30 min', status: 'Completed' },
    { time: '10:00 AM', zone: 'Zone 2', duration: '45 min', status: 'Upcoming' },
    { time: '02:00 PM', zone: 'Zone 1', duration: '25 min', status: 'Upcoming' },
    { time: '06:00 PM', zone: 'Zone 3', duration: '40 min', status: 'Upcoming' },
  ];

  const waterUsage = {
    today: '2,450L',
    thisWeek: '16,800L',
    thisMonth: '68,500L',
    efficiency: '92%',
  };

  const alerts = [
    'Zone 2 moisture level below threshold',
    'Weather forecast: Rain expected tomorrow',
    'Water tank level at 45%',
  ];

  return (
    <ThemedView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#1976D2', '#1E88E5', '#42A5F5']}
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
            <Text style={styles.pageText}>💧 Smart Irrigation</Text>
          </View>
          
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Water Smart</Text>
          <Text style={styles.welcomeSubtext}>Automated irrigation system 🚿</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* System Status */}
        <Card style={styles.statusCard} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.systemHeader}>
              <Title style={styles.statusTitle}>System Status</Title>
              <View style={styles.autoModeToggle}>
                <Text style={styles.autoModeText}>Auto Mode</Text>
                <Switch
                  value={autoMode}
                  onValueChange={setAutoMode}
                  color="#1976D2"
                />
              </View>
            </View>
            
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.statusText}>All systems operational</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Alerts */}
        {alerts.length > 0 && (
          <Card style={styles.alertsCard} elevation={4}>
            <Card.Content style={styles.cardContent}>
              <Title style={styles.alertsTitle}>🚨 Alerts & Notifications</Title>
              {alerts.map((alert, index) => (
                <View key={index} style={styles.alertItem}>
                  <Ionicons name="warning" size={16} color="#FF9800" />
                  <Text style={styles.alertText}>{alert}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Irrigation Zones */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Irrigation Zones</Title>
            
            <View style={styles.zonesList}>
              {irrigationZones.map((zone, index) => (
                <TouchableOpacity key={index} style={styles.zoneItem}>
                  <View style={styles.zoneHeader}>
                    <Text style={styles.zoneName}>{zone.name}</Text>
                    <View style={[styles.zoneStatus, { backgroundColor: zone.color }]}>
                      <Text style={styles.zoneStatusText}>{zone.status}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.zoneDetails}>
                    <View style={styles.zoneMetric}>
                      <Ionicons name="water" size={16} color="#1976D2" />
                      <Text style={styles.metricText}>Moisture: {zone.moisture}</Text>
                    </View>
                    
                    <View style={styles.zoneMetric}>
                      <Ionicons name="time" size={16} color="#1976D2" />
                      <Text style={styles.metricText}>Last: {zone.lastWatered}</Text>
                    </View>
                    
                    <View style={styles.zoneMetric}>
                      <Ionicons name="calendar" size={16} color="#1976D2" />
                      <Text style={styles.metricText}>Next: {zone.nextScheduled}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.zoneActions}>
                    <TouchableOpacity style={styles.zoneActionButton}>
                      <Ionicons name="play" size={16} color="#1976D2" />
                      <Text style={styles.actionButtonText}>Start</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.zoneActionButton}>
                      <Ionicons name="settings" size={16} color="#1976D2" />
                      <Text style={styles.actionButtonText}>Configure</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Today's Schedule */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Today's Schedule</Title>
            
            <View style={styles.scheduleList}>
              {todaySchedule.map((item, index) => (
                <View key={index} style={styles.scheduleItem}>
                  <View style={styles.scheduleTime}>
                    <Text style={styles.timeText}>{item.time}</Text>
                  </View>
                  
                  <View style={styles.scheduleDetails}>
                    <Text style={styles.scheduleZone}>{item.zone}</Text>
                    <Text style={styles.scheduleDuration}>{item.duration}</Text>
                  </View>
                  
                  <View style={[
                    styles.scheduleStatus,
                    { backgroundColor: item.status === 'Completed' ? '#4CAF50' : '#FF9800' }
                  ]}>
                    <Text style={styles.scheduleStatusText}>{item.status}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Water Usage Stats */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Water Usage Statistics</Title>
            
            <View style={styles.usageGrid}>
              <View style={styles.usageItem}>
                <Ionicons name="today" size={24} color="#1976D2" />
                <Text style={styles.usageValue}>{waterUsage.today}</Text>
                <Text style={styles.usageLabel}>Today</Text>
              </View>
              
              <View style={styles.usageItem}>
                <Ionicons name="calendar" size={24} color="#1976D2" />
                <Text style={styles.usageValue}>{waterUsage.thisWeek}</Text>
                <Text style={styles.usageLabel}>This Week</Text>
              </View>
              
              <View style={styles.usageItem}>
                <Ionicons name="stats-chart" size={24} color="#1976D2" />
                <Text style={styles.usageValue}>{waterUsage.thisMonth}</Text>
                <Text style={styles.usageLabel}>This Month</Text>
              </View>
              
              <View style={styles.usageItem}>
                <Ionicons name="leaf" size={24} color="#4CAF50" />
                <Text style={styles.usageValue}>{waterUsage.efficiency}</Text>
                <Text style={styles.usageLabel}>Efficiency</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Quick Controls */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Quick Controls</Title>
            
            <View style={styles.controlsGrid}>
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="play" size={24} color="#4CAF50" />
                <Text style={styles.controlText}>Start All Zones</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="stop" size={24} color="#F44336" />
                <Text style={styles.controlText}>Stop All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="add-circle" size={24} color="#1976D2" />
                <Text style={styles.controlText}>Add Schedule</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.controlButton}>
                <Ionicons name="analytics" size={24} color="#9C27B0" />
                <Text style={styles.controlText}>View Reports</Text>
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
    backgroundColor: '#E3F2FD',
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
  settingsButton: {
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
    borderColor: 'rgba(25, 118, 210, 0.1)',
    marginBottom: 18,
  },
  statusCard: {
    backgroundColor: '#E8F5E8',
    borderRadius: 20,
    elevation: 4,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#4CAF50',
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
    color: '#0D47A1',
    marginBottom: 15,
  },
  systemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 0,
  },
  autoModeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  autoModeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 16,
    color: '#333',
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
  zonesList: {
    marginTop: 10,
  },
  zoneItem: {
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    marginBottom: 15,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  zoneName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  zoneStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  zoneStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  zoneDetails: {
    marginBottom: 12,
  },
  zoneMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  metricText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  zoneActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  zoneActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1976D2',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
    marginLeft: 6,
  },
  scheduleList: {
    marginTop: 10,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  scheduleTime: {
    width: 80,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976D2',
  },
  scheduleDetails: {
    flex: 1,
    marginLeft: 15,
  },
  scheduleZone: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  scheduleDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  scheduleStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scheduleStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  usageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  usageItem: {
    width: '48%',
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  usageValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
  },
  usageLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  controlsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  controlButton: {
    width: '48%',
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  controlText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
});
