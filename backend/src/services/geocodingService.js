const { client, config, handleGoogleMapsError } = require('../config/googleMaps');

/**
 * Convert address or place name to coordinates
 */
const getCoordinates = async (params) => {
  try {
    const {
      address,
      place_id,
      components,
      bounds,
      region = config.geocoding.region,
      apiKey
    } = params;

    let requestParams = {
      key: apiKey,
      language: config.geocoding.language,
      region
    };

    // Use place_id if provided, otherwise use address
    if (place_id) {
      requestParams.place_id = place_id;
    } else {
      requestParams.address = address;
    }

    if (components) requestParams.components = components;
    if (bounds) requestParams.bounds = bounds;

    const response = await client.geocode({
      params: requestParams
    });

    if (response.data.results.length === 0) {
      throw new Error('No results found for the provided address');
    }

    // Format results
    const results = response.data.results.map(result => ({
      place_id: result.place_id,
      formatted_address: result.formatted_address,
      geometry: {
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        },
        location_type: result.geometry.location_type,
        viewport: result.geometry.viewport,
        bounds: result.geometry.bounds
      },
      types: result.types,
      address_components: result.address_components,
      partial_match: result.partial_match
    }));

    return {
      results,
      status: response.data.status
    };

  } catch (error) {
    console.error('Geocoding service error:', error);
    throw handleGoogleMapsError(error);
  }
};

/**
 * Convert coordinates to address
 */
const getReverseGeocode = async (params) => {
  try {
    const {
      latitude,
      longitude,
      result_type,
      location_type,
      apiKey
    } = params;

    const requestParams = {
      key: apiKey,
      latlng: `${latitude},${longitude}`,
      language: config.geocoding.language,
      region: config.geocoding.region
    };

    if (result_type) requestParams.result_type = result_type;
    if (location_type) requestParams.location_type = location_type;

    const response = await client.reverseGeocode({
      params: requestParams
    });

    if (response.data.results.length === 0) {
      throw new Error('No address found for the provided coordinates');
    }

    // Format results
    const results = response.data.results.map(result => ({
      place_id: result.place_id,
      formatted_address: result.formatted_address,
      geometry: {
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng
        },
        location_type: result.geometry.location_type,
        viewport: result.geometry.viewport
      },
      types: result.types,
      address_components: result.address_components
    }));

    return {
      results,
      status: response.data.status
    };

  } catch (error) {
    console.error('Reverse geocoding service error:', error);
    throw handleGoogleMapsError(error);
  }
};

/**
 * Batch geocoding for multiple addresses
 */
const getBatchGeocode = async (params) => {
  try {
    const { addresses, components, apiKey } = params;

    // Process addresses in parallel (be mindful of rate limits)
    const promises = addresses.map(async (address, index) => {
      try {
        const result = await getCoordinates({
          address,
          components,
          apiKey
        });
        
        return {
          index,
          address,
          success: true,
          data: result
        };
      } catch (error) {
        return {
          index,
          address,
          success: false,
          error: error.message || 'Geocoding failed'
        };
      }
    });

    const results = await Promise.all(promises);

    return {
      results,
      total: addresses.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    };

  } catch (error) {
    console.error('Batch geocoding service error:', error);
    throw handleGoogleMapsError(error);
  }
};

/**
 * Get timezone information for coordinates
 */
const getTimezone = async (params) => {
  try {
    const {
      latitude,
      longitude,
      timestamp = Math.floor(Date.now() / 1000),
      apiKey
    } = params;

    const response = await client.timezone({
      params: {
        key: apiKey,
        location: `${latitude},${longitude}`,
        timestamp,
        language: config.geocoding.language
      }
    });

    return {
      timezone_id: response.data.timeZoneId,
      timezone_name: response.data.timeZoneName,
      dst_offset: response.data.dstOffset,
      raw_offset: response.data.rawOffset,
      status: response.data.status
    };

  } catch (error) {
    console.error('Timezone service error:', error);
    throw handleGoogleMapsError(error);
  }
};

module.exports = {
  getCoordinates,
  getReverseGeocode,
  getBatchGeocode,
  getTimezone
};
