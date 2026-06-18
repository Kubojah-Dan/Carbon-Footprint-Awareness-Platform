/**
 * Firebase Admin SDK — Server-Side Only
 *
 * IMPORTANT: Never import this file in client components.
 * Use only in:
 *   - Next.js API Route handlers (app/api/[...]/route.ts)
 *   - Server Components
 *   - Firebase Cloud Functions
 *
 * Initialized from environment variables (no JSON file required in production).
 * In local dev, set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path,
 * OR set the three individual FIREBASE_ADMIN_* vars.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;

function getAdminApp(): App {
  if (adminApp) return adminApp;
  if (getApps().length > 0) {
    adminApp = getApps()[0]!;
    return adminApp;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}\n-----END PRIVATE KEY-----`;
    }
  }

  if (!projectId || !clientEmail || !privateKey) {
    // In development, fall back to Application Default Credentials
    // (works if GOOGLE_APPLICATION_CREDENTIALS env var is set)
    adminApp = initializeApp();
    return adminApp;
  }

  adminApp = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });

  return adminApp;
}

/** Firebase Admin Auth — for verifying ID tokens, creating custom tokens */
export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

/** Firebase Admin Firestore — for server-side reads/writes bypassing security rules */
export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}

/**
 * Verify a Firebase ID token from a request Authorization header.
 * Returns the decoded token payload (includes uid, email, etc.).
 * Throws if the token is invalid or expired.
 */
export async function verifyIdToken(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  const idToken = authHeader.slice(7);
  return getAdminAuth().verifyIdToken(idToken);
}
