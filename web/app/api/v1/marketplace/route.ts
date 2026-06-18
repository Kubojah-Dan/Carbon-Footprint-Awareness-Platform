import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { MarketplaceAction, UserMarketplaceAction } from '@earthprint/types';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    const db = getAdminDb();
    
    // 1. Load active marketplace actions from Firestore
    let actionsSnap = await db.collection('marketplace-actions').where('isActive', '==', true).get();
    
    let actions: MarketplaceAction[] = [];
    actionsSnap.forEach((doc: any) => {
      actions.push({ id: doc.id, ...doc.data() } as MarketplaceAction);
    });

    // Fallback to reading the JSON file directly if Firestore is empty
    if (actions.length === 0) {
      try {
        const filePath = path.resolve(process.cwd(), 'data/seeds/marketplace-actions.json');
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, 'utf8');
          actions = JSON.parse(fileData).filter((a: any) => a.isActive);
        }
      } catch (err) {
        console.error('Error loading fallback marketplace actions:', err);
      }
    }

    // 2. Fetch user committed actions if uid is provided
    let userActions: UserMarketplaceAction[] = [];
    if (uid) {
      const userActionsSnap = await db.collection('users').doc(uid).collection('marketplaceActions').get();
      userActionsSnap.forEach((doc: any) => {
        userActions.push({ id: doc.id, ...doc.data() } as UserMarketplaceAction);
      });
    }

    return NextResponse.json({
      success: true,
      actions,
      userActions,
    });
  } catch (error: any) {
    console.error('[marketplace] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
