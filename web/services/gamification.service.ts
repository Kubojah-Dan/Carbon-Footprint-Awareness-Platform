import { getAdminDb } from '../lib/firebase-admin';
import { calculateTerraScore } from '@earthprint/emission-engine';
import type { UserProfile } from '@earthprint/types';

// Difference in days between two ISO date strings (ignoring times)
function getDaysDifference(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1.substring(0, 10) + 'T00:00:00Z');
  const d2 = new Date(dateStr2.substring(0, 10) + 'T00:00:00Z');
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export interface StreakUpdateResult {
  success: boolean;
  message: string;
  updatedProfile?: Partial<UserProfile>;
}

/**
 * Service to manage logging streaks, weekly grace days, and user Terra Score calculations.
 */
export class GamificationService {
  /**
   * Evaluates user activity dates and updates their streak, grace day usages, and monthly Terra Score.
   */
  public static async updateUserStreakAndScore(uid: string): Promise<StreakUpdateResult> {
    const db = getAdminDb();
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

    const logsSnap = await db
      .collection('users')
      .doc(uid)
      .collection('logs')
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

  /**
   * Run streak and score updates across all profiles (limited to first 100 for safety).
   */
  public static async batchUpdateAllStreaks(): Promise<string[]> {
    const db = getAdminDb();
    const usersSnap = await db.collection('users').limit(100).get();
    const results: string[] = [];

    for (const doc of usersSnap.docs) {
      const uRes = await this.updateUserStreakAndScore(doc.id);
      results.push(`User ${doc.id}: ${uRes.message}`);
    }

    return results;
  }
}
