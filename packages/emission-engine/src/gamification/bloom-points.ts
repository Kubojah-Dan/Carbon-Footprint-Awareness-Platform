import type { Badge, EmissionCategory } from '@earthprint/types';

/**
 * Calculate Bloom Points earned.
 * Rules:
 *   - 10 Bloom Points per manual/auto log entry.
 *   - 100 Bloom Points per completed weekly challenge.
 *   - 1 Bloom Point per kg CO₂e saved compared to their monthly carbon budget.
 */
export function calculateBloomPoints(params: {
  logsCount: number;
  challengesCompleted: number;
  kgCo2Saved: number;
}): number {
  const logPoints = params.logsCount * 10;
  const challengePoints = params.challengesCompleted * 100;
  const savingPoints = Math.max(0, Math.floor(params.kgCo2Saved));
  return logPoints + challengePoints + savingPoints;
}

/**
 * Calculate the Terra Score (0–100 heartbeat metric).
 * Evaluates budget adherence (80% weight) and logging consistency/streak (20% weight).
 *
 * For budget adherence:
 *   - If budgetUsed <= budgetTarget: score is 100.
 *   - If budgetUsed > budgetTarget: score drops linearly down to 0 at 2x target.
 *
 * For streak:
 *   - 0 days = 0 points
 *   - 1-3 days = 50 points
 *   - 4-6 days = 80 points
 *   - 7+ days = 100 points
 */
export function calculateTerraScore(params: {
  monthlyBudgetUsed: number;
  monthlyBudgetTarget: number;
  streakDays: number;
}): number {
  const { monthlyBudgetUsed, monthlyBudgetTarget, streakDays } = params;

  if (monthlyBudgetTarget <= 0) {
    return 100;
  }

  // 1. Budget Adherence Score (0 to 100)
  let budgetScore = 100;
  if (monthlyBudgetUsed > monthlyBudgetTarget) {
    const excess = monthlyBudgetUsed - monthlyBudgetTarget;
    // Overdraft drops score to 0 when consumption hits double the target budget
    const ratio = excess / monthlyBudgetTarget;
    budgetScore = Math.max(0, 100 - ratio * 100);
  }

  // 2. Logging Streak Score (0 to 100)
  let streakScore = 0;
  if (streakDays >= 7) {
    streakScore = 100;
  } else if (streakDays >= 4) {
    streakScore = 80;
  } else if (streakDays >= 1) {
    streakScore = 50;
  }

  // Weighted combination
  const finalScore = budgetScore * 0.8 + streakScore * 0.2;
  return Math.round(finalScore);
}

/**
 * Evaluates if user qualifies for new badges based on their activity stats.
 * Returns array of Badge IDs that the user has earned but not yet marked as earned.
 */
export function evaluateBadges(params: {
  earnedBadgeIds: string[];
  logsCount: number;
  logsByCategory: Record<EmissionCategory, number>;
  challengesCompletedCount: number;
  totalKgCo2Saved: number;
  currentStreak: number;
  friendsCount: number;
  hasTeamChallenge: boolean;
}): string[] {
  const newlyEarned: string[] = [];

  for (const badge of STARTER_BADGES) {
    // Skip if already earned
    if (params.earnedBadgeIds.includes(badge.id)) {
      continue;
    }

    let meetsRequirement = false;
    const req = badge.requirement;

    switch (req.type) {
      case 'first-log':
        meetsRequirement = params.logsCount >= req.threshold;
        break;
      case 'co2-saved':
        meetsRequirement = params.totalKgCo2Saved >= req.threshold;
        break;
      case 'streak-days':
        meetsRequirement = params.currentStreak >= req.threshold;
        break;
      case 'logs-count':
        if (req.category) {
          meetsRequirement = (params.logsByCategory[req.category] || 0) >= req.threshold;
        } else {
          meetsRequirement = params.logsCount >= req.threshold;
        }
        break;
      case 'challenges-completed':
        meetsRequirement = params.challengesCompletedCount >= req.threshold;
        break;
      case 'friends-added':
        meetsRequirement = params.friendsCount >= req.threshold;
        break;
      case 'team-challenge':
        meetsRequirement = params.hasTeamChallenge;
        break;
      default:
        break;
    }

    if (meetsRequirement) {
      newlyEarned.push(badge.id);
    }
  }

  return newlyEarned;
}

