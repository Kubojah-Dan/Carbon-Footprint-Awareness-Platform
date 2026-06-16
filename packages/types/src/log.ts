// Emission Log Entry Types
// Stored in Firestore: users/{uid}/logs/{date}/{entryId}

/** The four emission categories tracked by EarthPrint */
export type EmissionCategory = 'travel' | 'food' | 'energy' | 'shopping';

/** Transport modes used in travel log entries */
export type TransportMode =
  | 'car-petrol'
  | 'car-diesel'
  | 'car-electric'
  | 'car-hybrid'
  | 'car-phev'
  | 'motorcycle'
  | 'bus'
  | 'coach'
  | 'train-local'
  | 'train-intercity'
  | 'tram'
  | 'subway'
  | 'ferry'
  | 'flight-domestic'
  | 'flight-short-haul'
  | 'flight-long-haul'
  | 'cycling'
  | 'e-bike'
  | 'walking';

/** Flight cabin class — affects emission factor via RFI-adjusted multipliers */
export type FlightClass = 'economy' | 'premium-economy' | 'business' | 'first';

/** Travel/Transport log entry fields */
export interface TravelLogData {
  mode: TransportMode;
  distanceKm: number;
  origin?: string;      // Optional free text or Google Maps place
  destination?: string;
  flightClass?: FlightClass;
  passengers?: number;  // For carpooling (emissions split)
  routeId?: string;     // Google Maps route ID (Phase 2)
}

/** Food types mapped to emission factors */
export type FoodType =
  | 'beef'
  | 'lamb'
  | 'pork'
  | 'chicken'
  | 'fish-farmed'
  | 'fish-wild'
  | 'seafood'
  | 'eggs'
  | 'dairy-milk'
  | 'dairy-cheese'
  | 'dairy-butter'
  | 'legumes'
  | 'tofu'
  | 'vegetables'
  | 'fruits'
  | 'grains'
  | 'nuts'
  | 'oils'
  | 'sugar'
  | 'processed-food'
  | 'restaurant-meal'
  | 'coffee'
  | 'chocolate'
  | 'oat-milk'
  | 'almond-milk';

/** Food log entry fields */
export interface FoodLogData {
  foodType: FoodType;
  weightGrams: number;
  isOrganic: boolean;
  isLocal: boolean;
  wasWasted: boolean;
  description?: string; // Free text notes
  productBarcode?: string; // From scanner (Phase 3)
}

/** Energy source types */
export type EnergySource = 'grid-electricity' | 'natural-gas' | 'heating-oil' | 'lpg' | 'biomass' | 'solar-owned';

/** Home energy log entry fields */
export interface EnergyLogData {
  source: EnergySource;
  amount: number;       // kWh for electricity; kWh-equivalent for gas/oil
  unit: 'kwh' | 'therm' | 'litre' | 'm3';
  gridRegion?: string;  // Overrides profile default (from Electricity Maps)
  billingPeriodStart?: string; // ISO date
  billingPeriodEnd?: string;
  fromOcrUpload?: boolean; // True if auto-extracted from utility bill
  billImageUrl?: string;
}

/** Consumer goods categories for shopping emissions */
export type ShoppingItemCategory =
  | 'clothing-fast-fashion'
  | 'clothing-sustainable'
  | 'clothing-secondhand'
  | 'electronics-large'
  | 'electronics-small'
  | 'furniture'
  | 'appliances'
  | 'books-stationery'
  | 'toys-hobbies'
  | 'personal-care'
  | 'cleaning-products'
  | 'food-delivery'
  | 'online-delivery'
  | 'services';

/** Shopping log entry fields */
export interface ShoppingLogData {
  category: ShoppingItemCategory;
  isSecondHand: boolean;
  spendAmount: number;
  spendCurrency: string; // ISO 4217 (e.g. "GBP", "USD")
  itemDescription?: string;
  barcode?: string;
  fromBankTransaction?: boolean; // Phase 2
}

/** Base fields common to all log entries */
export interface BaseLogEntry {
  id: string;
  uid: string;
  category: EmissionCategory;
  kgCo2e: number;        // Calculated emission value
  loggedAt: string;      // ISO datetime when the user logged it
  activityDate: string;  // ISO date when the activity occurred (may differ from loggedAt)
  notes?: string;
  source: 'manual' | 'ocr' | 'bank' | 'maps' | 'scanner'; // How entry was created
}

/** Travel log entry (complete) */
export interface TravelLogEntry extends BaseLogEntry {
  category: 'travel';
  data: TravelLogData;
}

/** Food log entry (complete) */
export interface FoodLogEntry extends BaseLogEntry {
  category: 'food';
  data: FoodLogData;
}

/** Energy log entry (complete) */
export interface EnergyLogEntry extends BaseLogEntry {
  category: 'energy';
  data: EnergyLogData;
}

/** Shopping log entry (complete) */
export interface ShoppingLogEntry extends BaseLogEntry {
  category: 'shopping';
  data: ShoppingLogData;
}

/** Union type for any log entry */
export type LogEntry = TravelLogEntry | FoodLogEntry | EnergyLogEntry | ShoppingLogEntry;

/** Aggregated log summary for a given period */
export interface LogSummary {
  periodStart: string;
  periodEnd: string;
  totalKgCo2e: number;
  byCategory: {
    travel: number;
    food: number;
    energy: number;
    shopping: number;
  };
  entryCount: number;
}
