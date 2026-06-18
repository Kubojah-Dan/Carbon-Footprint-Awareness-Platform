import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/public-api-auth';

export async function GET(req: NextRequest) {
  const auth = await verifyApiKey(req);
  if (!auth.isAuthenticated && auth.errorResponse) {
    return NextResponse.json(
      { success: false, error: auth.errorResponse.error },
      { status: auth.errorResponse.status }
    );
  }

  const profile = auth.userProfile!;

  return NextResponse.json({
    success: true,
    profile: {
      uid: profile.uid,
      email: profile.email,
      displayName: profile.displayName || 'Anonymous',
      points: profile.points || 0,
      streakDays: profile.streakDays || 0,
      terraScore: profile.terraScore || 100,
      activeBiome: profile.activeBiome || 'temperate-forest',
      preferredUnits: profile.preferredUnits || 'metric',
      monthlyTargetKgCo2e: profile.monthlyTargetKgCo2e || 200,
      baselineKgCo2ePerYear: profile.baselineKgCo2ePerYear || 4800,
    },
  });
}
