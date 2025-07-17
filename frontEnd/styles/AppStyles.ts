import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

// React Native equivalent of your App.css styles
export const AppStyles = StyleSheet.create({
  // Equivalent to #root
  root: {
    maxWidth: Math.min(width, 1280),
    alignSelf: 'center',
    padding: 32, // 2rem = 32px
    alignItems: 'center',
    flex: 1,
  },

  // Equivalent to .logo
  logo: {
    height: 96, // 6em ≈ 96px
    width: 96,
    padding: 24, // 1.5em ≈ 24px
    // Note: React Native doesn't support CSS filters like drop-shadow
    // We'll use shadow properties instead
  },

  // Hover effect equivalent (for touchable components)
  logoHover: {
    shadowColor: '#646cff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10, // Android shadow
  },

  // React logo hover effect
  logoReactHover: {
    shadowColor: '#61dafb',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },

  // Equivalent to .card
  card: {
    padding: 32, // 2em = 32px
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginVertical: 8,
  },

  // Equivalent to .read-the-docs
  readTheDocs: {
    color: '#888888',
    fontSize: 14,
    textAlign: 'center',
  },

  // Container styles for better layout
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  // Center content like the original CSS
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text styles
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 16,
  },

  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },

  // Button styles that match the card aesthetic
  button: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Responsive styles for different screen sizes
  responsiveContainer: {
    paddingHorizontal: width > 768 ? 32 : 16,
    maxWidth: width > 1280 ? 1280 : width,
    alignSelf: 'center',
  },
});

// Animation values that can be used with Reanimated
export const AnimationConfig = {
  logoSpin: {
    duration: 20000, // 20s
    repeat: -1, // infinite
  },
  
  transition: {
    duration: 300, // 300ms
  },

  // Easing curves
  easing: {
    linear: 'linear' as const,
    easeInOut: 'easeInOut' as const,
  },
};

// Color palette extracted from your CSS
export const Colors = {
  primary: '#646cff',
  react: '#61dafb',
  text: {
    primary: '#1f2937',
    secondary: '#6b7280',
    muted: '#888888',
  },
  background: {
    primary: '#ffffff',
    secondary: '#f8fafc',
  },
  shadow: '#000000',
};

// Spacing system (based on your rem values)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography system
export const Typography = {
  sizes: {
    small: 12,
    body: 14,
    subtitle: 16,
    title: 20,
    heading: 24,
    large: 32,
  },
  weights: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};
