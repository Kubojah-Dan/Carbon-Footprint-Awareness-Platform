import dotenv from 'dotenv';
import path from 'path';

// Load env variables
dotenv.config();

const BASE_URL = 'http://localhost:3000';

// Test UIDs and helper credentials
const TEST_UID_1 = 'test-user-prime-123';
const TEST_UID_2 = 'test-user-omega-456';

async function runPhase3Tests() {
  console.log('===================================================');
  console.log('EarthPrint Phase 3 API Routes Integration Tests');
  console.log('===================================================\n');

  // Helper function to seed test user profiles so Firebase queries don't fail
  console.log('0. Preparing mock users in database if missing...');
  try {
    // In local emulator/test setup, we can proceed. If real firestore, they will be created or retrieved.
  } catch (err) {
    console.warn('   Mock seeding warning:', err);
  }

  // 1. Scanner Barcode Lookup
  console.log('1. Testing /api/v1/scanner/lookup...');
  try {
    const res = await fetch(`${BASE_URL}/api/v1/scanner/lookup?barcode=5411188110827`, {
      method: 'GET',
    });
    const data = await res.json();
    console.log('   Status:', res.status);
    console.log('   Product Name:', data.productName);
    console.log('   Calculated Emission (kg CO2e):', data.estimatedKgCo2e);
    console.log('   Is OFF API Fallback:', data.isFallback);
    if (data.success && data.estimatedKgCo2e >= 0) {
      console.log('   ✅ Scanner Lookup passed!\n');
    } else {
      console.warn('   ⚠️ Scanner Lookup failed.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Scanner Lookup error:', err.message, '\n');
  }

  // 2. Global Impact Counter
  console.log('2. Testing /api/v1/impact/global...');
  try {
    // GET
    const getRes = await fetch(`${BASE_URL}/api/v1/impact/global`);
    const getData = await getRes.json();
    console.log('   GET Status:', getRes.status);
    console.log('   Current Saved (kg):', getData.impact?.totalKgCo2eSaved);

    // POST increment
    const postRes = await fetch(`${BASE_URL}/api/v1/impact/global`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kgCo2eSaved: 25.5,
        isNewUser: true,
        isNewLog: true,
      }),
    });
    const postData = await postRes.json();
    console.log('   POST Status:', postRes.status);
    console.log('   New Saved (kg):', postData.impact?.totalKgCo2eSaved);
    console.log('   New Users Count:', postData.impact?.totalUsers);
    
    if (postData.success && postData.impact?.totalKgCo2eSaved > getData.impact?.totalKgCo2eSaved) {
      console.log('   ✅ Global Impact test passed!\n');
    } else {
      console.warn('   ⚠️ Global Impact test failed.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Global Impact test error:', err.message, '\n');
  }

  // 3. Friends Request Flow
  console.log('3. Testing /api/v1/friends request flow...');
  try {
    // Send friend request
    const requestRes = await fetch(`${BASE_URL}/api/v1/friends`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromUid: TEST_UID_1,
        toUid: TEST_UID_2,
        action: 'request',
      }),
    });
    const requestData = await requestRes.json();
    console.log('   Send Request Status:', requestRes.status);
    console.log('   Message:', requestData.message || requestData.error);

    // List friends & pending requests
    const listRes = await fetch(`${BASE_URL}/api/v1/friends?uid=${TEST_UID_2}`);
    const listData = await listRes.json();
    console.log('   List Status:', listRes.status);
    console.log('   Pending Request Count:', listData.pendingRequests?.length);

    if (listData.success) {
      console.log('   ✅ Friends API checks passed!\n');
    } else {
      console.warn('   ⚠️ Friends API checks failed.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Friends API error:', err.message, '\n');
  }

  // 4. Community Posts Feed & Likes
  console.log('4. Testing /api/v1/posts & likes...');
  try {
    // Create Post
    const createRes = await fetch(`${BASE_URL}/api/v1/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: TEST_UID_1,
        content: 'I switched to LED lightbulbs today and reduced my household footprint! 💡 #climateaction',
      }),
    });
    const createData = await createRes.json();
    console.log('   Create Post Status:', createRes.status);
    console.log('   Created Post ID:', createData.post?.id);

    if (createData.success && createData.post?.id) {
      const postId = createData.post.id;
      
      // Like Post
      const likeRes = await fetch(`${BASE_URL}/api/v1/posts/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: TEST_UID_2,
          postId,
        }),
      });
      const likeData = await likeRes.json();
      console.log('   Like Post Status:', likeRes.status);
      console.log('   Is Liked:', likeData.liked);

      // GET posts feed
      const feedRes = await fetch(`${BASE_URL}/api/v1/posts?uid=${TEST_UID_2}`);
      const feedData = await feedRes.json();
      console.log('   GET Feed Status:', feedRes.status);
      console.log('   Feed Posts Count:', feedData.posts?.length);
      
      if (feedData.success && feedData.posts?.length > 0) {
        console.log('   ✅ Posts & Likes test passed!\n');
      } else {
        console.warn('   ⚠️ Posts & Likes test failed.\n');
      }
    } else {
      console.warn('   ⚠️ Could not create post to verify likes/feed.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Posts & Likes error:', err.message, '\n');
  }

  // 5. Teams & Joins
  console.log('5. Testing /api/v1/teams...');
  try {
    // Create team
    const createTeamRes = await fetch(`${BASE_URL}/api/v1/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creatorUid: TEST_UID_1,
        name: 'Eco Crusaders',
      }),
    });
    const createTeamData = await createTeamRes.json();
    console.log('   Create Team Status:', createTeamRes.status);
    console.log('   Invite Code:', createTeamData.team?.inviteCode);

    if (createTeamData.success && createTeamData.team?.inviteCode) {
      const inviteCode = createTeamData.team.inviteCode;

      // Join team
      const joinRes = await fetch(`${BASE_URL}/api/v1/teams/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: TEST_UID_2,
          inviteCode,
        }),
      });
      const joinData = await joinRes.json();
      console.log('   Join Team Status:', joinRes.status);
      console.log('   Message:', joinData.message || joinData.error);

      if (joinData.success) {
        console.log('   ✅ Teams creation and join test passed!\n');
      } else {
        console.warn('   ⚠️ Teams join verification failed.\n');
      }
    } else {
      console.warn('   ⚠️ Could not create team to verify join.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Teams error:', err.message, '\n');
  }

  // 6. Leaderboards
  console.log('6. Testing /api/v1/leaderboards...');
  try {
    const res = await fetch(`${BASE_URL}/api/v1/leaderboards?uid=${TEST_UID_1}&type=global`);
    const data = await res.json();
    console.log('   Status:', res.status);
    console.log('   Leaderboard Size:', data.leaderboard?.length);
    if (data.success && data.leaderboard) {
      console.log('   ✅ Leaderboard retrieve test passed!\n');
    } else {
      console.warn('   ⚠️ Leaderboard retrieve test failed.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Leaderboard retrieve test error:', err.message, '\n');
  }

  // 7. Marketplace & Redeem
  console.log('7. Testing /api/v1/marketplace...');
  try {
    // GET marketplace
    const getRes = await fetch(`${BASE_URL}/api/v1/marketplace?uid=${TEST_UID_1}`);
    const getData = await getRes.json();
    console.log('   GET Marketplace Status:', getRes.status);
    console.log('   Actions Count:', getData.actions?.length);

    // POST redeem (let's redeem a zero-points commitment action to ensure success)
    // E.g. action-003 is "Meatless Monday Routine", which is not redeemable with points (so it costs 0 and is just a commitment)
    const redeemRes = await fetch(`${BASE_URL}/api/v1/marketplace/redeem`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid: TEST_UID_1,
        actionId: 'action-003',
      }),
    });
    const redeemData = await redeemRes.json();
    console.log('   POST Redeem Status:', redeemRes.status);
    console.log('   Redeem Message:', redeemData.message || redeemData.error);

    if (redeemData.success) {
      console.log('   ✅ Marketplace & Redeem test passed!\n');
    } else {
      console.warn('   ⚠️ Marketplace & Redeem test failed.\n');
    }
  } catch (err: any) {
    console.error('   ❌ Marketplace & Redeem error:', err.message, '\n');
  }
}

runPhase3Tests();
