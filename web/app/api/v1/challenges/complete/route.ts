import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { uid, challengeId, pointsReward } = body;

    if (!uid || !challengeId || !pointsReward) {
      return NextResponse.json(
        { success: false, error: 'uid, challengeId, and pointsReward are required.' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'User profile not found.' },
        { status: 404 }
      );
    }

    // Update user points in Firestore
    await userRef.update({
      points: FieldValue.increment(pointsReward),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: `Successfully completed challenge and awarded ${pointsReward} Bloom Points!`,
    });
  } catch (error: any) {
    console.error('[challenges/complete] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
