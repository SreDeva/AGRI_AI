import React from 'react';
import { StyleSheet, View, ScrollView, StatusBar, TouchableOpacity, Image } from 'react-native';
import { Card, Title, Paragraph, Text, Button, Chip } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';

export default function ShopScreen() {
  const router = useRouter();

  const categories = [
    { name: 'Seeds', icon: 'leaf' as const, color: '#4CAF50' },
    { name: 'Fertilizers', icon: 'nutrition' as const, color: '#FF9800' },
    { name: 'Tools', icon: 'build' as const, color: '#9C27B0' },
    { name: 'Pesticides', icon: 'bug' as const, color: '#F44336' },
  ];

  const products = [
    {
      id: 1,
      name: 'Hybrid Tomato Seeds',
      price: '₹299',
      originalPrice: '₹399',
      rating: 4.5,
      category: 'Seeds',
      image: '🍅',
    },
    {
      id: 2,
      name: 'NPK Fertilizer 10kg',
      price: '₹850',
      originalPrice: '₹1000',
      rating: 4.8,
      category: 'Fertilizer',
      image: '🌿',
    },
    {
      id: 3,
      name: 'Garden Hand Tools Set',
      price: '₹1200',
      originalPrice: '₹1500',
      rating: 4.3,
      category: 'Tools',
      image: '🔧',
    },
  ];

  const offers = [
    'Free delivery on orders above ₹500',
    'Buy 2 Get 1 Free on selected seeds',
    'Up to 30% off on fertilizers',
  ];

  return (
    <ThemedView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header with Gradient Background */}
      <LinearGradient
        colors={['#FF5722', '#FF7043', '#FF8A65']}
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
            <Text style={styles.pageText}>🛒 Buy Inputs</Text>
          </View>
          
          <TouchableOpacity style={styles.cartButton}>
            <Ionicons name="cart" size={24} color="#FFFFFF" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Farm Store</Text>
          <Text style={styles.welcomeSubtext}>Quality inputs for better yields 🌾</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Special Offers */}
        <Card style={styles.offersCard} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.offersTitle}>🎉 Special Offers</Title>
            {offers.map((offer, index) => (
              <View key={index} style={styles.offerItem}>
                <Ionicons name="gift" size={16} color="#FF5722" />
                <Text style={styles.offerText}>{offer}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Categories */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Shop by Category</Title>
            
            <View style={styles.categoriesGrid}>
              {categories.map((category, index) => (
                <TouchableOpacity key={index} style={[styles.categoryItem, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon} size={30} color="#FFFFFF" />
                  <Text style={styles.categoryText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Featured Products */}
        <Card style={styles.card} elevation={4}>
          <Card.Content style={styles.cardContent}>
            <Title style={styles.cardTitle}>Featured Products</Title>
            
            <View style={styles.productsList}>
              {products.map((product) => (
                <View key={product.id} style={styles.productItem}>
                  <View style={styles.productImage}>
                    <Text style={styles.productEmoji}>{product.image}</Text>
                  </View>
                  
                  <View style={styles.productDetails}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <Text style={styles.productCategory}>{product.category}</Text>
                    
                    <View style={styles.priceRow}>
                      <Text style={styles.productPrice}>{product.price}</Text>
                      <Text style={styles.originalPrice}>{product.originalPrice}</Text>
                    </View>
                    
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={16} color="#FFC107" />
                      <Text style={styles.ratingText}>{product.rating}</Text>
                    </View>
                  </View>
                  
                  <TouchableOpacity style={styles.addToCartButton}>
                    <Ionicons name="add" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
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
                <Ionicons name="search" size={24} color="#FF5722" />
                <Text style={styles.actionText}>Search Products</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="list" size={24} color="#FF5722" />
                <Text style={styles.actionText}>My Orders</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart" size={24} color="#FF5722" />
                <Text style={styles.actionText}>Wishlist</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="headset" size={24} color="#FF5722" />
                <Text style={styles.actionText}>Support</Text>
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
    backgroundColor: '#FFF3E0',
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
  cartButton: {
    padding: 12,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FFEB3B',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
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
    borderColor: 'rgba(255, 87, 34, 0.1)',
    marginBottom: 18,
  },
  offersCard: {
    backgroundColor: '#FFF8F5',
    borderRadius: 20,
    elevation: 4,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: '#FF5722',
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D84315',
    marginBottom: 15,
  },
  offersTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF5722',
    marginBottom: 15,
  },
  offerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  offerText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '48%',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
  },
  productsList: {
    marginTop: 10,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#F5F5F5',
    borderRadius: 15,
    marginBottom: 12,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productEmoji: {
    fontSize: 30,
  },
  productDetails: {
    flex: 1,
    marginLeft: 15,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  productCategory: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF5722',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  addToCartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF5722',
    justifyContent: 'center',
    alignItems: 'center',
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
