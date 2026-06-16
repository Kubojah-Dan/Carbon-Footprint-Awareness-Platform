/**
 * Food Emission Calculator
 *
 * Calculates kg CO₂e for food consumption log entries.
 *
 * Primary source: Poore & Nemecek 2018 (Oxford University)
 * "Reducing food's environmental impacts through producers and consumers"
 * Science, Vol. 360, Issue 6392, pp. 987-992
 * DOI: 10.1126/science.aaq0216
 * Data: https://ora.ox.ac.uk/objects/uuid:b0b53649-5e93-4415-bf07-6b0b1227172f
 *
 * Factors represent median values across global production systems.
 * Land-use change (LUC) emissions are included.
 *
 * Organic food adjustment: Research suggests certified organic food
 * has ~20% lower greenhouse gas emissions per kg produced (Tuomisto et al. 2012,
 * "Exploring a safe and just operating space for food systems" — used conservatively as 15%).
 *
 * Local food adjustment: Locally sourced food typically reduces transport emissions
 * by ~10–20% of the total lifecycle (transport = ~5–10% of food LCA, so max saving ≈ 10%).
 * Source: Weber & Matthews 2008, "Food-Miles and the Relative Climate Impacts of Food Choices"
 */

import type { FoodType } from '@earthprint/types';
import { getFoodFactor } from '../factors/loader';

export interface FoodCalculationInput {
  foodType: FoodType;
  weightGrams: number;
  isOrganic?: boolean;
  isLocal?: boolean;
  wasWasted?: boolean;
}

export interface FoodCalculationResult {
  kgCo2e: number;
  factorUsed: number;     // kg CO₂e per kg of food
  factorSource: string;
  adjustments: {
    organic: number;    // Multiplier applied (1.0 = no change)
    local: number;
    waste: number;
  };
}

/**
 * Organic food emission reduction multiplier.
 * Conservative estimate: 15% reduction for certified organic production.
 * Source: Tuomisto et al. 2012 (meta-analysis of organic vs. conventional LCA studies)
 */
const ORGANIC_MULTIPLIER = 0.85;

/**
 * Local food emission reduction multiplier.
 * Transport represents ~6–11% of food lifecycle emissions on average.
 * Locally sourced food reduces transport by ~80% → ~8% total reduction.
 * Source: Weber & Matthews 2008
 */
const LOCAL_MULTIPLIER = 0.92;

/**
 * Wasted food emission multiplier.
 * Food waste generates methane in landfill, but per EarthPrint methodology,
 * waste is handled as a 30% REDUCTION because wasted food = less of its
 * lifecycle impact attributed to the consumer (production already happened).
 * See docs/emission-methodology.md for full waste accounting rationale.
 */
const WASTED_FOOD_MULTIPLIER = 0.70;

/**
 * Calculate CO₂e emissions for a food log entry.
 */
export function calculateFoodEmission(input: FoodCalculationInput): FoodCalculationResult {
  const {
    foodType,
    weightGrams,
    isOrganic = false,
    isLocal = false,
    wasWasted = false,
  } = input;

  if (weightGrams < 0) {
    throw new Error(`Weight must be non-negative, got ${weightGrams}`);
  }

  if (weightGrams === 0) {
    return {
      kgCo2e: 0,
      factorUsed: 0,
      factorSource: 'Zero weight',
      adjustments: { organic: 1, local: 1, waste: 1 },
    };
  }

  const factor = getFoodFactor(foodType);

  if (!factor) {
    console.warn(
      `[emission-engine] No food factor found for type="${foodType}". ` +
      'Returning 0. Add this food type to data/emission-factors/food-factors.json.'
    );
    return {
      kgCo2e: 0,
      factorUsed: 0,
      factorSource: 'Factor not found — returning 0',
      adjustments: { organic: 1, local: 1, waste: 1 },
    };
  }

  const weightKg = weightGrams / 1000;

  // Apply adjustments in sequence
  const organicMultiplier = isOrganic ? ORGANIC_MULTIPLIER : 1.0;
  const localMultiplier = isLocal ? LOCAL_MULTIPLIER : 1.0;
  const wasteMultiplier = wasWasted ? WASTED_FOOD_MULTIPLIER : 1.0;

  const kgCo2e =
    factor.kgCo2ePerKg * weightKg * organicMultiplier * localMultiplier * wasteMultiplier;

  return {
    kgCo2e: Math.round(kgCo2e * 1000) / 1000,
    factorUsed: factor.kgCo2ePerKg,
    factorSource: factor.dataSource,
    adjustments: {
      organic: organicMultiplier,
      local: localMultiplier,
      waste: wasteMultiplier,
    },
  };
}

/**
 * Estimate annual food emissions from onboarding diet answers.
 * Used in baseline calculation only.
 *
 * Annual food consumption estimates by diet type are based on:
 * - Scarborough et al. 2014: "Dietary greenhouse gas emissions of meat-eaters,
 *   fish-eaters, vegetarians and vegans in the UK"
 *   Climatic Change, 125, 179–192. DOI: 10.1007/s10461-014-0679-1
 */
export function estimateAnnualFoodEmissions(params: {
  dietType: string;
  organicPercent: number;
  localFoodPercent: number;
}): number {
  const { dietType, organicPercent, localFoodPercent } = params;

  // Annual kg CO₂e by diet type — Scarborough et al. 2014 (UK-based study)
  // Values represent median for each diet category
  const annualEmissionsByDiet: Record<string, number> = {
    omnivore: 2055,      // High-meat eater ~2,457; medium-meat ~1,669; average ~2,055 (Scarborough 2014)
    pescatarian: 1391,   // Fish-eaters: ~1,391 kg CO₂e/year
    vegetarian: 1055,    // Vegetarians: ~1,055 kg CO₂e/year
    vegan: 738,          // Vegans: ~738 kg CO₂e/year
  };

  const baseEmissions = (annualEmissionsByDiet[dietType] !== undefined)
    ? annualEmissionsByDiet[dietType]!
    : 2055;

  // Apply organic adjustment: each percentage point of organic = 0.15% reduction
  // (ORGANIC_MULTIPLIER = 0.85, so 15% reduction at 100% organic)
  const organicFraction = organicPercent / 100;
  const organicAdjustment = 1 - organicFraction * (1 - ORGANIC_MULTIPLIER);

  // Apply local food adjustment: each percentage point of local = 0.08% reduction
  const localFraction = localFoodPercent / 100;
  const localAdjustment = 1 - localFraction * (1 - LOCAL_MULTIPLIER);

  return Math.round(baseEmissions * organicAdjustment * localAdjustment);
}
