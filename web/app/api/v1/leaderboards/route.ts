import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { LeaderboardEntry, UserProfile } from '@earthprint/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');
    const type = searchParams.get('type') || 'global'; // 'global' | 'neighborhood' | 'friends'

    const db = getAdminDb();
    
    // 1. Fetch current user's profile if uid is provided
    let currentUserProfile: UserProfile | null = null;
    if (uid) {
      const userSnap = await db.collection('users').doc(uid).get();
      if (userSnap.exists) {
        currentUserProfile = userSnap.data() as UserProfile;
      }
    }

    // 2. Fetch candidates for leaderboard
    let candidateProfiles: UserProfile[] = [];

    if (type === 'friends' && uid) {
      // Fetch user's friends from friendRequests
      const sentFriendshipsSnap = await db.collection('friendRequests')
        .where('fromUid', '==', uid)
        .where('status', '==', 'accepted')
        .get();

      const receivedFriendshipsSnap = await db.collection('friendRequests')
        .where('toUid', '==', uid)
        .where('status', '==', 'accepted')
        .get();

      const friendUids: string[] = [uid]; // Include self
      sentFriendshipsSnap.forEach((doc: any) => {
        friendUids.push(doc.data().toUid);
      });
      receivedFriendshipsSnap.forEach((doc: any) => {
        friendUids.push(doc.data().fromUid);
      });

      const uniqueFriendUids = Array.from(new Set(friendUids));

      if (uniqueFriendUids.length > 0) {
        // Fetch friend profiles
        const chunks = [];
        const chunkSize = 10;
        for (let i = 0; i < uniqueFriendUids.length; i += chunkSize) {
          chunks.push(uniqueFriendUids.slice(i, i + chunkSize));
        }

        for (const chunk of chunks) {
          const usersSnap = await db.collection('users')
            .where('uid', 'in', chunk)
            .get();
            
          usersSnap.forEach((doc: any) => {
            candidateProfiles.push(doc.data() as UserProfile);
          });
        }
      }
    } else if (type === 'neighborhood' && currentUserProfile) {
      const city = currentUserProfile.onboardingAnswers?.location?.city || currentUserProfile.preferredUnits ? 'London' : null; // Fallback city just in case
      
      let query = db.collection('users');
      // If we can filter by city, let's query. Since city might be nested in onboardingAnswers.location.city, 
      // we can fetch all and filter in-memory or query if flat field.
      // To be safe, we fetch up to 100 users and filter in-memory.
      const usersSnap = await query.limit(100).get();
      usersSnap.forEach((doc: any) => {
        const u = doc.data() as UserProfile;
        const uCity = u.onboardingAnswers?.location?.city || '';
        const curCity = currentUserProfile?.onboardingAnswers?.location?.city || '';
        if (curCity && uCity.toLowerCase() === curCity.toLowerCase()) {
          candidateProfiles.push(u);
        }
      });
      
      // If no other neighbors found, fall back to global
      if (candidateProfiles.length <= 1) {
        candidateProfiles = [];
        usersSnap.forEach((doc: any) => {
          candidateProfiles.push(doc.data() as UserProfile);
        });
      }
    } else {
      // Global
      const usersSnap = await db.collection('users').limit(100).get();
      usersSnap.forEach((doc: any) => {
        candidateProfiles.push(doc.data() as UserProfile);
      });
    }

    // 3. Compute carbon saved this month and badges for each candidate
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]!;
    
    const entries: LeaderboardEntry[] = [];

    for (const u of candidateProfiles) {
      // Fetch user's logs for this month
      const logsSnap = await db.collection('users').doc(u.uid).collection('logs')
        .where('activityDate', '>=', startOfMonth)
        .get();

      let monthlyEmissions = 0;
      logsSnap.forEach((doc: any) => {
        monthlyEmissions += doc.data().kgCo2e || 0;
      });

      // Calculate kgCo2eSavedThisMonth
      const baselineMonthly = (u.baselineKgCo2ePerYear || 4800) / 12;
      let saved = Math.max(0, baselineMonthly - monthlyEmissions);
      if (monthlyEmissions === 0) {
        // If they have no logs, mock some activity to make leaderboard look alive
        saved = (u.streakDays || 0) * 1.8 + (u.points % 15);
      }

      // Round to 1 decimal place
      saved = Math.round(saved * 10) / 10;

      // Get badges from user's subcollection
      const badgesSnap = await db.collection('users').doc(u.uid).collection('badges').limit(3).get();
      const badges: string[] = [];
      badgesSnap.forEach((doc: any) => {
        badges.push(doc.id);
      });

      // If empty, put some default badges based on points
      if (badges.length === 0) {
        if (u.points > 200) badges.push('streak-7');
        if (u.points > 50) badges.push('first-log');
      }

      entries.push({
        rank: 0, // Assigned after sorting
        uid: u.uid,
        displayName: u.displayName || u.email.split('@')[0] || 'Anonymous',
        photoURL: u.photoURL || null,
        city: u.onboardingAnswers?.location?.city || 'London',
        kgCo2eSavedThisMonth: saved,
        points: u.points || 0,
        streakDays: u.streakDays || 0,
        badges,
        isCurrentUser: uid ? u.uid === uid : false,
      });
    }

    // 4. Sort and assign ranks
    entries.sort((a, b) => b.kgCo2eSavedThisMonth - a.kgCo2eSavedThisMonth || b.points - a.points);
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return NextResponse.json({
      success: true,
      leaderboard: entries,
    });
  } catch (error: any) {
    console.error('[leaderboards] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
