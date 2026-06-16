/**
 * Home Energy Emission Calculator
 *
 * Calculates kg CO₂e for home energy consumption.
 *
 * Electricity factors:
 *   Primary source: IEA World Energy Statistics 2022
 *   https://www.iea.org/data-and-statistics/data-product/world-energy-statistics
 *   Real-time factors: Electricity Maps API (requires API key)
 *   https://www.electricitymap.org/
 *
 * Gas/fuel combustion factors:
 *   Source: DEFRA 2023 GHG Conversion Factors — Fuels section
 *   https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting
 *
 * Unit conversion reference (IEA / Ofgem):
 *   1 therm = 29.31 kWh
 *   1 m³ natural gas = ~10.55 kWh (gross calorific value, UK average)
 *   1 litre heating oil = ~10.35 kWh
 *   1 litre LPG = ~7.08 kWh
 */

import type { EnergySource } from '@earthprint/types';
import { getGridFactor, getFuelFactor } from '../factors/loader';

export interface EnergyCalculationInput {
  source: EnergySource;
  amount: number;
  unit: 'kwh' | 'therm' | 'litre' | 'm3';
  gridRegion?: string; // ISO country code or Electricity Maps zone (e.g. "GB", "US-CAL-CISO")
}

export interface EnergyCalculationResult {
  kgCo2e: number;
  kwhEquivalent: number;   // Normalized to kWh for display
  factorUsed: number;      // kg CO₂e per kWh
  factorSource: string;
  gridRegionUsed: string;
}

/**
 * Unit conversion to kWh equivalents.
 * Source: IEA Energy Statistics Manual + UK Ofgem conversion factors
 */
const UNIT_TO_KWH: Record<string, number> = {
  kwh: 1,
  therm: 29.3071,      // 1 therm = 29.3071 kWh (exact, NIST)
  m3: 10.55,           // 1 m³ natural gas = 10.55 kWh (UK Ofgem gross CV)
  litre_oil: 10.35,    // Heating oil: 1 litre = 10.35 kWh
  litre_lpg: 7.08,     // LPG: 1 litre = 7.08 kWh
};

/**
 * Convert an energy amount to kWh based on source and unit.
 */
function toKwh(amount: number, unit: string, source: EnergySource): number {
  if (unit === 'kwh') return amount;
  if (unit === 'therm') return amount * UNIT_TO_KWH['therm']!;
  if (unit === 'm3') return amount * UNIT_TO_KWH['m3']!;
  if (unit === 'litre') {
    if (source === 'heating-oil') return amount * UNIT_TO_KWH['litre_oil']!;
    if (source === 'lpg') return amount * UNIT_TO_KWH['litre_lpg']!;
    return amount * UNIT_TO_KWH['litre_oil']!; // Default to oil for unknown liquid fuels
  }
  return amount; // Fall through to kWh
}

/**
 * Calculate CO₂e emissions for a home energy log entry.
 */
export function calculateEnergyEmission(
  input: EnergyCalculationInput
): EnergyCalculationResult {
  const { source, amount, unit, gridRegion = 'GLOBAL' } = input;

  if (amount < 0) {
    throw new Error(`Energy amount must be non-negative, got ${amount}`);
  }

  if (amount === 0) {
    const fallbackGrid = getGridFactor(gridRegion);
    return {
      kgCo2e: 0,
      kwhEquivalent: 0,
      factorUsed: 0,
      factorSource: 'Zero consumption',
      gridRegionUsed: fallbackGrid.region,
    };
  }

  const kwhEquivalent = toKwh(amount, unit, source);

  if (source === 'grid-electricity') {
    // Source: IEA World Energy Statistics 2022 — country-specific grid intensity
    const gridFactor = getGridFactor(gridRegion);
    const kgCo2e = kwhEquivalent * gridFactor.kgCo2ePerKwh;

    return {
      kgCo2e: Math.round(kgCo2e * 1000) / 1000,
      kwhEquivalent: Math.round(kwhEquivalent * 10) / 10,
      factorUsed: gridFactor.kgCo2ePerKwh,
      factorSource: gridFactor.dataSource,
      gridRegionUsed: gridFactor.region,
    };
  }

  if (source === 'solar-owned') {
    // Self-generated solar: zero grid emissions
    // Manufacturing emissions (~40 g CO₂e/kWh over system lifetime) not attributed to consumption
    return {
      kgCo2e: 0,
      kwhEquivalent,
      factorUsed: 0,
      factorSource: 'Solar PV — zero operational emissions (manufacturing excluded per DEFRA guidance)',
      gridRegionUsed: 'N/A',
    };
  }

  // Combustion fuels: natural gas, heating oil, LPG, biomass
  // Source: DEFRA 2023 — Fuels section
  const fuelFactor = getFuelFactor(source);

  if (!fuelFactor) {
    console.warn(
      `[emission-engine] No fuel factor found for source="${source}". ` +
      'Returning 0. Add to data/emission-factors/grid-factors.json.'
    );
    return {
      kgCo2e: 0,
      kwhEquivalent,
      factorUsed: 0,
      factorSource: 'Factor not found — returning 0',
      gridRegionUsed: 'N/A',
    };
  }

  const kgCo2e = kwhEquivalent * fuelFactor.kgCo2ePerKwh;

  return {
    kgCo2e: Math.round(kgCo2e * 1000) / 1000,
    kwhEquivalent: Math.round(kwhEquivalent * 10) / 10,
    factorUsed: fuelFactor.kgCo2ePerKwh,
    factorSource: fuelFactor.dataSource,
    gridRegionUsed: 'N/A',
  };
}

