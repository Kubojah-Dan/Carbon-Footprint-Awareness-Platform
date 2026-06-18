import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, fcmToken } = body;

    if (!uid || !fcmToken) {
      return NextResponse.json(
        { success: false, error: 'Both uid and fcmToken are required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    await userRef.update({
      fcmToken: fcmToken,
      notificationsEnabled: true,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'FCM token registered successfully.',
    });
  } catch (error: any) {
    console.error('[users/fcm-token] Error updating token:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
