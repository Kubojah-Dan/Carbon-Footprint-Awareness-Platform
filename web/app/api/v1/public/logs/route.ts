import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/public-api-auth';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import {
  calculateTransportEmission,
  calculateFoodEmission,
  calculateEnergyEmission,
  calculateShoppingEmission,
  calculateTerraScore,
} from '@earthprint/emission-engine';
import type { LogEntry } from '@earthprint/types';

function calculateNewStreak(
  activityDate: string,
  lastLogDate: string | undefined,
  currentStreak: number,
  graceUsedThisWeek: boolean
): { newStreak: number; graceUsed: boolean } {
  if (!lastLogDate) {
    return { newStreak: 1, graceUsed: false };
  }

  const getDaysDifference = (d1Str: string, d2Str: string) => {
    const d1 = new Date(d1Str.substring(0, 10) + 'T00:00:00Z');
    const d2 = new Date(d2Str.substring(0, 10) + 'T00:00:00Z');
    const diff = Math.abs(d2.getTime() - d1.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const daysSinceLastLog = getDaysDifference(activityDate, lastLogDate);

  if (daysSinceLastLog === 0) {
    // Already logged today, streak stays the same
    return { newStreak: currentStreak, graceUsed: false };
  } else if (daysSinceLastLog === 1) {
    // Consecutive day logging, increment streak
    return { newStreak: currentStreak + 1, graceUsed: false };
  } else if (daysSinceLastLog === 2) {
    // Missed exactly 1 day (yesterday)
    if (!graceUsedThisWeek) {
      // Grace day is available, use it to bridge the gap and increment streak
      return { newStreak: currentStreak + 1, graceUsed: true };
    } else if (currentStreak > 0) {
      // Grace day was already applied (e.g. automatically on page load/login decay check)
      // to keep the current streak alive. Now that we are logging, increment it!
      return { newStreak: currentStreak + 1, graceUsed: false };
    } else {
      // Grace already used and streak reset to 0, start new streak
      return { newStreak: 1, graceUsed: false };
    }
  } else {
    // >= 3 days gap. Grace cannot save this, reset to 1
    return { newStreak: 1, graceUsed: false };
  }
}

export async function GET(req: NextRequest) {
  const auth = await verifyApiKey(req);
  if (!auth.isAuthenticated && auth.errorResponse) {
    return NextResponse.json(
      { success: false, error: auth.errorResponse.error },
      { status: auth.errorResponse.status }
    );
  }

  const uid = auth.uid!;

  try {
    const db = getAdminDb();
    
    // Fetch user's logs
    const logsSnap = await db.collection('users').doc(uid).collection('logs')
      .orderBy('activityDate', 'desc')
      .limit(30)
      .get();

    const logs: LogEntry[] = [];
    logsSnap.forEach((doc: any) => {
      logs.push({ id: doc.id, ...doc.data() } as LogEntry);
    });

    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    console.error('[public/logs] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const auth = await verifyApiKey(req);
  if (!auth.isAuthenticated && auth.errorResponse) {
    return NextResponse.json(
      { success: false, error: auth.errorResponse.error },
      { status: auth.errorResponse.status }
    );
  }

  const uid = auth.uid!;

  try {
    const body = await req.json();
    const { category, data, activityDate, notes = '', source = 'manual' } = body;

    if (!category || !data || !activityDate) {
      return NextResponse.json(
        { success: false, error: 'category, data, and activityDate fields are required.' },
        { status: 400 }
      );
    }

    let kgCo2e = 0;

    switch (category) {
      case 'travel': {
        const { mode, distanceKm } = data;
        const res = calculateTransportEmission({ mode, distanceKm });
        kgCo2e = res.kgCo2e;
        break;
      }
      case 'food': {
        const { foodType, weightGrams, isOrganic = false, isLocal = false } = data;
        const res = calculateFoodEmission({ foodType, weightGrams, isOrganic, isLocal });
        kgCo2e = res.kgCo2e;
        break;
      }
      case 'energy': {
        const { source: energySource, amount, unit = 'kwh' } = data;
        const res = calculateEnergyEmission({ source: energySource, amount, unit });
        kgCo2e = res.kgCo2e;
        break;
      }
      case 'shopping': {
        const { category: shopCat, spendAmount } = data;
        const res = calculateShoppingEmission({
          category: shopCat,
          spendAmount,
          spendCurrency: data.spendCurrency || 'USD',
          isSecondHand: !!data.isSecondHand,
        });
        kgCo2e = res.kgCo2e;
        break;
      }
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid category. Supported: travel, food, energy, shopping.' },
          { status: 400 }
        );
    }

    const db = getAdminDb();
    
    // Create new log document reference
    const logRef = db.collection('users').doc(uid).collection('logs').doc();
    const logEntry: LogEntry = {
      id: logRef.id,
      uid,
      category,
      kgCo2e: Number(kgCo2e.toFixed(3)),
      loggedAt: new Date().toISOString(),
      activityDate,
      notes,
      source,
      data,
    } as unknown as LogEntry;

    // Fetch last 30 days of logs to compute Terra Score
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffIso = cutoffDate.toISOString().split('T')[0]!;
    const logsSnap = await db.collection('users').doc(uid).collection('logs')
      .where('activityDate', '>=', cutoffIso)
      .get();

    let totalCo2 = kgCo2e;
    logsSnap.forEach((doc: any) => {
      totalCo2 += doc.data().kgCo2e || 0;
    });

    // Run transaction: write log, update user points, and update global counter
    const userRef = db.collection('users').doc(uid);
    await db.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) {
        throw new Error('User profile not found');
      }

      const profileData = userSnap.data() || {};
      const currentStreak = profileData.streakDays || 0;

      const isSunday = new Date().getDay() === 0;
      const hasGraceUsed = isSunday ? false : (profileData.graceUsedThisWeek || false);

      const { newStreak, graceUsed } = calculateNewStreak(
        activityDate,
        profileData.lastLogDate,
        currentStreak,
        hasGraceUsed
      );

      const target = profileData.monthlyTargetKgCo2e || 208;
      const newScore = calculateTerraScore({
        monthlyBudgetUsed: totalCo2,
        monthlyBudgetTarget: target,
        streakDays: newStreak,
      });

      transaction.set(logRef, logEntry);

      transaction.update(userRef, {
        points: (profileData.points || 0) + 10, // +10 points reward
        streakDays: newStreak,
        lastLogDate: activityDate,
        graceUsedThisWeek: isSunday ? false : (hasGraceUsed || graceUsed),
        terraScore: newScore,
        updatedAt: new Date().toISOString(),
      });
    });

    // Fire-and-forget: increment global impact counter
    try {
      await fetch(`${req.nextUrl.origin}/api/v1/impact/global`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kgCo2eSaved: Math.max(0.1, Number((kgCo2e * 0.1).toFixed(2))), // estimated savings factor
          isNewLog: true,
        }),
      });
    } catch (e) {
      console.warn('[public/logs] Global impact post failed:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Log entry added successfully',
      logEntry,
    });
  } catch (error: any) {
    console.error('[public/logs] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
