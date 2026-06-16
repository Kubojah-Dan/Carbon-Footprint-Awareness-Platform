import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { MarketplaceAction, UserMarketplaceAction, UserProfile } from '@earthprint/types';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, actionId } = body;

    if (!uid || !actionId) {
      return NextResponse.json(
        { success: false, error: 'Both uid and actionId are required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    
    // 1. Fetch user profile
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    if (!userSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }
    const userProfile = userSnap.data() as UserProfile;

    // 2. Fetch action details
    let action: MarketplaceAction | null = null;
    const actionDoc = await db.collection('marketplace-actions').doc(actionId).get();
    if (actionDoc.exists) {
      action = { id: actionDoc.id, ...actionDoc.data() } as MarketplaceAction;
    } else {
      // Check fallback JSON
      try {
        const filePath = path.resolve(process.cwd(), 'data/seeds/marketplace-actions.json');
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, 'utf8');
          const actions = JSON.parse(fileData);
          action = actions.find((a: any) => a.id === actionId) || null;
        }
      } catch (err) {
        console.error('Fallback marketplace actions read failed:', err);
      }
    }

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Marketplace action not found' },
        { status: 404 }
      );
    }

    // 3. Check existing user commitment
    const userActionRef = db.collection('users').doc(uid).collection('marketplaceActions').doc(actionId);
    const userActionSnap = await userActionRef.get();
    if (userActionSnap.exists) {
      const existing = userActionSnap.data() as UserMarketplaceAction;
      if (existing.status === 'committed' || existing.status === 'completed') {
        return NextResponse.json(
          { success: false, error: 'You have already committed to or redeemed this action' },
          { status: 400 }
        );
      }
    }

    // 4. Points redemption checks
    const pointsCost = action.pointsCost || 0;
    if (action.isRedeemable && pointsCost > 0) {
      const currentPoints = userProfile.points || 0;
      if (currentPoints < pointsCost) {
        return NextResponse.json(
          { success: false, error: `Insufficient Bloom Points. You have ${currentPoints} but need ${pointsCost}.` },
          { status: 400 }
        );
      }
    }

    // 5. Generate redemption code
    const redemptionCode = action.isRedeemable
      ? `EP-REDEEM-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      : undefined;

    const userAction: UserMarketplaceAction = {
      id: actionId,
      uid,
      actionId,
      action,
      status: 'committed',
      committedAt: new Date().toISOString(),
      pointsRedeemed: pointsCost,
      ...(redemptionCode && { redemptionCode }),
    };

    // 6. Run transaction to deduct points and record redemption
    await db.runTransaction(async (transaction) => {
      if (action!.isRedeemable && pointsCost > 0) {
        transaction.update(userRef, {
          points: FieldValue.increment(-pointsCost),
          updatedAt: new Date().toISOString(),
        });
      }
      transaction.set(userActionRef, userAction);
    });

    return NextResponse.json({
      success: true,
      message: action.isRedeemable
        ? `Successfully redeemed ${action.title} for ${pointsCost} Bloom Points!`
        : `Committed to ${action.title} successfully!`,
      userAction,
    });
  } catch (error: any) {
    console.error('[marketplace/redeem] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
