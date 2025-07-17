const geocodingService = require('../services/geocodingService');

/**
 * Convert address or place name to coordinates
 */
const getCoordinates = async (req, res, next) => {
  try {
    const { address, place_id, components, bounds, region } = req.body;
    
    if (!address && !place_id) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameter',
        message: 'Either address or place_id is required',
        timestamp: new Date().toISOString()
      });
    }

    const coordinates = await geocodingService.getCoordinates({
      address,
      place_id,
      components,
      bounds,
      region,
      apiKey: req.apiKey
    });

    res.json({
      success: true,
      data: coordinates,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Convert coordinates to address
 */
const getReverseGeocode = async (req, res, next) => {
  try {
    const { latitude, longitude, result_type, location_type } = req.body;
    
    const reverseGeocode = await geocodingService.getReverseGeocode({
      latitude,
      longitude,
      result_type,
      location_type,
      apiKey: req.apiKey
    });

    res.json({
      success: true,
      data: reverseGeocode,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Batch geocoding for multiple addresses
 */
const getBatchGeocode = async (req, res, next) => {
  try {
    const { addresses, components } = req.body;
    
    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'addresses must be a non-empty array',
        timestamp: new Date().toISOString()
      });
    }

    const batchResults = await geocodingService.getBatchGeocode({
      addresses,
      components,
      apiKey: req.apiKey
    });

    res.json({
      success: true,
      data: batchResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get timezone information for coordinates
 */
const getTimezone = async (req, res, next) => {
  try {
    const { latitude, longitude, timestamp } = req.query;
    
    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'Both latitude and longitude are required',
        timestamp: new Date().toISOString()
      });
    }

    const timezone = await geocodingService.getTimezone({
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      timestamp: timestamp ? parseInt(timestamp) : Math.floor(Date.now() / 1000),
      apiKey: req.apiKey
    });

    res.json({
      success: true,
      data: timezone,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCoordinates,
  getReverseGeocode,
  getBatchGeocode,
  getTimezone
};
