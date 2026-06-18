import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, postId } = body;

    if (!uid || !postId) {
      return NextResponse.json(
        { success: false, error: 'Both uid and postId are required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const postRef = db.collection('posts').doc(postId);
    const postSnap = await postRef.get();

    if (!postSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    const likeRef = postRef.collection('likes').doc(uid);
    const likeSnap = await likeRef.get();

    let liked = false;
    if (likeSnap.exists) {
      // Unlike
      await db.runTransaction(async (transaction) => {
        transaction.delete(likeRef);
        transaction.update(postRef, {
          likeCount: FieldValue.increment(-1),
        });
      });
      liked = false;
    } else {
      // Like
      await db.runTransaction(async (transaction) => {
        transaction.set(likeRef, {
          likedAt: new Date().toISOString(),
          uid,
        });
        transaction.update(postRef, {
          likeCount: FieldValue.increment(1),
        });
      });
      liked = true;
    }

    return NextResponse.json({
      success: true,
      liked,
      message: liked ? 'Post liked successfully' : 'Post unliked successfully',
    });
  } catch (error: any) {
    console.error('[posts/like] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
