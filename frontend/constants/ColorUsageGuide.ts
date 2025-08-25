// Agricultural Color Theme Usage Examples
// 
// This file shows how to use the new agricultural green theme colors
// throughout your AGRI AI app for consistent styling.

import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

/* 
EXAMPLE USAGE:

const MyComponent = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  return (
    <View style={{
      backgroundColor: colors.background,
      padding: 16,
    }}>
      <Text style={{ color: colors.text }}>
        Welcome to AGRI AI
      </Text>
      
      <Button 
        color={colors.tint}
        title="Plant Crops"
      />
      
      // For specific agricultural features:
      <Button 
        color={Colors.agricultural.soil}
        title="Soil Analysis"
      />
      
      <Button 
        color={Colors.agricultural.water}
        title="Irrigation Schedule"
      />
      
      <Button 
        color={Colors.agricultural.warning}
        title="Crop Alert"
      />
    </View>
  );
};

COLOR PALETTE:
✅ Primary Green: #4CAF50 (buttons, highlights)
🌿 Light Green: #81C784 (secondary elements)
🌱 Medium Green: #66BB6A (accents)
🍃 Background: #F1F8E9 (light) / #1B2E1F (dark)
📝 Text: #2E4A3D (light) / #E8F5E8 (dark)

AGRICULTURAL SPECIFIC:
🌾 Success: #388E3C (successful harvests, growth)
⚠️ Warning: #FF8F00 (diseases, weather alerts)
❌ Error: #D32F2F (failed crops, critical issues)
🌍 Soil: #8D6E63 (soil analysis, earth tones)
💧 Water: #1976D2 (irrigation, water management)
☀️ Sun: #FFC107 (weather, sunlight hours)
*/
