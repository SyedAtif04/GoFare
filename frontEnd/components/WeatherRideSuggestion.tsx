import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface WeatherData {
  weather: string;
  description: string;
  temp: number;
  icon: string;
}

interface WeatherSuggestionData {
  pickup: WeatherData;
  drop: WeatherData;
  suggestion: string;
  severity: 'clear' | 'advisory' | 'warning';
  recommendedRides: string[];
}

interface WeatherRideSuggestionProps {
  pickup: { lat: number; lon: number };
  drop: { lat: number; lon: number };
  visible: boolean;
  onClose: () => void;
}

const WeatherRideSuggestion: React.FC<WeatherRideSuggestionProps> = ({
  pickup,
  drop,
  visible,
  onClose,
}) => {
  const [weatherData, setWeatherData] = useState<WeatherSuggestionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Test coordinates - you can change these
  const testPickup = { lat: 28.6139, lon: 77.2090 }; // Delhi
  const testDrop = { lat: 28.5355, lon: 77.3910 };   // Noida

  useEffect(() => {
    if (visible) {
      fetchWeatherSuggestion();
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      fadeAnim.setValue(0);
      slideAnim.setValue(50);
    }
  }, [visible]);

  const fetchWeatherSuggestion = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use actual coordinates passed as props, fallback to test coordinates only if no props provided
      const coords = {
        pickup: pickup && pickup.lat && pickup.lon ? pickup : testPickup,
        drop: drop && drop.lat && drop.lon ? drop : testDrop
      };

      console.log(' Calling weather API with coords:', coords);
      console.log(' Using real coordinates:', pickup && pickup.lat && pickup.lon && drop && drop.lat && drop.lon ? 'YES' : 'NO (fallback to test)');

      const response = await fetch('http://10.205.72.101:3000/api/weather-ride-suggestion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(coords),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(' Weather API response:', data);

      setWeatherData(data);

    } catch (err) {
      console.error(' Weather API error:', err);
      setError('Unable to fetch weather information');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case 'warning':
        return {
          gradient: ['#FEF3C7', '#FDE68A'],
          border: '#F59E0B',
          text: '#92400E',
        };
      case 'advisory':
        return {
          gradient: ['#DBEAFE', '#BFDBFE'],
          border: '#3B82F6',
          text: '#1E40AF',
        };
      default:
        return {
          gradient: ['#D1FAE5', '#A7F3D0'],
          border: '#10B981',
          text: '#065F46',
        };
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={weatherData ? getSeverityColors(weatherData.severity).gradient : ['#F3F4F6', '#E5E7EB']}
            style={[
              styles.card,
              {
                borderColor: weatherData ? getSeverityColors(weatherData.severity).border : '#D1D5DB',
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Weather Advisory</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Checking weather conditions...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="warning-outline" size={32} color="#EF4444" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : weatherData ? (
              <>
                {/* Weather Summary */}
                <View style={styles.weatherSummary}>
                  <View style={styles.locationWeather}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <View style={styles.weatherInfo}>
                      <Text style={styles.locationLabel}>Pickup</Text>
                      <Text style={styles.weatherText}>
                        {weatherData.pickup.icon} {weatherData.pickup.weather}, {weatherData.pickup.temp}°C
                      </Text>
                    </View>
                  </View>

                  <View style={styles.locationWeather}>
                    <Text style={styles.locationIcon}>🎯</Text>
                    <View style={styles.weatherInfo}>
                      <Text style={styles.locationLabel}>Drop</Text>
                      <Text style={styles.weatherText}>
                        {weatherData.drop.icon} {weatherData.drop.weather}, {weatherData.drop.temp}°C
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Suggestion */}
                <View style={styles.suggestionContainer}>
                  <Text style={[styles.suggestionText, { color: getSeverityColors(weatherData.severity).text }]}>
                    {weatherData.suggestion}
                  </Text>
                </View>

                {/* Recommended Rides */}
                <View style={styles.ridesContainer}>
                  <Text style={styles.ridesLabel}>Recommended:</Text>
                  <View style={styles.ridesList}>
                    {weatherData.recommendedRides.map((ride, index) => (
                      <View key={index} style={styles.rideTag}>
                        <Text style={styles.rideTagText}>{ride}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : null}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  container: {
    width: width - 40,
    maxWidth: 400,
  },
  card: {
    borderRadius: 16,
    borderWidth: 2,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#6B7280',
    fontSize: 14,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    marginTop: 8,
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
  weatherSummary: {
    marginBottom: 16,
  },
  locationWeather: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  weatherInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  weatherText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  suggestionContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  ridesContainer: {
    marginTop: 8,
  },
  ridesLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  ridesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  rideTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rideTagText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
});

export default WeatherRideSuggestion;




