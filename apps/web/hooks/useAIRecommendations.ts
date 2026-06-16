'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, collection, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import type { AIRecommendation } from '@earthprint/types';

interface UseAIRecommendationsReturn {
  recommendations: AIRecommendation[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  submitFeedback: (recId: string, feedback: 'helpful' | 'not-relevant') => Promise<void>;
}

const REGEN_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Hook for AI recommendations from Vertex AI / Gemini.
 * Loads cached recommendations from Firestore.
 * Triggers regeneration if cache is > 7 days old.
 */
export function useAIRecommendations(uid: string | undefined): UseAIRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async (forceRefresh = false) => {
    if (!uid) return;
    setLoading(true);
    setError(null);

    try {
      // Check Firestore cache first
      const db = getFirebaseDb();
      const recsRef = collection(db, 'users', uid, 'recommendations');
      const snapshot = await getDocs(recsRef);

      if (!snapshot.empty && !forceRefresh) {
        const cached = snapshot.docs.map((d) => d.data() as AIRecommendation);

        // Check if newest recommendation is within 7 days
        const newest = cached.sort(
          (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
        )[0];

        if (newest) {
          const age = Date.now() - new Date(newest.generatedAt).getTime();
          if (age < REGEN_INTERVAL_MS) {
            setRecommendations(cached.slice(0, 3));
            setLoading(false);
            return;
          }
        }
      }

      // Fetch fresh recommendations from API route
      const response = await fetch('/api/ai/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }

      const data = await response.json() as { recommendations: AIRecommendation[] };
      setRecommendations(data.recommendations);
    } catch (err) {
      console.error('[useAIRecommendations] Error:', err);
      setError('Could not load your personalized tips. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  const refresh = useCallback(() => fetchRecommendations(true), [fetchRecommendations]);

  const submitFeedback = useCallback(
    async (recId: string, feedback: 'helpful' | 'not-relevant') => {
      if (!uid) return;

      try {
        const db = getFirebaseDb();
        const recRef = doc(db, 'users', uid, 'recommendations', recId);
        await setDoc(recRef, { userFeedback: feedback, _feedbackAt: Timestamp.now() }, { merge: true });

        setRecommendations((prev) =>
          prev.map((r) => (r.id === recId ? { ...r, userFeedback: feedback } : r))
        );
      } catch (err) {
        console.error('[useAIRecommendations] Failed to submit feedback:', err);
      }
    },
    [uid]
  );

  return { recommendations, loading, error, refresh, submitFeedback };
}
