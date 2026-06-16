import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, inviteCode, department } = body;

    if (!uid || !inviteCode) {
      return NextResponse.json(
        { success: false, error: 'Both uid and inviteCode are required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // Verify user profile exists
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Find organization by invite code
    const orgsSnap = await db.collection('organizations')
      .where('inviteCode', '==', inviteCode.trim().toUpperCase())
      .limit(1)
      .get();

    if (orgsSnap.empty) {
      return NextResponse.json(
        { success: false, error: 'Invalid invite code or organization not found' },
        { status: 404 }
      );
    }

    const orgDoc = orgsSnap.docs[0]!;
    const orgId = orgDoc.id;
    const orgData = orgDoc.data();

    // Add user to organization members
    await orgDoc.ref.update({
      memberUids: FieldValue.arrayUnion(uid),
    });

    // Update user profile with org details
    const chosenDept = department ? department.trim() : 'General';
    await db.collection('users').doc(uid).update({
      orgId,
      orgRole: 'member',
      department: chosenDept,
    });

    const updatedOrgData = {
      ...orgData,
      id: orgId,
      memberUids: Array.from(new Set([...(orgData.memberUids || []), uid])),
    };

    return NextResponse.json({
      success: true,
      message: 'Joined organization successfully',
      organization: updatedOrgData,
    });
  } catch (error: any) {
    console.error('[organizations/join] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
