// API service for GoFare backend integration

// Backend URL - Force IP address for all platforms during testing
const BACKEND_URL = 'http://10.50.179.45:3000';
console.log('🚀 Backend URL (forced IP):', BACKEND_URL);

export interface LocationSuggestion {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  types: string[];
  matched_substrings?: any[];
  terms?: any[];
}

export interface LocationData {
  place_id: string;
  description: string;
  main_text: string;
  secondary_text: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface CurrentLocationResponse {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  formatted_address: string;
  place_id: string;
  types: string[];
  parsed_address?: {
    street_number?: string;
    street_name?: string;
    city?: string;
    state?: string;
    country?: string;
    country_code?: string;
    postal_code?: string;
  };
}

export interface DirectionsResponse {
  routes: Array<{
    summary: string;
    legs: Array<{
      distance: { text: string; value: number };
      duration: { text: string; value: number };
      start_address: string;
      end_address: string;
      start_location: { lat: number; lng: number };
      end_location: { lat: number; lng: number };
      steps: Array<{
        distance: { text: string; value: number };
        duration: { text: string; value: number };
        html_instructions: string;
        polyline: { points: string };
        start_location: { lat: number; lng: number };
        end_location: { lat: number; lng: number };
        travel_mode: string;
      }>;
    }>;
    overview_polyline: { points: string };
    bounds: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
    warnings: string[];
  }>;
  status: string;
  geocoded_waypoints: any[];
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = BACKEND_URL) {
    this.baseUrl = baseUrl;
  }

  // Get autocomplete suggestions
  async getAutocompleteSuggestions(input: string): Promise<LocationSuggestion[]> {
    try {
      const url = `${this.baseUrl}/api/v1/maps/autocomplete?input=${encodeURIComponent(input)}`;
      console.log('🔗 API Request URL:', url);
      console.log('🏠 Base URL:', this.baseUrl);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data.suggestions) {
        return data.data.suggestions;
      } else {
        throw new Error(data.message || 'Failed to get suggestions');
      }
    } catch (error) {
      console.error('Autocomplete API error:', error);
      throw error;
    }
  }

  // Process current location
  async processCurrentLocation(latitude: number, longitude: number): Promise<CurrentLocationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/location/current`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          detailed: true
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to process location');
      }
    } catch (error) {
      console.error('Current location API error:', error);
      throw error;
    }
  }

  // Get place details
  async getPlaceDetails(placeId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/maps/place-details?place_id=${encodeURIComponent(placeId)}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get place details');
      }
    } catch (error) {
      console.error('Place details API error:', error);
      throw error;
    }
  }

  // Get directions between two points
  async getDirections(origin: string, destination: string, mode: string = 'driving'): Promise<DirectionsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/maps/directions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          origin,
          destination,
          mode
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get directions');
      }
    } catch (error) {
      console.error('Directions API error:', error);
      throw error;
    }
  }

  // Get coordinates from address
  async getCoordinates(address: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/geocoding/coordinates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data;
      } else {
        throw new Error(data.message || 'Failed to get coordinates');
      }
    } catch (error) {
      console.error('Geocoding API error:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
