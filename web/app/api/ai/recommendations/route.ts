import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { generateRecommendations } from '@/lib/vertex-ai';
import { calculateBaseline } from '@earthprint/emission-engine';
import type { UserProfile, AIRecommendation } from '@earthprint/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid } = body;

    if (!uid) {
      return NextResponse.json({ error: 'Missing uid' }, { status: 400 });
    }

    const db = getAdminDb();

    // 1. Fetch user profile
    const userDocRef = db.collection('users').doc(uid);
    const userSnap = await userDocRef.get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const userProfile = userSnap.data() as UserProfile;
    if (!userProfile.onboardingCompleted || !userProfile.onboardingAnswers) {
      return NextResponse.json({ error: 'Onboarding not completed' }, { status: 400 });
    }

    // 2. Fetch last 30 days of logs to construct categoryBreakdown
    const logsRef = db.collection('users').doc(uid).collection('logs');
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    const cutoffIso = cutoffDate.toISOString().split('T')[0]!;

    const logsSnap = await logsRef
      .where('activityDate', '>=', cutoffIso)
      .get();

    const categoryBreakdown = {
      travel: 0,
      food: 0,
      energy: 0,
      shopping: 0,
    };

    let hasLogs = false;
    logsSnap.forEach((doc) => {
      const log = doc.data();
      const cat = log.category as keyof typeof categoryBreakdown;
      if (cat in categoryBreakdown && typeof log.kgCo2e === 'number') {
        categoryBreakdown[cat] += log.kgCo2e;
        hasLogs = true;
      }
    });

    // If no logs, fall back to monthly baseline breakdown
    if (!hasLogs) {
      const baselineResult = calculateBaseline(userProfile.onboardingAnswers);
      categoryBreakdown.travel = baselineResult.byCategory.travel / 12;
      categoryBreakdown.food = baselineResult.byCategory.food / 12;
      categoryBreakdown.energy = baselineResult.byCategory.energy / 12;
      categoryBreakdown.shopping = baselineResult.byCategory.shopping / 12;
    }

    // 3. Fetch previous recommendations for feedback
    const recsRef = db.collection('users').doc(uid).collection('recommendations');
    const recsSnap = await recsRef.get();
    const previousTipFeedback: Array<{ title: string; feedback: 'helpful' | 'not-relevant' }> = [];

    recsSnap.forEach((doc) => {
      const data = doc.data();
      if (data.title && (data.userFeedback === 'helpful' || data.userFeedback === 'not-relevant')) {
        previousTipFeedback.push({
          title: data.title,
          feedback: data.userFeedback as 'helpful' | 'not-relevant',
        });
      }
    });

    // 4. Generate recommendations using Vertex AI / Gemini API
    const recommendations = await generateRecommendations({
      userProfile,
      onboardingAnswers: userProfile.onboardingAnswers,
      baselineKgCo2ePerYear: userProfile.baselineKgCo2ePerYear || 4800,
      categoryBreakdown,
      previousTipFeedback,
    });

    // 5. Store generated recommendations in Firestore
    const batch = db.batch();
    recommendations.forEach((rec) => {
      const recDocRef = recsRef.doc(rec.id);
      batch.set(recDocRef, rec);
    });
    await batch.commit();

    return NextResponse.json({ recommendations });
  } catch (error: any) {
    console.error('[API Recommendations] Error generating recommendations:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
