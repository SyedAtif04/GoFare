import * as Location from 'expo-location';
import { Alert } from 'react-native';
import { apiService, CurrentLocationResponse } from './apiService';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
}

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.PermissionStatus;
}

class LocationService {
  private static instance: LocationService;
  private permissionStatus: LocationPermissionStatus | null = null;

  constructor() {
    if (LocationService.instance) {
      return LocationService.instance;
    }
    LocationService.instance = this;
  }

  // Request location permissions
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      // Check if location services are enabled
      const serviceEnabled = await Location.hasServicesEnabledAsync();
      if (!serviceEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use this feature.',
          [{ text: 'OK' }]
        );
        return {
          granted: false,
          canAskAgain: false,
          status: Location.PermissionStatus.DENIED
        };
      }

      // Request foreground permissions
      const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
      
      const permissionResult: LocationPermissionStatus = {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status
      };

      this.permissionStatus = permissionResult;

      if (!permissionResult.granted) {
        let message = 'Location permission is required to use this feature.';
        let title = 'Permission Required';

        if (status === Location.PermissionStatus.DENIED && !canAskAgain) {
          title = 'Permission Denied';
          message = 'Location permission has been permanently denied. Please enable it in your device settings.';
        }

        Alert.alert(title, message, [{ text: 'OK' }]);
      }

      return permissionResult;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.DENIED
      };
    }
  }

  // Get current location coordinates
  async getCurrentLocation(): Promise<LocationCoordinates | null> {
    try {
      // Check permissions first
      if (!this.permissionStatus || !this.permissionStatus.granted) {
        const permission = await this.requestLocationPermission();
        if (!permission.granted) {
          return null;
        }
      }

      // Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 1,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude,
        heading: location.coords.heading,
        speed: location.coords.speed,
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your current location. Please try again or enter your location manually.',
        [{ text: 'OK' }]
      );
      return null;
    }
  }

  // Get current location with address details
  async getCurrentLocationWithAddress(): Promise<CurrentLocationResponse | null> {
    try {
      const coordinates = await this.getCurrentLocation();
      if (!coordinates) {
        return null;
      }

      // Call backend to convert coordinates to address
      const locationData = await apiService.processCurrentLocation(
        coordinates.latitude,
        coordinates.longitude
      );

      return locationData;
    } catch (error) {
      console.error('Error getting location with address:', error);
      Alert.alert(
        'Location Error',
        'Unable to get your address. Please try again or enter your location manually.',
        [{ text: 'OK' }]
      );
      return null;
    }
  }

  // Watch location changes (for real-time tracking)
  async watchLocation(
    callback: (location: LocationCoordinates) => void,
    errorCallback?: (error: any) => void
  ): Promise<Location.LocationSubscription | null> {
    try {
      // Check permissions first
      if (!this.permissionStatus || !this.permissionStatus.granted) {
        const permission = await this.requestLocationPermission();
        if (!permission.granted) {
          return null;
        }
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          callback({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy,
            altitude: location.coords.altitude,
            heading: location.coords.heading,
            speed: location.coords.speed,
          });
        }
      );

      return subscription;
    } catch (error) {
      console.error('Error watching location:', error);
      errorCallback?.(error);
      return null;
    }
  }

  // Calculate distance between two points (in meters)
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  // Format distance for display
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  }

  // Format duration for display
  formatDuration(seconds: number): string {
    if (seconds < 60) {
      return `${Math.round(seconds)}s`;
    } else if (seconds < 3600) {
      return `${Math.round(seconds / 60)}min`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours}h ${minutes}min`;
    }
  }

  // Check if location services are available
  async isLocationAvailable(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error('Error checking location availability:', error);
      return false;
    }
  }

  // Get permission status without requesting
  async getPermissionStatus(): Promise<LocationPermissionStatus> {
    try {
      const { status, canAskAgain } = await Location.getForegroundPermissionsAsync();
      
      const permissionResult: LocationPermissionStatus = {
        granted: status === Location.PermissionStatus.GRANTED,
        canAskAgain,
        status
      };

      this.permissionStatus = permissionResult;
      return permissionResult;
    } catch (error) {
      console.error('Error getting permission status:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: Location.PermissionStatus.DENIED
      };
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();
export default locationService;
