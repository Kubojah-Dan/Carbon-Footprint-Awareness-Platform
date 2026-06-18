'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot, updateDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { UserProfile } from '@earthprint/types';

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

/**
 * Real-time Firestore listener for user profile.
 * Provides the current user profile and an update function.
 */
export function useUserProfile(uid: string | undefined): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const db = getFirebaseDb();
    const profileRef = doc(db, 'users', uid);

    const unsubscribe = onSnapshot(
      profileRef,
      (snap) => {
        if (snap.exists()) {
          setProfile(snap.data() as UserProfile);
        } else {
          setProfile(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useUserProfile] Firestore error:', err);
        setError('Failed to load your profile. Please refresh.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [uid]);

  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>): Promise<void> => {
      if (!uid) throw new Error('User not authenticated');

      const db = getFirebaseDb();
      const profileRef = doc(db, 'users', uid);

      try {
        await updateDoc(profileRef, {
          ...updates,
          updatedAt: new Date().toISOString(),
          _updatedAt: Timestamp.now(),
        });
      } catch (err) {
        console.error('[useUserProfile] Failed to update profile:', err);
        throw new Error('Failed to update your profile. Please try again.');
      }
    },
    [uid]
  );

  return { profile, loading, error, updateProfile };
}
