import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const Button: React.FC<ButtonProps> = ({ 
  children, 
  onPress, 
  disabled = false, 
  style = {},
  textStyle = {}
}) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const shimmerPosition = useSharedValue(0);

  // Start shimmer animation on mount
  React.useEffect(() => {
    if (!disabled) {
      shimmerPosition.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        false
      );
    }
  }, [disabled]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateY: translateY.value }
      ],
    };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [0, 1],
      [-100, 100]
    );

    return {
      transform: [{ translateX }],
      opacity: disabled ? 0 : 0.3,
    };
  });

  const handlePressIn = () => {
    if (!disabled) {
      scale.value = withSpring(0.98);
      translateY.value = withSpring(-2);
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1);
      translateY.value = withSpring(0);
    }
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      runOnJS(onPress)();
    }
  };

  return (
    <AnimatedTouchableOpacity
      style={[styles.button, animatedStyle, style]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#2563eb', '#0d9488']} // blue-600 to teal-600
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, disabled && styles.disabled]}
      >
        {/* Shimmer effect */}
        {!disabled && (
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        )}
        
        <Text style={[styles.text, textStyle, disabled && styles.disabledText]}>
          {children}
        </Text>
      </LinearGradient>
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  disabledText: {
    opacity: 0.7,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    width: 50,
  },
});

export default Button;
