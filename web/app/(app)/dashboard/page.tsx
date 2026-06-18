'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useLogs } from '@/hooks/useLogs';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ProgressBar, CircularProgress } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { analytics } from '@/lib/analytics';
import Link from 'next/link';
import { EcosystemAvatar } from '@/components/ui/EcosystemAvatar';

// Centralized sub-component imports
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { CarbonHistoryChart } from '@/components/dashboard/CarbonHistoryChart';
import { RecommendationCard } from '@/components/dashboard/RecommendationCard';
import { LogEntryRow } from '@/components/dashboard/LogEntryRow';

const CATEGORY_CONFIG = {
  travel: { icon: '🚗', label: 'Travel', color: '#3B82F6', bgClass: 'category-bg-travel', textClass: 'category-travel' },
  food: { icon: '🍽', label: 'Food', color: '#10B981', bgClass: 'category-bg-food', textClass: 'category-food' },
  energy: { icon: '⚡', label: 'Energy', color: '#F59E0B', bgClass: 'category-bg-energy', textClass: 'category-energy' },
  shopping: { icon: '🛍', label: 'Shopping', color: '#8B5CF6', bgClass: 'category-bg-shopping', textClass: 'category-shopping' },
};

const ECO_FACTS = [
  {
    icon: '🚗',
    title: 'Smart Commuting',
    fact: 'Carpooling with just one colleague cuts your travel emissions by 50%. Swapping driving for cycling or public transport makes your daily footprint zero-carbon!',
  },
  {
    icon: '🥩',
    title: 'Dietary Swaps',
    fact: 'Swapping beef for beans or chicken just once a week saves up to 150 kg of CO₂e annually. Plant-based eating is one of the single most effective climate actions.',
  },
  {
    icon: '⚡',
    title: 'Thermostat Adjustment',
    fact: 'Lowering your home thermostat by just 1°C can decrease your household energy carbon emissions and electricity bill by up to 10%!',
  },
  {
    icon: '🛍️',
    title: 'Slow Fashion',
    fact: 'The clothing industry emits 10% of global greenhouse gases. Choosing pre-loved or second-hand items instead of buying new clothing prevents 15 kg of CO₂e per item.',
  },
  {
    icon: '🍽️',
    title: 'Food Waste Impact',
    fact: 'If food waste were a nation, it would be the third-largest global emitter. Composting your food scraps and planning meals prevents methane emissions from landfills.',
  },
  {
    icon: '💡',
    title: 'LED Efficiency',
    fact: 'LED light bulbs use 75% less energy than standard incandescent lighting, saving up to 25 kg of carbon emissions annually per bulb replaced.',
  },
];

