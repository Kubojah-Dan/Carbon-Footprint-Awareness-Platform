import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { GamificationService } from '@/services/gamification.service';

const streakSchema = z
  .object({
    uid: z.string().optional(),
    all: z.boolean().optional(),
  })
  .refine((data) => data.uid || data.all === true, {
    message: 'Provide uid or { all: true } in the request body',
  });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Validate request body using Zod
    const parsed = streakSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.message || 'Invalid request body' },
        { status: 400 }
      );
    }

    const { uid, all } = parsed.data;

    if (uid) {
      const result = await GamificationService.updateUserStreakAndScore(uid);
      if (!result.success) {
        return NextResponse.json(result, { status: 404 });
      }
      return NextResponse.json(result);
    }

    if (all === true) {
      const results = await GamificationService.batchUpdateAllStreaks();
      return NextResponse.json({
        success: true,
        message: 'Batch streak update completed',
        results,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Provide uid or { all: true } in the request body' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[gamification/streak] Endpoint error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

