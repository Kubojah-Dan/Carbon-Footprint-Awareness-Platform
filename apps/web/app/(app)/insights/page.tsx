'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { useLogs } from '@/hooks/useLogs';
import { useAIRecommendations } from '@/hooks/useAIRecommendations';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AIRecommendation, LogEntry } from '@earthprint/types';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const CATEGORY_CONFIG = {
  travel: { icon: '🚗', label: 'Travel', color: '#3B82F6', bgClass: 'category-bg-travel', textClass: 'category-travel' },
  food: { icon: '🍽', label: 'Food', color: '#10B981', bgClass: 'category-bg-food', textClass: 'category-food' },
  energy: { icon: '⚡', label: 'Energy', color: '#F59E0B', bgClass: 'category-bg-energy', textClass: 'category-energy' },
  shopping: { icon: '🛍', label: 'Shopping', color: '#8B5CF6', bgClass: 'category-bg-shopping', textClass: 'category-shopping' },
};

const BIOME_CONFIG = {
  'temperate-forest': {
    label: 'Temperate Forest',
    avatarEmoji: '🌲',
    desc: 'Nurture oaks, rivers, and wildlife by lowering transport emissions.',
    themeBg: 'bg-emerald-50/70 border-emerald-200/50 text-emerald-950',
    gradientClass: 'from-emerald-500 to-green-600',
  },
  'coral-reef': {
    label: 'Coral Reef',
    avatarEmoji: '🪸',
    desc: 'Keep ocean waters cool and clear for reef systems by eating green.',
    themeBg: 'bg-cyan-50/70 border-cyan-200/50 text-cyan-950',
    gradientClass: 'from-cyan-500 to-sky-600',
  },
  'alpine-meadow': {
    label: 'Alpine Meadow',
    avatarEmoji: '🏔️',
    desc: 'Preserve snowy peaks, streams, and meadows of wildflowers.',
    themeBg: 'bg-amber-50/70 border-amber-200/50 text-amber-950',
    gradientClass: 'from-amber-500 to-yellow-600',
  },
};

