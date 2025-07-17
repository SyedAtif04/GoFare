import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

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
}

const MapView: React.FC<MapViewProps> = ({ pickup, destination, rides, onRideSelect }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
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
  }, []);

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
          styles.cabMarker,
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
      {/* Map Background */}
      <LinearGradient
        colors={['#EBF8FF', '#DBEAFE', '#BFDBFE']}
        style={styles.mapBackground}
      >
        {/* Grid Pattern */}
        <View style={styles.gridPattern}>
          {Array.from({ length: 20 }).map((_, i) => (
            <View key={`h-${i}`} style={[styles.gridLine, styles.horizontalLine, { top: i * 30 }]} />
          ))}
          {Array.from({ length: 15 }).map((_, i) => (
            <View key={`v-${i}`} style={[styles.gridLine, styles.verticalLine, { left: i * 30 }]} />
          ))}
        </View>

        {/* Roads */}
        <View style={styles.roadPattern}>
          <View style={[styles.road, { top: 100, left: '10%', width: '80%', height: 4 }]} />
          <View style={[styles.road, { top: 200, left: '20%', width: '60%', height: 4 }]} />
          <View style={[styles.road, { left: '30%', top: 50, width: 4, height: 200 }]} />
          <View style={[styles.road, { left: '70%', top: 80, width: 4, height: 150 }]} />
        </View>

        {/* Pickup Pin */}
        <View style={[styles.locationPin, styles.pickupPin, { top: 120, left: '20%' }]}>
          <Ionicons name="location" size={24} color="#10B981" />
          <View style={styles.pinLabel}>
            <Text style={styles.pinLabelText}>Pickup</Text>
          </View>
        </View>

        {/* Destination Pin */}
        <View style={[styles.locationPin, styles.destinationPin, { top: 180, left: '75%' }]}>
          <Ionicons name="flag" size={24} color="#EF4444" />
          <View style={styles.pinLabel}>
            <Text style={styles.pinLabelText}>Drop</Text>
          </View>
        </View>

        {/* Route Line */}
        <View style={styles.routeLine} />

        {/* Cab Markers */}
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
  mapBackground: {
    flex: 1,
    margin: 20,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
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
  cabMarker: {
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

export default MapView;
