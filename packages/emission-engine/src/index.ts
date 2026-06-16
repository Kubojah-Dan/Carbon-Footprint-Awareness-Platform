/**
 * @earthprint/emission-engine
 *
 * Core CO₂e calculation library shared between web and mobile apps.
 *
 * All emission factors cite their source dataset.
 * All calculations use IPCC AR6 100-year GWP basis.
 * Unit: kg CO₂e throughout.
 */

// Baseline (onboarding)
export { calculateBaseline } from './baseline';

// Individual calculators
export {
  calculateTransportEmission,
  classifyFlightByDistance,
  estimateAnnualTransportEmissions,
} from './categories/transport';

export type {
  TransportCalculationInput,
  TransportCalculationResult,
} from './categories/transport';

export {
  calculateFoodEmission,
  estimateAnnualFoodEmissions,
} from './categories/food';

export type {
  FoodCalculationInput,
  FoodCalculationResult,
} from './categories/food';

export {
  calculateEnergyEmission,
  estimateAnnualEnergyEmissions,
} from './categories/energy';

export type {
  EnergyCalculationInput,
  EnergyCalculationResult,
} from './categories/energy';

export {
  calculateShoppingEmission,
  estimateAnnualShoppingEmissions,
} from './categories/shopping';

export type {
  ShoppingCalculationInput,
  ShoppingCalculationResult,
} from './categories/shopping';

// Factor loading utilities
export {
  loadEmissionFactors,
  clearFactorCache,
  getTransportFactor,
  getFoodFactor,
  getGridFactor,
  getFuelFactor,
  getShoppingFactor,
} from './factors/loader';

// Gamification
export {
  calculateBloomPoints,
  calculateTerraScore,
  evaluateBadges,
  STARTER_BADGES,
} from './gamification/bloom-points';
