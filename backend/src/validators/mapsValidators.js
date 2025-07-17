const Joi = require('joi');

/**
 * Validation schema for autocomplete requests
 */
const autocompleteSchema = Joi.object({
  input: Joi.string().min(1).max(200).required()
    .messages({
      'string.empty': 'Search input cannot be empty',
      'string.min': 'Search input must be at least 1 character',
      'string.max': 'Search input cannot exceed 200 characters',
      'any.required': 'Search input is required'
    }),
  
  types: Joi.string().optional()
    .valid('geocode', 'address', 'establishment', 'regions', 'cities')
    .messages({
      'any.only': 'Invalid place type. Must be one of: geocode, address, establishment, regions, cities'
    }),
  
  components: Joi.string().optional()
    .pattern(/^country:[a-z]{2}$/i)
    .messages({
      'string.pattern.base': 'Components must be in format "country:XX" where XX is a 2-letter country code'
    }),
  
  location: Joi.string().optional()
    .pattern(/^-?\d+\.?\d*,-?\d+\.?\d*$/)
    .messages({
      'string.pattern.base': 'Location must be in format "latitude,longitude"'
    }),
  
  radius: Joi.number().integer().min(1).max(50000).optional()
    .messages({
      'number.base': 'Radius must be a number',
      'number.integer': 'Radius must be an integer',
      'number.min': 'Radius must be at least 1 meter',
      'number.max': 'Radius cannot exceed 50,000 meters'
    }),
  
  language: Joi.string().length(2).optional()
    .messages({
      'string.length': 'Language must be a 2-letter language code'
    })
});

/**
 * Middleware to validate autocomplete requests
 */
const validateAutocompleteRequest = (req, res, next) => {
  const { error } = autocompleteSchema.validate(req.query, {
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
 * Validation schema for place details requests
 */
const placeDetailsSchema = Joi.object({
  place_id: Joi.string().required()
    .messages({
      'string.empty': 'Place ID cannot be empty',
      'any.required': 'Place ID is required'
    }),
  
  fields: Joi.string().optional()
    .pattern(/^[a-z_,]+$/)
    .messages({
      'string.pattern.base': 'Fields must be comma-separated field names'
    }),
  
  language: Joi.string().length(2).optional()
    .messages({
      'string.length': 'Language must be a 2-letter language code'
    })
});

/**
 * Middleware to validate place details requests
 */
const validatePlaceDetailsRequest = (req, res, next) => {
  const { error } = placeDetailsSchema.validate(req.query, {
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
 * Validation schema for directions requests
 */
const directionsSchema = Joi.object({
  origin: Joi.alternatives().try(
    Joi.string().pattern(/^-?\d+\.?\d*,-?\d+\.?\d*$/),
    Joi.string().min(1).max(200)
  ).required()
    .messages({
      'alternatives.match': 'Origin must be coordinates (lat,lng) or an address',
      'any.required': 'Origin is required'
    }),
  
  destination: Joi.alternatives().try(
    Joi.string().pattern(/^-?\d+\.?\d*,-?\d+\.?\d*$/),
    Joi.string().min(1).max(200)
  ).required()
    .messages({
      'alternatives.match': 'Destination must be coordinates (lat,lng) or an address',
      'any.required': 'Destination is required'
    }),
  
  mode: Joi.string().optional()
    .valid('driving', 'walking', 'bicycling', 'transit')
    .default('driving')
    .messages({
      'any.only': 'Mode must be one of: driving, walking, bicycling, transit'
    }),
  
  waypoints: Joi.array().items(
    Joi.alternatives().try(
      Joi.string().pattern(/^-?\d+\.?\d*,-?\d+\.?\d*$/),
      Joi.string().min(1).max(200)
    )
  ).optional()
    .messages({
      'array.base': 'Waypoints must be an array'
    }),
  
  avoid: Joi.array().items(
    Joi.string().valid('tolls', 'highways', 'ferries', 'indoor')
  ).optional()
    .messages({
      'array.base': 'Avoid must be an array',
      'any.only': 'Avoid items must be one of: tolls, highways, ferries, indoor'
    }),
  
  departure_time: Joi.number().integer().min(Math.floor(Date.now() / 1000)).optional()
    .messages({
      'number.base': 'Departure time must be a number',
      'number.integer': 'Departure time must be an integer',
      'number.min': 'Departure time cannot be in the past'
    })
});

/**
 * Middleware to validate directions requests
 */
const validateDirectionsRequest = (req, res, next) => {
  const { error } = directionsSchema.validate(req.body, {
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
  validateAutocompleteRequest,
  validatePlaceDetailsRequest,
  validateDirectionsRequest
};
