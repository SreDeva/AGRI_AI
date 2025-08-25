import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { Card, Title, Paragraph, Text, Button } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function ExpertScreen() {
  const router = useRouter();

  const experts = [
    { 
      id: 1, 
      name: 'Dr. Rajesh Kumar', 
      specialty: 'Crop Disease Specialist', 
      rating: 4.8, 
      available: true,
      experience: '15 years'
    },
    { 
      id: 2, 
      name: 'Dr. Priya Sharma', 
      specialty: 'Soil Health Expert', 
      rating: 4.9, 
      available: false,
      experience: '12 years'
    },
    { 
      id: 3, 
      name: 'Dr. Anand Patel', 
      specialty: 'Organic Farming Consultant', 
      rating: 4.7, 
      available: true,
      experience: '18 years'
    },
  ];

  const handleBookCall = (expertId: number) => {
    console.log('Booking call with expert:', expertId);
  };

  return (
    <ThemedView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#9C27B0', '#BA68C8', '#CE93D8']}
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
            <Text style={styles.pageText}>📞 Talk to Expert</Text>
          </View>
          
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Get Expert Help</Text>
          <Text style={styles.welcomeSubtext}>Connect with agricultural specialists 👨‍🌾</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Available Experts</Title>
            <Paragraph style={styles.cardDescription}>
              Connect with certified agricultural experts for personalized advice.
            </Paragraph>
            
            <View style={styles.expertsList}>
              {experts.map((expert) => (
                <View key={expert.id} style={styles.expertItem}>
                  <View style={styles.expertAvatar}>
                    <Ionicons name="person" size={32} color="#9C27B0" />
                  </View>
                  
                  <View style={styles.expertInfo}>
                    <Text style={styles.expertName}>{expert.name}</Text>
                    <Text style={styles.expertSpecialty}>{expert.specialty}</Text>
                    <View style={styles.expertMeta}>
                      <View style={styles.ratingContainer}>
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text style={styles.rating}>{expert.rating}</Text>
                      </View>
                      <Text style={styles.experience}>{expert.experience}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.expertActions}>
                    <View style={[styles.statusBadge, { backgroundColor: expert.available ? '#4CAF50' : '#FF5722' }]}>
                      <Text style={styles.statusText}>
                        {expert.available ? 'Available' : 'Busy'}
                      </Text>
                    </View>
                    <Button
                      mode="contained"
                      onPress={() => handleBookCall(expert.id)}
                      style={styles.callButton}
                      buttonColor="#9C27B0"
                      textColor="#FFFFFF"
                      disabled={!expert.available}
                      compact
                    >
                      Call Now
                    </Button>
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Quick Support</Title>
            
            <View style={styles.supportOptions}>
              <TouchableOpacity style={styles.supportItem}>
                <Ionicons name="chatbubbles-outline" size={32} color="#9C27B0" />
                <Text style={styles.supportText}>Live Chat</Text>
                <Text style={styles.supportDesc}>Instant messaging</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.supportItem}>
                <Ionicons name="videocam-outline" size={32} color="#2196F3" />
                <Text style={styles.supportText}>Video Call</Text>
                <Text style={styles.supportDesc}>Face-to-face consultation</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.supportItem}>
                <Ionicons name="document-text-outline" size={32} color="#FF9800" />
                <Text style={styles.supportText}>Submit Query</Text>
                <Text style={styles.supportDesc}>Written consultation</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.supportItem}>
                <Ionicons name="calendar-outline" size={32} color="#4CAF50" />
                <Text style={styles.supportText}>Schedule</Text>
                <Text style={styles.supportDesc}>Book appointment</Text>
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
    backgroundColor: '#F3E5F5',
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
    borderColor: 'rgba(156, 39, 176, 0.1)',
    marginBottom: 18,
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#7B1FA2',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  expertsList: {
    marginTop: 10,
  },
  expertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  expertAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3E5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  expertInfo: {
    flex: 1,
  },
  expertName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  expertSpecialty: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
  },
  expertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  experience: {
    fontSize: 12,
    color: '#666',
  },
  expertActions: {
    alignItems: 'center',
    gap: 8,
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
  callButton: {
    paddingVertical: 2,
    borderRadius: 8,
  },
  supportOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  supportItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 12,
  },
  supportText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  supportDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
});
