import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import type { CommunityPost } from '@earthprint/types';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const uid = searchParams.get('uid');

    const db = getAdminDb();

    // Fetch posts ordered by postedAt descending
    const postsSnap = await db.collection('posts')
      .orderBy('postedAt', 'desc')
      .limit(50)
      .get();

    const posts: CommunityPost[] = [];

    for (const doc of postsSnap.docs) {
      const data = doc.data();
      const postId = doc.id;
      
      let userHasLiked = false;
      if (uid) {
        // Check if the user liked this post
        const likeDoc = await db.collection('posts').doc(postId).collection('likes').doc(uid).get();
        userHasLiked = likeDoc.exists;
      }

      posts.push({
        id: postId,
        uid: data.uid,
        authorName: data.authorName || 'Anonymous',
        authorPhotoURL: data.authorPhotoURL || null,
        authorCity: data.authorCity,
        content: data.content,
        logEntryId: data.logEntryId,
        kgCo2eSaved: data.kgCo2eSaved,
        category: data.category,
        postedAt: data.postedAt,
        likeCount: data.likeCount || 0,
        commentCount: data.commentCount || 0,
        userHasLiked,
      });
    }

    return NextResponse.json({
      success: true,
      posts,
    });
  } catch (error: any) {
    console.error('[posts] GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uid, content, logEntryId } = body;

    if (!uid || !content) {
      return NextResponse.json(
        { success: false, error: 'Both uid and content are required' },
        { status: 400 }
      );
    }

    if (content.length > 280) {
      return NextResponse.json(
        { success: false, error: 'Content exceeds 280 characters' },
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
    let kgCo2eSaved: number | undefined;
    let category: string | undefined;

    // 2. Verify log entry if provided
    if (logEntryId) {
      const logSnap = await db.collection('users').doc(uid).collection('logs').doc(logEntryId).get();
      if (logSnap.exists) {
        const logData = logSnap.data()!;
        category = logData.category;
        // Default to a verified saving value from log entry (or base calculations)
        kgCo2eSaved = logData.kgCo2eSaved || logData.savedKgCo2e || (logData.kgCo2e ? Math.max(0.1, Number((logData.kgCo2e * 0.25).toFixed(2))) : 5.0);
      }
    }

    const newPostRef = db.collection('posts').doc();
    const newPost: CommunityPost = {
      id: newPostRef.id,
      uid,
      authorName: userProfile.displayName || 'Anonymous',
      authorPhotoURL: userProfile.photoURL || null,
      content,
      postedAt: new Date().toISOString(),
      likeCount: 0,
      commentCount: 0,
      ...(userProfile.city && { authorCity: userProfile.city }),
      ...(logEntryId && { logEntryId }),
      ...(kgCo2eSaved !== undefined && { kgCo2eSaved }),
      ...(category !== undefined && { category }),
    };

    await newPostRef.set(newPost);

    return NextResponse.json({
      success: true,
      message: 'Post created successfully',
      post: newPost,
    });
  } catch (error: any) {
    console.error('[posts] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
