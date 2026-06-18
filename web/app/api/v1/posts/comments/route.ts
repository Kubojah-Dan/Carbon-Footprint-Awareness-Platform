import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { PostComment } from '@earthprint/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'postId is required' },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const commentsSnap = await db
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .orderBy('postedAt', 'asc')
      .get();

    const comments: PostComment[] = [];
    commentsSnap.forEach((doc) => {
      const data = doc.data();
      comments.push({
        id: doc.id,
        postId,
        uid: data.uid,
        authorName: data.authorName || 'Anonymous',
        authorPhotoURL: data.authorPhotoURL || null,
        content: data.content,
        postedAt: data.postedAt,
      });
    });

    return NextResponse.json({
      success: true,
      comments,
    });
  } catch (error: any) {
    console.error('[comments] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, postId, content } = body;

    if (!uid || !postId || !content) {
      return NextResponse.json(
        { success: false, error: 'uid, postId, and content are required' },
        { status: 400 }
      );
    }

    if (content.length > 280) {
      return NextResponse.json(
        { success: false, error: 'Comment exceeds 280 characters' },
        { status: 400 }
      );
    }

    const db = getAdminDb();

    // 1. Fetch user profile for metadata
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    const userProfile = userSnap.data()!;

    // 2. Add comment to subcollection
    const commentRef = db.collection('posts').doc(postId).collection('comments').doc();
    const newComment: PostComment = {
      id: commentRef.id,
      postId,
      uid,
      authorName: userProfile.displayName || 'Anonymous',
      authorPhotoURL: userProfile.photoURL || null,
      content: content.trim(),
      postedAt: new Date().toISOString(),
    };

    await commentRef.set(newComment);

    // 3. Increment comment count on the post
    await db.collection('posts').doc(postId).update({
      commentCount: FieldValue.increment(1),
    });

    return NextResponse.json({
      success: true,
      message: 'Comment added successfully',
      comment: newComment,
    });
  } catch (error: any) {
    console.error('[comments] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
