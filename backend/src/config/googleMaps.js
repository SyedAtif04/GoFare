const { Client } = require('@googlemaps/google-maps-services-js');

// Initialize Google Maps client
const googleMapsClient = new Client({});

// Google Maps API configuration
const config = {
  apiKey: process.env.GOOGLE_MAPS_API_KEY,
  
  // Default parameters for different services
  autocomplete: {
    language: 'en',
    types: 'establishment|geocode', // Places and addresses
    components: 'country:in', // Restrict to India (change as needed)
  },
  
  geocoding: {
    language: 'en',
    region: 'in', // Bias results to India
  },
  
  places: {
    language: 'en',
    fields: [
      'place_id',
      'formatted_address',
      'geometry',
      'name',
      'types',
      'address_components'
    ]
  },
  
  directions: {
    language: 'en',
    units: 'metric',
    avoid: [], // Can include 'tolls', 'highways', 'ferries'
    mode: 'driving' // driving, walking, bicycling, transit
  }
};

// Validate API key on startup
const validateApiKey = () => {
  if (!config.apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY is required in environment variables');
  }
  
  if (config.apiKey === 'your_google_maps_api_key_here') {
    throw new Error('Please set a valid GOOGLE_MAPS_API_KEY in your .env file');
  }
  
  console.log('✅ Google Maps API key configured');
};

// Error handling for Google Maps API responses
const handleGoogleMapsError = (error) => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return { error: 'Invalid request parameters', details: data };
      case 401:
        return { error: 'Invalid API key', details: 'Check your Google Maps API key' };
      case 403:
        return { error: 'API access forbidden', details: 'Check API key permissions and billing' };
      case 429:
        return { error: 'Rate limit exceeded', details: 'Too many requests to Google Maps API' };
      case 500:
        return { error: 'Google Maps API server error', details: 'Try again later' };
      default:
        return { error: 'Google Maps API error', details: data };
    }
  }
  
  return { error: 'Network error', details: error.message };
};

module.exports = {
  client: googleMapsClient,
  config,
  validateApiKey,
  handleGoogleMapsError
};
