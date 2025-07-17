/**
 * Middleware to validate Google Maps API key configuration
 * Ensures the API key is properly set before processing requests
 */

const validateApiKey = (req, res, next) => {
  // Check if Google Maps API key is configured
  if (!process.env.GOOGLE_MAPS_API_KEY) {
    return res.status(500).json({
      success: false,
      error: 'Server configuration error',
      message: 'Google Maps API key is not configured',
      timestamp: new Date().toISOString()
    });
  }

  // Check if API key is not the default placeholder
  if (process.env.GOOGLE_MAPS_API_KEY === 'your_google_maps_api_key_here') {
    return res.status(500).json({
      success: false,
      error: 'Server configuration error',
      message: 'Google Maps API key is not properly configured',
      timestamp: new Date().toISOString()
    });
  }

  // Optional: Add request-specific API key validation
  // This allows clients to send their own API key if needed
  const clientApiKey = req.headers['x-api-key'] || req.query.key;
  
  if (clientApiKey) {
    // If client provides an API key, validate it's not empty
    if (!clientApiKey.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid API key',
        message: 'Provided API key is empty',
        timestamp: new Date().toISOString()
      });
    }
    
    // Store client API key for use in services
    req.apiKey = clientApiKey;
  } else {
    // Use server's default API key
    req.apiKey = process.env.GOOGLE_MAPS_API_KEY;
  }

  next();
};

module.exports = validateApiKey;
