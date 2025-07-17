const express = require('express');
const router = express.Router();

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lng1, lat2, lng2) {
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
router.get('/estimate', (req, res) => {
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

    // Calculate distance using Haversine formula
    const distanceKm = calculateDistance(pickupLat, pickupLng, dropLat, dropLng);

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

    // Generate random ETA between 4-7 minutes
    const eta = Math.floor(Math.random() * 4) + 4;
    const duration = Math.floor(Math.random() * 8) + 16; // 16-24 mins

    // Return response in frontend-compatible format
    res.json({
      id: 'ola_' + Date.now(),
      provider: 'Ola',
      providerLogo: 'car-sport',
      cabType: 'Sedan',
      cabIcon: 'car-sport',
      fare: Math.round(totalFare),
      eta: eta,
      duration: duration,
      surge: false,
      rating: 4.6,
      color: '#FFD700'
    });

  } catch (error) {
    console.error('Error in Ola estimate:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;