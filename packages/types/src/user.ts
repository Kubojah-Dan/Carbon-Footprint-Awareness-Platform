// User & Profile Types
// Used across web + mobile + emission-engine

/** Supported diet types for emission calculations */
export type DietType = 'omnivore' | 'pescatarian' | 'vegetarian' | 'vegan';

/** Heating fuel types for home energy calculations */
export type HeatingType = 'gas' | 'electric' | 'oil' | 'heat-pump' | 'district' | 'biomass' | 'none';

/** Dwelling type affects heating/cooling emission estimates */
export type DwellingType = 'detached' | 'semi-detached' | 'terraced' | 'flat' | 'apartment';

/** Vehicle fuel types for transport calculations */
export type VehicleFuelType = 'petrol' | 'diesel' | 'hybrid' | 'phev' | 'electric' | 'none';

/** How often the user drives */
export type CarUsageFrequency = 'daily' | 'several-times-week' | 'occasionally' | 'rarely' | 'never';

/** User budget level — used to filter AI recommendations */
export type BudgetLevel = 'low' | 'medium' | 'high';

/** Onboarding Step 1: Location */
export interface LocationData {
  country: string;       // ISO 3166-1 alpha-2 (e.g. "GB", "US", "IN")
  countryName: string;
  city: string;
  gridRegion?: string;   // Grid region code for Electricity Maps (e.g. "GB", "US-CAL-CISO")
}

/** Onboarding Step 2: Household */
export interface HouseholdData {
  size: number;           // Number of people in household
  dwellingType: DwellingType;
  heatingType: HeatingType;
  hasAirConditioning: boolean;
  homeOwnership: 'owned' | 'rented';
}

/** Onboarding Step 3: Transport */
export interface TransportData {
  hasCarOrVan: boolean;
  vehicleFuelType: VehicleFuelType;
  carUsageFrequency: CarUsageFrequency;
  weeklyCarKm: number;
  usesPublicTransport: boolean;
  weeklyPublicTransportKm: number;
  flightsPerYear: number;           // Short-haul (<3h)
  longHaulFlightsPerYear: number;   // Long-haul (>3h)
  flightClass: 'economy' | 'business' | 'first';
}

/** Onboarding Step 4: Diet */
export interface DietData {
  dietType: DietType;
  organicPercent: number;   // 0–100
  localFoodPercent: number; // 0–100
  foodWasteLevel: 'low' | 'average' | 'high';
  mealsOutPerWeek: number;
}

/** Onboarding Step 5: Shopping */
export interface ShoppingData {
  newClothingItemsPerMonth: number;
  fastFashionFrequency: 'never' | 'rarely' | 'sometimes' | 'often' | 'always';
  newElectronicsPerYear: number;
  deliveryOrdersPerWeek: number;
  budgetLevel: BudgetLevel;
  buySecondHand: 'never' | 'sometimes' | 'often';
}

/** Complete onboarding answers — all 5 steps */
export interface OnboardingAnswers {
  location: LocationData;
  household: HouseholdData;
  transport: TransportData;
  diet: DietData;
  shopping: ShoppingData;
  completedAt: string; // ISO date string
}

/** Core user profile stored in Firestore: users/{uid} */
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  updatedAt: string;

  // Onboarding
  onboardingCompleted: boolean;
  onboardingAnswers?: OnboardingAnswers;
  baselineKgCo2ePerYear?: number;
  monthlyTargetKgCo2e?: number;  // 10% less than monthly baseline

  // Gamification
  points: number;
  streakDays: number;
  lastLogDate?: string; // ISO date — used for streak calculation
  graceUsedThisWeek: boolean;
  terraScore: number; // 0-100 heartbeat metric
  activeBiome?: 'temperate-forest' | 'coral-reef' | 'alpine-meadow';
  earnedBadgeIds?: string[];

  // Settings
  preferredUnits: 'metric' | 'imperial';
  preferredCurrency?: string;
  notificationsEnabled: boolean;
  fcmToken?: string;
  locale: string; // e.g. "en", "fr", "es"

  // Organization (Phase 4)
  orgId?: string;

  // Public profile
  username?: string;
  bio?: string;
  isPublicProfile: boolean;
  city?: string;
  country?: string;
}
