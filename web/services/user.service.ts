import { getAdminDb } from '../lib/firebase-admin';
import type { UserProfile } from '@earthprint/types';

/**
 * Service to manage user profile storage and operations in Firestore (server-side).
 */
export class UserService {
  /**
   * Retrieves a user profile by UID. Returns null if not found.
   */
  public static async getUserProfile(uid: string): Promise<UserProfile | null> {
    const db = getAdminDb();
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) {
      return null;
    }
    return doc.data() as UserProfile;
  }

  /**
   * Registers or updates the FCM Push Notification token for a user.
   */
  public static async registerFcmToken(uid: string, fcmToken: string): Promise<boolean> {
    const db = getAdminDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return false;
    }

    await userRef.update({
      fcmToken,
      notificationsEnabled: true,
      updatedAt: new Date().toISOString(),
    });

    return true;
  }
}
