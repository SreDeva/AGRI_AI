import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity, Dimensions } from 'react-native';
import { Card, Title, Paragraph, Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const router = useRouter();

  const farmStats = [
    { label: 'Total Area', value: '25 acres', icon: 'resize' as const, color: '#4CAF50' },
    { label: 'Crop Yield', value: '85%', icon: 'trending-up' as const, color: '#2196F3' },
    { label: 'Water Usage', value: '12,500L', icon: 'water' as const, color: '#00BCD4' },
    { label: 'Revenue', value: '₹4.2L', icon: 'cash' as const, color: '#FF9800' },
  ];

  const monthlyData = [
    { month: 'Jan', yield: 85, revenue: 45000 },
    { month: 'Feb', yield: 78, revenue: 42000 },
    { month: 'Mar', yield: 92, revenue: 48000 },
    { month: 'Apr', yield: 88, revenue: 46000 },
    { month: 'May', yield: 95, revenue: 52000 },
    { month: 'Jun', yield: 89, revenue: 47000 },
  ];

  const insights = [
    {
      title: 'Optimal Irrigation',
      description: 'Reduce water usage by 15% with smart scheduling',
      icon: 'water' as const,
      impact: 'High',
      color: '#00BCD4',
    },
    {
      title: 'Fertilizer Timing',
      description: 'Apply nitrogen fertilizer 2 weeks earlier for better yield',
      icon: 'leaf' as const,
      impact: 'Medium',
      color: '#4CAF50',
    },
    {
      title: 'Market Timing',
      description: 'Harvest tomatoes 3 days earlier for better market prices',
      icon: 'trending-up' as const,
      impact: 'High',
      color: '#FF9800',
    },
  ];

  const reports = [
    { name: 'Crop Performance', type: 'Weekly', status: 'Ready', color: '#4CAF50' },
    { name: 'Financial Summary', type: 'Monthly', status: 'Generating', color: '#FF9800' },
    { name: 'Resource Usage', type: 'Daily', status: 'Ready', color: '#2196F3' },
  ];

  return (
    <ThemedView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#3F51B5', '#5C6BC0', '#7986CB']}
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
            <Text style={styles.pageText}>📊 Farm Analytics</Text>
          </View>
          
          <TouchableOpacity style={styles.exportButton}>
            <Ionicons name="download" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Data Insights</Text>
          <Text style={styles.welcomeSubtext}>Make smarter farming decisions 📈</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Key Statistics */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Farm Overview</Title>
            
            <View style={styles.statsGrid}>
              {farmStats.map((stat, index) => (
                <View key={index} style={[styles.statItem, { backgroundColor: stat.color }]}>
                  <Ionicons name={stat.icon} size={24} color="#FFFFFF" />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Performance Chart */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>6-Month Performance</Title>
            
            <View style={styles.chartContainer}>
              <View style={styles.chartWrapper}>
                {monthlyData.map((data, index) => (
                  <View key={index} style={styles.chartItem}>
                    <View 
                      style={[
                        styles.chartBar, 
                        { height: (data.yield / 100) * 120, backgroundColor: '#3F51B5' }
                      ]} 
                    />
                    <Text style={styles.chartMonth}>{data.month}</Text>
                    <Text style={styles.chartValue}>{data.yield}%</Text>
                  </View>
                ))}
              </View>
              
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#3F51B5' }]} />
                  <Text style={styles.legendText}>Crop Yield (%)</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* AI Insights */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>🤖 AI Recommendations</Title>
            
            <View style={styles.insightsList}>
              {insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <View style={[styles.insightIcon, { backgroundColor: insight.color }]}>
                    <Ionicons name={insight.icon} size={20} color="#FFFFFF" />
                  </View>
                  
                  <View style={styles.insightContent}>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    <Text style={styles.insightDescription}>{insight.description}</Text>
                    
                    <View style={styles.impactBadge}>
                      <Text style={[
                        styles.impactText, 
                        { color: insight.impact === 'High' ? '#F44336' : '#FF9800' }
                      ]}>
                        {insight.impact} Impact
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Reports */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Generated Reports</Title>
            
            <View style={styles.reportsList}>
              {reports.map((report, index) => (
                <TouchableOpacity key={index} style={styles.reportItem}>
                  <View style={styles.reportInfo}>
                    <Ionicons name="document-text" size={24} color={report.color} />
                    <View style={styles.reportDetails}>
                      <Text style={styles.reportName}>{report.name}</Text>
                      <Text style={styles.reportType}>{report.type} Report</Text>
                    </View>
                  </View>
                  
                  <View style={styles.reportStatus}>
                    <Text style={[
                      styles.statusText, 
                      { color: report.status === 'Ready' ? '#4CAF50' : '#FF9800' }
                    ]}>
                      {report.status}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Analytics Tools */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Analytics Tools</Title>
            
            <View style={styles.toolsGrid}>
              <TouchableOpacity style={styles.toolButton}>
                <Ionicons name="bar-chart" size={24} color="#3F51B5" />
                <Text style={styles.toolText}>Custom Charts</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.toolButton}>
                <Ionicons name="pie-chart" size={24} color="#3F51B5" />
                <Text style={styles.toolText}>Cost Analysis</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.toolButton}>
                <Ionicons name="trending-up" size={24} color="#3F51B5" />
                <Text style={styles.toolText}>Trend Analysis</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.toolButton}>
                <Ionicons name="stats-chart" size={24} color="#3F51B5" />
                <Text style={styles.toolText}>Comparison</Text>
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
    backgroundColor: '#E8EAF6',
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
  exportButton: {
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
    borderColor: 'rgba(63, 81, 181, 0.1)',
    marginBottom: 18,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#283593',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  chartContainer: {
    marginTop: 10,
  },
  chartWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 140,
    marginBottom: 20,
  },
  chartItem: {
    alignItems: 'center',
    flex: 1,
  },
  chartBar: {
    width: 20,
    borderRadius: 10,
    marginBottom: 8,
  },
  chartMonth: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  chartValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3F51B5',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 14,
    color: '#666',
  },
  insightsList: {
    marginTop: 10,
  },
  insightItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    marginBottom: 12,
  },
  insightIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  impactBadge: {
    alignSelf: 'flex-start',
  },
  impactText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportsList: {
    marginTop: 10,
  },
  reportItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  reportInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  reportDetails: {
    marginLeft: 12,
    flex: 1,
  },
  reportName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reportType: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  reportStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  toolButton: {
    width: '48%',
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  toolText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
});
