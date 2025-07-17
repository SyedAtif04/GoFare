import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
    View,
} from 'react-native';

// Import components
import FilterSheet from '../components/FilterSheet';
import LoadingState from '../components/LoadingState';
import MapView from '../components/MapView';
import RideCard from '../components/RideCard';

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

interface ResultsScreenProps {
  route: {
    params: {
      pickup: string;
      destination: string;
      selectedCabType?: string;
    };
  };
  navigation: any;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ route, navigation }) => {
  const { pickup, destination, selectedCabType } = route.params;
  
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  const [rideOptions, setRideOptions] = useState<RideOption[]>([]);
  const [sortBy, setSortBy] = useState<'fare' | 'eta'>('fare');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    cabTypes: ['bike', 'mini', 'sedan', 'suv', 'auto'],
    surgeFreOnly: false,
  });

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

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
    // Simulate loading
    setTimeout(() => {
      let filteredData = mockRideData;
      
      // Filter by selected cab type if provided
      if (selectedCabType) {
        filteredData = mockRideData.filter(
          ride => ride.cabType.toLowerCase() === selectedCabType.toLowerCase()
        );
      }
      
      setRideOptions(filteredData);
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
    }, 2000);
  }, []);

  const getSortedRides = () => {
    let filtered = rideOptions.filter(ride => {
      const cabTypeMatch = filters.cabTypes.includes(ride.cabType.toLowerCase());
      const surgeMatch = filters.surgeFreOnly ? !ride.surge : true;
      return cabTypeMatch && surgeMatch;
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Available Rides</Text>
          <Text style={styles.headerSubtitle}>
            {pickup} → {destination}
          </Text>
        </View>
        
        <TouchableOpacity onPress={() => setShowFilters(true)} style={styles.filterButton}>
          <Ionicons name="options" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* View Toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
          onPress={() => toggleViewMode('list')}
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
          style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
          onPress={() => toggleViewMode('map')}
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
      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {viewMode === 'map' ? (
          <MapView 
            pickup={pickup}
            destination={destination}
            rides={getSortedRides()}
            onRideSelect={handleBookRide}
          />
        ) : (
          <ScrollView 
            style={styles.ridesList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.ridesListContent}
          >
            {getSortedRides().map((ride, index) => (
              <RideCard
                key={ride.id}
                ride={ride}
                onBook={() => handleBookRide(ride)}
                animationDelay={index * 100}
              />
            ))}
          </ScrollView>
        )}
      </Animated.View>

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
    fontFamily: 'Inter_600SemiBold',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
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
    fontFamily: 'Inter_500Medium',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
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
    fontFamily: 'Inter_500Medium',
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
    fontFamily: 'Inter_500Medium',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
  },
});

export default ResultsScreen;
