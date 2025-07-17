import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
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

interface MapViewProps {
  pickup: string;
  destination: string;
  rides: RideOption[];
  onRideSelect: (ride: RideOption) => void;
  pickupCoords?: { latitude: number; longitude: number };
  destinationCoords?: { latitude: number; longitude: number };
}

const GoFareMapView: React.FC<MapViewProps> = ({
  pickup,
  destination,
  rides,
  onRideSelect,
  pickupCoords,
  destinationCoords
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [duration, setDuration] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const mapRef = useRef<MapView>(null);

  // Fetch route when coordinates are available
  useEffect(() => {
    if (pickupCoords && destinationCoords) {
      fetchRoute();
    }

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pickupCoords, destinationCoords]);

  // Fetch route from backend
  const fetchRoute = async () => {
    if (!pickupCoords || !destinationCoords) return;

    try {
      const origin = `${pickupCoords.latitude},${pickupCoords.longitude}`;
      const destination = `${destinationCoords.latitude},${destinationCoords.longitude}`;

      const directionsData = await apiService.getDirections(origin, destination);

      if (directionsData.routes && directionsData.routes.length > 0) {
        const route = directionsData.routes[0];
        const leg = route.legs[0];

        // Set duration and distance
        setDuration(leg.duration.text);
        setDistance(leg.distance.text);

        // Decode polyline for route visualization
        const coordinates = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(coordinates);

        // Fit map to show both markers
        if (mapRef.current) {
          mapRef.current.fitToCoordinates([pickupCoords, destinationCoords], {
            edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
            animated: true,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  // Simple polyline decoder (you might want to use a library for production)
  const decodePolyline = (encoded: string) => {
    const coordinates: any[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return coordinates;
  };

  const getCabIcon = (cabType: string) => {
    switch (cabType.toLowerCase()) {
      case 'bike':
        return 'two-wheeler';
      case 'mini':
        return 'directions-car';
      case 'sedan':
        return 'directions-car';
      case 'suv':
        return 'airport-shuttle';
      case 'auto':
        return 'local-taxi';
      default:
        return 'directions-car';
    }
  };

  const CabMarker = ({ ride, position }: { ride: RideOption; position: { top: number; left: number } }) => {
    const markerScale = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
      // Initial scale animation
      Animated.spring(markerScale, {
        toValue: 1,
        delay: Math.random() * 1000,
        useNativeDriver: true,
      }).start();

      // Pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }, []);

    return (
      <Animated.View
        style={[
          styles.cabMarkerContainer,
          position,
          {
            transform: [
              { scale: markerScale },
              { scale: pulseAnim },
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => onRideSelect(ride)}
          style={[styles.cabMarkerButton, { backgroundColor: ride.color + '20' }]}
        >
          <MaterialIcons 
            name={getCabIcon(ride.cabType) as any} 
            size={20} 
            color={ride.color} 
          />
          <View style={[styles.cabMarkerBadge, { backgroundColor: ride.color }]}>
            <Text style={styles.cabMarkerText}>₹{ride.fare}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Default coordinates (Delhi) if no coordinates provided
  const defaultRegion = {
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Calculate region if both coordinates are available
  const getMapRegion = () => {
    if (pickupCoords && destinationCoords) {
      const minLat = Math.min(pickupCoords.latitude, destinationCoords.latitude);
      const maxLat = Math.max(pickupCoords.latitude, destinationCoords.latitude);
      const minLng = Math.min(pickupCoords.longitude, destinationCoords.longitude);
      const maxLng = Math.max(pickupCoords.longitude, destinationCoords.longitude);

      const latDelta = (maxLat - minLat) * 1.5; // Add padding
      const lngDelta = (maxLng - minLng) * 1.5;

      return {
        latitude: (minLat + maxLat) / 2,
        longitude: (minLng + maxLng) / 2,
        latitudeDelta: Math.max(latDelta, 0.01),
        longitudeDelta: Math.max(lngDelta, 0.01),
      };
    }
    return defaultRegion;
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      {/* Mock Map View (will be replaced with real maps later) */}
      <LinearGradient
        colors={['#EBF8FF', '#DBEAFE', '#BFDBFE']}
        style={styles.map}
      >
        {/* Coordinate Display */}
        <View style={styles.coordinateDisplay}>
          <Text style={styles.coordinateTitle}>📍 Location Coordinates:</Text>
          {pickupCoords && (
            <Text style={styles.coordinateText}>
              🚕 Pickup: {pickupCoords.latitude.toFixed(4)}, {pickupCoords.longitude.toFixed(4)}
            </Text>
          )}
          {destinationCoords && (
            <Text style={styles.coordinateText}>
              🏁 Drop: {destinationCoords.latitude.toFixed(4)}, {destinationCoords.longitude.toFixed(4)}
            </Text>
          )}
          {duration && (
            <Text style={styles.coordinateText}>⏱️ ETA: {duration}</Text>
          )}
          {distance && (
            <Text style={styles.coordinateText}>📏 Distance: {distance}</Text>
          )}
        </View>

        {/* Mock Pickup Pin */}
        <View style={[styles.locationPin, styles.pickupPin, { top: 120, left: '20%' }]}>
          <Ionicons name="location" size={24} color="#10B981" />
          <View style={styles.pinLabel}>
            <Text style={styles.pinLabelText}>Pickup</Text>
          </View>
        </View>

        {/* Mock Destination Pin */}
        <View style={[styles.locationPin, styles.destinationPin, { top: 180, left: '75%' }]}>
          <Ionicons name="flag" size={24} color="#EF4444" />
          <View style={styles.pinLabel}>
            <Text style={styles.pinLabelText}>Drop</Text>
          </View>
        </View>

        {/* Mock Route Line */}
        <View style={styles.routeLine} />

        {/* Mock Cab Markers */}
        {rides.map((ride, index) => (
          <CabMarker
            key={ride.id}
            ride={ride}
            position={{
              top: 80 + (index * 40) + Math.random() * 60,
              left: (20 + (index * 15) + Math.random() * 20) + '%',
            }}
          />
        ))}
      </LinearGradient>

      {/* ETA Info Card */}
      {(duration || distance) && (
        <View style={styles.etaCard}>
          <View style={styles.etaInfo}>
            <Ionicons name="time" size={16} color="#3B82F6" />
            <Text style={styles.etaText}>{duration}</Text>
          </View>
          <View style={styles.etaInfo}>
            <Ionicons name="car" size={16} color="#3B82F6" />
            <Text style={styles.etaText}>{distance}</Text>
          </View>
        </View>
      )}

      {/* Location Info Card */}
      <View style={styles.locationCard}>
        <View style={styles.locationItem}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText} numberOfLines={1}>
            {pickup}
          </Text>
        </View>
        <View style={styles.locationDivider} />
        <View style={styles.locationItem}>
          <View style={[styles.locationDot, styles.destinationDot]} />
          <Text style={styles.locationText} numberOfLines={1}>
            {destination}
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="locate" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="add" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="remove" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Bottom Ride Summary */}
      <View style={styles.rideSummary}>
        <Text style={styles.summaryTitle}>Available Rides</Text>
        <View style={styles.summaryStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{rides.length}</Text>
            <Text style={styles.statLabel}>Options</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>₹{Math.min(...rides.map(r => r.fare))}</Text>
            <Text style={styles.statLabel}>Lowest</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{Math.min(...rides.map(r => r.eta))}m</Text>
            <Text style={styles.statLabel}>Fastest</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  map: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
  },
  // Custom marker styles
  customMarker: {
    alignItems: 'center',
  },
  markerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerLabel: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  markerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  // Cab marker styles
  cabMarker: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cabFare: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  // ETA card styles
  etaCard: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  etaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  etaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  // Coordinate display styles
  coordinateDisplay: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  coordinateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  coordinateText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  gridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#94A3B8',
    opacity: 0.2,
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
    backgroundColor: '#64748B',
    opacity: 0.4,
    borderRadius: 2,
  },
  locationPin: {
    position: 'absolute',
    alignItems: 'center',
    zIndex: 10,
  },
  pickupPin: {},
  destinationPin: {},
  pinLabel: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pinLabelText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    fontFamily: 'Inter_600SemiBold',
  },
  routeLine: {
    position: 'absolute',
    top: 135,
    left: '25%',
    width: '50%',
    height: 2,
    backgroundColor: '#3B82F6',
    opacity: 0.6,
    borderRadius: 1,
  },
  cabMarkerContainer: {
    position: 'absolute',
    zIndex: 5,
  },
  cabMarkerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cabMarkerBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 24,
    alignItems: 'center',
  },
  cabMarkerText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  locationCard: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginRight: 12,
  },
  destinationDot: {
    backgroundColor: '#EF4444',
  },
  locationText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontFamily: 'Inter_400Regular',
  },
  locationDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
    marginLeft: 24,
  },
  quickActions: {
    position: 'absolute',
    right: 20,
    top: 120,
    alignItems: 'center',
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rideSummary: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
    fontFamily: 'Inter_700Bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontFamily: 'Inter_400Regular',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
});

export default GoFareMapView;
