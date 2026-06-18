import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { GlobalImpact } from '@earthprint/types';

const GLOBAL_DOC_PATH = 'impact/global';

async function getOrCreateGlobalImpact(db: any): Promise<GlobalImpact> {
  const docRef = db.doc(GLOBAL_DOC_PATH);
  const snap = await docRef.get();

  if (snap.exists) {
    return snap.data() as GlobalImpact;
  }

  // Create initial seed values
  const initial: GlobalImpact = {
    totalKgCo2eSaved: 23849.5,
    totalUsers: 148,
    totalLogEntries: 2478,
    lastUpdatedAt: new Date().toISOString(),
  };

  await docRef.set(initial);
  return initial;
}

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb();
    const impact = await getOrCreateGlobalImpact(db);
    
    return NextResponse.json({
      success: true,
      impact,
    });
  } catch (error: any) {
    console.error('[impact/global] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { kgCo2eSaved = 0, isNewUser = false, isNewLog = false } = body;

    const db = getAdminDb();
    const docRef = db.doc(GLOBAL_DOC_PATH);

    // Make sure the document exists first
    await getOrCreateGlobalImpact(db);

    const updates: any = {
      lastUpdatedAt: new Date().toISOString(),
    };

    if (kgCo2eSaved > 0) {
      updates.totalKgCo2eSaved = FieldValue.increment(Number(kgCo2eSaved));
    }
    if (isNewUser) {
      updates.totalUsers = FieldValue.increment(1);
    }
    if (isNewLog) {
      updates.totalLogEntries = FieldValue.increment(1);
    }

    await docRef.update(updates);
    
    // Fetch fresh stats to return
    const updatedSnap = await docRef.get();
    const updatedImpact = updatedSnap.data() as GlobalImpact;

    return NextResponse.json({
      success: true,
      message: 'Global impact updated successfully',
      impact: updatedImpact,
    });
  } catch (error: any) {
    console.error('[impact/global] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
