const express = require('express');
const router = express.Router();
const mapsController = require('../controllers/mapsController');
const { validateAutocompleteRequest } = require('../validators/mapsValidators');

/**
 * @route   GET /api/v1/maps/autocomplete
 * @desc    Get autocomplete suggestions for location search
 * @access  Public
 * @params  {string} input - Search query (required)
 * @params  {string} types - Place types filter (optional)
 * @params  {string} components - Country/region filter (optional)
 * @params  {string} location - Bias results around location (optional)
 * @params  {number} radius - Search radius in meters (optional)
 */
router.get('/autocomplete', validateAutocompleteRequest, mapsController.getAutocomplete);

/**
 * @route   GET /api/v1/maps/place-details
 * @desc    Get detailed information about a specific place
 * @access  Public
 * @params  {string} place_id - Google Place ID (required)
 * @params  {string} fields - Comma-separated list of fields to return (optional)
 */
router.get('/place-details', mapsController.getPlaceDetails);

/**
 * @route   POST /api/v1/maps/directions
 * @desc    Get directions between two points
 * @access  Public
 * @body    {object} origin - Starting location
 * @body    {object} destination - Ending location
 * @body    {string} mode - Travel mode (driving, walking, bicycling, transit)
 */
router.post('/directions', mapsController.getDirections);

/**
 * @route   GET /api/v1/maps/distance-matrix
 * @desc    Get distance and duration between multiple origins and destinations
 * @access  Public
 * @params  {string} origins - Pipe-separated list of origins
 * @params  {string} destinations - Pipe-separated list of destinations
 * @params  {string} mode - Travel mode (optional)
 */
router.get('/distance-matrix', mapsController.getDistanceMatrix);

module.exports = router;
