import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { Challenge } from '@earthprint/types';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const db = getAdminDb();
    
    // Fetch active challenges from Firestore
    const snap = await db.collection('challenges').where('isActive', '==', true).get();
    
    let challenges: Challenge[] = [];
    snap.forEach((doc: any) => {
      challenges.push({ id: doc.id, ...doc.data() } as Challenge);
    });

    // Fallback if collection is empty
    if (challenges.length === 0) {
      try {
        const filePath = path.resolve(process.cwd(), 'data/seeds/challenges.json');
        if (fs.existsSync(filePath)) {
          const fileData = fs.readFileSync(filePath, 'utf8');
          challenges = JSON.parse(fileData).filter((c: any) => c.isActive);
        }
      } catch (err) {
        console.error('Failed to load fallback challenges seed:', err);
      }
    }

    return NextResponse.json({
      success: true,
      challenges,
    });
  } catch (error: any) {
    console.error('[challenges] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
