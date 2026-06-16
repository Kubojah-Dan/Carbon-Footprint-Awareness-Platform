// Emission Factor Types
// All emission factors cite their source dataset. See data/emission-factors/ for raw data.

/**
 * Transport emission factor — kg CO₂e per passenger-km
 * Source: DEFRA 2023 GHG Conversion Factors for Company Reporting
 * https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting
 */
export interface TransportEmissionFactor {
  mode: string;
  subMode?: string;
  kgCo2ePerPassengerKm: number;
  flightClass?: string;
  radiativeForcingMultiplier?: number; // Applied to flight emissions; default 1.9 per IPCC
  dataSource: string;
  dataYear: number;
  notes?: string;
}

/**
 * Food emission factor — kg CO₂e per kg of food
 * Source: Poore & Nemecek 2018 (Oxford University)
 * https://ora.ox.ac.uk/objects/uuid:b0b53649-5e93-4415-bf07-6b0b1227172f
 */
export interface FoodEmissionFactor {
  foodType: string;
  kgCo2ePerKg: number;
  includesLandUse: boolean; // Oxford data includes LUC; EPA data may not
  dataSource: string;
  dataYear: number;
  notes?: string;
}

/**
 * Electricity grid emission factor — kg CO₂e per kWh
 * Source: IEA World Energy Statistics 2022 + Electricity Maps API
 * https://www.iea.org/data-and-statistics
 */
export interface GridEmissionFactor {
  region: string;       // Country code or grid region (e.g. "GB", "US-CAL-CISO")
  countryName: string;
  kgCo2ePerKwh: number;
  dataSource: string;
  dataYear: number;
  isRealTime?: boolean; // True if fetched live from Electricity Maps API
}

/**
 * Combustion fuel emission factor — kg CO₂e per kWh energy equivalent
 * Source: DEFRA 2023 + IPCC AR6 combustion factors
 */
export interface FuelEmissionFactor {
  fuelType: string;      // 'natural-gas', 'heating-oil', 'lpg', etc.
  kgCo2ePerKwh: number;  // Energy-equivalent basis for comparison
  kgCo2ePerUnit?: number;
  unit?: string;         // The non-kWh unit (e.g. 'litre', 'therm', 'm3')
  dataSource: string;
  dataYear: number;
}

/**
 * Spend-based shopping emission factor — kg CO₂e per £1 GBP spent
 * Source: DEFRA 2023 GHG Conversion Factors — Scope 3 spend-based factors
 * https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting
 */
export interface ShoppingEmissionFactor {
  category: string;
  kgCo2ePerGbp: number;
  secondHandMultiplier: number; // 0 = no production emissions; typically 0.1–0.2 for transport
  dataSource: string;
  dataYear: number;
  notes?: string;
}

/** All emission factor tables combined */
export interface EmissionFactorTables {
  transport: TransportEmissionFactor[];
  food: FoodEmissionFactor[];
  grid: GridEmissionFactor[];
  fuel: FuelEmissionFactor[];
  shopping: ShoppingEmissionFactor[];
  loadedAt: string; // ISO datetime — for cache invalidation
}

/** Per-category breakdown of baseline emissions */
export interface CategoryBreakdown {
  travel: number;  // kg CO₂e per year
  food: number;
  energy: number;
  shopping: number;
  total: number;
}

/** Result of the onboarding baseline calculation */
export interface BaselineResult {
  annualKgCo2e: number;
  monthlyKgCo2e: number;
  byCategory: CategoryBreakdown;
  monthlyTarget: number;      // 10% reduction from monthly average
  comparedToAverage: number;  // Percentage above/below country average
  countryAverageKgCo2e: number;
  globalAverageKgCo2e: number; // ~4,800 kg CO₂e (Our World in Data 2022)
  calculatedAt: string;
  methodology: string;
}

/** AI recommendation from Vertex AI / Gemini */
export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'travel' | 'food' | 'energy' | 'shopping' | 'systemic';
  monthlyCo2Saving: number;     // Estimated kg CO₂e saved per month
  effortLevel: 'low' | 'medium' | 'high';
  costImpact: 'saves-money' | 'cost-neutral' | 'small-cost' | 'significant-cost';
  reasoning: string;            // Why this was recommended for this user
  actionUrl?: string;
  generatedAt: string;
  userFeedback?: 'helpful' | 'not-relevant' | null;
}
