const mapsService = require('../services/mapsService');

/**
 * Get autocomplete suggestions for location search
 */
const getAutocomplete = async (req, res, next) => {
  try {
    const { input, types, components, location, radius, language } = req.query;
    
    const suggestions = await mapsService.getAutocompleteSuggestions({
      input,
      types,
      components,
      location,
      radius: radius ? parseInt(radius) : undefined,
      language,
      apiKey: req.apiKey
    });

    res.json({
      success: true,
      data: suggestions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get detailed information about a specific place
 */
const getPlaceDetails = async (req, res, next) => {
  try {
    const { place_id, fields, language } = req.query;
    
    if (!place_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'place_id is required',
        timestamp: new Date().toISOString()
      });
    }

    const placeDetails = await mapsService.getPlaceDetails({
      place_id,
      fields: fields ? fields.split(',') : undefined,
      language,
      apiKey: req.apiKey
    });

    res.json({
      success: true,
      data: placeDetails,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get directions between two points
 */
const getDirections = async (req, res, next) => {
  try {
    const { origin, destination, mode, waypoints, avoid, departure_time } = req.body;
    
    if (!origin || !destination) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Both origin and destination are required',
        timestamp: new Date().toISOString()
      });
    }

    const directions = await mapsService.getDirections({
      origin,
      destination,
      mode: mode || 'driving',
      waypoints,
      avoid,
      departure_time,
      apiKey: req.apiKey
    });

    res.json({
      success: true,
      data: directions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get distance and duration between multiple origins and destinations
 */
const getDistanceMatrix = async (req, res, next) => {
  try {
    const { origins, destinations, mode, avoid, units } = req.query;
    
    if (!origins || !destinations) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Both origins and destinations are required',
        timestamp: new Date().toISOString()
      });
    }

    const distanceMatrix = await mapsService.getDistanceMatrix({
      origins: origins.split('|'),
      destinations: destinations.split('|'),
      mode: mode || 'driving',
      avoid,
      units: units || 'metric',
      apiKey: req.apiKey
    });

    res.json({
      success: true,
      data: distanceMatrix,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAutocomplete,
  getPlaceDetails,
  getDirections,
  getDistanceMatrix
};
