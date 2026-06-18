import { NextResponse } from 'next/server';
import { loadEmissionFactors } from '@earthprint/emission-engine';

export async function GET() {
  try {
    const factors = loadEmissionFactors();
    return NextResponse.json(factors, {
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=3600',
      },
    });
  } catch (error: any) {
    console.error('[API Emission Factors] Failed to load factors:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load emission factors' },
      { status: 500 }
    );
  }
}
