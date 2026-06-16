// Marketplace Action Types (Phase 3)

import type { EmissionCategory } from './log';

/** Status of a marketplace action for a specific user */
export type ActionStatus = 'available' | 'committed' | 'completed' | 'not-for-me';

/** Verification standard for carbon offset projects */
export type OffsetVerification = 'verra-vcs' | 'gold-standard' | 'plan-vivo' | 'verified';

/** Type of marketplace action */
export type ActionType =
  | 'energy-switch'      // Switch to green energy tariff
  | 'carbon-offset'      // Purchase verified carbon offsets
  | 'product-switch'     // Switch to a sustainable product alternative
  | 'local-service'      // Local eco-service (repair café, etc.)
  | 'behavior-change'    // Behavior change action (e.g., reduce meat)
  | 'infrastructure';    // EV charging, public transit info

/** A curated eco-action in the marketplace */
export interface MarketplaceAction {
  id: string;
  title: string;
  description: string;
  type: ActionType;
  category: EmissionCategory | 'all';
  monthlyCo2ImpactKg: number;  // Estimated monthly CO₂ saving
  effortLevel: 'low' | 'medium' | 'high';
  estimatedCostGbp?: number;   // Negative = saves money
  costLabel: 'saves-money' | 'cost-neutral' | 'small-cost' | 'significant-cost';
  externalUrl?: string;
  iconEmoji: string;
  pointsCost?: number;         // Green Points cost to redeem (if applicable)
  isRedeemable: boolean;       // Whether points can be used for this action
  countryRestrictions?: string[]; // ISO country codes; empty = worldwide
  verificationStandard?: OffsetVerification;
  isActive: boolean;
}

/** A user's interaction with a marketplace action */
export interface UserMarketplaceAction {
  id: string;
  uid: string;
  actionId: string;
  action: MarketplaceAction;
  status: ActionStatus;
  committedAt?: string;
  completedAt?: string;
  pointsRedeemed?: number;
  redemptionCode?: string;     // Revealed on redemption
}
