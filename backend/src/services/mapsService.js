const { client, config, handleGoogleMapsError } = require('../config/googleMaps');

/**
 * Get autocomplete suggestions for location search
 */
const getAutocompleteSuggestions = async (params) => {
  try {
    const {
      input,
      types = config.autocomplete.types,
      components = config.autocomplete.components,
      location,
      radius,
      language = config.autocomplete.language,
      apiKey
    } = params;

    const requestParams = {
      key: apiKey,
      input,
      language,
      types,
      components
    };

    // Add location bias if provided
    if (location) {
      requestParams.location = location;
      if (radius) {
        requestParams.radius = radius;
      }
    }

    const response = await client.placeAutocomplete({
      params: requestParams
    });

    // Format the response for frontend consumption
    const suggestions = response.data.predictions.map(prediction => ({
      place_id: prediction.place_id,
      description: prediction.description,
      main_text: prediction.structured_formatting.main_text,
      secondary_text: prediction.structured_formatting.secondary_text,
      types: prediction.types,
      matched_substrings: prediction.matched_substrings,
      terms: prediction.terms
    }));

    return {
      suggestions,
      status: response.data.status,
      info_messages: response.data.info_messages || []
    };

  } catch (error) {
    console.error('Autocomplete service error:', error);
    throw handleGoogleMapsError(error);
  }
};

/**
 * Get detailed information about a specific place
 */
const getPlaceDetails = async (params) => {
  try {
    const {
      place_id,
      fields = config.places.fields,
      language = config.places.language,
      apiKey
    } = params;

    const response = await client.placeDetails({
      params: {
        key: apiKey,
        place_id,
        fields: fields.join(','),
        language
      }
    });

    const place = response.data.result;
    
    // Format the response
    return {
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      geometry: {
        location: {
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng
        },
        viewport: place.geometry.viewport
      },
      types: place.types,
      address_components: place.address_components,
      status: response.data.status
    };

  } catch (error) {
    console.error('Place details service error:', error);
    throw handleGoogleMapsError(error);
  }
};

/**
 * Get directions between two points
 */
const getDirections = async (params) => {
  try {
    const {
      origin,
      destination,
      mode = config.directions.mode,
      waypoints,
      avoid = config.directions.avoid,
      departure_time,
      apiKey
    } = params;

    const requestParams = {
      key: apiKey,
      origin,
      destination,
      mode,
      units: config.directions.units,
      language: config.directions.language
    };

    if (waypoints && waypoints.length > 0) {
      requestParams.waypoints = waypoints;
    }

    if (avoid && avoid.length > 0) {
      requestParams.avoid = avoid;
    }

    if (departure_time) {
      requestParams.departure_time = departure_time;
    }

    const response = await client.directions({
      params: requestParams
    });

    // Format the response
    const routes = response.data.routes.map(route => ({
      summary: route.summary,
      legs: route.legs.map(leg => ({
        distance: leg.distance,
        duration: leg.duration,
        start_address: leg.start_address,
        end_address: leg.end_address,
        start_location: leg.start_location,
        end_location: leg.end_location,
        steps: leg.steps.map(step => ({
          distance: step.distance,
          duration: step.duration,
          html_instructions: step.html_instructions,
          polyline: step.polyline,
          start_location: step.start_location,
          end_location: step.end_location,
          travel_mode: step.travel_mode
        }))
      })),
      overview_polyline: route.overview_polyline,
      bounds: route.bounds,
      warnings: route.warnings
    }));

    return {
      routes,
      status: response.data.status,
      geocoded_waypoints: response.data.geocoded_waypoints
    };

  } catch (error) {
    console.error('Directions service error:', error);
    throw handleGoogleMapsError(error);
  }
};

/**
 * Get distance and duration between multiple origins and destinations
 */
const getDistanceMatrix = async (params) => {
  try {
    const {
      origins,
      destinations,
      mode = config.directions.mode,
      avoid,
      units = config.directions.units,
      apiKey
    } = params;

    const requestParams = {
      key: apiKey,
      origins,
      destinations,
      mode,
      units,
      language: config.directions.language
    };

    if (avoid) {
      requestParams.avoid = avoid;
    }

    const response = await client.distancematrix({
      params: requestParams
    });

    return {
      origin_addresses: response.data.origin_addresses,
      destination_addresses: response.data.destination_addresses,
      rows: response.data.rows,
      status: response.data.status
    };

  } catch (error) {
    console.error('Distance matrix service error:', error);
    throw handleGoogleMapsError(error);
  }
};

module.exports = {
  getAutocompleteSuggestions,
  getPlaceDetails,
  getDirections,
  getDistanceMatrix
};
