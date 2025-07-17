require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const rapidoRoutes = require('./routes/rapido');
const uberRoutes = require('./routes/uber');
const olaRoutes = require('./routes/ola');

// Use routes
app.use('/api/rapido', rapidoRoutes);
app.use('/api/uber', uberRoutes);
app.use('/api/ola', olaRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'GoFare Backend API' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Available routes:');
  console.log('- GET /api/rapido/estimate');
  console.log('- GET /api/uber/estimate');
  console.log('- GET /api/ola/estimate');
});

module.exports = app;

