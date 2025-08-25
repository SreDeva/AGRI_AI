/**
 * Test script for frontend API integration
 * Run this in your React Native app's console or create a test component
 */

// Test function to verify API integration
export const testDiagnoseAPI = async () => {
  try {
    console.log('Testing diagnose API...');
    
    // Create a mock FormData (you'd use a real image in practice)
    const formData = new FormData();
    
    // Create a test blob for image
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#00FF00';
    ctx.fillRect(0, 0, 200, 200);
    
    canvas.toBlob(async (blob) => {
      if (blob) {
        formData.append('image', blob, 'test_plant.jpg');
        formData.append('crop_type', 'tomato');
        formData.append('symptoms', 'yellow spots on leaves');
        formData.append('location', 'California');
        
        try {
          // Use your API service
          const result = await api.aiAPI.diagnosePlant(formData);
          console.log('Success!', result);
          
          // Log important fields
          console.log('Primary diagnosis:', result.primary_diagnosis);
          console.log('Confidence:', result.confidence);
          console.log('Recommendations:', result.recommendations);
          console.log('LLM Analysis length:', result.llm_analysis.length);
          
        } catch (error) {
          console.error('API call failed:', error);
          
          // Log more details
          if (error.message) {
            console.error('Error message:', error.message);
          }
        }
      }
    }, 'image/jpeg');
    
  } catch (error) {
    console.error('Test setup failed:', error);
  }
};

// React Native specific test (for actual mobile app)
export const testDiagnoseAPIMobile = async () => {
  try {
    console.log('Testing diagnose API on mobile...');
    
    // Create FormData for React Native
    const formData = new FormData();
    
    // Mock image data (in real app, this would come from ImagePicker)
    const mockImageUri = 'file:///path/to/test/image.jpg';
    
    formData.append('image', {
      uri: mockImageUri,
      type: 'image/jpeg',
      name: 'test_plant.jpg',
    });
    
    formData.append('crop_type', 'tomato');
    formData.append('symptoms', 'yellow spots on leaves');
    formData.append('location', 'California');
    
    console.log('FormData created, making API call...');
    
    try {
      const result = await api.aiAPI.diagnosePlant(formData);
      console.log('Mobile API test success!', result);
      
    } catch (error) {
      console.error('Mobile API test failed:', error);
      
      // Check specific error types
      if (error.message.includes('Authentication')) {
        console.error('Authentication issue - check AsyncStorage for access_token');
      } else if (error.message.includes('Network')) {
        console.error('Network issue - check API_BASE_URL and server status');
      } else if (error.message.includes('422')) {
        console.error('Validation issue - check FormData format');
      }
    }
    
  } catch (error) {
    console.error('Mobile test setup failed:', error);
  }
};

// Debug function to check authentication
export const checkAuth = async () => {
  try {
    const token = await AsyncStorage.getItem('access_token');
    console.log('Token exists:', !!token);
    console.log('Token length:', token?.length || 0);
    
    if (token) {
      // Decode JWT to check expiration (basic check)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Date.now() / 1000;
        console.log('Token expires at:', new Date(payload.exp * 1000));
        console.log('Token is expired:', payload.exp < now);
      } catch (e) {
        console.error('Could not decode token:', e);
      }
    }
    
  } catch (error) {
    console.error('Auth check failed:', error);
  }
};

// Export for use in components
export default {
  testDiagnoseAPI,
  testDiagnoseAPIMobile,
  checkAuth
};
