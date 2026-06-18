import { NextRequest, NextResponse } from 'next/server';
import { verifyApiKey } from '@/lib/public-api-auth';
import {
  calculateTransportEmission,
  calculateFoodEmission,
  calculateEnergyEmission,
  calculateShoppingEmission,
} from '@earthprint/emission-engine';

export async function POST(req: NextRequest) {
  // 1. Authenticate API client
  const auth = await verifyApiKey(req);
  if (!auth.isAuthenticated && auth.errorResponse) {
    return NextResponse.json(
      { success: false, error: auth.errorResponse.error },
      { status: auth.errorResponse.status }
    );
  }

  try {
    const body = await req.json();
    const { category, data } = body;

    if (!category || !data) {
      return NextResponse.json(
        { success: false, error: 'Both category and data fields are required.' },
        { status: 400 }
      );
    }

    let kgCo2e = 0;
    let details = {};

    switch (category) {
      case 'travel': {
        const { mode, distanceKm } = data;
        if (!mode || typeof distanceKm !== 'number') {
          return NextResponse.json(
            { success: false, error: 'For travel calculations, mode and distanceKm (number) are required.' },
            { status: 400 }
          );
        }
        const res = calculateTransportEmission({ mode, distanceKm });
        kgCo2e = res.kgCo2e;
        details = res;
        break;
      }
      case 'food': {
        const { foodType, weightGrams, isOrganic = false, isLocal = false } = data;
        if (!foodType || typeof weightGrams !== 'number') {
          return NextResponse.json(
            { success: false, error: 'For food calculations, foodType and weightGrams (number) are required.' },
            { status: 400 }
          );
        }
        const res = calculateFoodEmission({ foodType, weightGrams, isOrganic, isLocal });
        kgCo2e = res.kgCo2e;
        details = res;
        break;
      }
      case 'energy': {
        const { source, amount, unit = 'kwh' } = data;
        if (!source || typeof amount !== 'number') {
          return NextResponse.json(
            { success: false, error: 'For energy calculations, source and amount (number) are required.' },
            { status: 400 }
          );
        }
        const res = calculateEnergyEmission({ source, amount, unit });
        kgCo2e = res.kgCo2e;
        details = res;
        break;
      }
      case 'shopping': {
        const { category: shopCat, spendAmount } = data;
        if (!shopCat || typeof spendAmount !== 'number') {
          return NextResponse.json(
            { success: false, error: 'For shopping calculations, category and spendAmount (number) are required.' },
            { status: 400 }
          );
        }
        const res = calculateShoppingEmission({
          category: shopCat,
          spendAmount,
          spendCurrency: data.spendCurrency || 'USD',
          isSecondHand: !!data.isSecondHand,
        });
        kgCo2e = res.kgCo2e;
        details = res;
        break;
      }
      default:
        return NextResponse.json(
          { success: false, error: `Invalid category. Supported categories: travel, food, energy, shopping.` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      category,
      kgCo2e: Number(kgCo2e.toFixed(3)),
      details,
    });
  } catch (error: any) {
    console.error('[public/calculate] POST Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
