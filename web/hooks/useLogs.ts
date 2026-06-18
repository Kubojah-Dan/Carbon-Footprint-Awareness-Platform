'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  doc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
  getDoc,
  getDocs,
  type QuerySnapshot,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { analytics } from '@/lib/analytics';
import { calculateTerraScore } from '@earthprint/emission-engine';
import type { LogEntry, LogSummary } from '@earthprint/types';

interface UseLogsReturn {
  logs: LogEntry[];
  summary: LogSummary | null;
  loading: boolean;
  error: string | null;
  addLog: (entry: Omit<LogEntry, 'id'>) => Promise<string>;
  updateLog: (id: string, updates: Partial<LogEntry>) => Promise<void>;
  deleteLog: (id: string, activityDate: string) => Promise<void>;
}

/**
 * Firestore real-time hook for user log entries.
 * Returns the last 30 days of log entries ordered by date descending.
 */
export function useLogs(uid: string | undefined, daysBack = 30): UseLogsReturn {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<LogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setLogs([]);
      setSummary(null);
      setLoading(false);
      return;
    }

    const db = getFirebaseDb();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    const cutoffIso = cutoffDate.toISOString().split('T')[0]!;

    // Query all log entries for this user within the date range
    // Firestore path: users/{uid}/logs (flattened — date stored as field)
    const logsRef = collection(db, 'users', uid, 'logs');
    const q = query(
      logsRef,
      where('activityDate', '>=', cutoffIso),
      orderBy('activityDate', 'desc'),
      limit(200)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const fetchedLogs: LogEntry[] = snapshot.docs.map(
          (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as LogEntry)
        );
        // Sort in memory to avoid needing composite Firestore indexes
        fetchedLogs.sort((a, b) => {
          if (a.activityDate !== b.activityDate) {
            return b.activityDate.localeCompare(a.activityDate);
          }
          const timeA = a.loggedAt ? new Date(a.loggedAt).getTime() : 0;
          const timeB = b.loggedAt ? new Date(b.loggedAt).getTime() : 0;
          return timeB - timeA;
        });
        setLogs(fetchedLogs);
        setSummary(computeSummary(fetchedLogs, cutoffDate, new Date()));
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useLogs] Firestore error:', err);
        setError('Failed to load your activity log. Please refresh.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid, daysBack]);

  const addLog = useCallback(
    async (entry: Omit<LogEntry, 'id'>): Promise<string> => {
      if (!uid) throw new Error('User not authenticated');

      const db = getFirebaseDb();
      const logsRef = collection(db, 'users', uid, 'logs');

      try {
        const docRef = await addDoc(logsRef, {
          ...cleanUndefined(entry),
          uid,
          loggedAt: new Date().toISOString(),
          _createdAt: Timestamp.now(),
        });

        // Track in Google Analytics
        analytics.logEntryCreated(entry.category, entry.kgCo2e, entry.source);

        // Recalculate profile points, streak, and terraScore in real-time
        try {
          const profileRef = doc(db, 'users', uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            const target = profileData.monthlyBudgetTarget || 208;
            const currentStreak = profileData.streakDays || 0;

            const isSunday = new Date().getDay() === 0;
            const hasGraceUsed = isSunday ? false : (profileData.graceUsedThisWeek || false);

            const { newStreak, graceUsed } = calculateNewStreak(
              entry.activityDate,
              profileData.lastLogDate,
              currentStreak,
              hasGraceUsed
            );

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30);
            const cutoffIso = cutoffDate.toISOString().split('T')[0]!;
            const logsQuery = query(logsRef, where('activityDate', '>=', cutoffIso));
            const logsSnap = await getDocs(logsQuery);
            const allLogs = logsSnap.docs.map(d => d.data() as LogEntry);
            const totalCo2 = allLogs.reduce((acc, l) => acc + l.kgCo2e, 0);

            const newScore = calculateTerraScore({
              monthlyBudgetUsed: totalCo2,
              monthlyBudgetTarget: target,
              streakDays: newStreak,
            });

            // Reward 10 Bloom Points per log entry
            const oldPoints = profileData.points || 0;
            const newPoints = oldPoints + 10;

            await updateDoc(profileRef, {
              terraScore: newScore,
              points: newPoints,
              streakDays: newStreak,
              lastLogDate: entry.activityDate,
              graceUsedThisWeek: isSunday ? false : (hasGraceUsed || graceUsed),
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (profileErr) {
          console.error('[useLogs] Failed to update user profile gamification:', profileErr);
        }

        return docRef.id;
      } catch (err) {
        console.error('[useLogs] Failed to add log entry:', err);
        throw new Error('Failed to save your log entry. Please try again.');
      }
    },
    [uid]
  );

  const updateLog = useCallback(
    async (id: string, updates: Partial<LogEntry>): Promise<void> => {
      if (!uid) throw new Error('User not authenticated');

      const db = getFirebaseDb();
      const logRef = doc(db, 'users', uid, 'logs', id);

      try {
        await updateDoc(logRef, {
          ...cleanUndefined(updates),
          _updatedAt: Timestamp.now(),
        });
      } catch (err) {
        console.error('[useLogs] Failed to update log entry:', err);
        throw new Error('Failed to update your log entry. Please try again.');
      }
    },
    [uid]
  );

  const deleteLog = useCallback(
    async (id: string): Promise<void> => {
      if (!uid) throw new Error('User not authenticated');

      const db = getFirebaseDb();
      const logRef = doc(db, 'users', uid, 'logs', id);

      try {
        await deleteDoc(logRef);

        // Recalculate profile points and terraScore in real-time on delete
        try {
          const profileRef = doc(db, 'users', uid);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const profileData = profileSnap.data();
            const target = profileData.monthlyBudgetTarget || 208;
            const currentStreak = profileData.streakDays || 0;

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 30);
            const cutoffIso = cutoffDate.toISOString().split('T')[0]!;
            const logsRef = collection(db, 'users', uid, 'logs');
            const logsQuery = query(logsRef, where('activityDate', '>=', cutoffIso));
            const logsSnap = await getDocs(logsQuery);
            const allLogs = logsSnap.docs.map(d => d.data() as LogEntry);
            const totalCo2 = allLogs.reduce((acc, l) => acc + l.kgCo2e, 0);

            const newScore = calculateTerraScore({
              monthlyBudgetUsed: totalCo2,
              monthlyBudgetTarget: target,
              streakDays: currentStreak,
            });

            // Deduct 10 Bloom Points on delete
            const oldPoints = profileData.points || 0;
            const newPoints = Math.max(0, oldPoints - 10);

            await updateDoc(profileRef, {
              terraScore: newScore,
              points: newPoints,
              updatedAt: new Date().toISOString(),
            });
          }
        } catch (profileErr) {
          console.error('[useLogs] Failed to update user profile gamification on delete:', profileErr);
        }
      } catch (err) {
        console.error('[useLogs] Failed to delete log entry:', err);
        throw new Error('Failed to delete your log entry. Please try again.');
      }
    },
    [uid]
  );

  return { logs, summary, loading, error, addLog, updateLog, deleteLog };
}

function computeSummary(
  logs: LogEntry[],
  periodStart: Date,
  periodEnd: Date
): LogSummary {
  const byCategory = { travel: 0, food: 0, energy: 0, shopping: 0 };
  let total = 0;

  for (const log of logs) {
    byCategory[log.category] += log.kgCo2e;
    total += log.kgCo2e;
  }

  return {
    periodStart: periodStart.toISOString().split('T')[0]!,
    periodEnd: periodEnd.toISOString().split('T')[0]!,
    totalKgCo2e: Math.round(total * 100) / 100,
    byCategory: {
      travel: Math.round(byCategory.travel * 100) / 100,
      food: Math.round(byCategory.food * 100) / 100,
      energy: Math.round(byCategory.energy * 100) / 100,
      shopping: Math.round(byCategory.shopping * 100) / 100,
    },
    entryCount: logs.length,
  };
}

function cleanUndefined(obj: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  Object.entries(obj).forEach(([key, val]) => {
    if (val !== undefined) {
      cleaned[key] = val;
    }
  });
  return cleaned;
}

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
