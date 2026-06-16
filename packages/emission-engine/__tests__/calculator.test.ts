/**
 * Emission Engine — Unit Tests
 *
 * Tests use known input/output pairs derived from the source datasets:
 *   - Transport: DEFRA 2023 factors
 *   - Food: Poore & Nemecek 2018
 *   - Energy: IEA 2022 / DEFRA 2023
 *   - Shopping: DEFRA 2023 spend-based
 *   - Baseline: Scarborough et al. 2014 diet estimates
 */

import {
  calculateTransportEmission,
  calculateFoodEmission,
  calculateEnergyEmission,
  calculateShoppingEmission,
  calculateBaseline,
  clearFactorCache,
} from '../src/index';

import type { OnboardingAnswers } from '@earthprint/types';

// Clear cache before each test to ensure fresh factor load
beforeEach(() => clearFactorCache());

// ──────────────────────────────────────────────────────────────────────────────
// TRANSPORT TESTS
// ──────────────────────────────────────────────────────────────────────────────

describe('calculateTransportEmission — Transport', () => {
  test('petrol car: 100 km journey', () => {
    // Factor: 0.1704 kg CO₂e/km (DEFRA 2023 petrol car, avg occupancy)
    // Expected: 100 × 0.1704 = 17.04 kg CO₂e
    const result = calculateTransportEmission({ mode: 'car-petrol', distanceKm: 100 });
    expect(result.kgCo2e).toBeCloseTo(17.04, 1);
    expect(result.factorUsed).toBeCloseTo(0.1704, 3);
  });

  test('electric car: 50 km journey', () => {
    // Factor: 0.0442 kg CO₂e/km (DEFRA 2023 BEV, UK grid)
    // Expected: 50 × 0.0442 = 2.21 kg CO₂e
    const result = calculateTransportEmission({ mode: 'car-electric', distanceKm: 50 });
    expect(result.kgCo2e).toBeCloseTo(2.21, 1);
  });

  test('local bus: 20 km journey', () => {
    // Factor: 0.1029 kg CO₂e/km (DEFRA 2023 local bus)
    // Expected: 20 × 0.1029 = 2.058 kg CO₂e
    const result = calculateTransportEmission({ mode: 'bus', distanceKm: 20 });
    expect(result.kgCo2e).toBeCloseTo(2.058, 1);
  });

  test('train (local): 30 km commute', () => {
    // Factor: 0.0362 kg CO₂e/km (DEFRA 2023 national rail)
    // Expected: 30 × 0.0362 = 1.086 kg CO₂e
    const result = calculateTransportEmission({ mode: 'train-local', distanceKm: 30 });
    expect(result.kgCo2e).toBeCloseTo(1.086, 1);
  });

  test('long-haul flight economy: London to New York (~5,500 km)', () => {
    // Factor: 0.1480 kg CO₂e/km (DEFRA 2023 long-haul economy, includes RFI 1.9)
    // Expected: 5500 × 0.1480 = 814 kg CO₂e
    const result = calculateTransportEmission({
      mode: 'flight-long-haul',
      distanceKm: 5500,
      flightClass: 'economy',
    });
    expect(result.kgCo2e).toBeCloseTo(814, 0);
  });

  test('long-haul flight business class: London to New York (5,500 km)', () => {
    // Factor: 0.4290 kg CO₂e/km (DEFRA 2023 business class, 2.9x economy seat area)
    // Expected: 5500 × 0.4290 = 2,359.5 kg CO₂e
    const result = calculateTransportEmission({
      mode: 'flight-long-haul',
      distanceKm: 5500,
      flightClass: 'business',
    });
    expect(result.kgCo2e).toBeCloseTo(2359.5, 0);
  });

  test('cycling: 10 km — zero emissions', () => {
    const result = calculateTransportEmission({ mode: 'cycling', distanceKm: 10 });
    expect(result.kgCo2e).toBe(0);
  });

  test('carpooling: petrol car 100 km with 4 passengers', () => {
    // Emissions split 4 ways: 100 × 0.1704 / 4 = 4.26 kg CO₂e
    const result = calculateTransportEmission({
      mode: 'car-petrol',
      distanceKm: 100,
      passengers: 4,
    });
    expect(result.kgCo2e).toBeCloseTo(4.26, 1);
  });

  test('zero distance returns zero emissions', () => {
    const result = calculateTransportEmission({ mode: 'car-petrol', distanceKm: 0 });
    expect(result.kgCo2e).toBe(0);
  });

  test('negative distance throws error', () => {
    expect(() =>
      calculateTransportEmission({ mode: 'car-petrol', distanceKm: -5 })
    ).toThrow();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// FOOD TESTS
// ──────────────────────────────────────────────────────────────────────────────

describe('calculateFoodEmission — Food', () => {
  test('beef: 200g serving', () => {
    // Factor: 60.0 kg CO₂e/kg (Poore & Nemecek 2018)
    // Expected: 0.2 × 60.0 = 12.0 kg CO₂e
    const result = calculateFoodEmission({ foodType: 'beef', weightGrams: 200 });
    expect(result.kgCo2e).toBeCloseTo(12.0, 1);
    expect(result.factorUsed).toBe(60.0);
  });

  test('chicken: 150g serving', () => {
    // Factor: 6.9 kg CO₂e/kg (Poore & Nemecek 2018)
    // Expected: 0.15 × 6.9 = 1.035 kg CO₂e
    const result = calculateFoodEmission({ foodType: 'chicken', weightGrams: 150 });
    expect(result.kgCo2e).toBeCloseTo(1.035, 2);
  });

  test('vegetables: 300g serving', () => {
    // Factor: 2.0 kg CO₂e/kg (Poore & Nemecek 2018 — weighted average)
    // Expected: 0.3 × 2.0 = 0.6 kg CO₂e
    const result = calculateFoodEmission({ foodType: 'vegetables', weightGrams: 300 });
    expect(result.kgCo2e).toBeCloseTo(0.6, 1);
  });

  test('legumes: 150g serving', () => {
    // Factor: 0.9 kg CO₂e/kg (Poore & Nemecek 2018)
    // Expected: 0.15 × 0.9 = 0.135 kg CO₂e
    const result = calculateFoodEmission({ foodType: 'legumes', weightGrams: 150 });
    expect(result.kgCo2e).toBeCloseTo(0.135, 2);
  });

  test('organic beef: 200g — 15% reduction vs conventional', () => {
    const conventional = calculateFoodEmission({ foodType: 'beef', weightGrams: 200 });
    const organic = calculateFoodEmission({
      foodType: 'beef',
      weightGrams: 200,
      isOrganic: true,
    });
    // Organic should be ~15% less
    expect(organic.kgCo2e).toBeCloseTo(conventional.kgCo2e * 0.85, 1);
    expect(organic.adjustments.organic).toBe(0.85);
  });

  test('local vegetables: 300g — ~8% reduction vs imported', () => {
    const imported = calculateFoodEmission({ foodType: 'vegetables', weightGrams: 300 });
    const local = calculateFoodEmission({
      foodType: 'vegetables',
      weightGrams: 300,
      isLocal: true,
    });
    expect(local.kgCo2e).toBeCloseTo(imported.kgCo2e * 0.92, 2);
  });

  test('dairy cheese: 100g serving', () => {
    // Factor: 21.0 kg CO₂e/kg (Poore & Nemecek 2018)
    // Expected: 0.1 × 21.0 = 2.1 kg CO₂e
    const result = calculateFoodEmission({ foodType: 'dairy-cheese', weightGrams: 100 });
    expect(result.kgCo2e).toBeCloseTo(2.1, 1);
  });

  test('eggs: 100g (2 medium eggs)', () => {
    // Factor: 4.8 kg CO₂e/kg (Poore & Nemecek 2018)
    // Expected: 0.1 × 4.8 = 0.48 kg CO₂e
    const result = calculateFoodEmission({ foodType: 'eggs', weightGrams: 100 });
    expect(result.kgCo2e).toBeCloseTo(0.48, 2);
  });

  test('wasted food: 30% emissions reduction', () => {
    const eaten = calculateFoodEmission({ foodType: 'beef', weightGrams: 200 });
    const wasted = calculateFoodEmission({
      foodType: 'beef',
      weightGrams: 200,
      wasWasted: true,
    });
    expect(wasted.kgCo2e).toBeCloseTo(eaten.kgCo2e * 0.7, 1);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// ENERGY TESTS
// ──────────────────────────────────────────────────────────────────────────────

describe('calculateEnergyEmission — Energy', () => {
  test('UK grid electricity: 250 kWh (monthly bill)', () => {
    // Factor: 0.2120 kg CO₂e/kWh (IEA 2022, UK)
    // Expected: 250 × 0.2120 = 53.0 kg CO₂e
    const result = calculateEnergyEmission({
      source: 'grid-electricity',
      amount: 250,
      unit: 'kwh',
      gridRegion: 'GB',
    });
    expect(result.kgCo2e).toBeCloseTo(53.0, 0);
    expect(result.gridRegionUsed).toBe('GB');
  });

  test('Indian grid electricity: 250 kWh (coal-heavy grid)', () => {
    // Factor: 0.7080 kg CO₂e/kWh (IEA 2022, India)
    // Expected: 250 × 0.7080 = 177.0 kg CO₂e
    const result = calculateEnergyEmission({
      source: 'grid-electricity',
      amount: 250,
      unit: 'kwh',
      gridRegion: 'IN',
    });
    expect(result.kgCo2e).toBeCloseTo(177.0, 0);
  });

  test('natural gas heating: 100 m³', () => {
    // 100 m³ × 10.55 kWh/m³ = 1,055 kWh
    // Factor: 0.2026 kg CO₂e/kWh (DEFRA 2023)
    // Expected: 1055 × 0.2026 ≈ 213.7 kg CO₂e
    const result = calculateEnergyEmission({
      source: 'natural-gas',
      amount: 100,
      unit: 'm3',
    });
    expect(result.kgCo2e).toBeCloseTo(213.7, 0);
    expect(result.kwhEquivalent).toBeCloseTo(1055, 0);
  });

  test('heating oil: 50 litres', () => {
    // 50 litres × 10.35 kWh/litre = 517.5 kWh
    // Factor: 0.2968 kg CO₂e/kWh (DEFRA 2023)
    // Expected: 517.5 × 0.2968 ≈ 153.6 kg CO₂e
    const result = calculateEnergyEmission({
      source: 'heating-oil',
      amount: 50,
      unit: 'litre',
    });
    expect(result.kgCo2e).toBeCloseTo(153.6, 0);
  });

  test('unknown region falls back to global average (0.49 kg CO₂e/kWh)', () => {
    const result = calculateEnergyEmission({
      source: 'grid-electricity',
      amount: 100,
      unit: 'kwh',
      gridRegion: 'XX', // Non-existent region
    });
    // Should use GLOBAL fallback: 100 × 0.49 = 49 kg CO₂e
    expect(result.kgCo2e).toBeCloseTo(49.0, 0);
    expect(result.gridRegionUsed).toBe('GLOBAL');
  });

  test('solar energy: zero emissions', () => {
    const result = calculateEnergyEmission({
      source: 'solar-owned',
      amount: 500,
      unit: 'kwh',
    });
    expect(result.kgCo2e).toBe(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// SHOPPING TESTS
// ──────────────────────────────────────────────────────────────────────────────

describe('calculateShoppingEmission — Shopping', () => {
  test('fast fashion clothing: £100 spend', () => {
    // Factor: 0.50 kg CO₂e/GBP (DEFRA 2023)
    // Expected: 100 × 0.50 = 50.0 kg CO₂e
    const result = calculateShoppingEmission({
      category: 'clothing-fast-fashion',
      spendAmount: 100,
      spendCurrency: 'GBP',
      isSecondHand: false,
    });
    expect(result.kgCo2e).toBeCloseTo(50.0, 1);
  });

  test('second-hand clothing: £50 spend — drastically reduced emissions', () => {
    // Factor: 0.50 × 0.05 (secondHandMultiplier) = 0.025 kg CO₂e/GBP
    // Expected: 50 × 0.025 = 1.25 kg CO₂e
    const result = calculateShoppingEmission({
      category: 'clothing-fast-fashion',
      spendAmount: 50,
      spendCurrency: 'GBP',
      isSecondHand: true,
    });
    expect(result.kgCo2e).toBeCloseTo(1.25, 1);
    expect(result.secondHandApplied).toBe(true);
  });

  test('electronics: £500 laptop (new)', () => {
    // Factor: 0.42 kg CO₂e/GBP (DEFRA 2023)
    // Expected: 500 × 0.42 = 210.0 kg CO₂e
    const result = calculateShoppingEmission({
      category: 'electronics-large',
      spendAmount: 500,
      spendCurrency: 'GBP',
      isSecondHand: false,
    });
    expect(result.kgCo2e).toBeCloseTo(210.0, 0);
  });

  test('USD currency conversion: $125 clothing (approx £100 GBP at PPP rate)', () => {
    // USD PPP rate: 0.80, so $125 ≈ £100 GBP
    // Expected similar to £100 GBP clothing
    const result = calculateShoppingEmission({
      category: 'clothing-fast-fashion',
      spendAmount: 125,
      spendCurrency: 'USD',
      isSecondHand: false,
    });
    // £100 × 0.50 = 50 kg CO₂e (approximate due to PPP conversion)
    expect(result.kgCo2e).toBeCloseTo(50.0, 1);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// BASELINE INTEGRATION TEST
// ──────────────────────────────────────────────────────────────────────────────

describe('calculateBaseline — Integration', () => {
  const highEmissionProfile: OnboardingAnswers = {
    location: { country: 'US', countryName: 'United States', city: 'New York', gridRegion: 'US-MIDA-PJM' },
    household: { size: 2, dwellingType: 'detached', heatingType: 'gas', hasAirConditioning: true, homeOwnership: 'owned' },
    transport: {
      hasCarOrVan: true,
      vehicleFuelType: 'petrol',
      carUsageFrequency: 'daily',
      weeklyCarKm: 300,
      usesPublicTransport: false,
      weeklyPublicTransportKm: 0,
      flightsPerYear: 6,
      longHaulFlightsPerYear: 2,
      flightClass: 'business',
    },
    diet: { dietType: 'omnivore', organicPercent: 0, localFoodPercent: 0, foodWasteLevel: 'high', mealsOutPerWeek: 7 },
    shopping: { newClothingItemsPerMonth: 8, fastFashionFrequency: 'always', newElectronicsPerYear: 4, deliveryOrdersPerWeek: 7, budgetLevel: 'high', buySecondHand: 'never' },
    completedAt: new Date().toISOString(),
  };

  const lowEmissionProfile: OnboardingAnswers = {
    location: { country: 'FR', countryName: 'France', city: 'Paris', gridRegion: 'FR' },
    household: { size: 2, dwellingType: 'apartment', heatingType: 'electric', hasAirConditioning: false, homeOwnership: 'rented' },
    transport: {
      hasCarOrVan: false,
      vehicleFuelType: 'none',
      carUsageFrequency: 'never',
      weeklyCarKm: 0,
      usesPublicTransport: true,
      weeklyPublicTransportKm: 50,
      flightsPerYear: 0,
      longHaulFlightsPerYear: 0,
      flightClass: 'economy',
    },
    diet: { dietType: 'vegan', organicPercent: 80, localFoodPercent: 60, foodWasteLevel: 'low', mealsOutPerWeek: 2 },
    shopping: { newClothingItemsPerMonth: 1, fastFashionFrequency: 'rarely', newElectronicsPerYear: 0, deliveryOrdersPerWeek: 1, budgetLevel: 'low', buySecondHand: 'often' },
    completedAt: new Date().toISOString(),
  };

  test('high-emission profile produces significantly more CO₂ than global average', () => {
    const result = calculateBaseline(highEmissionProfile);
    // US high-income household: expect well above 14,000 kg CO₂e/year
    expect(result.annualKgCo2e).toBeGreaterThan(14000);
    expect(result.comparedToAverage).toBeGreaterThan(0); // Above US average
    expect(result.byCategory.travel).toBeGreaterThan(5000);
  });

  test('low-emission profile produces significantly less CO₂ than global average', () => {
    const result = calculateBaseline(lowEmissionProfile);
    // Paris vegan, no car, no flights: expect below 4,000 kg CO₂e/year
    expect(result.annualKgCo2e).toBeLessThan(4000);
    expect(result.byCategory.travel).toBeLessThan(500);
  });

  test('baseline result has correct structure', () => {
    const result = calculateBaseline(highEmissionProfile);
    expect(result).toHaveProperty('annualKgCo2e');
    expect(result).toHaveProperty('monthlyKgCo2e');
    expect(result).toHaveProperty('byCategory');
    expect(result).toHaveProperty('monthlyTarget');
    expect(result.byCategory.total).toBe(result.annualKgCo2e);
    // Monthly target should be 10% less than monthly average
    const expectedTarget = result.monthlyKgCo2e * 0.9;
    expect(result.monthlyTarget).toBeCloseTo(expectedTarget, 0);
  });

  test('monthly target is 10% below monthly baseline', () => {
    const result = calculateBaseline(lowEmissionProfile);
    const expectedTarget = result.monthlyKgCo2e * 0.9;
    expect(result.monthlyTarget).toBeCloseTo(expectedTarget, 0);
  });
});
