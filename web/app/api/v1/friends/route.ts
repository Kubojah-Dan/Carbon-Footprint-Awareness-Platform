import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { FriendRequest, UserProfile } from '@earthprint/types';

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

    // 1. Fetch pending incoming requests
    const incomingSnap = await db.collection('friendRequests')
      .where('toUid', '==', uid)
      .where('status', '==', 'pending')
      .get();

    const pendingRequests: FriendRequest[] = [];
    incomingSnap.forEach((doc: any) => {
      pendingRequests.push({ id: doc.id, ...doc.data() } as FriendRequest);
    });

    // 2. Fetch accepted friendships
    const sentFriendshipsSnap = await db.collection('friendRequests')
      .where('fromUid', '==', uid)
      .where('status', '==', 'accepted')
      .get();

    const receivedFriendshipsSnap = await db.collection('friendRequests')
      .where('toUid', '==', uid)
      .where('status', '==', 'accepted')
      .get();

    const friendUids: string[] = [];
    sentFriendshipsSnap.forEach((doc: any) => {
      friendUids.push(doc.data().toUid);
    });
    receivedFriendshipsSnap.forEach((doc: any) => {
      friendUids.push(doc.data().fromUid);
    });

    // Remove duplicates just in case
    const uniqueFriendUids = Array.from(new Set(friendUids));

    // Fetch friend profiles
    const friends: UserProfile[] = [];
    if (uniqueFriendUids.length > 0) {
      // Firestore 'in' query supports up to 30 items
      const chunks = [];
      const chunkSize = 10;
      for (let i = 0; i < uniqueFriendUids.length; i += chunkSize) {
        chunks.push(uniqueFriendUids.slice(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        const usersSnap = await db.collection('users')
          .where('uid', 'in', chunk)
          .get();
          
        usersSnap.forEach((doc: any) => {
          friends.push(doc.data() as UserProfile);
        });
      }
    }

    return NextResponse.json({
      success: true,
      friends,
      pendingRequests,
    });
  } catch (error: any) {
    console.error('[friends] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fromUid, toUid, action, requestId } = body;

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action parameter is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    if (action === 'request') {
      if (!fromUid || !toUid) {
        return NextResponse.json(
          { success: false, error: 'Both fromUid and toUid are required for sending requests' },
          { status: 400 }
        );
      }

      // Check if a request already exists between these users
      const existingSnap = await db.collection('friendRequests')
        .where('fromUid', 'in', [fromUid, toUid])
        .get();

      let alreadyExists = false;
      existingSnap.forEach((doc: any) => {
        const data = doc.data();
        if (
          (data.fromUid === fromUid && data.toUid === toUid) ||
          (data.fromUid === toUid && data.toUid === fromUid)
        ) {
          alreadyExists = true;
        }
      });

      if (alreadyExists) {
        return NextResponse.json(
          { success: false, error: 'A friendship or pending request already exists between these users' },
          { status: 400 }
        );
      }

      const newRequestRef = db.collection('friendRequests').doc();
      const newRequest: FriendRequest = {
        id: newRequestRef.id,
        fromUid,
        toUid,
        status: 'pending',
        sentAt: new Date().toISOString(),
      };

      await newRequestRef.set(newRequest);

      return NextResponse.json({
        success: true,
        message: 'Friend request sent successfully.',
        request: newRequest,
      });
    }

    if (action === 'accept' || action === 'decline') {
      if (!requestId) {
        return NextResponse.json(
          { success: false, error: 'requestId is required to respond to requests' },
          { status: 400 }
        );
      }

      const requestRef = db.collection('friendRequests').doc(requestId);
      const docSnap = await requestRef.get();

      if (!docSnap.exists) {
        return NextResponse.json(
          { success: false, error: 'Friend request not found' },
          { status: 404 }
        );
      }

      const newStatus = action === 'accept' ? 'accepted' : 'declined';
      await requestRef.update({
        status: newStatus,
        respondedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: `Friend request ${action}ed successfully.`,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action value' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[friends] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
