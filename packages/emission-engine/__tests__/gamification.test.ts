import {
  calculateBloomPoints,
  calculateTerraScore,
  evaluateBadges,
  STARTER_BADGES
} from '../src/gamification/bloom-points';

describe('Gamification — Bloom Points', () => {
  it('should calculate points correctly based on logs, challenges, and savings', () => {
    // 5 logs = 50 pts, 2 challenges = 200 pts, 25 kg CO2 saved = 25 pts. Total = 275 pts.
    const pts = calculateBloomPoints({
      logsCount: 5,
      challengesCompleted: 2,
      kgCo2Saved: 25.4,
    });
    expect(pts).toBe(275);
  });

  it('should handle zero stats and negative CO2 savings gracefully', () => {
    const pts = calculateBloomPoints({
      logsCount: 0,
      challengesCompleted: 0,
      kgCo2Saved: -15, // should be treated as 0
    });
    expect(pts).toBe(0);
  });
});

describe('Gamification — Terra Score (heartbeat)', () => {
  it('should return 100 if user remains within their monthly carbon budget target', () => {
    const score = calculateTerraScore({
      monthlyBudgetUsed: 120,
      monthlyBudgetTarget: 200,
      streakDays: 8, // streak >= 7 adds 20 points, budget <= target adds 80 points. Total = 100.
    });
    expect(score).toBe(100);
  });

  it('should decline linearly if budget is exceeded', () => {
    // target = 200, used = 300 (overdraft = 100, ratio = 0.5, budget score = 50)
    // streak = 5 (streak score = 80)
    // final = 50 * 0.8 + 80 * 0.2 = 40 + 16 = 56
    const score = calculateTerraScore({
      monthlyBudgetUsed: 300,
      monthlyBudgetTarget: 200,
      streakDays: 5,
    });
    expect(score).toBe(56);
  });

  it('should handle double target budget and zero streak correctly', () => {
    // target = 200, used = 400 (ratio = 1.0, budget score = 0)
    // streak = 0 (streak score = 0)
    // final = 0
    const score = calculateTerraScore({
      monthlyBudgetUsed: 400,
      monthlyBudgetTarget: 200,
      streakDays: 0,
    });
    expect(score).toBe(0);
  });
});

describe('Gamification — Badges Evaluation', () => {
  it('should award the first-log badge correctly when threshold is met', () => {
    const newlyEarned = evaluateBadges({
      earnedBadgeIds: [],
      logsCount: 1,
      logsByCategory: { travel: 0, food: 1, energy: 0, shopping: 0 },
      challengesCompletedCount: 0,
      totalKgCo2Saved: 0,
      currentStreak: 0,
      friendsCount: 0,
      hasTeamChallenge: false,
    });
    expect(newlyEarned).toContain('first-log');
  });

  it('should award streak badges when matching logging milestones', () => {
    const newlyEarned = evaluateBadges({
      earnedBadgeIds: ['first-log'], // already has first-log
      logsCount: 15,
      logsByCategory: { travel: 5, food: 5, energy: 5, shopping: 0 },
      challengesCompletedCount: 0,
      totalKgCo2Saved: 0,
      currentStreak: 7, // meets streak-3 and streak-7
      friendsCount: 0,
      hasTeamChallenge: false,
    });
    expect(newlyEarned).toContain('streak-3');
    expect(newlyEarned).toContain('streak-7');
    expect(newlyEarned).not.toContain('streak-14');
  });

  it('should not duplicate badges that the user already earned', () => {
    const newlyEarned = evaluateBadges({
      earnedBadgeIds: ['first-log', 'streak-3'],
      logsCount: 5,
      logsByCategory: { travel: 0, food: 5, energy: 0, shopping: 0 },
      challengesCompletedCount: 0,
      totalKgCo2Saved: 0,
      currentStreak: 4, // meets streak-3 again, but user already has it
      friendsCount: 0,
      hasTeamChallenge: false,
    });
    expect(newlyEarned).not.toContain('first-log');
    expect(newlyEarned).not.toContain('streak-3');
  });
});
