const express = require('express');
const router = express.Router();
const mapsService = require('../services/mapsService');

// Helper function to get road distance using Google Maps Distance Matrix API
async function getRoadDistance(lat1, lng1, lat2, lng2, apiKey) {
  try {
    const origins = [`${lat1},${lng1}`];
    const destinations = [`${lat2},${lng2}`];

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
        const distanceKm = element.distance.value / 1000;
        console.log(` Road distance: ${distanceKm.toFixed(2)} km (vs straight-line)`);
        return distanceKm;
      }
    }

    // Fallback to Haversine if Google Maps fails
    console.log(' Google Maps distance failed, using straight-line distance');
    return calculateStraightLineDistance(lat1, lng1, lat2, lng2);
  } catch (error) {
    console.error(' Error getting road distance:', error.message);
    // Fallback to Haversine if Google Maps fails
    return calculateStraightLineDistance(lat1, lng1, lat2, lng2);
  }
}

// Helper function to calculate straight-line distance (fallback)
function calculateStraightLineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

// Rapido fare estimation route
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

    // Get road distance using Google Maps
    const distance = await getRoadDistance(pickupLat, pickupLng, dropLat, dropLng, process.env.GOOGLE_MAPS_API_KEY);

    // Rapido cab types with different pricing
    const rapidoOptions = [
      {
        cabType: 'Bike',
        cabIcon: 'two-wheeler',
        baseFare: 10,
        perKmRate: 10,
        baseEta: 2,
        rating: 4.5
      },
      {
        cabType: 'Auto',
        cabIcon: 'local-taxi',
        baseFare: 20,
        perKmRate: 12,
        baseEta: 4,
        rating: 4.3
      }
    ];

    // Generate estimates for all cab types
    const estimates = rapidoOptions.map((option, index) => {
      const fare = Math.round(option.baseFare + (distance * option.perKmRate));
      const eta = option.baseEta + Math.floor(Math.random() * 3);
      const duration = Math.floor(Math.random() * 5) + 12; // 12-17 mins

      return {
        id: `rapido_${option.cabType.toLowerCase()}_${Date.now()}_${index}`,
        provider: 'Rapido',
        providerLogo: 'bicycle',
        cabType: option.cabType,
        cabIcon: option.cabIcon,
        fare: fare,
        eta: eta,
        duration: duration,
        surge: false, // Rapido rarely has surge
        rating: option.rating,
        color: '#FF6B35'
      };
    });

    // Return array of estimates
    res.json({
      success: true,
      provider: 'Rapido',
      estimates: estimates
    });

  } catch (error) {
    console.error('Error in Rapido estimate:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;