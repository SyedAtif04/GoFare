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

import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
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
  const [showTraffic, setShowTraffic] = useState(true);
  const [alternateRoutes, setAlternateRoutes] = useState<any[]>([]);
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

  // Fetch route from backend with traffic and alternate routes
  const fetchRoute = async () => {
    if (!pickupCoords || !destinationCoords) return;

    try {
      const origin = `${pickupCoords.latitude},${pickupCoords.longitude}`;
      const destination = `${destinationCoords.latitude},${destinationCoords.longitude}`;

      // Request directions with traffic and alternate routes
      const directionsData = await apiService.getDirections(origin, destination, {
        mode: 'driving',
        alternatives: true,
        traffic_model: 'best_guess',
        departure_time: 'now'
      });

      if (directionsData.routes && directionsData.routes.length > 0) {
        const mainRoute = directionsData.routes[0];
        const leg = mainRoute.legs[0];

        // Set duration and distance (with traffic if available)
        const durationInTraffic = (leg as any).duration_in_traffic || leg.duration;
        setDuration(durationInTraffic.text);
        setDistance(leg.distance.text);

        // Decode polyline for main route visualization
        const coordinates = decodePolyline(mainRoute.overview_polyline.points);
        setRouteCoordinates(coordinates);

        // Store alternate routes
        if (directionsData.routes.length > 1) {
          const alternates = directionsData.routes.slice(1).map(route => ({
            coordinates: decodePolyline(route.overview_polyline.points),
            duration: route.legs[0].duration.text,
            distance: route.legs[0].distance.text,
            summary: route.summary
          }));
          setAlternateRoutes(alternates);
        }

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
      // Fallback: create a simple straight line
      setRouteCoordinates([pickupCoords, destinationCoords]);
      setDuration('~15 mins');
      setDistance('~5 km');
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



  // Default coordinates (Delhi) if no coordinates provided
  const defaultRegion = {
    latitude: 28.6139,
    longitude: 77.2090,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Helper function to get map region based on pickup/destination
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

    if (pickupCoords) {
      return {
        latitude: pickupCoords.latitude,
        longitude: pickupCoords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    return defaultRegion;
  };

  // Helper function to generate cab positions around the route
  const generateCabPosition = (index: number, pickup?: { latitude: number; longitude: number }, destination?: { latitude: number; longitude: number }) => {
    if (pickup && destination) {
      const latDiff = destination.latitude - pickup.latitude;
      const lngDiff = destination.longitude - pickup.longitude;

      // Distribute cabs along the route with some random offset
      const progress = (index + 1) / 6; // 6 total positions
      const randomOffset = (Math.random() - 0.5) * 0.002; // Small random offset

      return {
        latitude: pickup.latitude + (latDiff * progress) + randomOffset,
        longitude: pickup.longitude + (lngDiff * progress) + randomOffset,
      };
    }

    // Fallback to default region with offset
    return {
      latitude: defaultRegion.latitude + (index * 0.001),
      longitude: defaultRegion.longitude + (index * 0.001),
    };
  };

  // Custom map style for a clean look
  const mapStyle = [
    {
      featureType: 'poi',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
    {
      featureType: 'transit',
      elementType: 'labels',
      stylers: [{ visibility: 'off' }],
    },
  ];

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
      {/* Real Google Maps */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'ios' ? undefined : PROVIDER_GOOGLE}
        initialRegion={getMapRegion()}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        showsScale={false}
        showsBuildings={true}
        showsTraffic={showTraffic}
        mapType="standard"
        customMapStyle={Platform.OS === 'android' ? mapStyle : undefined}
      >
        {/* Pickup Marker */}
        {pickupCoords && (
          <Marker
            coordinate={pickupCoords}
            title="Pickup Location"
            description={pickup}
            pinColor="#10B981"
          >
            <View style={styles.customMarker}>
              <View style={[styles.markerCircle, { backgroundColor: '#10B981' }]}>
                <Ionicons name="location" size={20} color="#FFFFFF" />
              </View>
            </View>
          </Marker>
        )}

        {/* Destination Marker */}
        {destinationCoords && (
          <Marker
            coordinate={destinationCoords}
            title="Destination"
            description={destination}
            pinColor="#EF4444"
          >
            <View style={styles.customMarker}>
              <View style={[styles.markerCircle, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="flag" size={20} color="#FFFFFF" />
              </View>
            </View>
          </Marker>
        )}

        {/* Main Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#3B82F6"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}

        {/* Alternate Routes */}
        {alternateRoutes.map((route, index) => (
          <Polyline
            key={`alternate-${index}`}
            coordinates={route.coordinates}
            strokeColor="#9CA3AF"
            strokeWidth={3}
            lineDashPattern={[5, 5]}
          />
        ))}

        {/* Cab Markers */}
        {rides.slice(0, 5).map((ride, index) => {
          const cabPosition = generateCabPosition(index, pickupCoords, destinationCoords);
          return (
            <Marker
              key={ride.id}
              coordinate={cabPosition}
              title={`${ride.provider} - ${ride.cabType}`}
              description={`₹${ride.fare} • ${ride.eta}m ETA`}
              onPress={() => onRideSelect(ride)}
            >
              <View style={styles.cabMarkerWrapper}>
                <View style={[styles.cabMarkerContainer, { backgroundColor: ride.color + '15' }]}>
                  <MaterialIcons
                    name={getCabIcon(ride.cabType) as any}
                    size={16}
                    color={ride.color}
                  />
                </View>
                <View style={[styles.cabMarkerBadge, { backgroundColor: ride.color }]}>
                  <Text style={styles.cabMarkerText}>₹{ride.fare}</Text>
                </View>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Compact Trip Info Overlay */}
      <View style={styles.compactTripInfo}>
        <View style={styles.tripInfoRow}>
          {duration && (
            <View style={styles.tripInfoItem}>
              <Ionicons name="time-outline" size={14} color="#3B82F6" />
              <Text style={styles.tripInfoText}>{duration}</Text>
            </View>
          )}
          {distance && (
            <View style={styles.tripInfoItem}>
              <Ionicons name="car-outline" size={14} color="#3B82F6" />
              <Text style={styles.tripInfoText}>{distance}</Text>
            </View>
          )}
          {showTraffic && (
            <View style={styles.tripInfoItem}>
              <Ionicons name="information-circle-outline" size={14} color="#3B82F6" />
              <Text style={styles.tripInfoText}>Live Traffic</Text>
            </View>
          )}
        </View>
      </View>





      {/* Compact Location Card */}
      <View style={styles.compactLocationCard}>
        <View style={styles.locationRow}>
          <Ionicons name="radio-button-on" size={12} color="#10B981" />
          <Text style={styles.compactLocationText} numberOfLines={1}>
            {pickup.length > 25 ? pickup.substring(0, 25) + '...' : pickup}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location" size={12} color="#EF4444" />
          <Text style={styles.compactLocationText} numberOfLines={1}>
            {destination.length > 25 ? destination.substring(0, 25) + '...' : destination}
          </Text>
        </View>
      </View>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={[styles.controlButton, showTraffic && styles.controlButtonActive]}
          onPress={() => setShowTraffic(!showTraffic)}
        >
          <Ionicons
            name="car"
            size={20}
            color={showTraffic ? "#FFFFFF" : "#3B82F6"}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            if (mapRef.current) {
              mapRef.current.animateToRegion(getMapRegion(), 1000);
            }
          }}
        >
          <Ionicons name="locate" size={20} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            // Refresh route data
            fetchRoute();
          }}
        >
          <Ionicons name="refresh" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Compact Ride Summary */}
      <View style={styles.compactRideSummary}>
        <View style={styles.summaryRow}>
          <Text style={styles.compactSummaryText}>{rides.length} rides</Text>
          <Text style={styles.compactSummaryText}>From ₹{Math.min(...rides.map(r => r.fare))}</Text>
          <Text style={styles.compactSummaryText}>{Math.min(...rides.map(r => r.eta))}m ETA</Text>
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
  // Compact trip info styles
  compactTripInfo: {
    position: 'absolute',
    top: 15,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tripInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tripInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripInfoText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
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
  cabMarkerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cabMarkerContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  cabMarkerText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
  compactLocationCard: {
    position: 'absolute',
    bottom: 80,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  compactLocationText: {
    flex: 1,
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 8,
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
  locationDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
    marginLeft: 24,
  },
  mapControls: {
    position: 'absolute',
    right: 20,
    top: 120,
    alignItems: 'center',
  },
  controlButton: {
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
  controlButtonActive: {
    backgroundColor: '#3B82F6',
  },
  compactRideSummary: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactSummaryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
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
