import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const BASE_URL = 'http://localhost:3000';
const MOCK_API_KEY = 'EP-DEV-TEST-KEY-123';
const TEST_UID = 'test-user-prime-123';

async function runPublicAPITests() {
  console.log('===================================================');
  console.log('EarthPrint Phase 4 API Routes Integration Tests');
  console.log('===================================================\n');

  // 1. Public Calculate Endpoint
  console.log('1. Testing /api/v1/public/calculate...');
  try {
    const res = await fetch(`${BASE_URL}/api/v1/public/calculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MOCK_API_KEY,
      },
      body: JSON.stringify({
        category: 'travel',
        details: {
          mode: 'car',
          distanceKm: 150,
          fuelType: 'petrol',
        },
      }),
    });
    const data = await res.json();
    console.log('   Status:', res.status);
    console.log('   Calculated Footprint (kg CO2e):', data.kgCo2e);
    if (res.status === 200 && data.success && data.kgCo2e > 0) {
      console.log('   ✅ Public Calculate passed!\n');
    } else {
      console.warn('   ⚠️ Public Calculate failed.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Public Calculate error:', err.message, '\n');
  }

  // 2. Public Logs Endpoint
  console.log('2. Testing /api/v1/public/logs (POST and GET)...');
  try {
    // POST a log
    const postRes = await fetch(`${BASE_URL}/api/v1/public/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': MOCK_API_KEY,
      },
      body: JSON.stringify({
        uid: TEST_UID,
        category: 'food',
        source: 'API Integration Test Log',
        details: {
          foodType: 'beef',
          servings: 2,
        },
        activityDate: new Date().toISOString().split('T')[0],
      }),
    });
    const postData = await postRes.json();
    console.log('   POST Status:', postRes.status);
    console.log('   Logged kg CO2e:', postData.logEntry?.kgCo2e);

    // GET logs
    const getRes = await fetch(`${BASE_URL}/api/v1/public/logs?uid=${TEST_UID}&limit=5`, {
      method: 'GET',
      headers: {
        'x-api-key': MOCK_API_KEY,
      },
    });
    const getData = await getRes.json();
    console.log('   GET Status:', getRes.status);
    console.log('   Logs Count:', getData.logs?.length);

    if (postRes.status === 200 && getRes.status === 200 && getData.success) {
      console.log('   ✅ Public Logs passed!\n');
    } else {
      console.warn('   ⚠️ Public Logs failed.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Public Logs error:', err.message, '\n');
  }

  // 3. Public Profile Endpoint
  console.log('3. Testing /api/v1/public/profile...');
  try {
    const res = await fetch(`${BASE_URL}/api/v1/public/profile?uid=${TEST_UID}`, {
      method: 'GET',
      headers: {
        'x-api-key': MOCK_API_KEY,
      },
    });
    const data = await res.json();
    console.log('   Status:', res.status);
    console.log('   Profile Email:', data.profile?.email);
    console.log('   Profile Points:', data.profile?.points);
    if (res.status === 200 && data.success && data.profile) {
      console.log('   ✅ Public Profile passed!\n');
    } else {
      console.warn('   ⚠️ Public Profile failed.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Public Profile error:', err.message, '\n');
  }

  // 4. Workplace Organizations Endpoint
  console.log('4. Testing /api/v1/organizations...');
  try {
    const orgName = `Test Corp ${Math.floor(Math.random() * 1000)}`;
    const createRes = await fetch(`${BASE_URL}/api/v1/organizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorUid: TEST_UID,
        name: orgName,
      }),
    });
    const createData = await createRes.json();
    console.log('   Create Status:', createRes.status);
    console.log('   Created Org Name:', createData.organization?.name);
    console.log('   Invite Code:', createData.organization?.inviteCode);

    if (createRes.status === 200 && createData.success) {
      const inviteCode = createData.organization.inviteCode;
      
      // Join Org
      const joinRes = await fetch(`${BASE_URL}/api/v1/organizations/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: 'test-user-omega-456',
          inviteCode,
          department: 'Marketing',
        }),
      });
      const joinData = await joinRes.json();
      console.log('   Join Status:', joinRes.status);
      console.log('   Joined Org ID:', joinData.organization?.id);

      // GET Org details
      const getRes = await fetch(`${BASE_URL}/api/v1/organizations?uid=${TEST_UID}`);
      const getData = await getRes.json();
      console.log('   GET Details Status:', getRes.status);
      console.log('   Department Stats Count:', getData.departmentStats?.length);
      console.log('   Member Leaderboard Count:', getData.memberLeaderboard?.length);

      if (joinRes.status === 200 && getRes.status === 200 && getData.success) {
        console.log('   ✅ Workplace Organization flow passed!\n');
      } else {
        console.warn('   ⚠️ Workplace Organization flow failed.\n');
      }
    } else {
      console.warn('   ⚠️ Could not create organization to test join/details.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Workplace Organization error:', err.message, '\n');
  }
}

runPublicAPITests();
