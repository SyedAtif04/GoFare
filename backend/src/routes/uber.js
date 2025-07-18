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
      // Return fallback estimates for multiple cab types
      const uberOptions = [
        {
          cabType: 'UberGo',
          cabIcon: 'directions-car',
          multiplier: 0.85,
          baseEta: 4,
          rating: 4.6
        },
        {
          cabType: 'UberX',
          cabIcon: 'car',
          multiplier: 1.0,
          baseEta: 5,
          rating: 4.8
        },
        {
          cabType: 'UberXL',
          cabIcon: 'airport-shuttle',
          multiplier: 1.6,
          baseEta: 7,
          rating: 4.9
        }
      ];

      const baseFallbackFare = uberService.calculateFallbackFare(pickupLat, pickupLng, dropLat, dropLng);

      const estimates = uberOptions.map((option, index) => {
        const fare = Math.round(baseFallbackFare * option.multiplier);
        const eta = option.baseEta + Math.floor(Math.random() * 4);
        const duration = Math.floor(Math.random() * 10) + 15;

        return {
          id: `uber_${option.cabType.toLowerCase()}_fallback_${Date.now()}_${index}`,
          provider: 'Uber',
          providerLogo: 'car',
          cabType: option.cabType,
          cabIcon: option.cabIcon,
          fare: fare,
          eta: eta,
          duration: duration,
          surge: Math.random() > 0.8, // 20% chance of surge
          surgeMultiplier: Math.random() > 0.8 ? 1.2 + Math.random() * 0.6 : 1.0,
          rating: option.rating,
          color: '#000000',
          source: 'approximate',
          requiresLogin: true,
          loginUrl: '/api/uber/login',
          message: 'Login for real-time prices'
        };
      });

      return res.json({
        success: true,
        provider: 'Uber',
        estimates: estimates,
        requiresLogin: true
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

        duration = estimate.duration ? Math.round(estimate.duration / 60) : 20;
        surge = estimate.surge_multiplier > 1;
        surgeMultiplier = estimate.surge_multiplier || 1.0;
      } else {
        // Fallback calculation
        console.log('Using fallback fare calculation');
        fare = uberService.calculateFallbackFare(pickupLat, pickupLng, dropLat, dropLng);
      }

      // If we have real API data, try to extract multiple cab types
      if (priceData.status === 'fulfilled' && priceData.value.prices?.length > 0) {
        const estimates = priceData.value.prices.map((priceEstimate, index) => {
          let fare = 150; // default
          if (priceEstimate.estimate) {
            const fareMatch = priceEstimate.estimate.match(/[\d.]+/);
            if (fareMatch) {
              fare = parseFloat(fareMatch[0]);
              if (priceEstimate.estimate.includes('$')) {
                fare = Math.round(fare * 83); // USD to INR conversion
              }
            }
          }

          return {
            id: `uber_${priceEstimate.display_name?.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${index}`,
            provider: 'Uber',
            providerLogo: 'car',
            cabType: priceEstimate.display_name || 'UberX',
            cabIcon: 'car',
            fare: fare,
            eta: eta,
            duration: priceEstimate.duration ? Math.round(priceEstimate.duration / 60) : 20,
            surge: priceEstimate.surge_multiplier > 1,
            surgeMultiplier: priceEstimate.surge_multiplier || 1.0,
            rating: 4.8,
            color: '#000000',
            source: 'api',
            authenticated: true
          };
        });

        return res.json({
          success: true,
          provider: 'Uber',
          estimates: estimates,
          authenticated: true
        });
      } else {
        // Fallback to multiple cab types with calculated fares
        const uberOptions = [
          { cabType: 'UberGo', multiplier: 0.85, rating: 4.6 },
          { cabType: 'UberX', multiplier: 1.0, rating: 4.8 },
          { cabType: 'UberXL', multiplier: 1.6, rating: 4.9 }
        ];

        const estimates = uberOptions.map((option, index) => ({
          id: `uber_${option.cabType.toLowerCase()}_${Date.now()}_${index}`,
          provider: 'Uber',
          providerLogo: 'car',
          cabType: option.cabType,
          cabIcon: 'car',
          fare: Math.round((fare || 150) * option.multiplier),
          eta: eta,
          duration: duration,
          surge: surge,
          surgeMultiplier: surgeMultiplier,
          rating: option.rating,
          color: '#000000',
          source: 'fallback',
          authenticated: true
        }));

        return res.json({
          success: true,
          provider: 'Uber',
          estimates: estimates,
          authenticated: true
        });
      }

    } catch (apiError) {
      console.error('Uber API integration failed:', apiError.message);

      // Fallback to calculation with multiple cab types
      const baseFallbackFare = uberService.calculateFallbackFare(pickupLat, pickupLng, dropLat, dropLng);

      const uberOptions = [
        { cabType: 'UberGo', multiplier: 0.85, rating: 4.6 },
        { cabType: 'UberX', multiplier: 1.0, rating: 4.8 },
        { cabType: 'UberXL', multiplier: 1.6, rating: 4.9 }
      ];

      const estimates = uberOptions.map((option, index) => ({
        id: `uber_${option.cabType.toLowerCase()}_error_${Date.now()}_${index}`,
        provider: 'Uber',
        providerLogo: 'car',
        cabType: option.cabType,
        cabIcon: 'car',
        fare: Math.round(baseFallbackFare * option.multiplier),
        eta: Math.floor(Math.random() * 6) + 3,
        duration: Math.floor(Math.random() * 10) + 15,
        surge: false,
        surgeMultiplier: 1.0,
        rating: option.rating,
        color: '#000000',
        source: 'fallback',
        error: 'API unavailable'
      }));

      res.json({
        success: true,
        provider: 'Uber',
        estimates: estimates,
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