export default function InsightsPage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const uid = user?.uid;

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch 6 months of logs for history charts
  const { logs, loading: logsLoading } = useLogs(uid, 180);
  const { recommendations, loading: recsLoading, error: recsError, refresh: refreshRecs, submitFeedback } = useAIRecommendations(uid);

  // Biophilic coach states
  const [coachMsg, setCoachMsg] = useState<string>('');
  const [coachLoading, setCoachLoading] = useState(true);
  const [activeBiome, setActiveBiome] = useState<'temperate-forest' | 'coral-reef' | 'alpine-meadow'>('temperate-forest');
  const [updatingBiome, setUpdatingBiome] = useState(false);

  const isDemoData = logs.length === 0;

  // Process data for charts
  const finalChartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    if (!isDemoData) {
      // 1. Group logs by month
      const monthlyMap: Record<string, number> = {};
      const now = new Date();
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

      const trend = Object.entries(monthlyMap).map(([name, value]) => ({
        name,
        Emissions: Math.round(value * 10) / 10,
      }));

      // 2. Group by category
      const catMap = { travel: 0, food: 0, energy: 0, shopping: 0 };
      logs.forEach(log => {
        if (log.category in catMap) {
          catMap[log.category as keyof typeof catMap] += log.kgCo2e;
        }
      });

      const breakdown = Object.entries(catMap).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: Math.round(value * 10) / 10,
        color: CATEGORY_CONFIG[name as keyof typeof CATEGORY_CONFIG]?.color || '#3B82F6',
        icon: CATEGORY_CONFIG[name as keyof typeof CATEGORY_CONFIG]?.icon || '🌿',
      })).filter(item => item.value > 0);

      // If categories sum to 0, use demo layout to prevent blank charts
      if (breakdown.length === 0) {
        return {
          trend,
          breakdown: [
            { name: 'Travel', value: 0.1, color: '#3B82F6', icon: '🚗' },
            { name: 'Food', value: 0.1, color: '#10B981', icon: '🍽' },
          ]
        };
      }

      return { trend, breakdown };
    }

    // Fallback Mock baseline data for visualization
    const now = new Date();
    const trend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const name = `${months[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      trend.push({ name, Emissions: 140 - i * 15 + Math.round(Math.random() * 25) });
    }

    const breakdown = [
      { name: 'Travel', value: 92, color: '#3B82F6', icon: '🚗' },
      { name: 'Food', value: 65, color: '#10B981', icon: '🍽' },
      { name: 'Energy', value: 48, color: '#F59E0B', icon: '⚡' },
      { name: 'Shopping', value: 25, color: '#8B5CF6', icon: '🛍' },
    ];

    return { trend, breakdown };
  }, [logs, isDemoData]);

  // Fetch Biophilic Coach Guidance
  const fetchCoachNudge = async (biomeOverride?: typeof activeBiome) => {
    if (!uid) return;
    try {
      setCoachLoading(true);
      const res = await fetch('/api/v1/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          activeBiome: biomeOverride || activeBiome,
        }),
      });
      const data = await res.json();
      if (data.success && data.coach) {
        setCoachMsg(data.coach.message);
      }
    } catch (err) {
      console.error('Failed to load coach nudge:', err);
    } finally {
      setCoachLoading(false);
    }
  };

  useEffect(() => {
    if (uid) {
      if (userProfile?.activeBiome) {
        setActiveBiome(userProfile.activeBiome as any);
      }
      fetchCoachNudge(userProfile?.activeBiome as any);
    }
  }, [uid, userProfile?.activeBiome]);

  // Switch user's active biome avatar in Firestore
  const handleSwitchBiome = async (biome: typeof activeBiome) => {
    if (!uid || updatingBiome) return;
    try {
      setUpdatingBiome(true);
      setActiveBiome(biome);
      
      const { getFirebaseDb } = await import('@/lib/firebase');
      const { doc: firestoreDoc, updateDoc } = await import('firebase/firestore');
      const db = getFirebaseDb();
      const userRef = firestoreDoc(db, 'users', uid);
      await updateDoc(userRef, {
        activeBiome: biome,
        updatedAt: new Date().toISOString(),
      });

      if (refreshProfile) {
        await refreshProfile();
      }
      await fetchCoachNudge(biome);
    } catch (err) {
      console.error('Failed to switch biome:', err);
    } finally {
      setUpdatingBiome(false);
    }
  };

  const selectedBiomeInfo = BIOME_CONFIG[activeBiome];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-display text-3xl font-bold text-ink">Personalized Insights</h1>
        <p className="text-ink-soft mt-1">
          Explore interactive carbon analytics graphs, complete eco-challenges, and check in with Arbor.
        </p>
      </div>

      {/* ── Visual Analytics (Graphs Section) ── */}
      {mounted && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Trend Area Chart */}
          <Card className="glass-card">
            <CardHeader className="block mb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-ink">Emissions History</CardTitle>
                {isDemoData && (
                  <span className="text-[10px] font-mono font-bold bg-[#E8960A]/15 text-[#E8960A] px-2 py-0.5 rounded-full">
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-soft">
                {isDemoData ? 'Simulating monthly footprint progression.' : 'Your monthly carbon emissions tracking history.'}
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full pt-4">
                {logsLoading ? (
                  <Skeleton className="h-full w-full rounded-xl" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={finalChartData.trend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="emissionsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4DB87A" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#4DB87A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#5A7060' }} stroke="#D1E8D9" />
                      <YAxis tick={{ fontSize: 10, fill: '#5A7060' }} stroke="#D1E8D9" />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #D1E8D9',
                          borderRadius: '12px',
                          fontSize: '11px',
                          color: '#0F1C14',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                        }} 
                      />
                      <Area type="monotone" dataKey="Emissions" stroke="#2D7A4F" strokeWidth={2.5} fillOpacity={1} fill="url(#emissionsGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution Donut Chart */}
          <Card className="glass-card">
            <CardHeader className="block mb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-ink">Impact Breakdown</CardTitle>
                {isDemoData && (
                  <span className="text-[10px] font-mono font-bold bg-[#E8960A]/15 text-[#E8960A] px-2 py-0.5 rounded-full">
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-soft">
                {isDemoData ? 'Visualizing typical household carbon categories.' : 'Emissions split percentage across carbon activities.'}
              </p>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row items-center justify-around gap-4 pt-4">
              {logsLoading ? (
                <Skeleton className="h-44 w-44 rounded-full" />
              ) : (
                <>
                  <div className="h-44 w-44 relative shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={finalChartData.breakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {finalChartData.breakdown.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ 
                            background: 'rgba(255, 255, 255, 0.95)', 
                            border: '1px solid #D1E8D9',
                            borderRadius: '12px',
                            fontSize: '11px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl lively-emoji">🌱</span>
                      <span className="text-[9px] text-ink-soft font-mono uppercase font-bold mt-0.5">Carbon</span>
                    </div>
                  </div>

                  {/* Custom Legend */}
                  <div className="flex-1 space-y-2.5 w-full max-w-[200px]">
                    {finalChartData.breakdown.map((item, idx) => {
                      const totalVal = finalChartData.breakdown.reduce((sum, i) => sum + i.value, 0);
                      const pct = totalVal > 0 ? Math.round((item.value / totalVal) * 100) : 0;
                      return (
                        <div key={idx} className="flex items-center justify-between text-xs border-b border-[#D1E8D9]/30 pb-1 last:border-0 last:pb-0">
                          <div className="flex items-center gap-2">
                            <span className="text-base lively-emoji">{item.icon}</span>
                            <span className="font-semibold text-ink">{item.name}</span>
                          </div>
                          <span className="font-mono text-ink-soft font-bold">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Insights Main Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Arbor Biophilic Coach Card (Left Column) ────────────────────── */}
        <div className="space-y-6">
          <Card className={`relative overflow-hidden border ${selectedBiomeInfo.themeBg} shadow-glow`}>
            {/* Header background band */}
            <div className={`h-28 bg-gradient-to-r ${selectedBiomeInfo.gradientClass} absolute top-0 left-0 right-0`} />

            <CardContent className="pt-16 pb-6 relative z-10 flex flex-col items-center text-center">
              {/* Arbor Avatar */}
              <div className="w-24 h-24 rounded-full bg-white shadow-lg border-4 border-white flex items-center justify-center text-5xl mb-4 relative group">
                <span className="lively-emoji">{selectedBiomeInfo.avatarEmoji}</span>
                <span className="absolute bottom-1 right-1 text-xs bg-emerald-600 text-white rounded-full w-5 h-5 flex items-center justify-center font-bold font-mono">
                  {userProfile?.terraScore || 75}
                </span>
              </div>

              <h2 className="font-display text-xl font-bold text-ink">Arbor, The Planet Whisperer</h2>
              <span className="text-xs uppercase font-bold tracking-wider text-ink-soft bg-white/60 px-2.5 py-1 rounded-full mt-1.5 border border-[#D1E8D9]/40">
                Active Biome: {selectedBiomeInfo.label}
              </span>

              {/* Coach message */}
              <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 mt-6 border border-white/20 shadow-sm min-h-[120px] flex items-center justify-center">
                {coachLoading ? (
                  <div className="space-y-2 w-full">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/5" />
                  </div>
                ) : (
                  <p className="italic text-ink font-medium leading-relaxed text-sm sm:text-base">
                    {coachMsg}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Biome Switcher Card */}
          <Card className="glass-card">
            <CardHeader className="block">
              <CardTitle className="text-base font-bold text-ink">Switch Biome Avatar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(Object.keys(BIOME_CONFIG) as Array<keyof typeof BIOME_CONFIG>).map((b) => {
                const config = BIOME_CONFIG[b];
                const isActive = activeBiome === b;
                return (
                  <button
                    key={b}
                    onClick={() => handleSwitchBiome(b)}
                    disabled={updatingBiome || isActive}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-300 group ${
                      isActive
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                        : 'border-[#D1E8D9]/60 bg-white/60 hover:bg-emerald-50/30'
                    }`}
                  >
                    <span className="text-2xl lively-emoji">{config.avatarEmoji}</span>
                    <div className="flex-1">
                      <h4 className="font-semibold text-ink text-sm">{config.label}</h4>
                      <p className="text-xs text-ink-soft mt-0.5 leading-relaxed font-light">{config.desc}</p>
                    </div>
                  </button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* ── AI Carbon Recommendations (Right/Main Columns) ────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-bold text-ink">AI Tailored Actions</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs"
                onClick={refreshRecs}
                disabled={recsLoading}
              >
                {recsLoading ? 'Regenerating...' : '⚡ Regenerate Tips'}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {recsError && (
                <p className="text-sm text-rose-500 bg-rose-50 border border-rose-100 p-3 rounded-xl">
                  ⚠️ {recsError}
                </p>
              )}

              {recsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="p-4 border border-border rounded-xl space-y-3">
                    <Skeleton className="h-5 w-1/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ))
              ) : recommendations.length === 0 ? (
                <div className="text-center py-12 text-ink-soft">
                  <p className="text-4xl mb-2">💡</p>
                  <p className="font-medium text-lg">No recommendations yet</p>
                  <p className="text-sm mt-1">Complete your onboarding first to see custom AI tips!</p>
                </div>
              ) : (
                recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 sm:p-5 border border-[#D1E8D9]/60 rounded-2xl hover:border-emerald-300 transition-colors bg-white/60 flex flex-col justify-between"
                  >
                    <div>
                      {/* Title & Category badge */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-semibold text-ink text-sm sm:text-base leading-snug">{rec.title}</h3>
                        <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full flex-shrink-0">
                          {rec.category}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-xs sm:text-sm text-ink-soft leading-relaxed mb-4">
                        {rec.description}
                      </p>

                      {/* Carbon saving metric */}
                      <div className="flex flex-wrap items-center gap-4 text-xs font-mono font-bold text-ink-soft mb-4">
                        <span className="text-emerald-600">🌿 Estimated Saving: {rec.monthlyCo2Saving * 12} kg CO₂e/yr</span>
                        <span className="capitalize">🧠 Effort: {rec.effortLevel}</span>
                      </div>
                    </div>

                    {/* Feedback interactions */}
                    <div className="flex items-center justify-between border-t border-border/50 pt-3 text-xs">
                      <span className="text-ink-soft font-medium">Was this recommendation helpful?</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => submitFeedback(rec.id, 'helpful')}
                          className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                            rec.userFeedback === 'helpful'
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-800 font-semibold'
                              : 'border-border bg-white hover:bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          👍 Helpful
                        </button>
                        <button
                          onClick={() => submitFeedback(rec.id, 'not-relevant')}
                          className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                            rec.userFeedback === 'not-relevant'
                              ? 'bg-rose-100 border-rose-300 text-rose-800 font-semibold'
                              : 'border-border bg-white hover:bg-rose-50 text-rose-700'
                          }`}
                        >
                          👎 Not Relevant
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
