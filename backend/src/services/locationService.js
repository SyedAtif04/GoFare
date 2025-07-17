const { client, config, handleGoogleMapsError } = require('../config/googleMaps');

/**
 * Process current location coordinates and get address details
 */
const processCurrentLocation = async (params) => {
  try {
    const { latitude, longitude, detailed = false, apiKey } = params;

    // Get address from coordinates using reverse geocoding
    const response = await client.reverseGeocode({
      params: {
        key: apiKey,
        latlng: `${latitude},${longitude}`,
        language: config.geocoding.language,
        region: config.geocoding.region
      }
    });

    if (response.data.results.length === 0) {
      throw new Error('No address found for the provided coordinates');
    }

    const result = response.data.results[0];
    
    // Basic location data
    const locationData = {
      coordinates: {
        latitude,
        longitude
      },
      formatted_address: result.formatted_address,
      place_id: result.place_id,
      types: result.types
    };

    // Add detailed address components if requested
    if (detailed) {
      locationData.address_components = result.address_components;
      locationData.geometry = result.geometry;
      
      // Extract useful components
      const components = {};
      result.address_components.forEach(component => {
        const types = component.types;
        if (types.includes('street_number')) {
          components.street_number = component.long_name;
        }
        if (types.includes('route')) {
          components.street_name = component.long_name;
        }
        if (types.includes('locality')) {
          components.city = component.long_name;
        }
        if (types.includes('administrative_area_level_1')) {
          components.state = component.long_name;
        }
        if (types.includes('country')) {
          components.country = component.long_name;
          components.country_code = component.short_name;
        }
        if (types.includes('postal_code')) {
          components.postal_code = component.long_name;
        }
      });
      
      locationData.parsed_address = components;
    }

    return locationData;

  } catch (error) {
    console.error('Process current location error:', error);
    throw handleGoogleMapsError(error);
  }
};

/**
 * Find nearby places of interest
 */
const getNearbyPlaces = async (params) => {
  try {
    const {
      latitude,
      longitude,
      type = 'point_of_interest',
      radius = 1000,
      keyword,
      min_price,
      max_price,
      open_now,
      apiKey
    } = params;

    const requestParams = {
      key: apiKey,
      location: `${latitude},${longitude}`,
      radius,
      type,
      language: config.places.language
    };

    if (keyword) requestParams.keyword = keyword;
    if (min_price !== undefined) requestParams.minprice = min_price;
    if (max_price !== undefined) requestParams.maxprice = max_price;
    if (open_now !== undefined) requestParams.opennow = open_now;

    const response = await client.placesNearby({
      params: requestParams
    });

    // Format the results
    const places = response.data.results.map(place => ({
      place_id: place.place_id,
      name: place.name,
      vicinity: place.vicinity,
      geometry: {
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        }
      },
      types: place.types,
      rating: place.rating,
      price_level: place.price_level,
      opening_hours: place.opening_hours,
      photos: place.photos ? place.photos.map(photo => ({
        photo_reference: photo.photo_reference,
        height: photo.height,
        width: photo.width
      })) : []
    }));

    return {
      places,
      status: response.data.status,
      next_page_token: response.data.next_page_token
    };

  } catch (error) {
    console.error('Nearby places service error:', error);
    throw handleGoogleMapsError(error);
  }
};

/**
 * Validate if coordinates are within service area
 * This is a custom validation - you can modify based on your service area
 */
const validateServiceArea = async (params) => {
  try {
    const { latitude, longitude, apiKey } = params;

    // Get address details to determine location
    const response = await client.reverseGeocode({
      params: {
        key: apiKey,
        latlng: `${latitude},${longitude}`,
        language: config.geocoding.language
      }
    });

    if (response.data.results.length === 0) {
      return {
        is_valid: false,
        reason: 'Location not found',
        coordinates: { latitude, longitude }
      };
    }

    const result = response.data.results[0];
    
    // Example validation: Check if location is in India (modify as needed)
    const countryComponent = result.address_components.find(
      component => component.types.includes('country')
    );

    const isInServiceArea = countryComponent && countryComponent.short_name === 'IN';
    
    return {
      is_valid: isInServiceArea,
      reason: isInServiceArea ? 'Location is within service area' : 'Location is outside service area',
      coordinates: { latitude, longitude },
      address: result.formatted_address,
      country: countryComponent ? countryComponent.long_name : 'Unknown'
    };

  } catch (error) {
    console.error('Service area validation error:', error);
    throw handleGoogleMapsError(error);
  }
};

module.exports = {
  processCurrentLocation,
  getNearbyPlaces,
  validateServiceArea
};
