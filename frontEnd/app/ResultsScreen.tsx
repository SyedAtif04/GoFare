import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Import components
import FilterSheet from '../components/FilterSheet';
import LoadingState from '../components/LoadingState';
import MapView from '../components/MapView';
import WeatherRideSuggestion from '../components/WeatherRideSuggestion';
import { apiService } from '../services/apiService';

const { width, height } = Dimensions.get('window');

interface RideOption {
  id: string;
  provider: string;
  providerLogo: string;
  cabType: string;
  cabIcon: string;
  fare: number;
  eta: number;
  duration: number;
  surge: boolean;
  surgeMultiplier?: number;
  rating: number;
  color: string;
}

const ResultsScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const {
    pickup,
    destination,
    selectedCabType,
    pickupPlaceId,
    pickupLat,
    pickupLng,
    destinationPlaceId,
    destLat,
    destLng
  } = params;

  // Parse coordinates
  const pickupCoords = pickupLat && pickupLng ? {
    latitude: parseFloat(pickupLat as string),
    longitude: parseFloat(pickupLng as string)
  } : undefined;

  const destinationCoords = destLat && destLng ? {
    latitude: parseFloat(destLat as string),
    longitude: parseFloat(destLng as string)
  } : undefined;

  // Log coordinates when component mounts
  useEffect(() => {
    console.log('🚕 ResultsScreen - PICKUP COORDINATES:', pickupCoords);
    console.log('🏁 ResultsScreen - DESTINATION COORDINATES:', destinationCoords);
    console.log('📍 Pickup Place ID:', pickupPlaceId);
    console.log('📍 Destination Place ID:', destinationPlaceId);
  }, []);
  
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [rideOptions, setRideOptions] = useState<RideOption[]>([]);
  const [sortBy, setSortBy] = useState<'fare' | 'eta'>('fare');
  const [showFilters, setShowFilters] = useState(false);
  const [showWeatherModal, setShowWeatherModal] = useState(false);
  // Initialize filters based on home screen selection
  const getInitialFilters = () => {
    if (selectedCabType && typeof selectedCabType === 'string' && selectedCabType !== 'all') {
      // If a specific cab type was selected on home screen, start with only that type
      return {
        cabTypes: [selectedCabType.toLowerCase()],
        surgeFreOnly: false,
      };
    } else {
      // If no specific type or "all" was selected, start with all types
      return {
        cabTypes: ['bike', 'mini', 'sedan', 'suv', 'auto'],
        surgeFreOnly: false,
      };
    }
  };

  const [filters, setFilters] = useState(getInitialFilters());

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const [cardAnimations] = useState(() =>
    Array.from({ length: 5 }, () => new Animated.Value(0))
  );
  const [cardScales] = useState(() =>
    Array.from({ length: 5 }, () => new Animated.Value(1))
  );

  // Mock ride data
  const mockRideData: RideOption[] = [
    {
      id: '1',
      provider: 'Uber',
      providerLogo: 'car',
      cabType: 'Mini',
      cabIcon: 'car',
      fare: 120,
      eta: 4,
      duration: 20,
      surge: false,
      rating: 4.8,
      color: '#000000',
    },
    {
      id: '2',
      provider: 'Ola',
      providerLogo: 'car-sport',
      cabType: 'Sedan',
      cabIcon: 'car-sport',
      fare: 180,
      eta: 6,
      duration: 18,
      surge: true,
      surgeMultiplier: 1.5,
      rating: 4.6,
      color: '#FFD700',
    },
    {
      id: '3',
      provider: 'Rapido',
      providerLogo: 'bicycle',
      cabType: 'Bike',
      cabIcon: 'bicycle',
      fare: 45,
      eta: 2,
      duration: 15,
      surge: false,
      rating: 4.5,
      color: '#FF6B35',
    },
    {
      id: '4',
      provider: 'Uber',
      providerLogo: 'car',
      cabType: 'SUV',
      cabIcon: 'car-sport',
      fare: 250,
      eta: 8,
      duration: 22,
      surge: false,
      rating: 4.9,
      color: '#000000',
    },
    {
      id: '5',
      provider: 'Ola',
      providerLogo: 'car-sport',
      cabType: 'Auto',
      cabIcon: 'car',
      fare: 85,
      eta: 3,
      duration: 25,
      surge: true,
      surgeMultiplier: 1.2,
      rating: 4.3,
      color: '#FFD700',
    },
  ];

  useEffect(() => {
    const fetchRideEstimates = async () => {
      try {
        // Check if we have coordinates
        if (!pickupLat || !pickupLng || !destLat || !destLng) {
          console.log('❌ Missing coordinates for ride estimates');
          // Fallback to mock data
          setRideOptions(mockRideData);
          setIsLoading(false);
          return;
        }

        console.log('🚗 Fetching real ride estimates...');
        console.log('📍 Pickup:', pickupLat, pickupLng);
        console.log('🏁 Destination:', destLat, destLng);

        // Get real estimates from all providers
        const estimates = await apiService.getAllRideEstimates(
          parseFloat(pickupLat),
          parseFloat(pickupLng),
          parseFloat(destLat),
          parseFloat(destLng)
        );

        console.log('✅ Received estimates:', estimates.length);

        if (estimates.length > 0) {
          setRideOptions(estimates);
        } else {
          console.log('⚠️ No estimates received, using mock data');
          setRideOptions(mockRideData);
        }

      } catch (error) {
        console.error('❌ Error fetching ride estimates:', error);
        // Fallback to mock data on error
        setRideOptions(mockRideData);
      } finally {
        setIsLoading(false);

        // Start animations
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();

        // Stagger card animations
        cardAnimations.forEach((anim, index) => {
          Animated.timing(anim, {
            toValue: 1,
            duration: 300,
            delay: index * 100,
            useNativeDriver: true,
          }).start();
        });
      }
    };

    // Add delay for better UX
    setTimeout(fetchRideEstimates, 1500);
  }, [pickupLat, pickupLng, destLat, destLng]);

  const getSortedRides = () => {
    let filtered = rideOptions.filter(ride => {
      // Filter logic:
      // - Home screen selection sets INITIAL filter state
      // - Filter sheet has FULL CONTROL to add/remove any cab types
      // - User can override home selection completely via filter sheet

      // 1. Filter by current filter selections (from filter sheet)
      const filterCabTypeMatch = filters.cabTypes.includes(ride.cabType.toLowerCase());

      // 2. Filter by surge preference
      const surgeMatch = filters.surgeFreOnly ? !ride.surge : true;

      return filterCabTypeMatch && surgeMatch;
    });

    return filtered.sort((a, b) => {
      if (sortBy === 'fare') {
        return a.fare - b.fare;
      } else {
        return a.eta - b.eta;
      }
    });
  };

  const handleBookRide = (ride: RideOption) => {
    Alert.alert(
      'Book Ride',
      `Book ${ride.provider} ${ride.cabType} for ₹${ride.fare}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Book Now', onPress: () => console.log('Booking ride...') },
      ]
    );
  };





  const toggleViewMode = (mode: 'map' | 'list') => {
    // Add a subtle fade animation when switching views
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setViewMode(mode);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={['#F0F9FF', '#E0F2FE', '#F8FAFC']}
        style={styles.backgroundGradient}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Available Rides ({getSortedRides().length})</Text>
          <Text style={styles.headerSubtitle}>
            {pickup} → {destination}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => setShowWeatherModal(true)} style={styles.weatherButton}>
            <Ionicons name="partly-sunny" size={24} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filterButton}>
            <Ionicons name="options" size={24} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonWithAnimation,
            viewMode === 'list' && styles.toggleButtonActive
          ]}
          onPress={() => toggleViewMode('list')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="list"
            size={20}
            color={viewMode === 'list' ? '#FFFFFF' : '#6B7280'}
          />
          <Text style={[
            styles.toggleText,
            viewMode === 'list' && styles.toggleTextActive
          ]}>
            List View
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.toggleButton,
            styles.toggleButtonWithAnimation,
            viewMode === 'map' && styles.toggleButtonActive
          ]}
          onPress={() => toggleViewMode('map')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="map"
            size={20}
            color={viewMode === 'map' ? '#FFFFFF' : '#6B7280'}
          />
          <Text style={[
            styles.toggleText,
            viewMode === 'map' && styles.toggleTextActive
          ]}>
            Map View
          </Text>
        </TouchableOpacity>
      </View>



      {/* Content */}
      <View style={styles.content}>
        {viewMode === 'map' ? (
          <MapView
            pickup={pickup as string}
            destination={destination as string}
            rides={getSortedRides()}
            onRideSelect={handleBookRide}
            pickupCoords={pickupCoords}
            destinationCoords={destinationCoords}
          />
        ) : (
          <ScrollView
            style={styles.ridesList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ridesListContent}
          >
            {getSortedRides().map((ride, index) => {
              const cardOpacity = cardAnimations[index] || new Animated.Value(1);
              const cardScale = cardScales[index] || new Animated.Value(1);

              const handleCardPress = () => {
                // Card lift animation
                Animated.sequence([
                  Animated.timing(cardScale, {
                    toValue: 0.98,
                    duration: 100,
                    useNativeDriver: true,
                  }),
                  Animated.timing(cardScale, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                  }),
                ]).start();
              };

              return (
                <Animated.View
                  key={ride.id}
                  style={[
                    styles.simpleCard,
                    styles.cardWithAnimation,
                    {
                      opacity: cardOpacity,
                      transform: [{ scale: cardScale }]
                    }
                  ]}
                >
                  <TouchableOpacity
                    style={styles.cardTouchable}
                    onPress={handleCardPress}
                    activeOpacity={0.95}
                  >
                    <Text style={styles.providerText}>{ride.provider} {ride.cabType}</Text>
                    <Text style={styles.fareText}>₹{ride.fare}</Text>
                    <Text style={styles.etaText}>Arrives in {ride.eta} min • {ride.duration} min ride</Text>
                    {ride.surge && (
                      <Text style={styles.surgeText}>🔥 Surge {ride.surgeMultiplier}x</Text>
                    )}
                    <TouchableOpacity
                      style={[styles.simpleBookButton, styles.bookButtonWithAnimation]}
                      onPress={(e) => {
                        e.stopPropagation();
                        // Button glow animation
                        const buttonScale = new Animated.Value(1);
                        Animated.sequence([
                          Animated.timing(buttonScale, {
                            toValue: 1.05,
                            duration: 100,
                            useNativeDriver: true,
                          }),
                          Animated.timing(buttonScale, {
                            toValue: 1,
                            duration: 100,
                            useNativeDriver: true,
                          }),
                        ]).start();

                        setTimeout(() => handleBookRide(ride), 150);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.bookButtonText}>Book Now</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}

            {getSortedRides().length === 0 && (
              <View style={styles.noRidesContainer}>
                <Text style={styles.noRidesText}>No rides match your filters</Text>
                <Text style={styles.noRidesSubtext}>
                  Try adjusting your filters or cab type selection
                </Text>
              </View>
            )}
          </ScrollView>
        )}
      </View>

      {/* Sort Bar */}
      <View style={styles.sortBar}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'fare' && styles.sortButtonActive]}
          onPress={() => setSortBy('fare')}
        >
          <Text style={[
            styles.sortButtonText,
            sortBy === 'fare' && styles.sortButtonTextActive
          ]}>
            Lowest Fare
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'eta' && styles.sortButtonActive]}
          onPress={() => setSortBy('eta')}
        >
          <Text style={[
            styles.sortButtonText,
            sortBy === 'eta' && styles.sortButtonTextActive
          ]}>
            Shortest ETA
          </Text>
        </TouchableOpacity>
      </View>

      {/* Filter Sheet */}
      {showFilters && (
        <FilterSheet
          visible={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFiltersChange={setFilters}
        />
      )}

      {/* Weather Modal */}
      <WeatherRideSuggestion
        visible={showWeatherModal}
        onClose={() => setShowWeatherModal(false)}
        pickup={pickupCoords ? { lat: pickupCoords.latitude, lon: pickupCoords.longitude } : { lat: 28.6139, lon: 77.2090 }}
        drop={destinationCoords ? { lat: destinationCoords.latitude, lon: destinationCoords.longitude } : { lat: 28.5355, lon: 77.3910 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  weatherButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggle: {
    flexDirection: 'row',
    margin: 20,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  toggleText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  ridesContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  ridesList: {
    flex: 1,
  },
  ridesListContent: {
    padding: 20,
    paddingBottom: 100,
  },
  sortBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  sortLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginRight: 12,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#F3F4F6',
  },
  sortButtonActive: {
    backgroundColor: '#3B82F6',
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
  noRidesContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  noRidesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  noRidesSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },

  simpleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  providerText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  fareText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 8,
  },
  etaText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  surgeText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '600',
    marginBottom: 16,
  },
  simpleBookButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Animation styles
  cardWithAnimation: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTouchable: {
    flex: 1,
  },
  bookButtonWithAnimation: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButtonWithAnimation: {
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 1,
    transform: [{ scale: 1 }],
  },

  debugContainer: {
    backgroundColor: '#EF4444',
    padding: 10,
    margin: 10,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ResultsScreen;
