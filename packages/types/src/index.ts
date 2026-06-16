// @earthprint/types — Public API

export type {
  // User
  DietType,
  HeatingType,
  DwellingType,
  VehicleFuelType,
  CarUsageFrequency,
  BudgetLevel,
  LocationData,
  HouseholdData,
  TransportData,
  DietData,
  ShoppingData,
  OnboardingAnswers,
  UserProfile,
} from './user';

export type {
  // Log
  EmissionCategory,
  TransportMode,
  FlightClass,
  TravelLogData,
  FoodType,
  FoodLogData,
  EnergySource,
  EnergyLogData,
  ShoppingItemCategory,
  ShoppingLogData,
  BaseLogEntry,
  TravelLogEntry,
  FoodLogEntry,
  EnergyLogEntry,
  ShoppingLogEntry,
  LogEntry,
  LogSummary,
} from './log';

export type {
  // Emission
  TransportEmissionFactor,
  FoodEmissionFactor,
  GridEmissionFactor,
  FuelEmissionFactor,
  ShoppingEmissionFactor,
  EmissionFactorTables,
  CategoryBreakdown,
  BaselineResult,
  AIRecommendation,
} from './emission';

export type {
  // Challenge & Badge
  Badge,
  BadgeRequirement,
  ChallengeDifficulty,
  Challenge,
  UserChallenge,
  TeamChallenge,
} from './challenge';

export type {
  // Marketplace
  ActionStatus,
  OffsetVerification,
  ActionType,
  MarketplaceAction,
  UserMarketplaceAction,
} from './marketplace';

export type {
  // Community
  CommunityPost,
  PostComment,
  LeaderboardEntry,
  Team,
  FriendRequest,
  GlobalImpact,
} from './community';
