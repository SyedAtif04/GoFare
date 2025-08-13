const express = require('express');
const axios = require('axios');
const router = express.Router();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

router.post('/weather-ride-suggestion', async (req, res) => {
  try {
    console.log(' Weather request received:', req.body);

    const { pickup, drop } = req.body;

    // Validate input
    if (!pickup?.lat || !pickup?.lon || !drop?.lat || !drop?.lon) {
      return res.status(400).json({
        error: 'Missing pickup or drop coordinates',
        received: { pickup, drop }
      });
    }

    console.log(`  Fetching weather for pickup: ${pickup.lat}, ${pickup.lon}`);
    console.log(`  Fetching weather for drop: ${drop.lat}, ${drop.lon}`);

    // Fetch weather for both locations
    const [pickupWeather, dropWeather] = await Promise.all([
      getWeatherData(pickup.lat, pickup.lon),
      getWeatherData(drop.lat, drop.lon)
    ]);

    console.log(' Weather data fetched successfully');

    // Analyze weather and generate suggestion
    const suggestion = generateRideSuggestion(pickupWeather, dropWeather);

    const response = {
      pickup: {
        weather: pickupWeather.weather[0].main,
        description: pickupWeather.weather[0].description,
        temp: Math.round(pickupWeather.main.temp),
        icon: getWeatherIcon(pickupWeather.weather[0].main)
      },
      drop: {
        weather: dropWeather.weather[0].main,
        description: dropWeather.weather[0].description,
        temp: Math.round(dropWeather.main.temp),
        icon: getWeatherIcon(dropWeather.weather[0].main)
      },
      suggestion: suggestion.text,
      severity: suggestion.severity,
      recommendedRides: suggestion.rides
    };

    console.log(' Sending response:', response);
    res.json(response);

  } catch (error) {
    console.error(' Weather API error:', error.message);
    res.status(500).json({
      error: 'Failed to fetch weather data',
      details: error.message
    });
  }
});

async function getWeatherData(lat, lon) {
  if (!OPENWEATHER_API_KEY || OPENWEATHER_API_KEY === 'your_openweather_api_key_here') {
    throw new Error('OpenWeather API key not configured');
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`;
  console.log(` Calling OpenWeather API: ${url.replace(OPENWEATHER_API_KEY, 'API_KEY')}`);

  try {
    const response = await axios.get(url);
    console.log(` Weather data received for ${lat}, ${lon}:`, response.data.weather[0].main, response.data.main.temp + '°C');
    return response.data;
  } catch (error) {
    console.error(` OpenWeather API error for ${lat}, ${lon}:`, error.response?.data || error.message);
    throw error;
  }
}

function generateRideSuggestion(pickupWeather, dropWeather) {
  const pickupCondition = pickupWeather.weather[0].main.toLowerCase();
  const dropCondition = dropWeather.weather[0].main.toLowerCase();
  const pickupTemp = pickupWeather.main.temp;
  const dropTemp = dropWeather.main.temp;

  console.log(`  Pickup: ${pickupCondition}, ${pickupTemp}°C`);
  console.log(`  Drop: ${dropCondition}, ${dropTemp}°C`);

  // Check for adverse weather
  const badWeatherConditions = ['rain', 'drizzle', 'thunderstorm', 'snow', 'mist', 'fog'];
  const hasRainPickup = badWeatherConditions.includes(pickupCondition);
  const hasRainDrop = badWeatherConditions.includes(dropCondition);

  // Temperature checks
  const hotWeather = pickupTemp > 35 || dropTemp > 35;
  const coldWeather = pickupTemp < 15 || dropTemp < 15;

  if (hasRainPickup || hasRainDrop) {
    return {
      text: `We recommend covered rides like Ola Mini or UberGo due to ${hasRainPickup ? 'rain at pickup' : 'rain at drop'} location.`,
      severity: 'warning',
      rides: ['Mini', 'Sedan', 'SUV']
    };
  }

  if (hotWeather) {
    return {
      text: 'We recommend AC rides due to high temperature.',
      severity: 'advisory',
      rides: ['Mini', 'Sedan', 'SUV']
    };
  }

  if (coldWeather) {
    return {
      text: 'We recommend covered rides due to cold weather.',
      severity: 'advisory',
      rides: ['Mini', 'Sedan']
    };
  }

  return {
    text: 'Perfect weather for any ride! Bikes and budget options available.',
    severity: 'clear',
    rides: ['Bike', 'Mini', 'Auto']
  };
}

function getWeatherIcon(condition) {
  const iconMap = {
    'clear': '☀️',
    'clouds': '☁️',
    'rain': '🌧️',
    'drizzle': '🌦️',
    'thunderstorm': '⛈️',
    'snow': '❄️',
    'mist': '🌫️',
    'fog': '🌫️'
  };
  return iconMap[condition.toLowerCase()] || '🌤️';
}

module.exports = router;
