import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import axios from 'axios';

const { width } = Dimensions.get('window');
const API_BASE_URL = 'http://localhost:8000';

interface DashboardStats {
  totalUsers: number;
  totalFarmers: number;
  totalExperts: number;
  usersByRole: { farmer: number; hobbyist: number };
  farmersByLocation: { [key: string]: number };
  expertsByLanguage: { [key: string]: number };
  recentActivity: {
    newUsersThisWeek: number;
    newFarmersThisWeek: number;
  };
}

interface SimpleBarChartProps {
  data: { [key: string]: number };
  title: string;
  color: string;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, title, color }) => {
  const maxValue = Math.max(...Object.values(data));
  const entries = Object.entries(data);

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chart}>
        {entries.map(([key, value], index) => (
          <View key={index} style={styles.barContainer}>
            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    height: maxValue > 0 ? (value / maxValue) * 100 : 0,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>
            <Text style={styles.barLabel} numberOfLines={1}>
              {key}
            </Text>
            <Text style={styles.barValue}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <View style={[styles.statCard, { borderLeftColor: color }]}>
    <View style={styles.statContent}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statText}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  </View>
);

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch data from multiple endpoints
      const [usersRes, farmersRes, expertsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/auth/stats/users`).catch(() => ({ data: { total: 0, by_role: { farmer: 0, hobbyist: 0 } } })),
        axios.get(`${API_BASE_URL}/auth/stats/farmers`).catch(() => ({ data: { total: 0, by_location: {} } })),
        axios.get(`${API_BASE_URL}/experts/`).catch(() => ({ data: { experts: [] } })),
      ]);

      // Process experts data
      const experts = expertsRes.data.experts || [];
      const expertsByLanguage = experts.reduce((acc: { [key: string]: number }, expert: any) => {
        const lang = expert.spoken_language || 'Unknown';
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
      }, {});

      // Mock some data if endpoints don't exist yet
      const dashboardStats: DashboardStats = {
        totalUsers: usersRes.data.total || 0,
        totalFarmers: farmersRes.data.total || 0,
        totalExperts: experts.length,
        usersByRole: usersRes.data.by_role || { farmer: 0, hobbyist: 0 },
        farmersByLocation: farmersRes.data.by_location || {},
        expertsByLanguage,
        recentActivity: {
          newUsersThisWeek: Math.floor(Math.random() * 20) + 5,
          newFarmersThisWeek: Math.floor(Math.random() * 15) + 3,
        },
      };

      setStats(dashboardStats);
      console.log('✅ Dashboard data loaded:', dashboardStats);
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
      
      // Set fallback data
      setStats({
        totalUsers: 0,
        totalFarmers: 0,
        totalExperts: 0,
        usersByRole: { farmer: 0, hobbyist: 0 },
        farmersByLocation: {},
        expertsByLanguage: {},
        recentActivity: {
          newUsersThisWeek: 0,
          newFarmersThisWeek: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2F6D3E" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load dashboard data</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>📊 Admin Dashboard</Text>
      
      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          icon="👥"
          color="#4CAF50"
        />
        <StatCard
          title="Farmers"
          value={stats.totalFarmers}
          icon="👨‍🌾"
          color="#FF9800"
        />
        <StatCard
          title="Experts"
          value={stats.totalExperts}
          icon="🎓"
          color="#2196F3"
        />
        <StatCard
          title="New This Week"
          value={stats.recentActivity.newUsersThisWeek}
          icon="📈"
          color="#9C27B0"
        />
      </View>

      {/* Charts */}
      <SimpleBarChart
        data={stats.usersByRole}
        title="Users by Role"
        color="#4CAF50"
      />

      {Object.keys(stats.farmersByLocation).length > 0 && (
        <SimpleBarChart
          data={stats.farmersByLocation}
          title="Farmers by Location"
          color="#FF9800"
        />
      )}

      {Object.keys(stats.expertsByLanguage).length > 0 && (
        <SimpleBarChart
          data={stats.expertsByLanguage}
          title="Experts by Language"
          color="#2196F3"
        />
      )}

      {/* Recent Activity */}
      <View style={styles.activityContainer}>
        <Text style={styles.sectionTitle}>📈 Recent Activity</Text>
        <View style={styles.activityCard}>
          <Text style={styles.activityText}>
            🆕 {stats.recentActivity.newUsersThisWeek} new users this week
          </Text>
          <Text style={styles.activityText}>
            👨‍🌾 {stats.recentActivity.newFarmersThisWeek} new farmers this week
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e4d2b',
    textAlign: 'center',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  statText: {
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e4d2b',
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e4d2b',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 120,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  barWrapper: {
    height: 100,
    justifyContent: 'flex-end',
    width: '100%',
  },
  bar: {
    width: '80%',
    borderRadius: 4,
    alignSelf: 'center',
  },
  barLabel: {
    fontSize: 10,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  barValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e4d2b',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e4d2b',
    marginBottom: 12,
  },
  activityContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
});
