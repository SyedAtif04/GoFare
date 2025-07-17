/**
 * Global error handling middleware
 * Handles all errors and sends appropriate responses
 */

const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let error = {
    success: false,
    message: 'Internal server error',
    timestamp: new Date().toISOString()
  };

  // Handle different types of errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.details = err.details || err.message;
    return res.status(400).json(error);
  }

  if (err.name === 'UnauthorizedError') {
    error.message = 'Unauthorized access';
    return res.status(401).json(error);
  }

  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    error.message = 'External service unavailable';
    error.details = 'Unable to connect to Google Maps API';
    return res.status(503).json(error);
  }

  // Google Maps API specific errors
  if (err.response && err.response.data) {
    const { status, error_message } = err.response.data;
    
    switch (status) {
      case 'INVALID_REQUEST':
        error.message = 'Invalid request parameters';
        error.details = error_message;
        return res.status(400).json(error);
        
      case 'OVER_QUERY_LIMIT':
        error.message = 'API quota exceeded';
        error.details = 'Google Maps API quota has been exceeded';
        return res.status(429).json(error);
        
      case 'REQUEST_DENIED':
        error.message = 'Request denied';
        error.details = 'Google Maps API request was denied';
        return res.status(403).json(error);
        
      case 'UNKNOWN_ERROR':
        error.message = 'Google Maps API error';
        error.details = 'An unknown error occurred with Google Maps API';
        return res.status(500).json(error);
        
      default:
        error.message = 'Google Maps API error';
        error.details = error_message || 'Unknown Google Maps API error';
        return res.status(500).json(error);
    }
  }

  // Handle Joi validation errors
  if (err.isJoi) {
    error.message = 'Request validation failed';
    error.details = err.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return res.status(400).json(error);
  }

  // Default server error
  if (process.env.NODE_ENV === 'development') {
    error.details = err.message;
    error.stack = err.stack;
  }

  res.status(500).json(error);
};

module.exports = errorHandler;
