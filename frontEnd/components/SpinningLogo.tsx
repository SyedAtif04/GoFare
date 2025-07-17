import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

interface SpinningLogoProps {
  size?: number;
  color?: string;
  type?: 'react' | 'default';
  spinning?: boolean;
  source?: any; // For custom image logos
}

const SpinningLogo: React.FC<SpinningLogoProps> = ({
  size = 96,
  color = '#646cff',
  type = 'default',
  spinning = true,
  source,
}) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    if (spinning) {
      // Start the infinite rotation animation (20 seconds per rotation)
      rotation.value = withRepeat(
        withTiming(360, { duration: 20000 }),
        -1, // infinite
        false // don't reverse
      );
    } else {
      rotation.value = withTiming(0, { duration: 300 });
    }
  }, [spinning]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${rotation.value}deg`,
        },
      ],
    };
  });

  const logoColor = type === 'react' ? '#61dafb' : color;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View style={[styles.logoContainer, animatedStyle]}>
        {source ? (
          <Image source={source} style={[styles.logo, { width: size, height: size }]} />
        ) : (
          <Ionicons 
            name="logo-react" 
            size={size * 0.8} 
            color={logoColor}
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    resizeMode: 'contain',
  },
});

export default SpinningLogo;
