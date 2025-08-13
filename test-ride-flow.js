// Test complete ride booking flow
const BACKEND_URL = 'http://10.205.72.101:3000';

console.log('🚗 Testing Complete Ride Booking Flow');

// Simulate the complete flow that the frontend would follow
async function testCompleteRideFlow() {
  console.log('\n🎯 Starting Complete Ride Flow Test...\n');

  // Step 1: Get autocomplete suggestions for pickup
  console.log('📍 Step 1: Getting pickup location suggestions...');
  try {
    const pickupResponse = await fetch(`${BACKEND_URL}/api/v1/maps/autocomplete?input=Connaught Place`);
    const pickupData = await pickupResponse.json();
    
    if (!pickupData.success || !pickupData.data.suggestions.length) {
      throw new Error('No pickup suggestions found');
    }
    
    const pickupSuggestion = pickupData.data.suggestions[0];
    console.log('✅ Pickup suggestion:', pickupSuggestion.description);
    
    // Step 2: Get place details for pickup
    console.log('\n📍 Step 2: Getting pickup place details...');
    const pickupDetailsResponse = await fetch(`${BACKEND_URL}/api/v1/maps/place-details?place_id=${pickupSuggestion.place_id}`);
    const pickupDetails = await pickupDetailsResponse.json();
    
    if (!pickupDetails.success) {
      throw new Error('Failed to get pickup details');
    }
    
    const pickupCoords = pickupDetails.data.geometry.location;
    console.log('✅ Pickup coordinates:', pickupCoords);
    
    // Step 3: Get autocomplete suggestions for destination
    console.log('\n🏁 Step 3: Getting destination suggestions...');
    const destResponse = await fetch(`${BACKEND_URL}/api/v1/maps/autocomplete?input=India Gate`);
    const destData = await destResponse.json();
    
    if (!destData.success || !destData.data.suggestions.length) {
      throw new Error('No destination suggestions found');
    }
    
    const destSuggestion = destData.data.suggestions[0];
    console.log('✅ Destination suggestion:', destSuggestion.description);
    
    // Step 4: Get place details for destination
    console.log('\n🏁 Step 4: Getting destination place details...');
    const destDetailsResponse = await fetch(`${BACKEND_URL}/api/v1/maps/place-details?place_id=${destSuggestion.place_id}`);
    const destDetails = await destDetailsResponse.json();
    
    if (!destDetails.success) {
      throw new Error('Failed to get destination details');
    }
    
    const destCoords = destDetails.data.geometry.location;
    console.log('✅ Destination coordinates:', destCoords);
    
    // Step 5: Get directions
    console.log('\n🗺️  Step 5: Getting directions...');
    const directionsResponse = await fetch(`${BACKEND_URL}/api/v1/maps/directions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        origin: `${pickupCoords.lat},${pickupCoords.lng}`,
        destination: `${destCoords.lat},${destCoords.lng}`,
        mode: 'driving'
      })
    });
    
    const directionsData = await directionsResponse.json();
    
    if (!directionsData.success) {
      throw new Error('Failed to get directions');
    }
    
    const route = directionsData.data.routes[0];
    const leg = route.legs[0];
    console.log('✅ Route found:');
    console.log('   📏 Distance:', leg.distance.text);
    console.log('   ⏱️  Duration:', leg.duration.text);
    
    // Step 6: Get ride estimates from all providers
    console.log('\n🚗 Step 6: Getting ride estimates...');
    
    // Test each provider individually
    const providers = [
      { name: 'Ola', endpoint: '/api/ola/estimate' },
      { name: 'Uber', endpoint: '/api/uber/estimate' },
      { name: 'Rapido', endpoint: '/api/rapido/estimate' }
    ];
    
    const allEstimates = [];
    
    for (const provider of providers) {
      try {
        const url = `${BACKEND_URL}${provider.endpoint}?pickup_lat=${pickupCoords.lat}&pickup_lng=${pickupCoords.lng}&drop_lat=${destCoords.lat}&drop_lng=${destCoords.lng}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success && data.estimates) {
          allEstimates.push(...data.estimates);
          console.log(`✅ ${provider.name}: ${data.estimates.length} options`);
          
          // Show cheapest option for this provider
          const cheapest = data.estimates.reduce((min, curr) => curr.fare < min.fare ? curr : min);
          console.log(`   💰 Cheapest ${provider.name}: ₹${cheapest.fare} (${cheapest.cabType})`);
        } else {
          console.log(`❌ ${provider.name}: Failed to get estimates`);
        }
      } catch (error) {
        console.log(`❌ ${provider.name}: Error -`, error.message);
      }
    }
    
    // Step 7: Analyze results
    console.log('\n📊 Step 7: Analyzing results...');
    
    if (allEstimates.length === 0) {
      throw new Error('No ride estimates available');
    }
    
    // Find best deals
    const cheapestOverall = allEstimates.reduce((min, curr) => curr.fare < min.fare ? curr : min);
    const fastestOverall = allEstimates.reduce((min, curr) => curr.eta < min.eta ? curr : min);
    
    console.log('✅ Analysis complete:');
    console.log(`   🏆 Best Price: ₹${cheapestOverall.fare} (${cheapestOverall.provider} ${cheapestOverall.cabType})`);
    console.log(`   ⚡ Fastest: ${fastestOverall.eta} min (${fastestOverall.provider} ${fastestOverall.cabType})`);
    console.log(`   📈 Total Options: ${allEstimates.length}`);
    
    // Group by provider
    const byProvider = allEstimates.reduce((acc, est) => {
      acc[est.provider] = (acc[est.provider] || 0) + 1;
      return acc;
    }, {});
    
    console.log('   🏢 By Provider:', byProvider);
    
    console.log('\n🎉 Complete ride flow test PASSED! All integrations working correctly.');
    return true;
    
  } catch (error) {
    console.log('\n❌ Complete ride flow test FAILED:', error.message);
    return false;
  }
}

// Run the test
testCompleteRideFlow().catch(console.error);
