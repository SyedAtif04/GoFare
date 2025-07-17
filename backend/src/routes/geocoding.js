const express = require('express');
const router = express.Router();
const geocodingController = require('../controllers/geocodingController');
const { validateGeocodingRequest, validateReverseGeocodingRequest } = require('../validators/geocodingValidators');

/**
 * @route   POST /api/v1/geocoding/coordinates
 * @desc    Convert address or place name to coordinates
 * @access  Public
 * @body    {string} address - Address or place name to geocode (required)
 * @body    {string} place_id - Google Place ID (alternative to address)
 * @body    {string} components - Country/region filter (optional)
 * @body    {string} bounds - Viewport bias (optional)
 */
router.post('/coordinates', validateGeocodingRequest, geocodingController.getCoordinates);

/**
 * @route   POST /api/v1/geocoding/reverse
 * @desc    Convert coordinates to address
 * @access  Public
 * @body    {number} latitude - Latitude coordinate (required)
 * @body    {number} longitude - Longitude coordinate (required)
 * @body    {string} result_type - Filter results by type (optional)
 * @body    {string} location_type - Filter by location type (optional)
 */
router.post('/reverse', validateReverseGeocodingRequest, geocodingController.getReverseGeocode);

/**
 * @route   POST /api/v1/geocoding/batch
 * @desc    Batch geocoding for multiple addresses
 * @access  Public
 * @body    {array} addresses - Array of addresses to geocode (required)
 * @body    {string} components - Country/region filter (optional)
 */
router.post('/batch', geocodingController.getBatchGeocode);

/**
 * @route   GET /api/v1/geocoding/timezone
 * @desc    Get timezone information for coordinates
 * @access  Public
 * @params  {number} latitude - Latitude coordinate (required)
 * @params  {number} longitude - Longitude coordinate (required)
 * @params  {number} timestamp - Unix timestamp (optional, defaults to current time)
 */
router.get('/timezone', geocodingController.getTimezone);

module.exports = router;
