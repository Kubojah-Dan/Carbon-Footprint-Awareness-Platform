'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import type { calculateBaseline } from '@earthprint/emission-engine';

type BaselineData = ReturnType<typeof calculateBaseline>;

interface BaselineResultProps {
  baseline: BaselineData;
  onContinue: () => void;
}

const CATEGORY_CONFIG = {
  travel: { icon: '🚗', label: 'Travel', color: '#3B82F6' },
  food: { icon: '🍽', label: 'Food', color: '#10B981' },
  energy: { icon: '⚡', label: 'Energy', color: '#F59E0B' },
  shopping: { icon: '🛍', label: 'Shopping', color: '#8B5CF6' },
};

export function BaselineResult({ baseline, onContinue }: BaselineResultProps) {
  const isBelowAverage = baseline.comparedToAverage < 0;
  const isAboveAverage = baseline.comparedToAverage > 15;

  // Empowering message — never guilt-based
  const motivationalMessage = isBelowAverage
    ? `🌟 You're already ${Math.abs(baseline.comparedToAverage)}% below your country's average. Let's push further!`
    : isAboveAverage
    ? `💚 Great news — with a few targeted changes, you could cut this in half within a year.`
    : `👍 You're close to average. Small, consistent changes will make a big difference.`;

  return (
    <div className="min-h-screen bg-forest-deep flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-green flex items-center justify-center shadow-glow mx-auto mb-4">
            <span className="text-3xl">🌍</span>
          </div>
          <h1 className="font-display text-4xl text-ink-inverse mb-3">
            Your Carbon Footprint
          </h1>
          <p className="text-pale-green/90 text-lg">Based on your lifestyle answers</p>
        </div>

        {/* Main number */}
        <div className="glass-card-dark rounded-2xl p-8 mb-6 text-center border border-forest-action/20">
          <p className="text-pale-green/80 text-sm font-mono uppercase tracking-wider mb-2">Annual footprint</p>
          <p className="font-mono text-6xl font-bold text-ink-inverse mb-1 animate-count-up">
            {baseline.annualKgCo2e.toLocaleString()}
          </p>
          <p className="text-pale-green text-lg font-medium mb-4">kg CO₂e per year</p>

          {/* Comparison */}
          <div className="flex items-center justify-center gap-6 text-sm border-t border-forest-action/20 pt-4">
            <div className="text-center">
              <p className="text-pale-green/75">Country avg</p>
              <p className="font-mono font-bold text-ink-inverse">{baseline.countryAverageKgCo2e.toLocaleString()} kg</p>
            </div>
            <div className={`px-3 py-1.5 rounded-2xl text-sm font-bold font-mono ${
              isBelowAverage ? 'bg-[rgba(77,184,122,0.2)] text-growth-green' : 'bg-[rgba(232,150,10,0.2)] text-sunlight-amber'
            }`}>
              {isBelowAverage ? '▼' : '▲'} {Math.abs(baseline.comparedToAverage)}%
            </div>
            <div className="text-center">
              <p className="text-pale-green/75">Global avg</p>
              <p className="font-mono font-bold text-ink-inverse">{baseline.globalAverageKgCo2e.toLocaleString()} kg</p>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="glass-card-dark rounded-2xl p-6 mb-6 border border-forest-action/20">
          <h3 className="text-sm font-semibold text-pale-green/80 uppercase tracking-wider mb-4 font-mono">Breakdown by category</h3>
          <div className="space-y-3">
            {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((cat) => {
              const config = CATEGORY_CONFIG[cat];
              const value = baseline.byCategory[cat];
              const pct = Math.round((value / baseline.annualKgCo2e) * 100);
              return (
                <div key={cat}>
                  <div className="flex items-center justify-between mb-1.5">
                     <div className="flex items-center gap-2">
                      <span className="text-base">{config.icon}</span>
                      <span className="text-sm text-ink-inverse font-medium">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-pale-green/75">{pct}%</span>
                      <span className="text-sm font-mono font-bold text-ink-inverse">{Math.round(value).toLocaleString()} kg</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-forest-deep">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: config.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Monthly target */}
        <div className="glass-card-dark rounded-xl p-5 mb-6 border border-growth-green/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-pale-green/90">Your monthly target</p>
              <p className="font-mono text-2xl font-bold text-ink-inverse mt-0.5">
                {baseline.monthlyTarget.toFixed(0)} kg
              </p>
              <p className="text-xs text-pale-green/75 mt-1">10% below your monthly average</p>
            </div>
            <div className="text-4xl">🎯</div>
          </div>
        </div>

        {/* Motivational message */}
        <div className="rounded-xl bg-forest-mid p-4 mb-8">
          <p className="text-sm text-pale-green text-center leading-relaxed">{motivationalMessage}</p>
        </div>

        {/* Methodology note */}
        <p className="text-xs text-center text-pale-green/70 mb-6">
          Methodology: {baseline.methodology}
        </p>

        <Button
          id="baseline-continue"
          variant="primary"
          size="lg"
          fullWidth
          onClick={onContinue}
        >
          Go to My Dashboard →
        </Button>
      </div>
    </div>
  );
}
