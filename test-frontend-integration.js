// Test script to verify frontend-backend integration
const BACKEND_URL = 'http://10.205.72.101:3000';

console.log('🧪 Testing GoFare Frontend-Backend Integration');
console.log('🔗 Backend URL:', BACKEND_URL);

// Test 1: Health Check
async function testHealthCheck() {
  console.log('\n📋 Test 1: Health Check');
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    const data = await response.json();
    console.log('✅ Health Check:', data.status);
    return true;
  } catch (error) {
    console.log('❌ Health Check Failed:', error.message);
    return false;
  }
}

// Test 2: Autocomplete API (Frontend simulation)
async function testAutocomplete() {
  console.log('\n📋 Test 2: Autocomplete API');
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/maps/autocomplete?input=Delhi`);
    const data = await response.json();
    
    if (data.success && data.data.suggestions) {
      console.log('✅ Autocomplete API working');
      console.log(`📍 Found ${data.data.suggestions.length} suggestions`);
      console.log('🏷️  First suggestion:', data.data.suggestions[0]?.description);
      return true;
    } else {
      console.log('❌ Autocomplete API failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Autocomplete API error:', error.message);
    return false;
  }
}

// Test 3: Place Details API
async function testPlaceDetails() {
  console.log('\n📋 Test 3: Place Details API');
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/maps/place-details?place_id=ChIJLbZ-NFv9DDkRQJY4FbcFcgM`);
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('✅ Place Details API working');
      console.log('📍 Place:', data.data.name);
      console.log('📍 Address:', data.data.formatted_address);
      console.log('🗺️  Coordinates:', data.data.geometry.location);
      return true;
    } else {
      console.log('❌ Place Details API failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Place Details API error:', error.message);
    return false;
  }
}

// Test 4: Current Location API
async function testCurrentLocation() {
  console.log('\n📋 Test 4: Current Location API');
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/location/current`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        latitude: 28.6139,
        longitude: 77.2090,
        detailed: true
      })
    });
    
    const data = await response.json();
    
    if (data.success && data.data) {
      console.log('✅ Current Location API working');
      console.log('📍 Address:', data.data.formatted_address);
      console.log('🏙️  City:', data.data.parsed_address?.city);
      return true;
    } else {
      console.log('❌ Current Location API failed:', data);
      return false;
    }
  } catch (error) {
    console.log('❌ Current Location API error:', error.message);
    return false;
  }
}

// Test 5: Ride Estimates API
async function testRideEstimates() {
  console.log('\n📋 Test 5: Ride Estimates API');
  try {
    const olaResponse = await fetch(`${BACKEND_URL}/api/ola/estimate?pickup_lat=28.6139&pickup_lng=77.2090&drop_lat=28.7041&drop_lng=77.1025`);
    const olaData = await olaResponse.json();
    
    if (olaData.success && olaData.estimates) {
      console.log('✅ Ola Estimates API working');
      console.log(`🚗 Found ${olaData.estimates.length} Ola ride options`);
      console.log('💰 Cheapest Ola fare:', Math.min(...olaData.estimates.map(e => e.fare)));
      return true;
    } else {
      console.log('❌ Ola Estimates API failed:', olaData);
      return false;
    }
  } catch (error) {
    console.log('❌ Ride Estimates API error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Frontend-Backend Integration Tests...\n');
  
  const results = [];
  results.push(await testHealthCheck());
  results.push(await testAutocomplete());
  results.push(await testPlaceDetails());
  results.push(await testCurrentLocation());
  results.push(await testRideEstimates());
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('🎉 All tests passed! Frontend-Backend integration is working perfectly!');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run the tests
runAllTests().catch(console.error);
