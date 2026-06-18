import React from 'react';
import type { AIRecommendation } from '@earthprint/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { analytics } from '@/lib/analytics';

const CATEGORY_CONFIG = {
  travel: { icon: '🚗', label: 'Travel', color: '#3B82F6', bgClass: 'category-bg-travel', textClass: 'category-travel' },
  food: { icon: '🍽', label: 'Food', color: '#10B981', bgClass: 'category-bg-food', textClass: 'category-food' },
  energy: { icon: '⚡', label: 'Energy', color: '#F59E0B', bgClass: 'category-bg-energy', textClass: 'category-energy' },
  shopping: { icon: '🛍', label: 'Shopping', color: '#8B5CF6', bgClass: 'category-bg-shopping', textClass: 'category-shopping' },
};

const effortLabels = { low: '⚡ Low effort', medium: '💪 Medium', high: '🏋 High effort' };
const costLabels = {
  'saves-money': '💰 Saves money',
  'cost-neutral': '↔ Cost neutral',
  'small-cost': '💶 Small cost',
  'significant-cost': '💸 Significant cost',
};

interface RecommendationCardProps {
  rec: AIRecommendation;
  index: number;
  onFeedback: (id: string, feedback: 'helpful' | 'not-relevant') => Promise<void>;
}

export function RecommendationCard({ rec, index, onFeedback }: RecommendationCardProps) {
  const config = CATEGORY_CONFIG[rec.category as keyof typeof CATEGORY_CONFIG] ?? CATEGORY_CONFIG.travel;

  function handleFeedback(fb: 'helpful' | 'not-relevant') {
    analytics.tipFeedback(rec.id, fb);
    onFeedback(rec.id, fb);
  }

  return (
    <Card id={`rec-card-${index}`} variant="elevated" className="flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{config.icon}</span>
        <div className="flex gap-1.5">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.bgClass} ${config.textClass}`}>
            {config.label}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-pale-green text-forest-deep font-medium">
            −{Math.round(rec.monthlyCo2Saving)} kg/mo
          </span>
        </div>
      </div>

      <h3 className="font-semibold text-ink text-base mb-2 leading-snug">{rec.title}</h3>
      <p className="text-sm text-ink-soft leading-relaxed flex-1 mb-4">{rec.description}</p>

      <div className="flex gap-1.5 mb-4 flex-wrap">
        <span className="text-xs text-ink-soft">{effortLabels[rec.effortLevel]}</span>
        <span className="text-xs text-ink-soft">·</span>
        <span className="text-xs text-ink-soft">{costLabels[rec.costImpact]}</span>
      </div>

      {!rec.userFeedback ? (
        <div className="flex gap-2">
          <Button
            id={`btn-tip-helpful-${index}`}
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => handleFeedback('helpful')}
          >
            👍 Helpful
          </Button>
          <Button
            id={`btn-tip-not-relevant-${index}`}
            variant="ghost"
            size="sm"
            fullWidth
            onClick={() => handleFeedback('not-relevant')}
          >
            Not relevant
          </Button>
        </div>
      ) : (
        <p className="text-xs text-center text-ink-soft">
          {rec.userFeedback === 'helpful' ? '👍 Thanks for the feedback!' : '✓ We\'ll show you different tips next time'}
        </p>
      )}
    </Card>
  );
}
