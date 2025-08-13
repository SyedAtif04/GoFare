const axios = require('axios');

// Uber API configuration
const UBER_CONFIG = {
  client_id: process.env.UBER_CLIENT_ID,
  client_secret: process.env.UBER_CLIENT_SECRET,
  redirect_uri: process.env.UBER_REDIRECT_URI || 'http://localhost:3000/api/uber/callback',
  base_url: 'https://api.uber.com/v1.2',
  auth_url: 'https://login.uber.com/oauth/v2'
};

// In-memory token storage (in production, use a database)
let userToken = null;

/**
 * Generate OAuth authorization URL
 */
const getAuthorizationUrl = () => {
  const params = new URLSearchParams({
    client_id: UBER_CONFIG.client_id,
    response_type: 'code',
    redirect_uri: UBER_CONFIG.redirect_uri,
    scope: 'request'
  });
  
  return `${UBER_CONFIG.auth_url}/authorize?${params.toString()}`;
};

/**
 * Exchange authorization code for access token
 */
const exchangeCodeForToken = async (code) => {
  try {
    const response = await axios.post(`${UBER_CONFIG.auth_url}/token`, {
      client_id: UBER_CONFIG.client_id,
      client_secret: UBER_CONFIG.client_secret,
      grant_type: 'authorization_code',
      redirect_uri: UBER_CONFIG.redirect_uri,
      code: code
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    userToken = response.data;
    return response.data;
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    throw new Error('Failed to exchange code for token');
  }
};

/**
 * Get stored user token
 */
const getUserToken = () => {
  return userToken;
};

/**
 * Get price estimates from Uber API
 */
const getPriceEstimate = async (startLat, startLng, endLat, endLng) => {
  if (!userToken) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await axios.get(`${UBER_CONFIG.base_url}/estimates/price`, {
      params: {
        start_latitude: startLat,
        start_longitude: startLng,
        end_latitude: endLat,
        end_longitude: endLng
      },
      headers: {
        'Authorization': `Bearer ${userToken.access_token}`,
        'Accept-Language': 'en_US',
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Price estimate error:', error.response?.data || error.message);
    throw new Error('Failed to get price estimate');
  }
};

/**
 * Get time estimates from Uber API
 */
const getTimeEstimate = async (startLat, startLng) => {
  if (!userToken) {
    throw new Error('User not authenticated');
  }

  try {
    const response = await axios.get(`${UBER_CONFIG.base_url}/estimates/time`, {
      params: {
        start_latitude: startLat,
        start_longitude: startLng
      },
      headers: {
        'Authorization': `Bearer ${userToken.access_token}`,
        'Accept-Language': 'en_US',
        'Content-Type': 'application/json'
      }
    });

    return response.data;
  } catch (error) {
    console.error('Time estimate error:', error.response?.data || error.message);
    throw new Error('Failed to get time estimate');
  }
};

/**
 * Calculate fallback fare when API is unavailable
 */
const calculateFallbackFare = async (pickupLat, pickupLng, dropLat, dropLng, apiKey) => {
  let distance;

  try {
    // Try to get road distance from Google Maps
    const mapsService = require('./mapsService');
    const origins = [`${pickupLat},${pickupLng}`];
    const destinations = [`${dropLat},${dropLng}`];

    const distanceMatrix = await mapsService.getDistanceMatrix({
      origins,
      destinations,
      mode: 'driving',
      units: 'metric',
      apiKey
    });

    if (distanceMatrix.rows && distanceMatrix.rows[0] && distanceMatrix.rows[0].elements[0]) {
      const element = distanceMatrix.rows[0].elements[0];
      if (element.status === 'OK' && element.distance) {
        // Convert meters to kilometers
        distance = element.distance.value / 1000;
        console.log(` Uber fallback using road distance: ${distance.toFixed(2)} km`);
      }
    }
  } catch (error) {
    console.error(' Error getting road distance for Uber fallback:', error.message);
  }

  // Fallback to Haversine if Google Maps fails
  if (!distance) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (dropLat - pickupLat) * Math.PI / 180;
    const dLng = (dropLng - pickupLng) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(pickupLat * Math.PI / 180) * Math.cos(dropLat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distance = R * c;
    console.log(` Uber fallback using straight-line distance: ${distance.toFixed(2)} km`);
  }

  // Uber-like pricing calculation
  const baseFare = 50;
  const perKmRate = 15;
  const timeCharge = 2; // per minute
  const bookingFee = 25;
  const estimatedTime = distance * 3; // rough estimate: 3 mins per km

  const totalFare = baseFare + (distance * perKmRate) + (estimatedTime * timeCharge) + bookingFee;

  return Math.round(totalFare);
};

module.exports = {
  getAuthorizationUrl,
  exchangeCodeForToken,
  getUserToken,
  getPriceEstimate,
  getTimeEstimate,
  calculateFallbackFare
};
