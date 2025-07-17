const Joi = require('joi');

/**
 * Validation schema for location requests
 */
const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required()
    .messages({
      'number.base': 'Latitude must be a number',
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90',
      'any.required': 'Latitude is required'
    }),
  
  longitude: Joi.number().min(-180).max(180).required()
    .messages({
      'number.base': 'Longitude must be a number',
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180',
      'any.required': 'Longitude is required'
    }),
  
  detailed: Joi.boolean().optional().default(false)
    .messages({
      'boolean.base': 'Detailed must be a boolean value'
    })
});

/**
 * Middleware to validate location requests
 */
const validateLocationRequest = (req, res, next) => {
  const { error } = locationSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      })),
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Validation schema for nearby places requests
 */
const nearbyPlacesSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required()
    .messages({
      'number.base': 'Latitude must be a number',
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90',
      'any.required': 'Latitude is required'
    }),
  
  longitude: Joi.number().min(-180).max(180).required()
    .messages({
      'number.base': 'Longitude must be a number',
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180',
      'any.required': 'Longitude is required'
    }),
  
  type: Joi.string().optional().default('point_of_interest')
    .valid(
      'accounting', 'airport', 'amusement_park', 'aquarium', 'art_gallery',
      'atm', 'bakery', 'bank', 'bar', 'beauty_salon', 'bicycle_store',
      'book_store', 'bowling_alley', 'bus_station', 'cafe', 'campground',
      'car_dealer', 'car_rental', 'car_repair', 'car_wash', 'casino',
      'cemetery', 'church', 'city_hall', 'clothing_store', 'convenience_store',
      'courthouse', 'dentist', 'department_store', 'doctor', 'drugstore',
      'electrician', 'electronics_store', 'embassy', 'fire_station',
      'florist', 'funeral_home', 'furniture_store', 'gas_station', 'gym',
      'hair_care', 'hardware_store', 'hindu_temple', 'home_goods_store',
      'hospital', 'insurance_agency', 'jewelry_store', 'laundry', 'lawyer',
      'library', 'light_rail_station', 'liquor_store', 'local_government_office',
      'locksmith', 'lodging', 'meal_delivery', 'meal_takeaway', 'mosque',
      'movie_rental', 'movie_theater', 'moving_company', 'museum', 'night_club',
      'painter', 'park', 'parking', 'pet_store', 'pharmacy', 'physiotherapist',
      'plumber', 'police', 'post_office', 'primary_school', 'real_estate_agency',
      'restaurant', 'roofing_contractor', 'rv_park', 'school', 'secondary_school',
      'shoe_store', 'shopping_mall', 'spa', 'stadium', 'storage', 'store',
      'subway_station', 'supermarket', 'synagogue', 'taxi_stand', 'tourist_attraction',
      'train_station', 'transit_station', 'travel_agency', 'university',
      'veterinary_care', 'zoo', 'point_of_interest', 'establishment'
    )
    .messages({
      'any.only': 'Invalid place type'
    }),
  
  radius: Joi.number().integer().min(1).max(50000).optional().default(1000)
    .messages({
      'number.base': 'Radius must be a number',
      'number.integer': 'Radius must be an integer',
      'number.min': 'Radius must be at least 1 meter',
      'number.max': 'Radius cannot exceed 50,000 meters'
    }),
  
  keyword: Joi.string().max(100).optional()
    .messages({
      'string.max': 'Keyword cannot exceed 100 characters'
    }),
  
  min_price: Joi.number().integer().min(0).max(4).optional()
    .messages({
      'number.base': 'Min price must be a number',
      'number.integer': 'Min price must be an integer',
      'number.min': 'Min price must be between 0 and 4',
      'number.max': 'Min price must be between 0 and 4'
    }),
  
  max_price: Joi.number().integer().min(0).max(4).optional()
    .messages({
      'number.base': 'Max price must be a number',
      'number.integer': 'Max price must be an integer',
      'number.min': 'Max price must be between 0 and 4',
      'number.max': 'Max price must be between 0 and 4'
    }),
  
  open_now: Joi.boolean().optional()
    .messages({
      'boolean.base': 'Open now must be a boolean value'
    })
});

/**
 * Middleware to validate nearby places requests
 */
const validateNearbyPlacesRequest = (req, res, next) => {
  const { error } = nearbyPlacesSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      })),
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Validation schema for service area validation requests
 */
const serviceAreaSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required()
    .messages({
      'number.base': 'Latitude must be a number',
      'number.min': 'Latitude must be between -90 and 90',
      'number.max': 'Latitude must be between -90 and 90',
      'any.required': 'Latitude is required'
    }),
  
  longitude: Joi.number().min(-180).max(180).required()
    .messages({
      'number.base': 'Longitude must be a number',
      'number.min': 'Longitude must be between -180 and 180',
      'number.max': 'Longitude must be between -180 and 180',
      'any.required': 'Longitude is required'
    })
});

/**
 * Middleware to validate service area requests
 */
const validateServiceAreaRequest = (req, res, next) => {
  const { error } = serviceAreaSchema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      })),
      timestamp: new Date().toISOString()
    });
  }

  next();
};

module.exports = {
  validateLocationRequest,
  validateNearbyPlacesRequest,
  validateServiceAreaRequest
};
