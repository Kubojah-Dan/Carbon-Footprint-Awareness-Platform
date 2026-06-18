import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { Team } from '@earthprint/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, inviteCode } = body;

    if (!uid || !inviteCode) {
      return NextResponse.json(
        { success: false, error: 'Both uid and inviteCode are required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    
    // Check if the user exists
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Find team by invite code
    const teamsSnap = await db.collection('teams')
      .where('inviteCode', '==', inviteCode.trim().toUpperCase())
      .limit(1)
      .get();

    if (teamsSnap.empty) {
      return NextResponse.json(
        { success: false, error: 'Invalid invite code or team not found' },
        { status: 404 }
      );
    }

    const teamDoc = teamsSnap.docs[0]!;
    const teamData = { id: teamDoc.id, ...teamDoc.data() } as Team;

    if (teamData.memberUids.includes(uid)) {
      return NextResponse.json({
        success: true,
        message: 'You are already a member of this team',
        team: teamData,
      });
    }

    // Add user to team
    await teamDoc.ref.update({
      memberUids: FieldValue.arrayUnion(uid),
    });

    const updatedTeamData: Team = {
      ...teamData,
      memberUids: [...teamData.memberUids, uid],
    };

    return NextResponse.json({
      success: true,
      message: 'Joined team successfully',
      team: updatedTeamData,
    });
  } catch (error: any) {
    console.error('[teams/join] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
