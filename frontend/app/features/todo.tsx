import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Text, Checkbox } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function TodoScreen() {
  const router = useRouter();
  
  const todoItems = [
    { id: 1, task: 'Water tomato plants', completed: false, time: '6:00 AM' },
    { id: 2, task: 'Check irrigation system', completed: true, time: '7:30 AM' },
    { id: 3, task: 'Fertilize corn field', completed: false, time: '9:00 AM' },
    { id: 4, task: 'Inspect pest traps', completed: false, time: '11:00 AM' },
    { id: 5, task: 'Harvest lettuce', completed: true, time: '2:00 PM' },
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
            <Text style={styles.pageText}>✅ What to Do Today</Text>
          </View>
          
          <View style={styles.placeholder} />
        </View>
        
        {/* Progress Info */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>3 of 5 tasks</Text>
          <Text style={styles.welcomeSubtext}>Keep up the great work! 🌱</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Today's Farm Tasks</Title>
            <Paragraph style={styles.cardDescription}>
              Stay organized and productive with your daily farming schedule.
            </Paragraph>
            
            <View style={styles.taskList}>
              {todoItems.map((item) => (
                <View key={item.id} style={styles.taskItem}>
                  <Checkbox
                    status={item.completed ? 'checked' : 'unchecked'}
                    color="#4CAF50"
                  />
                  <View style={styles.taskContent}>
                    <Text style={[styles.taskText, item.completed && styles.completedTask]}>
                      {item.task}
                    </Text>
                    <Text style={styles.taskTime}>{item.time}</Text>
                  </View>
                  <Ionicons 
                    name={item.completed ? "checkmark-circle" : "time-outline"} 
                    size={20} 
                    color={item.completed ? "#4CAF50" : "#FF9800"} 
                  />
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Quick Actions</Title>
            
            <View style={styles.actionGrid}>
              <TouchableOpacity style={styles.actionItem}>
                <Ionicons name="add-circle-outline" size={32} color="#4CAF50" />
                <Text style={styles.actionText}>Add Task</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionItem}>
                <Ionicons name="calendar-outline" size={32} color="#2196F3" />
                <Text style={styles.actionText}>Schedule</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionItem}>
                <Ionicons name="notifications-outline" size={32} color="#FF9800" />
                <Text style={styles.actionText}>Reminders</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionItem}>
                <Ionicons name="stats-chart-outline" size={32} color="#9C27B0" />
                <Text style={styles.actionText}>Progress</Text>
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
  placeholder: {
    width: 48,
  },
  welcomeSection: {
    marginTop: 20,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 32,
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
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  taskList: {
    marginTop: 10,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  taskContent: {
    flex: 1,
    marginLeft: 10,
  },
  taskText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  taskTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  actionItem: {
    width: '45%',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
});
