const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { validateLocationRequest } = require('../validators/locationValidators');

/**
 * @route   POST /api/v1/location/current
 * @desc    Process current location coordinates and get address details
 * @access  Public
 * @body    {number} latitude - User's current latitude (required)
 * @body    {number} longitude - User's current longitude (required)
 * @body    {boolean} detailed - Return detailed address components (optional)
 */
router.post('/current', validateLocationRequest, locationController.processCurrentLocation);

/**
 * @route   POST /api/v1/location/nearby
 * @desc    Find nearby places of interest
 * @access  Public
 * @body    {number} latitude - Search center latitude (required)
 * @body    {number} longitude - Search center longitude (required)
 * @body    {string} type - Place type to search for (optional)
 * @body    {number} radius - Search radius in meters (optional, default: 1000)
 */
router.post('/nearby', locationController.getNearbyPlaces);

/**
 * @route   POST /api/v1/location/validate
 * @desc    Validate if coordinates are within service area
 * @access  Public
 * @body    {number} latitude - Latitude to validate (required)
 * @body    {number} longitude - Longitude to validate (required)
 */
router.post('/validate', locationController.validateServiceArea);

module.exports = router;
