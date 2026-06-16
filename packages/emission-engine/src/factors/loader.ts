/**
 * Emission Factor Loader (Isomorphic)
 *
 * Loads and caches emission factor tables.
 * Statically imports factor JSON files to be browser-compatible (no 'fs' or 'path' runtime dependencies).
 */

import type {
  TransportEmissionFactor,
  FoodEmissionFactor,
  GridEmissionFactor,
  FuelEmissionFactor,
  ShoppingEmissionFactor,
  EmissionFactorTables,
} from '@earthprint/types';

// Statically import the JSON factors from the data workspace
import transportData from '../../../../data/emission-factors/transport-factors.json';
import foodData from '../../../../data/emission-factors/food-factors.json';
import gridData from '../../../../data/emission-factors/grid-factors.json';
import shoppingData from '../../../../data/emission-factors/shopping-factors.json';

// In-memory cache
let cachedTables: EmissionFactorTables | null = null;

/**
 * Load all emission factor tables.
 * Returns cached tables if already loaded.
 */
export function loadEmissionFactors(): EmissionFactorTables {
  if (cachedTables) return cachedTables;

  cachedTables = {
    transport: transportData.factors as TransportEmissionFactor[],
    food: foodData.factors as FoodEmissionFactor[],
    grid: gridData.factors as GridEmissionFactor[],
    fuel: gridData.fuelFactors as FuelEmissionFactor[],
    shopping: shoppingData.factors as ShoppingEmissionFactor[],
    loadedAt: new Date().toISOString(),
  };

  return cachedTables;
}

/** Clear the cache (useful in tests) */
export function clearFactorCache(): void {
  cachedTables = null;
}

/** Look up a transport factor by mode and optional flight class */
export function getTransportFactor(
  mode: string,
  flightClass?: string
): TransportEmissionFactor | undefined {
  const tables = loadEmissionFactors();
  return tables.transport.find(
    (f) =>
      f.mode === mode &&
      (flightClass === undefined || f.flightClass === flightClass || f.flightClass === undefined)
  );
}

/** Look up a food emission factor by food type */
export function getFoodFactor(foodType: string): FoodEmissionFactor | undefined {
  const tables = loadEmissionFactors();
  return tables.food.find((f) => f.foodType === foodType);
}

/**
 * Look up a grid emission factor by country/region code.
 * Falls back to the global average (0.49 kg CO₂e/kWh) if not found.
 */
export function getGridFactor(region: string): GridEmissionFactor {
  const tables = loadEmissionFactors();
  const factor = tables.grid.find((f) => f.region === region);
  if (factor) return factor;

  // Fallback: global average
  const globalFallback = tables.grid.find((f) => f.region === 'GLOBAL');
  if (globalFallback) return globalFallback;

  // Hard-coded fallback if data file missing
  return {
    region: 'GLOBAL',
    countryName: 'Global average (fallback)',
    kgCo2ePerKwh: 0.49,
    dataSource: 'IEA World Energy Outlook 2022 — hard-coded fallback',
    dataYear: 2022,
  };
}

/** Look up a fuel emission factor by fuel type */
export function getFuelFactor(fuelType: string): FuelEmissionFactor | undefined {
  const tables = loadEmissionFactors();
  return tables.fuel.find((f) => f.fuelType === fuelType);
}

/** Look up a shopping emission factor by category */
export function getShoppingFactor(category: string): ShoppingEmissionFactor | undefined {
  const tables = loadEmissionFactors();
  return tables.shopping.find((f) => f.category === category);
}
