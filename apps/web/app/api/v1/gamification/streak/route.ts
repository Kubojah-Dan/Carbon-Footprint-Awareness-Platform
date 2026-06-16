import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { calculateTerraScore } from '@earthprint/emission-engine';
import type { UserProfile } from '@earthprint/types';

// Difference in days between two ISO date strings (ignoring times)
function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1.substring(0, 10) + 'T00:00:00Z');
  const d2 = new Date(dateStr2.substring(0, 10) + 'T00:00:00Z');
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

async function updateUserStreakAndScore(uid: string, db: any): Promise<{
  success: boolean;
  message: string;
  updatedProfile?: Partial<UserProfile>;
}> {
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    return { success: false, message: 'User profile not found' };
  }

  const profile = userSnap.data() as UserProfile;
  const todayStr = new Date().toISOString().split('T')[0]!;
  
  let newStreak = profile.streakDays ?? 0;
  let graceUsedThisWeek = profile.graceUsedThisWeek ?? false;
  let streakSavedByGrace = false;
  let streakReset = false;

  if (profile.lastLogDate) {
    const daysSinceLastLog = getDaysDifference(todayStr, profile.lastLogDate);

    if (daysSinceLastLog > 1) {
      // >= 2 days gap. Check if we can apply weekly grace day
      if (!graceUsedThisWeek) {
        graceUsedThisWeek = true;
        streakSavedByGrace = true;
        // Keep the current streak!
      } else {
        newStreak = 0;
        streakReset = true;
      }
    }
  } else {
    // Never logged before
    newStreak = 0;
  }

  // Calculate this month's emissions to compute updated Terra Score
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  
  const logsSnap = await db.collection('users').doc(uid).collection('logs')
    .where('activityDate', '>=', startOfMonth)
    .get();

  let monthlyBudgetUsed = 0;
  logsSnap.forEach((doc: any) => {
    monthlyBudgetUsed += doc.data().kgCo2e || 0;
  });

  const monthlyBudgetTarget = profile.monthlyTargetKgCo2e ?? 200;
  const newTerraScore = calculateTerraScore({
    monthlyBudgetUsed,
    monthlyBudgetTarget,
    streakDays: newStreak,
  });

  const updates: Partial<UserProfile> = {
    streakDays: newStreak,
    graceUsedThisWeek,
    terraScore: newTerraScore,
    updatedAt: new Date().toISOString(),
  };

  // If it is Sunday (end of week), reset grace coupon
  if (now.getDay() === 0) {
    updates.graceUsedThisWeek = false;
  }

  await userRef.update(updates);

  let msg = `Streak evaluated. Current streak: ${newStreak} days. Terra Score: ${newTerraScore}.`;
  if (streakSavedByGrace) msg += ' Streak was saved using a weekly Grace Day!';
  if (streakReset) msg += ' Streak was reset to 0 due to inactivity.';

  return {
    success: true,
    message: msg,
    updatedProfile: updates,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { uid, all } = body;

    // Check auth or admin privileges if needed, for dev we allow direct triggers
    const db = getAdminDb();

    if (uid) {
      const result = await updateUserStreakAndScore(uid, db);
      return NextResponse.json(result);
    }

    if (all === true) {
      // Batch trigger: loop over all users
      const usersSnap = await db.collection('users').limit(100).get();
      const results: string[] = [];

      for (const doc of usersSnap.docs) {
        const uRes = await updateUserStreakAndScore(doc.id, db);
        results.push(`User ${doc.id}: ${uRes.message}`);
      }

      return NextResponse.json({
        success: true,
        message: 'Batch streak update completed',
        results,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Provide uid or { all: true } in the request body' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[gamification/streak] Endpoint error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
