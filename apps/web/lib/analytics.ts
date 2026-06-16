/**
 * Firebase Analytics Helpers
 *
 * Google Service: Google Analytics for Firebase (GA4)
 * Wraps Firebase Analytics logEvent with type-safe event definitions.
 *
 * Key events tracked in Phase 1 (per spec 1.7):
 *   - onboarding_complete
 *   - log_entry_created
 *   - dashboard_viewed
 *   - tip_clicked
 *
 * All tracking is voluntary and respects user consent preferences.
 */

import { logEvent } from 'firebase/analytics';
import { getFirebaseAnalytics } from './firebase';

type EventParams = Record<string, string | number | boolean | undefined>;

/**
 * Track a Firebase Analytics event.
 * Safe to call in all environments — no-ops gracefully when analytics unavailable.
 */
export async function trackEvent(
  eventName: EarthPrintEvent,
  params?: EventParams
): Promise<void> {
  try {
    const analytics = await getFirebaseAnalytics();
    if (!analytics) return; // Analytics not supported (SSR, incognito, etc.)
    logEvent(analytics, eventName as string, params);
  } catch (error) {
    // Never let analytics errors affect the user experience
    console.debug('[analytics] Failed to track event:', eventName, error);
  }
}

/**
 * Typed event names for EarthPrint.
 * All events defined here should be registered in Firebase Console → Analytics.
 */
export type EarthPrintEvent =
  // Onboarding
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_complete'
  // Dashboard
  | 'dashboard_viewed'
  // Logging
  | 'log_entry_started'
  | 'log_entry_created'
  | 'log_entry_deleted'
  // AI Tips
  | 'tip_clicked'
  | 'tip_feedback_submitted'
  | 'tips_refreshed'
  // Challenges (Phase 2)
  | 'challenge_joined'
  | 'challenge_completed'
  | 'badge_earned'
  // Community (Phase 3)
  | 'community_post_created'
  | 'leaderboard_viewed'
  // Marketplace (Phase 3)
  | 'marketplace_action_committed'
  | 'marketplace_action_completed'
  | 'points_redeemed'
  // Scanner (Phase 3)
  | 'barcode_scanned'
  | 'scan_added_to_log'
  // Auth
  | 'sign_up'
  | 'login'
  | 'logout';

/** Convenience wrappers for the most common events */

export const analytics = {
  /** Track onboarding completion with category breakdown */
  onboardingComplete: (baselineKgCo2e: number) =>
    trackEvent('onboarding_complete', {
      baseline_kg_co2e: Math.round(baselineKgCo2e),
    }),

  /** Track a new log entry */
  logEntryCreated: (category: string, kgCo2e: number, source: string) =>
    trackEvent('log_entry_created', {
      category,
      kg_co2e: Math.round(kgCo2e * 100) / 100,
      source,
    }),

  /** Track dashboard view */
  dashboardViewed: () => trackEvent('dashboard_viewed'),

  /** Track when user clicks on an AI tip */
  tipClicked: (tipId: string, category: string) =>
    trackEvent('tip_clicked', { tip_id: tipId, category }),

  /** Track tip feedback */
  tipFeedback: (tipId: string, feedback: 'helpful' | 'not-relevant') =>
    trackEvent('tip_feedback_submitted', { tip_id: tipId, feedback }),

  /** Track sign-up method */
  signUp: (method: 'email' | 'google') =>
    trackEvent('sign_up', { method }),

  /** Track login method */
  login: (method: 'email' | 'google') =>
    trackEvent('login', { method }),
};
