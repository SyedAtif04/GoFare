const locationService = require('../services/locationService');

/**
 * Process current location coordinates and get address details
 */
const processCurrentLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, detailed = false } = req.body;
    
    const locationData = await locationService.processCurrentLocation({
      latitude,
      longitude,
      detailed,
      apiKey: req.apiKey
    });

    res.json({
      success: true,
      data: locationData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Find nearby places of interest
 */
const getNearbyPlaces = async (req, res, next) => {
  try {
    const { 
      latitude, 
      longitude, 
      type = 'point_of_interest', 
      radius = 1000,
      keyword,
      min_price,
      max_price,
      open_now
    } = req.body;
    
    const nearbyPlaces = await locationService.getNearbyPlaces({
      latitude,
      longitude,
      type,
      radius,
      keyword,
      min_price,
      max_price,
      open_now,
      apiKey: req.apiKey
    });

    res.json({
      success: true,
      data: nearbyPlaces,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate if coordinates are within service area
 */
const validateServiceArea = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    
    const validation = await locationService.validateServiceArea({
      latitude,
      longitude,
      apiKey: req.apiKey
    });

    res.json({
      success: true,
      data: validation,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  processCurrentLocation,
  getNearbyPlaces,
  validateServiceArea
};
