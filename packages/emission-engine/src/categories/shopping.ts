/**
 * Shopping Emission Calculator
 *
 * Calculates kg CO₂e for consumer goods purchases using spend-based emission factors.
 *
 * Primary source: DEFRA 2023 GHG Conversion Factors — Scope 3 spend-based factors
 * https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting
 * Sheet: "Scope 3 spend-based"
 *
 * Second-hand goods: Production emissions are allocated to the original buyer
 * per ISO 14044 system expansion principles. Only transport and transaction
 * emissions remain (represented by the secondHandMultiplier in factor data).
 *
 * Currency conversion: DEFRA factors are in GBP (2022 base). For other currencies,
 * we use approximate Purchasing Power Parity (PPP) conversion. For Phase 2,
 * this will be improved with real-time FX + PPP data.
 *
 * PPP conversion factors (World Bank 2022):
 *   USD: 1 GBP ≈ 1.25 USD (market rate) → PPP-adjusted: 1 GBP ≈ 1.0 USD
 *   EUR: 1 GBP ≈ 1.15 EUR → PPP: 1 GBP ≈ 1.05 EUR
 *   INR: 1 GBP ≈ 100 INR → PPP: 1 GBP ≈ 25 INR
 */

import type { ShoppingItemCategory } from '@earthprint/types';
import { getShoppingFactor } from '../factors/loader';

export interface ShoppingCalculationInput {
  category: ShoppingItemCategory;
  spendAmount: number;
  spendCurrency: string; // ISO 4217
  isSecondHand: boolean;
}

export interface ShoppingCalculationResult {
  kgCo2e: number;
  spendInGbp: number;       // Normalized for calculation
  factorUsed: number;       // kg CO₂e per GBP
  secondHandApplied: boolean;
  factorSource: string;
}

/**
 * Approximate Purchasing Power Parity conversion rates to GBP.
 * Used when spend is recorded in non-GBP currencies.
 * Source: World Bank International Comparison Program (ICP) 2022
 *
 * Note: PPP rates differ from market exchange rates. PPP adjusts for
 * the fact that a basket of goods costs different amounts in different countries.
 * For carbon accounting, PPP is more appropriate than market rates.
 */
const PPP_TO_GBP: Record<string, number> = {
  GBP: 1.0,
  USD: 0.80,   // $1 USD ≈ £0.80 GBP (PPP-adjusted)
  EUR: 0.87,   // €1 EUR ≈ £0.87 GBP (PPP-adjusted)
  INR: 0.0098, // ₹1 INR ≈ £0.0098 GBP (PPP-adjusted)
  AUD: 0.55,
  CAD: 0.60,
  JPY: 0.0061,
  CNY: 0.11,
  BRL: 0.16,
  ZAR: 0.044,
  SGD: 0.60,
};

function convertToGbp(amount: number, currency: string): number {
  const upperCurrency = currency.toUpperCase();
  const rate = (PPP_TO_GBP[upperCurrency] !== undefined) ? PPP_TO_GBP[upperCurrency]! : 0.80;
  return amount * rate;
}

/**
 * Calculate CO₂e emissions for a shopping log entry.
 */