/**
 * Estimate annual home energy emissions from onboarding answers.
 * Used in baseline calculation only.
 *
 * UK average household energy consumption (Ofgem 2023):
 *   Electricity: 2,900 kWh/year (typical home)
 *   Gas: 11,500 kWh/year (typical home with gas central heating)
 *
 * Household size scaling: sqrt(size) approximation (energy doesn't scale linearly)
 * Source: ONS Energy Consumption in the UK 2022
 */
export function estimateAnnualEnergyEmissions(params: {
  householdSize: number;
  heatingType: string;
  hasAirConditioning: boolean;
  gridRegion: string;
}): number {
  const { householdSize, heatingType, hasAirConditioning, gridRegion } = params;

  // Base consumption for a 2-person UK home (Ofgem 2023 typical values)
  const BASE_ELECTRICITY_KWH = 2900;
  const BASE_GAS_KWH = 11500;

  // Scale by household size using square-root model
  const sizeMultiplier = Math.sqrt(Math.max(1, householdSize) / 2);

  // Electricity consumption
  const electricityKwh = BASE_ELECTRICITY_KWH * sizeMultiplier;
  // Add A/C load: ~500 kWh/year in temperate climates (UK), ~1500 kWh in hot climates
  const acExtra = hasAirConditioning ? 800 : 0;

  const electricityResult = calculateEnergyEmission({
    source: 'grid-electricity',
    amount: electricityKwh + acExtra,
    unit: 'kwh',
    gridRegion,
  });

  let heatingKgCo2e = 0;

  // Heating fuel calculation
  switch (heatingType) {
    case 'gas': {
      // Natural gas central heating — DEFRA 2023
      const result = calculateEnergyEmission({
        source: 'natural-gas',
        amount: BASE_GAS_KWH * sizeMultiplier,
        unit: 'kwh',
      });
      heatingKgCo2e = result.kgCo2e;
      break;
    }
    case 'electric': {
      // All-electric heating (resistance or heat pump)
      // Heat pump COP ~3 → uses 1/3 the electricity of direct resistance heating
      const heatPumpFactor = 1 / 3;
      const result = calculateEnergyEmission({
        source: 'grid-electricity',
        amount: BASE_GAS_KWH * sizeMultiplier * heatPumpFactor,
        unit: 'kwh',
        gridRegion,
      });
      heatingKgCo2e = result.kgCo2e;
      break;
    }
    case 'heat-pump': {
      // Dedicated heat pump — same as electric above
      const result = calculateEnergyEmission({
        source: 'grid-electricity',
        amount: BASE_GAS_KWH * sizeMultiplier * (1 / 3),
        unit: 'kwh',
        gridRegion,
      });
      heatingKgCo2e = result.kgCo2e;
      break;
    }
    case 'oil': {
      const result = calculateEnergyEmission({
        source: 'heating-oil',
        amount: BASE_GAS_KWH * sizeMultiplier,
        unit: 'kwh',
      });
      heatingKgCo2e = result.kgCo2e;
      break;
    }
    case 'biomass': {
      const result = calculateEnergyEmission({
        source: 'biomass',
        amount: BASE_GAS_KWH * sizeMultiplier,
        unit: 'kwh',
      });
      heatingKgCo2e = result.kgCo2e;
      break;
    }
    case 'district':
    case 'none':
    default:
      heatingKgCo2e = 0; // Conservative — no direct attribution
  }

  return Math.round(electricityResult.kgCo2e + heatingKgCo2e);
}
