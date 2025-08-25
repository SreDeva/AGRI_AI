import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity, Image } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function LearningScreen() {
  const router = useRouter();

  const courses = [
    {
      title: 'Modern Farming Techniques',
      instructor: 'Dr. Rajesh Kumar',
      duration: '4 weeks',
      level: 'Beginner',
      rating: 4.8,
      enrolled: 1250,
      progress: 65,
      image: '🌱',
    },
    {
      title: 'Organic Pest Control',
      instructor: 'Prof. Meera Sharma',
      duration: '3 weeks',
      level: 'Intermediate',
      rating: 4.9,
      enrolled: 890,
      progress: 0,
      image: '🐛',
    },
    {
      title: 'Water Management Systems',
      instructor: 'Eng. Amit Patel',
      duration: '5 weeks',
      level: 'Advanced',
      rating: 4.7,
      enrolled: 654,
      progress: 80,
      image: '💧',
    },
  ];

  const categories = [
    { name: 'Crop Science', icon: 'leaf' as const, color: '#4CAF50', count: 45 },
    { name: 'Technology', icon: 'phone-portrait' as const, color: '#2196F3', count: 32 },
    { name: 'Business', icon: 'briefcase' as const, color: '#FF9800', count: 28 },
    { name: 'Sustainability', icon: 'earth' as const, color: '#4CAF50', count: 19 },
  ];

  const articles = [
    {
      title: 'Climate-Smart Agriculture Practices',
      author: 'Agricultural Research Institute',
      readTime: '8 min read',
      category: 'Environment',
      image: '🌍',
    },
    {
      title: 'Digital Tools for Farm Management',
      author: 'Tech Farming Journal',
      readTime: '12 min read',
      category: 'Technology',
      image: '📱',
    },
    {
      title: 'Market Analysis: Crop Pricing Trends',
      author: 'Market Research Team',
      readTime: '15 min read',
      category: 'Business',
      image: '📊',
    },
  ];

  const achievements = [
    { name: 'Course Completion', icon: 'trophy', color: '#FFD700', earned: true },
    { name: 'Knowledge Seeker', icon: 'book', color: '#4CAF50', earned: true },
    { name: 'Expert Learner', icon: 'school', color: '#2196F3', earned: false },
    { name: 'Community Helper', icon: 'people', color: '#9C27B0', earned: false },
  ];

  return (
    <ThemedView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#FF9800', '#FFB74D', '#FFCC02']}
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
            <Text style={styles.pageText}>📚 Learning Hub</Text>
          </View>
          
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Learn & Grow</Text>
          <Text style={styles.welcomeSubtext}>Knowledge for better farming 🎓</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Learning Progress */}
        <Card style={styles.progressCard} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.progressTitle}>📈 Your Progress</Title>
            
            <View style={styles.progressStats}>
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>3</Text>
                <Text style={styles.progressLabel}>Courses Enrolled</Text>
              </View>
              
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>1</Text>
                <Text style={styles.progressLabel}>Completed</Text>
              </View>
              
              <View style={styles.progressItem}>
                <Text style={styles.progressValue}>85%</Text>
                <Text style={styles.progressLabel}>Avg. Progress</Text>
              </View>
            </View>
            
            <View style={styles.streakContainer}>
              <Ionicons name="flame" size={24} color="#FF5722" />
              <Text style={styles.streakText}>7 day learning streak!</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Course Categories */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Explore Categories</Title>
            
            <View style={styles.categoriesGrid}>
              {categories.map((category, index) => (
                <TouchableOpacity key={index} style={[styles.categoryCard, { borderColor: category.color }]}>
                  <Ionicons name={category.icon} size={32} color={category.color} />
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{category.count} courses</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* My Courses */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>My Courses</Title>
            
            <View style={styles.coursesList}>
              {courses.map((course, index) => (
                <TouchableOpacity key={index} style={styles.courseItem}>
                  <View style={styles.courseHeader}>
                    <View style={styles.courseImageContainer}>
                      <Text style={styles.courseEmoji}>{course.image}</Text>
                    </View>
                    
                    <View style={styles.courseInfo}>
                      <Text style={styles.courseTitle}>{course.title}</Text>
                      <Text style={styles.courseInstructor}>By {course.instructor}</Text>
                      
                      <View style={styles.courseMetrics}>
                        <View style={styles.courseMetric}>
                          <Ionicons name="time" size={14} color="#666" />
                          <Text style={styles.metricText}>{course.duration}</Text>
                        </View>
                        
                        <View style={styles.courseMetric}>
                          <Ionicons name="star" size={14} color="#FFC107" />
                          <Text style={styles.metricText}>{course.rating}</Text>
                        </View>
                      </View>
                    </View>
                    
                    <Chip mode="outlined" textStyle={styles.levelChip}>
                      {course.level}
                    </Chip>
                  </View>
                  
                  {course.progress > 0 && (
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressText}>{course.progress}% complete</Text>
                      <View style={styles.progressBar}>
                        <View 
                          style={[styles.progressFill, { width: `${course.progress}%` }]} 
                        />
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Featured Articles */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Featured Articles</Title>
            
            <View style={styles.articlesList}>
              {articles.map((article, index) => (
                <TouchableOpacity key={index} style={styles.articleItem}>
                  <View style={styles.articleImageContainer}>
                    <Text style={styles.articleEmoji}>{article.image}</Text>
                  </View>
                  
                  <View style={styles.articleContent}>
                    <Text style={styles.articleTitle}>{article.title}</Text>
                    <Text style={styles.articleAuthor}>By {article.author}</Text>
                    
                    <View style={styles.articleMeta}>
                      <Text style={styles.articleCategory}>{article.category}</Text>
                      <Text style={styles.articleReadTime}>{article.readTime}</Text>
                    </View>
                  </View>
                  
                  <Ionicons name="chevron-forward" size={20} color="#FF9800" />
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Achievements */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>🏆 Achievements</Title>
            
            <View style={styles.achievementsGrid}>
              {achievements.map((achievement, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.achievementItem,
                    { opacity: achievement.earned ? 1 : 0.5 }
                  ]}
                >
                  <Ionicons 
                    name={achievement.icon as any} 
                    size={32} 
                    color={achievement.earned ? achievement.color : '#CCCCCC'} 
                  />
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                  {achievement.earned && (
                    <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                  )}
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Quick Actions</Title>
            
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="add-circle" size={24} color="#FF9800" />
                <Text style={styles.actionText}>Browse Courses</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="download" size={24} color="#FF9800" />
                <Text style={styles.actionText}>Offline Content</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="people" size={24} color="#FF9800" />
                <Text style={styles.actionText}>Study Groups</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="ribbon" size={24} color="#FF9800" />
                <Text style={styles.actionText}>Certificates</Text>
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
    backgroundColor: '#FFF8E1',
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
  searchButton: {
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
    borderColor: 'rgba(255, 152, 0, 0.1)',
    marginBottom: 18,
  },
  progressCard: {
    backgroundColor: '#FFF3E0',
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
    color: '#E65100',
    marginBottom: 15,
  },
  progressTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF9800',
    marginBottom: 15,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  progressItem: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FF9800',
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 15,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF5722',
    marginLeft: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  categoryCount: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  coursesList: {
    marginTop: 10,
  },
  courseItem: {
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    marginBottom: 15,
  },
  courseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  courseImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  courseEmoji: {
    fontSize: 24,
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  courseInstructor: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  courseMetrics: {
    flexDirection: 'row',
  },
  courseMetric: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  metricText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  levelChip: {
    fontSize: 12,
  },
  progressContainer: {
    marginTop: 15,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF9800',
    borderRadius: 3,
  },
  articlesList: {
    marginTop: 10,
  },
  articleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  articleImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  articleEmoji: {
    fontSize: 20,
  },
  articleContent: {
    flex: 1,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  articleAuthor: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  articleMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  articleCategory: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: '600',
  },
  articleReadTime: {
    fontSize: 12,
    color: '#666',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementItem: {
    width: '48%',
    padding: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  achievementName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
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
