import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AiService } from '@/services/ai.service';
import { isRateLimited } from '@/lib/rate-limiter';

const journalSchema = z.object({
  entryText: z.string().min(1, 'entryText is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    // Validate request body using Zod
    const parsed = journalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.errors[0]?.message || 'Invalid request body' },
        { status: 400 }
      );
    }

    const { entryText } = parsed.data;

    // Apply Rate Limiting (30 requests per hour)
    const ip = req.ip ?? req.headers.get('x-forwarded-for') ?? '127.0.0.1';
    const limitRes = isRateLimited(`journal_${ip}`, 30, 3600000);
    
    if (limitRes.limited) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again in an hour.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '30',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(limitRes.reset)
          }
        }
      );
    }

    // Delegate logic to AiService
    const reflection = await AiService.generateGratitudeReflection(entryText);

    return NextResponse.json({
      success: true,
      reflection,
    });
  } catch (error: any) {
    console.error('[ai/journal] Error analyzing entry:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

