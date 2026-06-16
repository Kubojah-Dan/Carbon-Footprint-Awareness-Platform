// Challenge & Badge Types

import type { EmissionCategory } from './log';

/** Badge definitions — 20 total badges across the platform */
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
  category: EmissionCategory | 'all' | 'streak' | 'social';
  requirement: BadgeRequirement;
  earnedAt?: string; // ISO datetime — undefined if not yet earned
  isRare: boolean;
}

/** What triggers a badge to be earned */
export interface BadgeRequirement {
  type:
    | 'first-log'
    | 'co2-saved'           // kgCo2e threshold
    | 'streak-days'
    | 'logs-count'
    | 'challenges-completed'
    | 'diet-streak'         // N consecutive days plant-based
    | 'car-free-commutes'
    | 'friends-added'
    | 'team-challenge';
  threshold: number;
  category?: EmissionCategory;
}

/** Challenge difficulty level */
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

/** Challenge definition — seeded in Firestore */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: EmissionCategory | 'all';
  difficulty: ChallengeDifficulty;
  durationDays: number;
  targetValue: number;       // e.g. 5 for "5 car-free days"
  targetUnit: string;        // e.g. "car-free days", "kg CO₂e saved"
  pointsReward: number;
  badgeReward?: string;      // Badge ID if completing this challenge earns a badge
  iconEmoji: string;
  isActive: boolean;
  weekNumber?: number;       // For rotating weekly challenges
  startsAt: string;
  endsAt: string;
  participantCount: number;
}

/** A user's progress on a specific challenge */
export interface UserChallenge {
  id: string;
  uid: string;
  challengeId: string;
  challenge: Challenge;
  joinedAt: string;
  currentProgress: number;
  isCompleted: boolean;
  completedAt?: string;
  pointsAwarded?: number;
}

/** Team challenge (Phase 3) */
export interface TeamChallenge {
  id: string;
  name: string;
  challengeId: string;
  creatorUid: string;
  memberUids: string[];
  aggregateProgress: number;
  startsAt: string;
  endsAt: string;
  isCompleted: boolean;
}
