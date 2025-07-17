const express = require('express');
const uberService = require('../services/uberService');

const router = express.Router();

// OAuth login route - redirects user to Uber
router.get('/login', (req, res) => {
  try {
    const authUrl = uberService.getAuthorizationUrl();
    res.json({
      success: true,
      auth_url: authUrl,
      message: 'Redirect user to this URL for Uber login'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// OAuth callback route - handles Uber redirect
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'OAuth authorization failed',
        details: error
      });
    }

    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Authorization code not received'
      });
    }

    const tokenData = await uberService.exchangeCodeForToken(code);

    res.json({
      success: true,
      message: 'Successfully authenticated with Uber',
      expires_in: tokenData.expires_in
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Token exchange failed',
      details: error.message
    });
  }
});

// Check authentication status
router.get('/auth-status', (req, res) => {
  const userToken = uberService.getUserToken();
  res.json({
    authenticated: !!userToken,
    message: userToken ? 'User is authenticated' : 'User needs to login'
  });
});

// Uber fare estimation route (updated)
router.get('/estimate', async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, drop_lat, drop_lng } = req.query;

    // Validate required parameters
    if (!pickup_lat || !pickup_lng || !drop_lat || !drop_lng) {
      return res.status(400).json({
        error: 'Missing required parameters: pickup_lat, pickup_lng, drop_lat, drop_lng'
      });
    }

    // Convert to numbers
    const pickupLat = parseFloat(pickup_lat);
    const pickupLng = parseFloat(pickup_lng);
    const dropLat = parseFloat(drop_lat);
    const dropLng = parseFloat(drop_lng);

    // Validate coordinates
    if (isNaN(pickupLat) || isNaN(pickupLng) || isNaN(dropLat) || isNaN(dropLng)) {
      return res.status(400).json({
        error: 'Invalid coordinates provided'
      });
    }

    // Check if user is authenticated
    const userToken = uberService.getUserToken();

    if (!userToken) {
      // Return fallback estimate with login prompt
      const fallbackFare = uberService.calculateFallbackFare(pickupLat, pickupLng, dropLat, dropLng);

      return res.json({
        id: 'uber_fallback_' + Date.now(),
        provider: 'Uber',
        providerLogo: 'car',
        cabType: 'UberX',
        cabIcon: 'car',
        fare: fallbackFare,
        eta: Math.floor(Math.random() * 6) + 3,
        duration: Math.floor(Math.random() * 10) + 15,
        surge: false,
        surgeMultiplier: 1.0,
        rating: 4.8,
        color: '#000000',
        source: 'approximate',
        requiresLogin: true,
        loginUrl: '/api/uber/login',
        message: 'Login for real-time prices'
      });
    }

    try {
      console.log('Calling Uber API for authenticated price estimate...');

      // Get price and time estimates from Uber API
      const [priceData, timeData] = await Promise.allSettled([
        uberService.getPriceEstimate(pickupLat, pickupLng, dropLat, dropLng),
        uberService.getTimeEstimate(pickupLat, pickupLng)
      ]);

      let estimate = null;
      let eta = 5; // default

      // Process price estimate
      if (priceData.status === 'fulfilled' && priceData.value.prices?.length > 0) {
        estimate = priceData.value.prices[0];
        console.log('Uber price estimate received:', estimate.display_name, estimate.estimate);
      }

      // Process time estimate
      if (timeData.status === 'fulfilled' && timeData.value.times?.length > 0) {
        eta = Math.round(timeData.value.times[0].estimate / 60);
        console.log('Uber ETA received:', eta, 'minutes');
      }

      let fare = 0;
      let cabType = 'UberX';
      let duration = 20;
      let surge = false;
      let surgeMultiplier = 1.0;

      if (estimate) {
        // Parse fare from estimate
        if (estimate.estimate) {
          const fareMatch = estimate.estimate.match(/[\d.]+/);
          if (fareMatch) {
            fare = parseFloat(fareMatch[0]);
            if (estimate.estimate.includes('$')) {
              fare = Math.round(fare * 83); // USD to INR conversion
            }
          }
        }

        cabType = estimate.display_name || 'UberX';
        duration = estimate.duration ? Math.round(estimate.duration / 60) : 20;
        surge = estimate.surge_multiplier > 1;
        surgeMultiplier = estimate.surge_multiplier || 1.0;
      } else {
        // Fallback calculation
        console.log('Using fallback fare calculation');
        fare = uberService.calculateFallbackFare(pickupLat, pickupLng, dropLat, dropLng);
      }

      // Return response in frontend-compatible format
      res.json({
        id: 'uber_' + Date.now(),
        provider: 'Uber',
        providerLogo: 'car',
        cabType: cabType,
        cabIcon: 'car',
        fare: fare || 150,
        eta: eta,
        duration: duration,
        surge: surge,
        surgeMultiplier: surgeMultiplier,
        rating: 4.8,
        color: '#000000',
        source: estimate ? 'api' : 'fallback',
        authenticated: true
      });

    } catch (apiError) {
      console.error('Uber API integration failed:', apiError.message);

      // Fallback to calculation
      const fallbackFare = uberService.calculateFallbackFare(pickupLat, pickupLng, dropLat, dropLng);

      res.json({
        id: 'uber_fallback_' + Date.now(),
        provider: 'Uber',
        providerLogo: 'car',
        cabType: 'UberX',
        cabIcon: 'car',
        fare: fallbackFare,
        eta: Math.floor(Math.random() * 6) + 3,
        duration: Math.floor(Math.random() * 10) + 15,
        surge: false,
        surgeMultiplier: 1.0,
        rating: 4.8,
        color: '#000000',
        source: 'fallback',
        error: 'API unavailable'
      });
    }

  } catch (error) {
    console.error('Error in Uber estimate route:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;

