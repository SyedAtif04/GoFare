# GoFare Backend API

A robust Node.js Express backend for Google Maps integration with the GoFare React Native app.

## 🚀 Features

- **Location Autocomplete**: Real-time place suggestions using Google Places API
- **Current Location Processing**: Convert GPS coordinates to formatted addresses
- **Geocoding & Reverse Geocoding**: Convert between addresses and coordinates
- **Map Integration**: Directions, distance matrix, and place details
- **Validation**: Comprehensive request validation with Joi
- **Error Handling**: Robust error handling with detailed responses
- **Rate Limiting**: Built-in rate limiting for API protection
- **CORS Support**: Configured for React Native Metro bundler

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── googleMaps.js          # Google Maps API configuration
│   ├── controllers/
│   │   ├── mapsController.js      # Maps-related endpoints
│   │   ├── locationController.js  # Location processing endpoints
│   │   └── geocodingController.js # Geocoding endpoints
│   ├── services/
│   │   ├── mapsService.js         # Google Maps API service layer
│   │   ├── locationService.js     # Location processing service
│   │   └── geocodingService.js    # Geocoding service
│   ├── routes/
│   │   ├── maps.js               # Maps routes
│   │   ├── location.js           # Location routes
│   │   └── geocoding.js          # Geocoding routes
│   ├── validators/
│   │   ├── mapsValidators.js     # Maps request validation
│   │   ├── locationValidators.js # Location request validation
│   │   └── geocodingValidators.js # Geocoding request validation
│   └── middleware/
│       ├── errorHandler.js       # Global error handling
│       └── validateApiKey.js     # API key validation
├── server.js                     # Main server file
├── package.json                  # Dependencies and scripts
├── .env.example                  # Environment variables template
└── README.md                     # This file
```

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Google Maps API Configuration
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration (React Native Metro bundler)
FRONTEND_URL=http://localhost:8081

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Start the Server

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

### 4. Health Check

Visit `http://localhost:3000/health` to verify the server is running.

## 📡 API Endpoints

### Maps Endpoints

#### Get Autocomplete Suggestions
```http
GET /api/v1/maps/autocomplete?input=search_query
```

#### Get Place Details
```http
GET /api/v1/maps/place-details?place_id=PLACE_ID
```

#### Get Directions
```http
POST /api/v1/maps/directions
Content-Type: application/json

{
  "origin": "pickup_location",
  "destination": "drop_location",
  "mode": "driving"
}
```

### Location Endpoints

#### Process Current Location
```http
POST /api/v1/location/current
Content-Type: application/json

{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "detailed": true
}
```

#### Find Nearby Places
```http
POST /api/v1/location/nearby
Content-Type: application/json

{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "type": "restaurant",
  "radius": 1000
}
```

### Geocoding Endpoints

#### Get Coordinates from Address
```http
POST /api/v1/geocoding/coordinates
Content-Type: application/json

{
  "address": "1600 Amphitheatre Parkway, Mountain View, CA"
}
```

#### Reverse Geocoding
```http
POST /api/v1/geocoding/reverse
Content-Type: application/json

{
  "latitude": 37.4224764,
  "longitude": -122.0842499
}
```

## 🔧 Integration with React Native

### Example Usage in GoFare App

```javascript
// Autocomplete for location search
const getLocationSuggestions = async (input) => {
  try {
    const response = await fetch(
      `http://localhost:3000/api/v1/maps/autocomplete?input=${encodeURIComponent(input)}`
    );
    const data = await response.json();
    return data.data.suggestions;
  } catch (error) {
    console.error('Autocomplete error:', error);
  }
};

// Process current location
const processCurrentLocation = async (latitude, longitude) => {
  try {
    const response = await fetch('http://localhost:3000/api/v1/location/current', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude,
        longitude,
        detailed: true
      })
    });
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Location processing error:', error);
  }
};
```

## 🛡️ Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **CORS Protection**: Configured for React Native origins
- **Input Validation**: Comprehensive validation with Joi
- **Error Handling**: Sanitized error responses
- **API Key Validation**: Ensures Google Maps API key is configured

## 🚦 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 📝 Development

### Running Tests
```bash
npm test
```

### Code Structure
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic and Google Maps API integration
- **Validators**: Request validation middleware
- **Middleware**: Cross-cutting concerns (auth, error handling)

## 🌐 Production Deployment

1. Set `NODE_ENV=production` in your environment
2. Configure proper CORS origins for your production frontend
3. Set up proper logging and monitoring
4. Configure reverse proxy (nginx) if needed
5. Set up SSL/TLS certificates

## 📞 Support

For issues and questions, refer to the Google Maps API documentation:
- [Places API](https://developers.google.com/maps/documentation/places/web-service)
- [Geocoding API](https://developers.google.com/maps/documentation/geocoding)
- [Directions API](https://developers.google.com/maps/documentation/directions)
