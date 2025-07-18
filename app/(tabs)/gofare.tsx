import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  FadeIn,
  interpolateColor,
  SlideInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming
} from 'react-native-reanimated';

// Get screen dimensions
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Cab types data
const cabTypes = [
  { id: 'bike', name: 'Bike', icon: 'motorcycle', color: '#FF6B6B' },
  { id: 'mini', name: 'Mini', icon: 'directions-car', color: '#4ECDC4' },
  { id: 'sedan', name: 'Sedan', icon: 'directions-car', color: '#45B7D1' },
  { id: 'suv', name: 'SUV', icon: 'airport-shuttle', color: '#96CEB4' },
  { id: 'auto', name: 'Auto', icon: 'local-taxi', color: '#FFEAA7' },
  { id: 'others', name: 'Others', icon: 'more-horiz', color: '#DDA0DD' },
];

export default function GoFareScreen() {
  const router = useRouter();

  const [currentLocation, setCurrentLocation] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedCabType, setSelectedCabType] = useState('mini');

  // Animation values
  const buttonScale = useSharedValue(1);
  const currentLocationGlow = useSharedValue(0);
  const destinationGlow = useSharedValue(0);

  // Button press animation
  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }]
    };
  });

  // Input glow animations
  const currentLocationStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: currentLocationGlow.value * 0.3,
      borderColor: interpolateColor(
        currentLocationGlow.value,
        [0, 1],
        ['#E5E7EB', '#3B82F6']
      ),
    };
  });

  const destinationStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: destinationGlow.value * 0.3,
      borderColor: interpolateColor(
        destinationGlow.value,
        [0, 1],
        ['#E5E7EB', '#3B82F6']
      ),
    };
  });

  const handleUseMyLocation = () => {
    setCurrentLocation('Current Location');
    Alert.alert('Location Found', 'Using your current location for pickup!');
  };

  const handleFindRide = () => {
    if (!currentLocation || !destination) {
      Alert.alert('Missing Information', 'Please enter both pickup and destination locations.');
      return;
    }

    // Button press animation
    buttonScale.value = withSpring(0.95, {}, () => {
      buttonScale.value = withSpring(1);
    });

    // Navigate to ResultsScreen
    router.push({
      pathname: '/ResultsScreen' as any,
      params: {
        pickup: currentLocation,
        destination: destination,
        selectedCabType: cabTypes.find(cab => cab.id === selectedCabType)?.name,
      },
    });
  };

  const handleCurrentLocationFocus = () => {
    currentLocationGlow.value = withTiming(1, { duration: 200 });
  };

  const handleCurrentLocationBlur = () => {
    currentLocationGlow.value = withTiming(0, { duration: 200 });
  };

  const handleDestinationFocus = () => {
    destinationGlow.value = withTiming(1, { duration: 200 });
  };

  const handleDestinationBlur = () => {
    destinationGlow.value = withTiming(0, { duration: 200 });
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      <View style={styles.screenContainer}>
        <LinearGradient
          colors={['#DBEAFE', '#BFDBFE', '#93C5FD', '#60A5FA']}
          style={styles.container}
        >

      {/* Enhanced Background Pattern - Light Map Pattern */}
      <View style={styles.backgroundPattern}>
        {/* Map Grid Pattern */}
        <View style={styles.mapGrid}>
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, styles.horizontalLine, { top: i * 35 }]} />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLine, styles.verticalLine, { left: i * 45 }]} />
          ))}
        </View>

        {/* Map Roads/Paths */}
        <View style={styles.roadPattern}>
          <View style={[styles.road, styles.horizontalRoad, { top: 120, left: '10%', width: '80%' }]} />
          <View style={[styles.road, styles.verticalRoad, { left: '30%', top: 80, height: 200 }]} />
          <View style={[styles.road, styles.horizontalRoad, { top: 200, left: '20%', width: '60%' }]} />
          <View style={[styles.road, styles.verticalRoad, { left: '70%', top: 100, height: 150 }]} />
        </View>



        {/* Taxi Icons for Theme */}
        <View style={[styles.floatingTaxi, { top: 100, left: '25%' }]}>
          <Ionicons name="car" size={16} color="#3B82F6" />
        </View>
        <View style={[styles.floatingTaxi, { top: 170, left: '75%' }]}>
          <Ionicons name="car-sport" size={16} color="#06B6D4" />
        </View>
      </View>

      {/* Sticky Header */}
      <View style={styles.stickyHeader}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoIcon}>
              <Ionicons name="car-sport" size={24} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.logoText}>GoFare</Text>
              <Text style={styles.tagline}>Compare. Choose. Go.</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Content */}
        <View style={styles.content}>
          {/* Input Card */}
          <Animated.View entering={FadeIn.delay(200)} style={styles.inputCard}>
            {/* Current Location Input */}
            <Animated.View style={[styles.inputContainer, currentLocationStyle]}>
              <Ionicons name="location" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Where are you now?"
                placeholderTextColor="#9CA3AF"
                value={currentLocation}
                onChangeText={setCurrentLocation}
                onFocus={handleCurrentLocationFocus}
                onBlur={handleCurrentLocationBlur}
              />
              <TouchableOpacity onPress={handleUseMyLocation} style={styles.locationButton}>
                <Text style={styles.locationButtonText}>Use My Location</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Destination Input */}
            <Animated.View style={[styles.inputContainer, destinationStyle]}>
              <Ionicons name="flag" size={20} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Where to?"
                placeholderTextColor="#9CA3AF"
                value={destination}
                onChangeText={setDestination}
                onFocus={handleDestinationFocus}
                onBlur={handleDestinationBlur}
              />
            </Animated.View>
          </Animated.View>

          {/* Cab Type Selector */}
          <Animated.View entering={SlideInUp.delay(400)} style={styles.cabSelectorContainer}>
            <Text style={styles.sectionTitle}>Choose Vehicle Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cabSelector}>
              {cabTypes.map((cab, index) => (
                <TouchableOpacity
                  key={cab.id}
                  style={[
                    styles.cabTypeItem,
                    selectedCabType === cab.id && styles.cabTypeItemSelected
                  ]}
                  onPress={() => setSelectedCabType(cab.id)}
                >
                  <View style={[styles.cabIcon, { backgroundColor: cab.color + '20' }]}>
                    <MaterialIcons name={cab.icon as any} size={24} color={cab.color} />
                  </View>
                  <Text style={[
                    styles.cabTypeName,
                    selectedCabType === cab.id && styles.cabTypeNameSelected
                  ]}>
                    {cab.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>

          {/* CTA Button */}
          <Animated.View entering={SlideInUp.delay(600)} style={styles.ctaContainer}>
            <Pressable onPress={handleFindRide}>
              <Animated.View style={[buttonStyle]}>
                <LinearGradient
                  colors={['#3B82F6', '#06B6D4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaButton}
                >
                  <Text style={styles.ctaButtonText}>
                    Find the Best Ride 🚕
                  </Text>
                </LinearGradient>
              </Animated.View>
            </Pressable>
          </Animated.View>


        </View>
      </ScrollView>
      </LinearGradient>

        </View>

      {/* Beautiful City Skyline Image - Fixed at absolute bottom */}
      <View style={styles.cityImageContainer}>
        <Image
          source={require('../../assets/images/ola.png')}
          style={styles.cityImage}
          resizeMode="cover"
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#60A5FA', // Blue background as fallback
  },
  container: {
    flex: 1,
    minHeight: '100%',
  },
  stickyHeader: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    fontFamily: 'System',
  },
  tagline: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    minHeight: '100%',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: '100%',
    overflow: 'hidden',
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#94A3B8',
    opacity: 0.3,
  },
  horizontalLine: {
    left: 0,
    right: 0,
    height: 1,
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  roadPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  road: {
    position: 'absolute',
    backgroundColor: '#94A3B8',
    opacity: 0.4,
  },
  horizontalRoad: {
    height: 3,
    borderRadius: 1.5,
  },
  verticalRoad: {
    width: 3,
    borderRadius: 1.5,
  },
  cityImageContainer: {
    position: 'absolute',
    top: screenHeight - 200, // Position from top using screen height
    left: 0,
    right: 0,
    width: screenWidth,
    height: 200,
    zIndex: 999,
    pointerEvents: 'none', // Allows touches to pass through to content below
    elevation: 999, // For Android
  },
  cityImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },

  mapMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  floatingTaxi: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  content: {
    padding: 20,
    paddingTop: 30,
    paddingBottom: 220, // Padding to prevent content from hiding behind city image
    minHeight: '100%',
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    fontFamily: 'System',
  },
  locationButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  cabSelectorContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    fontFamily: 'System',
  },
  cabSelector: {
    flexDirection: 'row',
  },
  cabTypeItem: {
    alignItems: 'center',
    marginRight: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cabTypeItemSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF4FF',
  },
  cabIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cabTypeName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  cabTypeNameSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  ctaContainer: {
    marginBottom: 24,
  },
  ctaButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'System',
  },
  priceContainer: {
    marginTop: 8,
  },
  priceTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  priceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bestDeal: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#F8FAFF',
  },
  priceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
    flex: 1,
  },
  bestBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  bestText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  eta: {
    fontSize: 14,
    color: '#6B7280',
  },
});
