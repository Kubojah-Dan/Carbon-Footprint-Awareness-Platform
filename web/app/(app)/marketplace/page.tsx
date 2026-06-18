'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import type { MarketplaceAction, UserMarketplaceAction } from '@earthprint/types';

export default function MarketplacePage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const uid = user?.uid;

  const [actions, setActions] = useState<MarketplaceAction[]>([]);
  const [userActions, setUserActions] = useState<UserMarketplaceAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<'all' | 'energy' | 'travel' | 'food' | 'shopping'>('all');

  // Modal State
  const [selectedAction, setSelectedAction] = useState<MarketplaceAction | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  const fetchMarketplace = useCallback(async () => {
    if (!uid) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/marketplace?uid=${uid}`);
      const data = await res.json();
      if (data.success) {
        setActions(data.actions);
        setUserActions(data.userActions);
      }
    } catch (err) {
      console.error('Failed to load marketplace:', err);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    if (uid) {
      fetchMarketplace();
    }
  }, [uid, fetchMarketplace]);

  const handleRedeemAction = async () => {
    if (!uid || !selectedAction) return;

    try {
      setRedeeming(true);
      setRedeemError(null);
      
      const res = await fetch('/api/v1/marketplace/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid,
          actionId: selectedAction.id,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Refresh local status
        setUserActions((prev) => [...prev, data.userAction]);
        if (data.userAction.redemptionCode) {
          setRevealedCode(data.userAction.redemptionCode);
        } else {
          // No points redeemed, just committed
          setSelectedAction(null);
          alert(data.message || 'Action committed successfully!');
        }
        
        // Refresh Auth provider points
        if (refreshProfile) {
          await refreshProfile();
        }
        
        // Also trigger global impact counter update
        if (selectedAction.monthlyCo2ImpactKg) {
          await fetch('/api/v1/impact/global', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              kgCo2eSaved: selectedAction.monthlyCo2ImpactKg,
            }),
          });
        }
      } else {
        setRedeemError(data.error || 'Redemption failed');
      }
    } catch (err: any) {
      setRedeemError(err.message || 'Network error occurred');
    } finally {
      setRedeeming(false);
    }
  };

  const getActionStatus = (actionId: string): 'available' | 'committed' | 'redeemed' => {
    const record = userActions.find((ua) => ua.actionId === actionId);
    if (!record) return 'available';
    return record.redemptionCode ? 'redeemed' : 'committed';
  };

  const getRedemptionCode = (actionId: string): string | undefined => {
    const record = userActions.find((ua) => ua.actionId === actionId);
    return record?.redemptionCode;
  };

  const filteredActions = actions.filter((action) => {
    if (filterCategory === 'all') return true;
    return action.category === filterCategory;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* ── Header Overview ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-green text-emerald-950 p-6 rounded-2xl shadow-glow">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">Action Marketplace</h1>
          <p className="text-emerald-950/80 mt-1 max-w-xl font-medium">
            Redeem your earned Green Points for carbon offset certificates, or commit to impactful environmental lifestyle changes.
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-4 text-center min-w-[150px]">
          <p className="text-2xl">🏆</p>
          <p className="font-mono text-3xl font-bold text-ink">
            {userProfile?.points?.toLocaleString() ?? 0}
          </p>
          <p className="text-xs text-ink/75 font-semibold">Available Points</p>
        </div>
      </div>

      {/* ── Category Filters ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 pb-2">
        {(['all', 'energy', 'travel', 'food', 'shopping'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filterCategory === cat
                ? 'bg-ink text-white'
                : 'bg-background-soft text-ink-soft hover:bg-border hover:text-ink'
            }`}
          >
            {cat === 'all' ? '🌍 All Actions' : cat === 'energy' ? '⚡ Energy' : cat === 'travel' ? '🚗 Travel' : cat === 'food' ? '🍽️ Food' : '🛍️ Shopping'}
          </button>
        ))}
      </div>

      {/* ── Listings Grid ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-6 space-y-3">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-10 w-full mt-4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredActions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-ink-soft">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium text-lg">No actions available in this category</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredActions.map((action) => {
            const status = getActionStatus(action.id);
            const code = getRedemptionCode(action.id);
            
            return (
              <Card
                key={action.id}
                className={`flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden ${
                  status !== 'available' ? 'border-emerald-300 bg-emerald-50/20' : ''
                }`}
              >
                {/* Ribbon badge for status */}
                {status !== 'available' && (
                  <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-bl-xl shadow-sm">
                    {status === 'redeemed' ? 'Redeemed' : 'Committed'}
                  </div>
                )}

                <CardContent className="py-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 bg-background-soft rounded-xl flex items-center justify-center text-2xl shadow-sm">
                        {action.iconEmoji}
                      </div>
                      <div>
                        <h3 className="font-semibold text-ink leading-tight">{action.title}</h3>
                        <p className="text-xs text-ink-soft mt-0.5 capitalize">
                          {action.type.replace('-', ' ')}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-ink-soft leading-relaxed mb-4">
                      {action.description}
                    </p>

                    {/* Meta stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4 border-t border-border pt-3">
                      <div>
                        <span className="text-ink-soft">CO₂ Impact:</span>
                        <p className="font-bold text-emerald-600">-{action.monthlyCo2ImpactKg} kg/mo</p>
                      </div>
                      <div>
                        <span className="text-ink-soft">Effort:</span>
                        <p className="font-bold text-ink capitalize">{action.effortLevel}</p>
                      </div>
                    </div>
                  </div>

                  {/* CTA button */}
                  <div>
                    {status === 'redeemed' && code ? (
                      <div className="bg-emerald-100 border border-emerald-300 rounded-xl p-3 text-center">
                        <span className="text-[10px] font-bold text-emerald-800 tracking-wider block mb-1">YOUR REDEMPTION CODE:</span>
                        <code className="font-mono text-xs font-bold text-emerald-950 select-all block bg-white py-1 rounded">
                          {code}
                        </code>
                      </div>
                    ) : status === 'committed' ? (
                      <Button variant="outline" size="sm" className="w-full text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border-emerald-300" disabled>
                        Committed
                      </Button>
                    ) : action.isRedeemable ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          setSelectedAction(action);
                          setRevealedCode(null);
                          setRedeemError(null);
                        }}
                      >
                        Redeem for {action.pointsCost} Points
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-emerald-600 text-emerald-700 hover:bg-emerald-50"
                        onClick={() => {
                          setSelectedAction(action);
                          setRevealedCode(null);
                          setRedeemError(null);
                        }}
                      >
                        Commit to Action
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Redemption / Commitment Modal ─────────────────────────────────────── */}
      {selectedAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedAction(null)}
              className="absolute top-4 right-4 text-ink-soft hover:text-ink text-xl font-bold"
            >
              ✕
            </button>

            {revealedCode ? (
              // Success Redemption View
              <div className="text-center space-y-4 py-4">
                <p className="text-5xl">🎉</p>
                <h3 className="font-display text-2xl font-bold text-ink">Reward Redeemed!</h3>
                <p className="text-sm text-ink-soft">
                  Successfully redeemed <strong>{selectedAction.title}</strong>. Copy your code below to use it.
                </p>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <span className="text-xs text-emerald-800 font-bold block mb-1">PROMO / REDEMPTION CODE:</span>
                  <code className="font-mono text-lg font-bold text-emerald-950 select-all block bg-white p-2 rounded shadow-sm border border-emerald-200/50">
                    {revealedCode}
                  </code>
                </div>
                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={() => {
                    setSelectedAction(null);
                    fetchMarketplace();
                  }}
                >
                  Done
                </Button>
              </div>
            ) : (
              // Confirmation View
              <>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-background-soft rounded-xl flex items-center justify-center text-2xl">
                    {selectedAction.iconEmoji}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">{selectedAction.title}</h3>
                    <p className="text-xs text-ink-soft capitalize">{selectedAction.type.replace('-', ' ')}</p>
                  </div>
                </div>

                <div className="text-sm text-ink-soft space-y-2 leading-relaxed">
                  <p>
                    {selectedAction.isRedeemable
                      ? `Are you sure you want to spend ${selectedAction.pointsCost} Bloom Points to redeem this carbon offset certificate?`
                      : 'Are you sure you want to commit to this sustainable lifestyle switch? Logging relevant activities will track your progress.'}
                  </p>
                  <p className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 p-2 rounded-lg">
                    🌎 Estimated carbon savings: {selectedAction.monthlyCo2ImpactKg} kg CO₂e per month!
                  </p>
                </div>

                {redeemError && (
                  <p className="text-xs text-rose-500 bg-rose-50 border border-rose-100 p-2.5 rounded-lg">
                    ⚠️ {redeemError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setSelectedAction(null)}
                    disabled={redeeming}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    className="flex-1"
                    onClick={handleRedeemAction}
                    disabled={redeeming}
                  >
                    {redeeming ? 'Processing...' : selectedAction.isRedeemable ? 'Redeem Now' : 'Commit Now'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
