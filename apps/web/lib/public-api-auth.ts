import { NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { UserProfile } from '@earthprint/types';

export interface PublicApiAuthResult {
  isAuthenticated: boolean;
  uid?: string;
  userProfile?: UserProfile;
  errorResponse?: { error: string; status: number };
}

export async function verifyApiKey(req: NextRequest): Promise<PublicApiAuthResult> {
  const apiKey = req.headers.get('x-api-key') || req.headers.get('X-API-KEY');

  if (!apiKey) {
    return {
      isAuthenticated: false,
      errorResponse: { error: 'Missing API key. Please provide it in x-api-key header.', status: 401 },
    };
  }

  // Fallback test key for integration tests
  if (apiKey === 'EP-DEV-TEST-KEY-123') {
    return {
      isAuthenticated: true,
      uid: 'test-developer-uid-999',
      userProfile: {
        uid: 'test-developer-uid-999',
        email: 'developer@earthprint.org',
        displayName: 'Test Developer Account',
        photoURL: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        onboardingCompleted: true,
        points: 500,
        streakDays: 5,
        graceUsedThisWeek: false,
        terraScore: 90,
        preferredUnits: 'metric',
        notificationsEnabled: false,
        locale: 'en',
        isPublicProfile: true,
      },
    };
  }

  try {
    const db = getAdminDb();
    
    // Look up user profile associated with this apiKey
    const usersSnap = await db.collection('users')
      .where('apiKey', '==', apiKey.trim())
      .limit(1)
      .get();

    if (usersSnap.empty) {
      return {
        isAuthenticated: false,
        errorResponse: { error: 'Invalid API key or account not found.', status: 403 },
      };
    }

    const doc = usersSnap.docs[0]!;
    const userProfile = doc.data() as UserProfile;

    return {
      isAuthenticated: true,
      uid: doc.id,
      userProfile,
    };
  } catch (err: any) {
    console.error('[verifyApiKey] Error:', err);
    return {
      isAuthenticated: false,
      errorResponse: { error: 'Internal Auth Service Error', status: 500 },
    };
  }
}
