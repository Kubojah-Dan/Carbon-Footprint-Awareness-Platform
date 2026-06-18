/**
 * Firebase Client SDK Initialization
 *
 * Singleton pattern — Firebase apps throw if initialized twice.
 * This module is safe to import from any client component.
 *
 * Services initialized here:
 *   - Firebase Auth (email/password + Google OAuth)
 *   - Firestore (real-time database)
 *   - Firebase Analytics (Google Analytics 4)
 *   - Firebase Cloud Messaging (push notifications)
 *
 * Google Services: Firebase Authentication, Firestore, FCM, Analytics
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getMessaging, type Messaging } from 'firebase/messaging';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase app (singleton) and App Check
function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) return getApp();
  const app = initializeApp(firebaseConfig);

  // Initialize App Check (client-side only)
  if (typeof window !== 'undefined') {
    const isDev = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_APP_CHECK_DEBUG === 'true';
    if (isDev) {
      // Set debug token for local testing
      (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }

    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (siteKey) {
      try {
        initializeAppCheck(app, {
          provider: new ReCaptchaV3Provider(siteKey),
          isTokenAutoRefreshEnabled: true,
        });
        console.log('[AppCheck] App Check initialized successfully');
      } catch (err) {
        console.error('[AppCheck] App Check initialization failed:', err);
      }
    } else {
      console.warn('[AppCheck] NEXT_PUBLIC_RECAPTCHA_SITE_KEY is missing. App Check is disabled.');
    }
  }

  return app;
}

// Lazily initialized singletons
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _analytics: Analytics | null = null;
let _messaging: Messaging | null = null;

/** Firebase Auth instance */
export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp());
  }
  return _auth;
}

/** Firestore database instance */
export function getFirebaseDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getFirebaseApp());
  }
  return _db;
}

/**
 * Firebase Analytics instance.
 * Returns null if analytics is not supported (SSR, bots, incognito).
 *
 * Google Service: Google Analytics for Firebase (GA4)
 */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (_analytics) return _analytics;

  try {
    const supported = await isSupported();
    if (supported) {
      _analytics = getAnalytics(getFirebaseApp());
      return _analytics;
    }
  } catch {
    // Analytics not supported in this environment (SSR, etc.)
  }
  return null;
}

/**
 * Firebase Cloud Messaging instance.
 * Returns null on server-side or unsupported browsers.
 *
 * Google Service: Firebase Cloud Messaging (FCM)
 */
export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;

  try {
    if (!_messaging) {
      _messaging = getMessaging(getFirebaseApp());
    }
    return _messaging;
  } catch {
    return null;
  }
}

// Named export of initialized app for cases requiring the raw FirebaseApp
export { getFirebaseApp };