export default function DashboardPage() {
  const { user, userProfile } = useAuth();
  const { logs, loading: logsLoading } = useLogs(user?.uid, 180);
  const { recommendations, loading: aiLoading, refresh: refreshAI, submitFeedback } = useAIRecommendations(user?.uid);

  const [mounted, setMounted] = useState(false);
  const [fact, setFact] = useState({
    icon: '🌿',
    title: 'Carbon Awareness',
    fact: 'Your daily choices shape the future of our biosphere. Start tracking to see your positive impact grow!',
  });

  useEffect(() => {
    setMounted(true);
    const index = new Date().getDate() % ECO_FACTS.length;
    const selectedFact = ECO_FACTS[index];
    if (selectedFact) {
      setFact(selectedFact);
    }
  }, []);

  const currentMonthLogs = useMemo(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const startIso = startOfMonth.toISOString().split('T')[0]!;
    return logs.filter(l => l.activityDate >= startIso);
  }, [logs]);

  const currentMonthSummary = useMemo(() => {
    const byCategory = { travel: 0, food: 0, energy: 0, shopping: 0 };
    let total = 0;
    for (const log of currentMonthLogs) {
      const cat = log.category as keyof typeof byCategory;
      if (cat in byCategory) {
        byCategory[cat] += log.kgCo2e;
        total += log.kgCo2e;
      }
    }
    return {
      totalKgCo2e: total,
      byCategory: {
        travel: Math.round(byCategory.travel * 100) / 100,
        food: Math.round(byCategory.food * 100) / 100,
        energy: Math.round(byCategory.energy * 100) / 100,
        shopping: Math.round(byCategory.shopping * 100) / 100,
      },
      entryCount: currentMonthLogs.length,
    };
  }, [currentMonthLogs]);

  const monthlyTarget = userProfile?.monthlyTargetKgCo2e ?? 200;
  const currentMonthKg = currentMonthSummary.totalKgCo2e;
  const targetProgress = Math.min(100, (currentMonthKg / monthlyTarget) * 100);

  const recentLogs = useMemo(() => logs.slice(0, 5), [logs]);
  const firstName = userProfile?.displayName?.split(' ')[0] ?? 'there';
  const isDemoData = logs.length === 0;

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const trend = [];

    if (!isDemoData) {
      const monthlyMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
        monthlyMap[key] = 0;
      }

      logs.forEach(log => {
        const date = new Date(log.activityDate);
        const key = `${months[date.getMonth()]} ${date.getFullYear().toString().slice(-2)}`;
        if (key in monthlyMap) {
          monthlyMap[key]! += log.kgCo2e;
        }
      });

      return Object.entries(monthlyMap).map(([name, value]) => ({
        name,
        Emissions: Math.round(value * 10) / 10,
      }));
    }

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const name = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      trend.push({ name, Emissions: 140 - i * 15 + Math.round(Math.random() * 20) });
    }
    return trend;
  }, [logs, isDemoData]);

  useEffect(() => {
    analytics.dashboardViewed();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Dashboard Greeting Header */}
      <DashboardHeader firstName={firstName} />

      {/* Living Ecosystem Avatar Biome Card */}
      <Card className="relative overflow-hidden h-[280px] border-none bg-forest-deep shadow-glow">
        <EcosystemAvatar
          biome={userProfile?.activeBiome || 'temperate-forest'}
          terraScore={userProfile?.terraScore ?? 75}
          className="absolute inset-0 z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 flex flex-col justify-between p-6 z-10 select-none">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>
                {userProfile?.activeBiome === 'coral-reef'
                  ? 'Coral Reef 🪸'
                  : userProfile?.activeBiome === 'alpine-meadow'
                  ? 'Alpine Meadow 🏔️'
                  : 'Temperate Forest 🌲'}
              </span>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-white text-xs font-semibold">
              🌡️ Health:{' '}
              <span className="font-bold text-emerald-300">
                {(userProfile?.terraScore ?? 75) >= 80
                  ? 'Thriving'
                  : (userProfile?.terraScore ?? 75) >= 60
                  ? 'Healthy'
                  : 'Stressed'}
              </span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-4">
            <div className="text-center md:text-left">
              <h2 className="font-display text-2xl font-bold text-white leading-tight drop-shadow-md">
                Your Living Planet
              </h2>
              <p className="text-white/80 text-sm mt-1 max-w-md drop-shadow-sm">
                Your daily choices nourish this ecosystem. Keep your lifestyle pulse low-carbon to see it flourish.
              </p>
            </div>
            <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-2xl border border-white/10 shadow-lg text-center min-w-[140px] shrink-0">
              <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider font-mono">
                Terra Score
              </p>
              <div className="flex items-baseline justify-center gap-1 mt-0.5">
                <span className="font-mono text-3xl font-bold text-ink">
                  {userProfile?.terraScore ?? 75}
                </span>
                <span className="text-xs text-ink-soft">/ 100</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Earth Awareness Hub Shortcut Banner */}
      <Card className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-300/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-3xl select-none">🌍</span>
          <div>
            <h3 className="font-semibold text-sm text-ink">Connect With The Planet's Pulse</h3>
            <p className="text-xs text-ink-soft">Enter the new Earth Awareness Hub to record Time Capsules, scan product lineages, and feel the haptic heartbeat core.</p>
          </div>
        </div>
        <Link href="/awareness">
          <Button variant="secondary" size="sm" className="shrink-0 border-forest-action/30 hover:border-forest-action">
            Enter Hub →
          </Button>
        </Link>
      </Card>

      {/* Monthly Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <Card id="monthly-progress-card">
            <CardHeader>
              <CardTitle>This Month</CardTitle>
              <span className="text-sm text-ink-soft font-mono">
                {new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
              </span>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-8 w-36" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ) : (
                <>
                  <div className="flex items-end gap-3 mb-4">
                    <p className="font-mono text-5xl font-bold text-ink">
                      {Math.round(currentMonthKg)}
                    </p>
                    <div className="mb-2">
                      <p className="text-lg text-ink-soft">kg CO₂e</p>
                      <p className="text-sm text-ink-soft">of {monthlyTarget} kg target</p>
                    </div>
                  </div>

                  <ProgressBar
                    value={targetProgress}
                    max={100}
                    showValue
                    label="Monthly budget used"
                    size="lg"
                  />

                  <div className="grid grid-cols-4 gap-3 mt-5">
                    {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((cat) => {
                      const config = CATEGORY_CONFIG[cat];
                      const value = currentMonthSummary.byCategory[cat] ?? 0;
                      return (
                        <div
                          key={cat}
                          className={`rounded-xl p-3 ${config.bgClass} text-center`}
                        >
                          <p className="text-xl mb-1">{config.icon}</p>
                          <p className={`text-sm font-mono font-bold ${config.textClass}`}>
                            {Math.round(value)} kg
                          </p>
                          <p className="text-xs text-ink-soft mt-0.5">{config.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card id="points-card">
            <CardContent className="text-center py-2">
              <p className="text-4xl mb-2">🏆</p>
              <p className="font-mono text-3xl font-bold text-ink">
                {userProfile?.points?.toLocaleString() ?? 0}
              </p>
              <p className="text-sm text-ink-soft font-medium">Green Points</p>
            </CardContent>
          </Card>

          <Card id="streak-card">
            <CardContent className="text-center py-2">
              <CircularProgress
                value={Math.min(100, ((userProfile?.streakDays ?? 0) / 7) * 100)}
                size={72}
                strokeWidth={8}
                label={`${userProfile?.streakDays ?? 0}`}
                sublabel="days"
                variant="success"
              />
              <p className="text-sm text-ink-soft font-medium mt-3">Logging Streak</p>
              {userProfile?.streakDays === 0 && (
                <p className="text-xs text-sunlight-amber mt-1">Log today to start your streak!</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Visual Insights & Daily Fact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          {/* Carbon History AreaChart Component */}
          <CarbonHistoryChart
            chartData={chartData}
            isDemoData={isDemoData}
            mounted={mounted && !logsLoading}
          />
        </div>

        <div>
          <Card className="glass-card h-[290px] flex flex-col justify-between bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 border-emerald-300/30">
            <CardHeader className="block pb-0">
              <CardTitle className="text-base font-bold text-ink">Eco-Awareness Fact</CardTitle>
              <p className="text-xs text-ink-soft">Daily bite-sized climate knowledge</p>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center items-center text-center p-4">
              <span className="text-4xl mb-3 lively-emoji animate-bounce-slow" role="img" aria-label={fact.title}>
                {fact.icon}
              </span>
              <h4 className="font-semibold text-sm text-ink mb-1.5">{fact.title}</h4>
              <p className="text-xs text-ink-soft leading-relaxed max-w-sm">
                {fact.fact}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Recommendations Action Plan */}
      <div id="ai-recommendations-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-ink">Your AI Action Plan</h2>
          <Button
            variant="ghost"
            size="sm"
            isLoading={aiLoading}
            onClick={() => refreshAI()}
            id="btn-refresh-tips"
          >
            ↻ Refresh Tips
          </Button>
        </div>

        {aiLoading ? (
          <div className="grid md:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <Card key={i}>
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-5/6 mb-4" />
                <Skeleton className="h-8 w-24" />
              </Card>
            ))}
          </div>
        ) : recommendations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-3xl mb-3">✨</p>
              <p className="text-ink font-medium">Generating your personalized plan...</p>
              <p className="text-sm text-ink-soft mt-1">This takes about 15 seconds</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-3 gap-4">
            {recommendations.map((rec, index) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                index={index}
                onFeedback={submitFeedback}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity Logs */}
      <div id="recent-activity-section">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-ink">Recent Activity</h2>
          <Link href="/log">
            <Button variant="ghost" size="sm" id="btn-view-all-logs">
              View All →
            </Button>
          </Link>
        </div>

        <Card>
          {logsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton width={40} height={40} rounded />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : recentLogs.length === 0 ? (
            <CardContent className="text-center py-10">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-ink font-medium">No logs yet this month</p>
              <p className="text-sm text-ink-soft mt-1 mb-4">Start tracking to see your progress</p>
              <Link href="/log/new">
                <Button variant="primary" id="btn-first-log">Log Your First Activity →</Button>
              </Link>
            </CardContent>
          ) : (
            <div className="divide-y divide-border">
              {recentLogs.map((log) => (
                <LogEntryRow key={log.id} log={log} />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

