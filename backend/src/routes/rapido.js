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

// Rapido fare estimation route
router.get('/estimate', (req, res) => {
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

    // Calculate distance
    const distance = calculateDistance(pickupLat, pickupLng, dropLat, dropLng);

    // Calculate fare: ₹10 base + ₹10/km
    const baseFare = 10;
    const perKmRate = 10;
    const estimatedPrice = Math.round(baseFare + (distance * perKmRate));

    // Generate random ETA between 2-6 minutes
    const eta = Math.floor(Math.random() * 5) + 2; // 2-6 minutes

    // Return response
    res.json({
      service: 'Rapido',
      estimated_price: estimatedPrice,
      eta: `${eta} mins`,
      distance: `${distance.toFixed(2)} km`
    });

  } catch (error) {
    console.error('Error in Rapido estimate:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});

module.exports = router;