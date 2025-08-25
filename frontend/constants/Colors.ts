/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * Agricultural green theme - inspired by nature, growth, and farming.
 */

const tintColorLight = '#4CAF50'; // Fresh green
const tintColorDark = '#81C784'; // Light green for dark mode

export const Colors = {
  light: {
    text: '#2E4A3D', // Dark forest green for text
    background: '#F1F8E9', // Very light green background
    tint: tintColorLight, // Primary green
    icon: '#689F73', // Medium green for icons
    tabIconDefault: '#A5C9A8', // Muted green for inactive tabs
    tabIconSelected: tintColorLight, // Active green for selected tabs
  },
  dark: {
    text: '#E8F5E8', // Light green text for dark mode
    background: '#1B2E1F', // Dark forest background
    tint: tintColorDark, // Light green tint
    icon: '#81C784', // Light green icons
    tabIconDefault: '#689F73', // Medium green for inactive tabs
    tabIconSelected: tintColorDark, // Light green for selected tabs
  },
  // Additional agricultural colors for specific use cases
  agricultural: {
    primary: '#4CAF50', // Main green
    secondary: '#81C784', // Light green
    accent: '#66BB6A', // Medium green
    surface: '#E8F5E8', // Very light green surface
    success: '#388E3C', // Dark green for success states
    warning: '#FF8F00', // Orange for warnings (crop diseases, etc.)
    error: '#D32F2F', // Red for errors
    soil: '#8D6E63', // Brown for soil-related features
    water: '#1976D2', // Blue for water/irrigation
    sun: '#FFC107', // Yellow for weather/sun
  },
};