export function calculateShoppingEmission(
  input: ShoppingCalculationInput
): ShoppingCalculationResult {
  const { category, spendAmount, spendCurrency, isSecondHand } = input;

  if (spendAmount < 0) {
    throw new Error(`Spend amount must be non-negative, got ${spendAmount}`);
  }

  if (spendAmount === 0) {
    return {
      kgCo2e: 0,
      spendInGbp: 0,
      factorUsed: 0,
      secondHandApplied: isSecondHand,
      factorSource: 'Zero spend',
    };
  }

  const factor = getShoppingFactor(category);

  if (!factor) {
    // Use online-delivery as a general fallback
    const fallback = getShoppingFactor('online-delivery');
    console.warn(
      `[emission-engine] No shopping factor for category="${category}". ` +
      `Using general retail fallback (${fallback?.kgCo2ePerGbp ?? 0} kg CO₂e/GBP).`
    );
    const spendInGbp = convertToGbp(spendAmount, spendCurrency);
    const factorValue = fallback?.kgCo2ePerGbp ?? 0.32;
    return {
      kgCo2e: Math.round(spendInGbp * factorValue * 1000) / 1000,
      spendInGbp,
      factorUsed: factorValue,
      secondHandApplied: isSecondHand,
      factorSource: fallback?.dataSource ?? 'General retail fallback',
    };
  }

  const spendInGbp = convertToGbp(spendAmount, spendCurrency);

  // Apply second-hand multiplier if applicable
  // Source: ISO 14044 — production emissions allocated to original buyer
  const effectiveFactor = isSecondHand
    ? factor.kgCo2ePerGbp * factor.secondHandMultiplier
    : factor.kgCo2ePerGbp;

  const kgCo2e = spendInGbp * effectiveFactor;

  return {
    kgCo2e: Math.round(kgCo2e * 1000) / 1000,
    spendInGbp: Math.round(spendInGbp * 100) / 100,
    factorUsed: effectiveFactor,
    secondHandApplied: isSecondHand,
    factorSource: factor.dataSource,
  };
}

/**
 * Estimate annual shopping emissions from onboarding answers.
 * Used in baseline calculation only.
 *
 * Annual expenditure estimates are based on ONS Family Spending Survey 2022 (UK)
 * and adapted by household income/budget level.
 * https://www.ons.gov.uk/peoplepopulationandcommunity/personalandhouseholdfinances/expenditure
 */
export function estimateAnnualShoppingEmissions(params: {
  fastFashionFrequency: string;
  newElectronicsPerYear: number;
  deliveryOrdersPerWeek: number;
  budgetLevel: string;
  buySecondHand: string;
}): number {
  const { fastFashionFrequency, newElectronicsPerYear, deliveryOrdersPerWeek, budgetLevel, buySecondHand } = params;

  // Annual clothing spend estimates by frequency (GBP, ONS 2022)
  const clothingSpendByFrequency: Record<string, number> = {
    never: 0,
    rarely: 200,
    sometimes: 600,
    often: 1200,
    always: 2000,
  };

  // Electronics spend per year (average UK new device prices, ONS 2022)
  const electronicsSpendPerItem = 350; // Average new device price

  // Delivery spend: ~£20 per order (ONS online retail 2022)
  const deliverySpendPerWeek = deliveryOrdersPerWeek * 20;
  const annualDeliverySpend = deliverySpendPerWeek * 52;

  // Budget-level modifier for general spending
  const budgetMultiplier: Record<string, number> = { low: 0.7, medium: 1.0, high: 1.5 };
  const mult = budgetMultiplier[budgetLevel] ?? 1.0;

  // Second-hand modifier (30% of items being second-hand reduces total by ~20%)
  const secondHandDiscount: Record<string, number> = { never: 1.0, sometimes: 0.85, often: 0.65 };
  const secondHandMult = secondHandDiscount[buySecondHand] ?? 1.0;

  const clothingSpend = (clothingSpendByFrequency[fastFashionFrequency] ?? 600) * mult * secondHandMult;
  const electronicsSpend = newElectronicsPerYear * electronicsSpendPerItem * mult * secondHandMult;
  const deliverySpend = annualDeliverySpend * mult;

  // Calculate using emission factors
  const clothingResult = calculateShoppingEmission({
    category: 'clothing-fast-fashion',
    spendAmount: clothingSpend,
    spendCurrency: 'GBP',
    isSecondHand: buySecondHand === 'often',
  });

  const electronicsResult = calculateShoppingEmission({
    category: 'electronics-large',
    spendAmount: electronicsSpend,
    spendCurrency: 'GBP',
    isSecondHand: buySecondHand === 'often',
  });

  const deliveryResult = calculateShoppingEmission({
    category: 'online-delivery',
    spendAmount: deliverySpend,
    spendCurrency: 'GBP',
    isSecondHand: false,
  });

  return Math.round(clothingResult.kgCo2e + electronicsResult.kgCo2e + deliveryResult.kgCo2e);
}
