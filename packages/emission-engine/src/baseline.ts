/**
 * Baseline Emission Calculator
 *
 * Calculates a user's estimated annual CO₂e from their onboarding questionnaire answers.
 * This is the starting point — not a precise measurement, but a meaningful estimate.
 *
 * Country average data source:
 *   Our World in Data — CO₂ and Greenhouse Gas Emissions
 *   https://ourworldindata.org/co2-and-greenhouse-gas-emissions
 *   Underlying data: Global Carbon Project + Friedlingstein et al. 2022
 *
 * Global average: ~4,800 kg CO₂e per capita per year (consumption-based, OWID 2022)
 * Note: This is the consumption-based footprint (imports included, exports excluded),
 * which is the correct measure for individual lifestyle emissions.
 *
 * Country-specific averages (consumption-based, OWID 2022 — kg CO₂e per capita):
 *   US: 14,000 | UK: 8,500 | DE: 9,600 | FR: 7,200 | IN: 1,900 | AU: 15,000
 *   CA: 13,700 | JP: 8,600 | CN: 7,600 | BR: 3,100 | ZA: 6,900
 */

import type { OnboardingAnswers, BaselineResult, CategoryBreakdown } from '@earthprint/types';
import { estimateAnnualTransportEmissions } from './categories/transport';
import { estimateAnnualFoodEmissions } from './categories/food';
import { estimateAnnualEnergyEmissions } from './categories/energy';
import { estimateAnnualShoppingEmissions } from './categories/shopping';

/**
 * Country-level per-capita consumption-based CO₂e estimates (kg/year).
 * Source: Our World in Data — CO₂ and Greenhouse Gas Emissions 2022
 * https://ourworldindata.org/co2-and-greenhouse-gas-emissions
 * Data: Global Carbon Project, Friedlingstein et al. 2022
 */
const COUNTRY_AVERAGES_KG_CO2E: Record<string, number> = {
  US: 14000,  AU: 15000,  CA: 13700,
  GB: 8500,   DE: 9600,   NL: 10200,
  FR: 7200,   ES: 6800,   IT: 7100,
  JP: 8600,   KR: 11400,  CN: 7600,
  IN: 1900,   BR: 3100,   MX: 3600,
  ZA: 6900,   NG: 700,    EG: 2300,
  SE: 6800,   NO: 7800,   DK: 7500,
  PL: 8900,   PT: 5200,   IE: 9200,
  NZ: 7200,   SG: 9800,   AR: 4400,
};

/** Global average — fallback if country not in list */
const GLOBAL_AVERAGE_KG_CO2E = 4800;

/**
 * Per-capita monthly target reduction: 10% below monthly baseline for Month 1.
 * Target increases 5% each month in future phases. For now: 10% flat.
 */
const INITIAL_MONTHLY_REDUCTION_PERCENT = 0.10;

/**
 * Calculate baseline annual CO₂e estimate from onboarding answers.
 * Each category estimate cites its source dataset in the category calculator files.
 */
export function calculateBaseline(answers: OnboardingAnswers): BaselineResult {
  const { location, household, transport, diet, shopping } = answers;

  // ── Transport ──────────────────────────────────────────────────────────────
  // Source: DEFRA 2023 transport factors (see categories/transport.ts)
  const transportKgCo2e = estimateAnnualTransportEmissions({
    weeklyCarKm: transport.hasCarOrVan ? transport.weeklyCarKm : 0,
    vehicleFuelType: transport.vehicleFuelType,
    weeklyPublicTransportKm: transport.weeklyPublicTransportKm,
    flightsPerYear: transport.flightsPerYear,
    longHaulFlightsPerYear: transport.longHaulFlightsPerYear,
    flightClass: transport.flightClass,
  });

  // ── Food ───────────────────────────────────────────────────────────────────
  // Source: Poore & Nemecek 2018 via Scarborough et al. 2014 diet averages
  // (see categories/food.ts)
  const foodKgCo2e = estimateAnnualFoodEmissions({
    dietType: diet.dietType,
    organicPercent: diet.organicPercent,
    localFoodPercent: diet.localFoodPercent,
  });

  // ── Energy ─────────────────────────────────────────────────────────────────
  // Source: IEA 2022 grid factors + DEFRA 2023 fuel factors (see categories/energy.ts)
  const energyKgCo2e = estimateAnnualEnergyEmissions({
    householdSize: household.size,
    heatingType: household.heatingType,
    hasAirConditioning: household.hasAirConditioning,
    gridRegion: location.gridRegion ?? location.country,
  });

  // ── Shopping ───────────────────────────────────────────────────────────────
  // Source: DEFRA 2023 spend-based factors (see categories/shopping.ts)
  const shoppingKgCo2e = estimateAnnualShoppingEmissions({
    fastFashionFrequency: shopping.fastFashionFrequency,
    newElectronicsPerYear: shopping.newElectronicsPerYear,
    deliveryOrdersPerWeek: shopping.deliveryOrdersPerWeek,
    budgetLevel: shopping.budgetLevel,
    buySecondHand: shopping.buySecondHand,
  });

  const totalKgCo2e = transportKgCo2e + foodKgCo2e + energyKgCo2e + shoppingKgCo2e;

  const byCategory: CategoryBreakdown = {
    travel: Math.round(transportKgCo2e),
    food: Math.round(foodKgCo2e),
    energy: Math.round(energyKgCo2e),
    shopping: Math.round(shoppingKgCo2e),
    total: Math.round(totalKgCo2e),
  };

  const monthlyKgCo2e = totalKgCo2e / 12;
  const monthlyTarget = monthlyKgCo2e * (1 - INITIAL_MONTHLY_REDUCTION_PERCENT);

  // Country average lookup
  // Source: Our World in Data 2022 — consumption-based CO₂e per capita
  const countryAverage =
    COUNTRY_AVERAGES_KG_CO2E[location.country] ?? GLOBAL_AVERAGE_KG_CO2E;

  const comparedToAverage =
    Math.round(((totalKgCo2e - countryAverage) / countryAverage) * 100);

  return {
    annualKgCo2e: Math.round(totalKgCo2e),
    monthlyKgCo2e: Math.round(monthlyKgCo2e * 10) / 10,
    byCategory,
    monthlyTarget: Math.round(monthlyTarget * 10) / 10,
    comparedToAverage,
    countryAverageKgCo2e: countryAverage,
    globalAverageKgCo2e: GLOBAL_AVERAGE_KG_CO2E,
    calculatedAt: new Date().toISOString(),
    methodology:
      'Transport: DEFRA 2023 | Food: Poore & Nemecek 2018 / Scarborough 2014 | ' +
      'Energy: IEA 2022 / DEFRA 2023 | Shopping: DEFRA 2023 spend-based',
  };
}