/** List of 20 starter badges definitions */
export const STARTER_BADGES: Badge[] = [
  {
    id: 'first-log',
    name: 'First Pulse',
    description: 'Logged your very first carbon activity to nurture your ecosystem.',
    iconEmoji: '🌱',
    category: 'all',
    requirement: { type: 'first-log', threshold: 1 },
    isRare: false,
  },
  {
    id: 'streak-3',
    name: 'Consistent Nurturer',
    description: 'Logged activities 3 days in a row.',
    iconEmoji: '🔥',
    category: 'streak',
    requirement: { type: 'streak-days', threshold: 3 },
    isRare: false,
  },
  {
    id: 'streak-7',
    name: 'Weekly Pulse',
    description: 'Logged activities 7 days in a row.',
    iconEmoji: '⚡',
    category: 'streak',
    requirement: { type: 'streak-days', threshold: 7 },
    isRare: false,
  },
  {
    id: 'streak-14',
    name: 'Biophilic Habit',
    description: 'Logged activities 14 days in a row.',
    iconEmoji: '🌟',
    category: 'streak',
    requirement: { type: 'streak-days', threshold: 14 },
    isRare: false,
  },
  {
    id: 'streak-30',
    name: 'Planet Guardian',
    description: 'Logged activities 30 days in a row.',
    iconEmoji: '👑',
    category: 'streak',
    requirement: { type: 'streak-days', threshold: 30 },
    isRare: true,
  },
  {
    id: 'co2-saved-10',
    name: 'Carbon Saver I',
    description: 'Saved a total of 10 kg CO₂e compared to baseline.',
    iconEmoji: '🍃',
    category: 'all',
    requirement: { type: 'co2-saved', threshold: 10 },
    isRare: false,
  },
  {
    id: 'co2-saved-50',
    name: 'Carbon Saver II',
    description: 'Saved a total of 50 kg CO₂e compared to baseline.',
    iconEmoji: '🍀',
    category: 'all',
    requirement: { type: 'co2-saved', threshold: 50 },
    isRare: false,
  },
  {
    id: 'co2-saved-100',
    name: 'Carbon Saver III',
    description: 'Saved a total of 100 kg CO₂e compared to baseline.',
    iconEmoji: '🌿',
    category: 'all',
    requirement: { type: 'co2-saved', threshold: 100 },
    isRare: false,
  },
  {
    id: 'co2-saved-500',
    name: 'Climate Champion',
    description: 'Saved a total of 500 kg CO₂e compared to baseline.',
    iconEmoji: '🌳',
    category: 'all',
    requirement: { type: 'co2-saved', threshold: 500 },
    isRare: true,
  },
  {
    id: 'commute-crusher',
    name: 'Commute Crusher',
    description: 'Logged 5 car-free commutes (train, walk, cycle, bus).',
    iconEmoji: '🚴',
    category: 'travel',
    requirement: { type: 'car-free-commutes', threshold: 5 },
    isRare: false,
  },
  {
    id: 'green-traveler',
    name: 'Green Traveler',
    description: 'Logged 10 travel activities.',
    iconEmoji: '🚲',
    category: 'travel',
    requirement: { type: 'logs-count', threshold: 10, category: 'travel' },
    isRare: false,
  },
  {
    id: 'plant-rich-3',
    name: 'Green Gourmet',
    description: 'Ate a plant-rich diet for 3 consecutive days.',
    iconEmoji: '🥗',
    category: 'food',
    requirement: { type: 'diet-streak', threshold: 3 },
    isRare: false,
  },
  {
    id: 'plant-rich-7',
    name: 'Herbivore Hero',
    description: 'Ate a plant-rich diet for 7 consecutive days.',
    iconEmoji: '🥑',
    category: 'food',
    requirement: { type: 'diet-streak', threshold: 7 },
    isRare: false,
  },
  {
    id: 'food-logger-10',
    name: 'Food Tracker',
    description: 'Logged 10 meals to feed your biome.',
    iconEmoji: '🍽️',
    category: 'food',
    requirement: { type: 'logs-count', threshold: 10, category: 'food' },
    isRare: false,
  },
  {
    id: 'energy-saver',
    name: 'Energy Watchdog',
    description: 'Logged 5 energy entries showing budget savings.',
    iconEmoji: '💡',
    category: 'energy',
    requirement: { type: 'logs-count', threshold: 5, category: 'energy' },
    isRare: false,
  },
  {
    id: 'smart-shopper',
    name: 'Conscious Consumer',
    description: 'Bought low-impact or second-hand goods 5 times.',
    iconEmoji: '🛍️',
    category: 'shopping',
    requirement: { type: 'logs-count', threshold: 5, category: 'shopping' },
    isRare: false,
  },
  {
    id: 'challenge-completed-1',
    name: 'First Victory',
    description: 'Completed 1 weekly challenge.',
    iconEmoji: '🏆',
    category: 'all',
    requirement: { type: 'challenges-completed', threshold: 1 },
    isRare: false,
  },
  {
    id: 'challenge-completed-5',
    name: 'Challenge Master',
    description: 'Completed 5 carbon footprint challenges.',
    iconEmoji: '🏅',
    category: 'all',
    requirement: { type: 'challenges-completed', threshold: 5 },
    isRare: true,
  },
  {
    id: 'friend-added-1',
    name: 'Hive Member',
    description: 'Connected with your first friend in the Community Hive.',
    iconEmoji: '🐝',
    category: 'social',
    requirement: { type: 'friends-added', threshold: 1 },
    isRare: false,
  },
  {
    id: 'team-challenge-1',
    name: 'Hive Mind',
    description: 'Participated in a collective neighborhood team challenge.',
    iconEmoji: '👥',
    category: 'social',
    requirement: { type: 'team-challenge', threshold: 1 },
    isRare: false,
  },
];
