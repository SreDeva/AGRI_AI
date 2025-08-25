import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function SoilTestingScreen() {
  const router = useRouter();

  const soilTests = [
    {
      parameter: 'pH Level',
      value: '6.8',
      status: 'Optimal',
      range: '6.0 - 7.0',
      color: '#4CAF50',
    },
    {
      parameter: 'Nitrogen (N)',
      value: '45 mg/kg',
      status: 'Low',
      range: '50-80 mg/kg',
      color: '#FF9800',
    },
    {
      parameter: 'Phosphorus (P)',
      value: '25 mg/kg',
      status: 'Adequate',
      range: '20-40 mg/kg',
      color: '#4CAF50',
    },
    {
      parameter: 'Potassium (K)',
      value: '180 mg/kg',
      status: 'High',
      range: '120-160 mg/kg',
      color: '#2196F3',
    },
    {
      parameter: 'Organic Matter',
      value: '3.2%',
      status: 'Good',
      range: '3.0-5.0%',
      color: '#4CAF50',
    },
  ];

  const recommendations = [
    {
      title: 'Nitrogen Boost',
      description: 'Apply 15-20 kg urea per acre to increase nitrogen levels',
      priority: 'High',
      color: '#F44336',
    },
    {
      title: 'Organic Matter',
      description: 'Add compost to maintain organic matter levels',
      priority: 'Medium',
      color: '#FF9800',
    },
    {
      title: 'pH Monitoring',
      description: 'Continue current practices, pH is optimal',
      priority: 'Low',
      color: '#4CAF50',
    },
  ];

  const testHistory = [
    { date: 'Mar 2024', ph: 6.8, nitrogen: 45, status: 'Current' },
    { date: 'Dec 2023', ph: 6.5, nitrogen: 52, status: 'Previous' },
    { date: 'Sep 2023', ph: 6.7, nitrogen: 48, status: 'Previous' },
  ];

  return (
    <ThemedView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#8D6E63', '#A1887F', '#BCAAA4']}
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
            <Text style={styles.pageText}>🧪 Soil Testing</Text>
          </View>
          
          <TouchableOpacity style={styles.labButton}>
            <Ionicons name="flask" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Soil Health</Text>
          <Text style={styles.welcomeSubtext}>Know your soil, grow better 🌱</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick Actions */}
        <Card style={styles.actionsCard} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.actionsTitle}>📋 Quick Actions</Title>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="add-circle" size={24} color="#8D6E63" />
                <Text style={styles.actionText}>New Test</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="camera" size={24} color="#8D6E63" />
                <Text style={styles.actionText}>Upload Report</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="location" size={24} color="#8D6E63" />
                <Text style={styles.actionText}>Find Lab</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="call" size={24} color="#8D6E63" />
                <Text style={styles.actionText}>Book Test</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Latest Test Results */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Latest Test Results</Title>
            <Text style={styles.testDate}>Tested on: March 15, 2024</Text>
            
            <View style={styles.testResults}>
              {soilTests.map((test, index) => (
                <View key={index} style={styles.testItem}>
                  <View style={styles.testInfo}>
                    <Text style={styles.testParameter}>{test.parameter}</Text>
                    <Text style={styles.testRange}>Range: {test.range}</Text>
                  </View>
                  
                  <View style={styles.testValues}>
                    <Text style={styles.testValue}>{test.value}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: test.color }]}>
                      <Text style={styles.statusText}>{test.status}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Recommendations */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>🎯 Recommendations</Title>
            
            <View style={styles.recommendationsList}>
              {recommendations.map((rec, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={[styles.priorityIndicator, { backgroundColor: rec.color }]} />
                  
                  <View style={styles.recommendationContent}>
                    <Text style={styles.recommendationTitle}>{rec.title}</Text>
                    <Text style={styles.recommendationDescription}>{rec.description}</Text>
                    
                    <View style={styles.priorityBadge}>
                      <Text style={[styles.priorityText, { color: rec.color }]}>
                        {rec.priority} Priority
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Test History */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Test History</Title>
            
            <View style={styles.historyList}>
              {testHistory.map((history, index) => (
                <TouchableOpacity key={index} style={styles.historyItem}>
                  <View style={styles.historyInfo}>
                    <Ionicons name="document-text" size={24} color="#8D6E63" />
                    <View style={styles.historyDetails}>
                      <Text style={styles.historyDate}>{history.date}</Text>
                      <Text style={styles.historyData}>
                        pH: {history.ph} • N: {history.nitrogen} mg/kg
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.historyStatus}>
                    <Text style={[
                      styles.historyStatusText,
                      { color: history.status === 'Current' ? '#4CAF50' : '#666' }
                    ]}>
                      {history.status}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#8D6E63" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Soil Health Score */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Soil Health Score</Title>
            
            <View style={styles.scoreContainer}>
              <View style={styles.scoreCircle}>
                <Text style={styles.scoreValue}>78</Text>
                <Text style={styles.scoreLabel}>/ 100</Text>
              </View>
              
              <View style={styles.scoreDetails}>
                <Text style={styles.scoreStatus}>Good Health</Text>
                <Text style={styles.scoreDescription}>
                  Your soil is in good condition with minor improvements needed for nitrogen levels.
                </Text>
                
                <View style={styles.scoreBreakdown}>
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Nutrient Balance</Text>
                    <View style={styles.breakdownBar}>
                      <View style={[styles.breakdownFill, { width: '75%', backgroundColor: '#4CAF50' }]} />
                    </View>
                  </View>
                  
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>pH Balance</Text>
                    <View style={styles.breakdownBar}>
                      <View style={[styles.breakdownFill, { width: '90%', backgroundColor: '#4CAF50' }]} />
                    </View>
                  </View>
                  
                  <View style={styles.breakdownItem}>
                    <Text style={styles.breakdownLabel}>Organic Matter</Text>
                    <View style={styles.breakdownBar}>
                      <View style={[styles.breakdownFill, { width: '80%', backgroundColor: '#4CAF50' }]} />
                    </View>
                  </View>
                </View>
              </View>
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
    backgroundColor: '#EFEBE9',
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
  labButton: {
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
    borderColor: 'rgba(141, 110, 99, 0.1)',
    marginBottom: 18,
  },
  actionsCard: {
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    elevation: 4,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#8D6E63',
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#5D4037',
    marginBottom: 15,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8D6E63',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#8D6E63',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  testDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  testResults: {
    marginTop: 10,
  },
  testItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  testInfo: {
    flex: 1,
  },
  testParameter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  testRange: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  testValues: {
    alignItems: 'flex-end',
  },
  testValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#8D6E63',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  recommendationsList: {
    marginTop: 10,
  },
  recommendationItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    marginBottom: 12,
  },
  priorityIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 15,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  recommendationDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priorityBadge: {
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  historyList: {
    marginTop: 10,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  historyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyDetails: {
    marginLeft: 12,
    flex: 1,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyData: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  historyStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyStatusText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8D6E63',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  scoreDetails: {
    flex: 1,
  },
  scoreStatus: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
    marginBottom: 8,
  },
  scoreDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  scoreBreakdown: {
    marginTop: 10,
  },
  breakdownItem: {
    marginBottom: 10,
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  breakdownBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownFill: {
    height: '100%',
    borderRadius: 3,
  },
});
