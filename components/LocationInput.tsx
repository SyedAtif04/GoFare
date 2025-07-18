import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';

interface LocationInputProps {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  showLocationButton?: boolean;
  onLocationClick?: () => void;
}

const AnimatedView = Animated.createAnimatedComponent(View);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const LocationInput: React.FC<LocationInputProps> = ({
  icon,
  placeholder,
  value,
  onChange,
  showLocationButton = false,
  onLocationClick,
}) => {
  const scale = useSharedValue(1);
  const locationButtonScale = useSharedValue(1);

  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const locationButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: locationButtonScale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const handleLocationPress = () => {
    locationButtonScale.value = withSpring(0.95, {}, () => {
      locationButtonScale.value = withSpring(1);
    });
    onLocationClick?.();
  };

  return (
    <AnimatedView style={[styles.container, containerAnimatedStyle]}>
      <TouchableOpacity
        style={styles.touchable}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name={icon} size={20} color="#6b7280" />
          </View>

          {/* Text Input */}
          <TextInput
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#9ca3af"
            value={value}
            onChangeText={onChange}
            multiline={false}
            numberOfLines={1}
          />

          {/* Location Button */}
          {showLocationButton && (
            <AnimatedTouchableOpacity
              style={[styles.locationButton, locationButtonAnimatedStyle]}
              onPress={handleLocationPress}
              activeOpacity={0.8}
            >
              <Text style={styles.locationButtonText}>Use My Location</Text>
            </AnimatedTouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </AnimatedView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  touchable: {
    borderRadius: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    color: '#1f2937',
    fontWeight: '500',
    backgroundColor: 'transparent',
  },
  locationButton: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  locationButtonText: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '500',
  },
});

export default LocationInput;
