const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const mapsRoutes = require('./src/routes/maps');
const locationRoutes = require('./src/routes/location');
const geocodingRoutes = require('./src/routes/geocoding');

// Import middleware
const errorHandler = require('./src/middleware/errorHandler');
const validateApiKey = require('./src/middleware/validateApiKey');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());

// CORS configuration for React Native
app.use(cors({
  origin: [
    'http://localhost:8081', // Expo Metro bundler
    'http://localhost:8082', // Alternative port
    'http://localhost:19006', // Expo web
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API key validation middleware (applied to all routes)
app.use('/api', validateApiKey);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'GoFare Backend API is running',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || 'v1'
  });
});

// API routes
const apiVersion = process.env.API_VERSION || 'v1';
app.use(`/api/${apiVersion}/maps`, mapsRoutes);
app.use(`/api/${apiVersion}/location`, locationRoutes);
app.use(`/api/${apiVersion}/geocoding`, geocodingRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The requested endpoint ${req.originalUrl} does not exist`,
    availableEndpoints: [
      `GET /health`,
      `GET /api/${apiVersion}/maps/autocomplete`,
      `POST /api/${apiVersion}/location/current`,
      `POST /api/${apiVersion}/geocoding/coordinates`,
      `POST /api/${apiVersion}/geocoding/reverse`
    ]
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GoFare Backend API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗺️  Google Maps API: ${process.env.GOOGLE_MAPS_API_KEY ? 'Configured' : 'Missing'}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
