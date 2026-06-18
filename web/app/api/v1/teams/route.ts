import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { Team } from '@earthprint/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { success: false, error: 'Query parameter uid is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    
    // Find teams where user is a member
    const teamsSnap = await db.collection('teams')
      .where('memberUids', 'array-contains', uid)
      .get();

    const teams: Team[] = [];
    teamsSnap.forEach((doc: any) => {
      teams.push({ id: doc.id, ...doc.data() } as Team);
    });

    return NextResponse.json({
      success: true,
      teams,
    });
  } catch (error: any) {
    console.error('[teams] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { creatorUid, name } = body;

    if (!creatorUid || !name) {
      return NextResponse.json(
        { success: false, error: 'Both creatorUid and name are required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Verify creator exists
    const userSnap = await db.collection('users').doc(creatorUid).get();
    if (!userSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Creator profile not found' },
        { status: 404 }
      );
    }

    // Generate random invite code
    let inviteCode = '';
    let isUnique = false;
    
    // Retry loop just to guarantee uniqueness
    for (let i = 0; i < 5; i++) {
      inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const codeCheck = await db.collection('teams').where('inviteCode', '==', inviteCode).get();
      if (codeCheck.empty) {
        isUnique = true;
        break;
      }
    }

    if (!isUnique) {
      inviteCode = `EP${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const teamRef = db.collection('teams').doc();
    const team: Team = {
      id: teamRef.id,
      name,
      creatorUid,
      memberUids: [creatorUid],
      totalKgCo2eSaved: 0,
      createdAt: new Date().toISOString(),
      inviteCode,
    };

    await teamRef.set(team);

    // Increment creator's points for starting a team challenge
    await db.collection('users').doc(creatorUid).update({
      points: (userSnap.data()?.points || 0) + 50, // bonus points
    });

    return NextResponse.json({
      success: true,
      message: 'Team created successfully',
      team,
    });
  } catch (error: any) {
    console.error('[teams] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
