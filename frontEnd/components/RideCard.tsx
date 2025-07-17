import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

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

interface RideCardProps {
  ride: RideOption;
  onBook: () => void;
  animationDelay?: number;
}

const RideCard: React.FC<RideCardProps> = ({ ride, onBook, animationDelay = 0 }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay: animationDelay,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay: animationDelay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [animationDelay]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.98,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 0.95,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleBookPress = () => {
    Animated.sequence([
      Animated.spring(buttonScale, {
        toValue: 0.9,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onBook();
    });
  };

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'uber':
        return 'car';
      case 'ola':
        return 'car-sport';
      case 'rapido':
        return 'bicycle';
      default:
        return 'car';
    }
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

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
        },
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.card}
      >
        {/* Provider Section */}
        <View style={styles.providerSection}>
          <View style={[styles.providerLogo, { backgroundColor: ride.color + '20' }]}>
            <Ionicons 
              name={getProviderIcon(ride.provider) as any} 
              size={24} 
              color={ride.color} 
            />
          </View>
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{ride.provider}</Text>
            <View style={styles.cabTypeContainer}>
              <MaterialIcons 
                name={getCabIcon(ride.cabType) as any} 
                size={16} 
                color="#6B7280" 
              />
              <Text style={styles.cabType}>{ride.cabType}</Text>
            </View>
          </View>
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text style={styles.rating}>{ride.rating}</Text>
          </View>
        </View>

        {/* Fare Section */}
        <View style={styles.fareSection}>
          <View style={styles.fareContainer}>
            <Text style={styles.fareAmount}>₹{ride.fare}</Text>
            {ride.surge && (
              <View style={styles.surgeContainer}>
                <Ionicons name="trending-up" size={12} color="#EF4444" />
                <Text style={styles.surgeText}>
                  {ride.surgeMultiplier}x surge
                </Text>
              </View>
            )}
          </View>
          
          {/* Time Info */}
          <View style={styles.timeInfo}>
            <View style={styles.timeItem}>
              <Ionicons name="time" size={14} color="#6B7280" />
              <Text style={styles.timeText}>Arrives in {ride.eta} min</Text>
            </View>
            <View style={styles.timeItem}>
              <Ionicons name="car" size={14} color="#6B7280" />
              <Text style={styles.timeText}>{ride.duration} min ride</Text>
            </View>
          </View>
        </View>

        {/* Book Button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity onPress={handleBookPress} style={styles.bookButton}>
            <LinearGradient
              colors={['#3B82F6', '#06B6D4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bookButtonGradient}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>

      {/* Best Deal Badge */}
      {ride.fare === Math.min(...[120, 180, 45, 250, 85]) && (
        <View style={styles.bestDealBadge}>
          <Text style={styles.bestDealText}>Best Deal</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  providerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  providerLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter_600SemiBold',
  },
  cabTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cabType: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
    fontFamily: 'Inter_400Regular',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400E',
    marginLeft: 2,
    fontFamily: 'Inter_500Medium',
  },
  fareSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  fareContainer: {
    alignItems: 'flex-start',
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter_700Bold',
  },
  surgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  surgeText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#DC2626',
    marginLeft: 2,
    fontFamily: 'Inter_500Medium',
  },
  timeInfo: {
    alignItems: 'flex-end',
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontFamily: 'Inter_400Regular',
  },
  bookButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  bookButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
    fontFamily: 'Inter_600SemiBold',
  },
  bestDealBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  bestDealText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter_600SemiBold',
  },
});

export default RideCard;
