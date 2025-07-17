const Joi = require('joi');

/**
 * Validation schema for geocoding requests
 */
const geocodingSchema = Joi.object({
  address: Joi.string().min(1).max(500).optional()
    .messages({
      'string.empty': 'Address cannot be empty',
      'string.min': 'Address must be at least 1 character',
      'string.max': 'Address cannot exceed 500 characters'
    }),

  place_id: Joi.string().optional()
    .messages({
      'string.empty': 'Place ID cannot be empty'
    }),
  
  components: Joi.string().optional()
    .pattern(/^(country:[a-z]{2}|administrative_area:[^|]+|locality:[^|]+|postal_code:[^|]+)(\|(country:[a-z]{2}|administrative_area:[^|]+|locality:[^|]+|postal_code:[^|]+))*$/i)
    .messages({
      'string.pattern.base': 'Components must be in format "type:value|type:value"'
    }),
  
  bounds: Joi.string().optional()
    .pattern(/^-?\d+\.?\d*,-?\d+\.?\d*\|-?\d+\.?\d*,-?\d+\.?\d*$/)
    .messages({
      'string.pattern.base': 'Bounds must be in format "southwest_lat,southwest_lng|northeast_lat,northeast_lng"'
    }),
  
  region: Joi.string().length(2).optional()
    .messages({
      'string.length': 'Region must be a 2-letter country code'
    })
});

/**
 * Middleware to validate geocoding requests
 */
const validateGeocodingRequest = (req, res, next) => {
  const { error } = geocodingSchema.validate(req.body, {
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

  // Custom validation: ensure either address or place_id is provided
  const { address, place_id } = req.body;
  if (!address && !place_id) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: [{
        field: 'address_or_place_id',
        message: 'Either address or place_id is required'
      }],
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Validation schema for reverse geocoding requests
 */
const reverseGeocodingSchema = Joi.object({
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
  
  result_type: Joi.string().optional()
    .valid(
      'street_address', 'route', 'intersection', 'political', 'country',
      'administrative_area_level_1', 'administrative_area_level_2',
      'administrative_area_level_3', 'administrative_area_level_4',
      'administrative_area_level_5', 'colloquial_area', 'locality',
      'sublocality', 'neighborhood', 'premise', 'subpremise',
      'postal_code', 'natural_feature', 'airport', 'park', 'point_of_interest'
    )
    .messages({
      'any.only': 'Invalid result type'
    }),
  
  location_type: Joi.string().optional()
    .valid('ROOFTOP', 'RANGE_INTERPOLATED', 'GEOMETRIC_CENTER', 'APPROXIMATE')
    .messages({
      'any.only': 'Location type must be one of: ROOFTOP, RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE'
    })
});

/**
 * Middleware to validate reverse geocoding requests
 */
const validateReverseGeocodingRequest = (req, res, next) => {
  const { error } = reverseGeocodingSchema.validate(req.body, {
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
 * Validation schema for batch geocoding requests
 */
const batchGeocodingSchema = Joi.object({
  addresses: Joi.array().items(
    Joi.string().min(1).max(500)
  ).min(1).max(25).required()
    .messages({
      'array.base': 'Addresses must be an array',
      'array.min': 'At least one address is required',
      'array.max': 'Maximum 25 addresses allowed per batch',
      'any.required': 'Addresses array is required'
    }),
  
  components: Joi.string().optional()
    .pattern(/^(country:[a-z]{2}|administrative_area:[^|]+|locality:[^|]+|postal_code:[^|]+)(\|(country:[a-z]{2}|administrative_area:[^|]+|locality:[^|]+|postal_code:[^|]+))*$/i)
    .messages({
      'string.pattern.base': 'Components must be in format "type:value|type:value"'
    })
});

/**
 * Middleware to validate batch geocoding requests
 */
const validateBatchGeocodingRequest = (req, res, next) => {
  const { error } = batchGeocodingSchema.validate(req.body, {
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
 * Validation schema for timezone requests
 */
const timezoneSchema = Joi.object({
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
  
  timestamp: Joi.number().integer().min(0).optional()
    .messages({
      'number.base': 'Timestamp must be a number',
      'number.integer': 'Timestamp must be an integer',
      'number.min': 'Timestamp must be positive'
    })
});

/**
 * Middleware to validate timezone requests
 */
const validateTimezoneRequest = (req, res, next) => {
  const { error } = timezoneSchema.validate(req.query, {
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
  validateGeocodingRequest,
  validateReverseGeocodingRequest,
  validateBatchGeocodingRequest,
  validateTimezoneRequest
};
