import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config();

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('===================================================');
  console.log('EarthPrint API Routes Integration Tests');
  console.log('===================================================\n');

  // Test 1: OCR Bill Parser Endpoint
  console.log('1. Testing /api/v1/ocr/bill...');
  try {
    const ocrRes = await fetch(`${BASE_URL}/api/v1/ocr/bill`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Octopus Energy invoice. Electricity bill details. Dates: 2026-05-01 to 2026-05-31. Total electricity consumed: 280.5 kWh. Amount due: £74.80.',
      }),
    });
    const ocrData = await ocrRes.json();
    console.log('   Response Status:', ocrRes.status);
    console.log('   Provider Extracted:', ocrData.provider);
    console.log('   Fuel Type:', ocrData.fuelType);
    console.log('   kWh Consumed:', ocrData.kwh);
    console.log('   Cost:', ocrData.cost);
    console.log('   CO2 calculated (kg):', ocrData.estimatedKgCo2e);
    if (ocrData.success && ocrData.kwh === 280.5 && ocrData.provider === 'Octopus Energy') {
      console.log('   ✅ OCR Bill Parser test passed!\n');
    } else {
      console.warn('   ⚠️ OCR Bill Parser test failed or returned unexpected data.\n');
    }
  } catch (err: any) {
    console.error('   ❌ OCR Bill Parser test failed with error:', err.message, '\n');
  }

  // Test 2: Route Calculation Endpoint
  console.log('2. Testing /api/v1/routes/calculate...');
  try {
    const routeRes = await fetch(`${BASE_URL}/api/v1/routes/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        origin: 'London',
        destination: 'Paris',
        mode: 'transit',
      }),
    });
    const routeData = await routeRes.json();
    console.log('   Response Status:', routeRes.status);
    console.log('   Calculated Distance (km):', routeData.distanceKm);
    console.log('   Estimated Duration (mins):', routeData.durationMinutes);
    console.log('   Fallback Method Active:', routeData.isFallback);
    console.log('   Routing Details:', routeData.routingDetails);
    console.log('   CO2 calculated (kg):', routeData.estimatedKgCo2e);
    if (routeData.success && routeData.distanceKm > 0) {
      console.log('   ✅ Route Calculation test passed!\n');
    } else {
      console.warn('   ⚠️ Route Calculation test failed.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Route Calculation test failed with error:', err.message, '\n');
  }

  // Test 3: Transaction CSV Importer
  console.log('3. Testing /api/v1/transactions/import...');
  try {
    const csvContent = `Date,Description,Amount
2026-06-01,Tesco Groceries,35.20
2026-06-02,Uber Commute Ride,-15.80
2026-06-03,Octopus Energy Direct Debit,-90.00
2026-06-04,ZARA Retail Clothing,-45.00`;

    const txRes = await fetch(`${BASE_URL}/api/v1/transactions/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvText: csvContent }),
    });
    const txData = await txRes.json();
    console.log('   Response Status:', txRes.status);
    console.log('   Parsed Transactions Count:', txData.count);
    console.log('   Total CO2 Estimated (kg):', txData.totalKgCo2e);
    
    if (txData.success && txData.count === 4) {
      txData.transactions.forEach((tx: any, i: number) => {
        console.log(`     - [${tx.category.toUpperCase()}] ${tx.description}: £${tx.amount} -> ${tx.kgCo2e} kg CO2e`);
      });
      console.log('   ✅ Transaction CSV Importer test passed!\n');
    } else {
      console.warn('   ⚠️ Transaction CSV Importer test failed.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Transaction CSV Importer test failed with error:', err.message, '\n');
  }

  // Test 4: AI Coach Nudge Endpoint
  console.log('4. Testing /api/v1/ai/coach...');
  try {
    const coachRes = await fetch(`${BASE_URL}/api/v1/ai/coach`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: 'Sarah',
        activeBiome: 'coral-reef',
        terraScore: 78,
        categoryBreakdown: {
          travel: 45.2,
          food: 120.8, // highest category
          energy: 30.5,
          shopping: 15.0,
        },
      }),
    });
    const coachData = await coachRes.json();
    console.log('   Response Status:', coachRes.status);
    console.log('   Coach Name:', coachData.coach.name);
    console.log('   Coach Message:', coachData.coach.message);
    console.log('   Is Fallback Active:', coachData.coach.isFallback);
    
    if (coachData.success && coachData.coach.message) {
      console.log('   ✅ AI Coach test passed!\n');
    } else {
      console.warn('   ⚠️ AI Coach test failed.\n');
    }
  } catch (err: any) {
    console.error('   ❌ AI Coach test failed with error:', err.message, '\n');
  }
}

runTests();
