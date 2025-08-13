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

// Ola fare estimation route
router.get('/estimate', async (req, res) => {
  try {
    const { pickup_lat, pickup_lng, drop_lat, drop_lng, ride_time } = req.query;

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
    const rideTimeMins = ride_time ? parseFloat(ride_time) : 2;

    // Validate coordinates
    if (isNaN(pickupLat) || isNaN(pickupLng) || isNaN(dropLat) || isNaN(dropLng)) {
      return res.status(400).json({
        error: 'Invalid coordinates provided'
      });
    }

    // Validate ride time
    if (isNaN(rideTimeMins) || rideTimeMins < 0) {
      return res.status(400).json({
        error: 'Invalid ride_time provided'
      });
    }

    // Get road distance using Google Maps
    const distanceKm = await getRoadDistance(pickupLat, pickupLng, dropLat, dropLng, process.env.GOOGLE_MAPS_API_KEY);

    // Ola pricing logic
    const baseFare = 45;
    const perKmRate = 11;
    const rideTimeChargePerMin = 1.2;
    const bookingFee = 20;
    const surgeMultiplier = 1.0;
    const serviceTaxPercent = 5;

    // Calculate components
    const distanceCharge = distanceKm * perKmRate;
    const rideTimeCharge = rideTimeMins * rideTimeChargePerMin;
    const fareBeforeSurge = baseFare + distanceCharge + rideTimeCharge + bookingFee;
    const fareAfterSurge = fareBeforeSurge * surgeMultiplier;
    const serviceTax = (fareAfterSurge * serviceTaxPercent) / 100;
    const totalFare = fareAfterSurge + serviceTax;

    // Ola cab types with different pricing
    const olaOptions = [
      {
        cabType: 'Mini',
        cabIcon: 'directions-car',
        multiplier: 0.8,
        baseEta: 4,
        rating: 4.4
      },
      {
        cabType: 'Sedan',
        cabIcon: 'car-sport',
        multiplier: 1.0,
        baseEta: 5,
        rating: 4.6
      },
      {
        cabType: 'Auto',
        cabIcon: 'local-taxi',
        multiplier: 0.6,
        baseEta: 3,
        rating: 4.2
      },
      {
        cabType: 'SUV',
        cabIcon: 'airport-shuttle',
        multiplier: 1.5,
        baseEta: 7,
        rating: 4.7
      }
    ];

    // Generate estimates for all cab types
    const estimates = olaOptions.map((option, index) => {
      const adjustedFare = Math.round(totalFare * option.multiplier);
      const eta = option.baseEta + Math.floor(Math.random() * 3);
      const duration = Math.floor(Math.random() * 8) + 16;

      return {
        id: `ola_${option.cabType.toLowerCase()}_${Date.now()}_${index}`,
        provider: 'Ola',
        providerLogo: 'car-sport',
        cabType: option.cabType,
        cabIcon: option.cabIcon,
        fare: adjustedFare,
        eta: eta,
        duration: duration,
        surge: Math.random() > 0.7, // 30% chance of surge
        surgeMultiplier: Math.random() > 0.7 ? 1.2 + Math.random() * 0.5 : 1.0,
        rating: option.rating,
        color: '#FFD700'
      };
    });

    // Return array of estimates
    res.json({
      success: true,
      provider: 'Ola',
      estimates: estimates
    });

  } catch (error) {
    console.error('Error in Ola estimate:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;