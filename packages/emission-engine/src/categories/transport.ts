/**
 * Transport Emission Calculator
 *
 * Calculates kg CO₂e for a given transport journey.
 *
 * Primary source: DEFRA 2023 GHG Conversion Factors for Company Reporting
 * https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting
 *
 * Flight uplift: Radiative Forcing Index (RFI) multiplier of 1.9 is already
 * embedded in the DEFRA flight factors and in our transport-factors.json.
 * This accounts for non-CO2 warming effects at high altitude (ozone depletion,
 * contrail formation, cirrus cloud formation).
 * Reference: Lee et al. 2021, "The contribution of global aviation to anthropogenic
 * climate forcing for 2000 to 2018", Atmospheric Environment.
 */

import type { TransportMode, FlightClass } from '@earthprint/types';
import { getTransportFactor } from '../factors/loader';

export interface TransportCalculationInput {
  mode: TransportMode;
  distanceKm: number;
  flightClass?: FlightClass;
  /** Number of passengers sharing a private vehicle (for carpooling) */
  passengers?: number;
}

export interface TransportCalculationResult {
  kgCo2e: number;
  factorUsed: number;     // kg CO₂e per passenger-km
  factorSource: string;
  notes?: string;
}

/**
 * Calculate CO₂e emissions for a transport journey.
 *
 * @param input - Journey parameters
 * @returns Emission result with the factor used and its source
 * @throws Error if distanceKm is negative
 */
export function calculateTransportEmission(
  input: TransportCalculationInput
): TransportCalculationResult {
  const { mode, distanceKm, flightClass = 'economy', passengers = 1 } = input;

  if (distanceKm < 0) {
    throw new Error(`Distance must be non-negative, got ${distanceKm}`);
  }

  if (distanceKm === 0) {
    return { kgCo2e: 0, factorUsed: 0, factorSource: 'Zero distance' };
  }

  // Determine if this is a flight mode for class-aware lookup
  const isFlightMode = mode.startsWith('flight-');

  // Look up the emission factor
  const factor = getTransportFactor(mode, isFlightMode ? flightClass : undefined);

  if (!factor) {
    // Fallback: warn and return 0 rather than crash
    console.warn(
      `[emission-engine] No transport factor found for mode="${mode}", class="${flightClass}". ` +
      'Returning 0. Add this mode to data/emission-factors/transport-factors.json.'
    );
    return {
      kgCo2e: 0,
      factorUsed: 0,
      factorSource: 'Factor not found — returning 0',
    };
  }

  const effectivePassengers = Math.max(1, Math.round(passengers));
  // For private vehicles, split emissions across passengers
  const passengerMultiplier = isPrivateVehicle(mode) ? 1 / effectivePassengers : 1;

  const kgCo2e = factor.kgCo2ePerPassengerKm * distanceKm * passengerMultiplier;

  const result: TransportCalculationResult = {
    kgCo2e: Math.round(kgCo2e * 1000) / 1000, // Round to 3 decimal places
    factorUsed: factor.kgCo2ePerPassengerKm,
    factorSource: factor.dataSource,
  };

  if (factor.notes) {
    result.notes = factor.notes;
  }

  return result;
}

/** Returns true for vehicle modes where passengers share the total emission */
function isPrivateVehicle(mode: TransportMode): boolean {
  return (
    mode === 'car-petrol' ||
    mode === 'car-diesel' ||
    mode === 'car-hybrid' ||
    mode === 'car-phev' ||
    mode === 'car-electric' ||
    mode === 'motorcycle'
  );
}

/**
 * Estimate a round-trip flight distance in km between two airport city names.
 * This is a very rough estimate used when no route data is available.
 * For accurate distances, use the Google Maps Routes API (Phase 2).
 *
 * Flight categories per DEFRA methodology:
 * - Domestic: < 500 km
 * - Short-haul: 500–3700 km
 * - Long-haul: > 3700 km
 */
export function classifyFlightByDistance(distanceKm: number): TransportMode {
  if (distanceKm < 500) return 'flight-domestic';
  if (distanceKm <= 3700) return 'flight-short-haul';
  return 'flight-long-haul';
}

/**
 * Estimate annual transport emissions from onboarding answers.
 * Used in baseline calculation — not for individual log entries.
 *
 * Source: DEFRA 2023 transport factors
 */
export function estimateAnnualTransportEmissions(params: {
  weeklyCarKm: number;
  vehicleFuelType: string;
  weeklyPublicTransportKm: number;
  flightsPerYear: number;          // Short-haul (<3h, ~1500 km avg)
  longHaulFlightsPerYear: number;  // Long-haul (>3h, ~8000 km avg)
  flightClass: FlightClass;
}): number {
  const {
    weeklyCarKm,
    vehicleFuelType,
    weeklyPublicTransportKm,
    flightsPerYear,
    longHaulFlightsPerYear,
    flightClass,
  } = params;

  const weeksPerYear = 52;

  // Car emissions
  const carMode = vehicleFuelTypeToMode(vehicleFuelType);
  const carResult = calculateTransportEmission({
    mode: carMode,
    distanceKm: weeklyCarKm * weeksPerYear,
  });

  // Public transport (use train-local as a proxy — lowest available factor)
  // Source: DEFRA 2023 — mix of bus (0.1029) and rail (0.0362)
  const ptResult = calculateTransportEmission({
    mode: 'train-local',
    distanceKm: weeklyPublicTransportKm * weeksPerYear,
  });

  // Short-haul flights — DEFRA average short-haul distance: ~1,500 km one-way
  const shortHaulKm = 1500;
  const shortHaulResult = calculateTransportEmission({
    mode: 'flight-short-haul',
    distanceKm: shortHaulKm * flightsPerYear,
    flightClass,
  });

  // Long-haul flights — DEFRA average long-haul distance: ~8,000 km one-way
  const longHaulKm = 8000;
  const longHaulResult = calculateTransportEmission({
    mode: 'flight-long-haul',
    distanceKm: longHaulKm * longHaulFlightsPerYear,
    flightClass,
  });

  return carResult.kgCo2e + ptResult.kgCo2e + shortHaulResult.kgCo2e + longHaulResult.kgCo2e;
}

function vehicleFuelTypeToMode(fuelType: string): TransportMode {
  switch (fuelType) {
    case 'petrol': return 'car-petrol';
    case 'diesel': return 'car-diesel';
    case 'hybrid': return 'car-hybrid';
    case 'phev': return 'car-phev';
    case 'electric': return 'car-electric';
    default: return 'car-petrol'; // Conservative default
  }
}
