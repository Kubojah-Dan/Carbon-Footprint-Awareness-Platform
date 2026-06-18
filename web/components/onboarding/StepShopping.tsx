'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { ShoppingData } from '@earthprint/types';

interface StepShoppingProps {
  initial: ShoppingData | null;
  onNext: (data: ShoppingData) => void;
  onBack: () => void;
  isSaving: boolean;
}

const fastFashionOptions = [
  { value: 'never', label: 'Never', icon: '🚫' },
  { value: 'rarely', label: 'Rarely', desc: 'A few items/year' },
  { value: 'sometimes', label: 'Sometimes', desc: 'Monthly or so' },
  { value: 'often', label: 'Often', desc: 'Several items/month' },
  { value: 'always', label: 'Always', desc: 'Big fast fashion fan' },
];

const secondHandOptions = [
  { value: 'never', label: 'Never — I always buy new', icon: '🛒' },
  { value: 'sometimes', label: 'Sometimes — when convenient', icon: '♻️' },
  { value: 'often', label: 'Often — my default choice', icon: '🏆' },
];

const budgetOptions = [
  { value: 'low', label: 'Budget-conscious', desc: '< £500/month on goods' },
  { value: 'medium', label: 'Average', desc: '£500–£1,500/month' },
  { value: 'high', label: 'High spender', desc: '£1,500+/month' },
];

export default function StepShopping({ initial, onNext, onBack, isSaving }: StepShoppingProps) {
  const [fastFashionFrequency, setFastFashion] = useState<ShoppingData['fastFashionFrequency']>(initial?.fastFashionFrequency ?? 'sometimes');
  const [newElectronicsPerYear, setElectronics] = useState(initial?.newElectronicsPerYear ?? 1);
  const [deliveryOrdersPerWeek, setDelivery] = useState(initial?.deliveryOrdersPerWeek ?? 3);
  const [buySecondHand, setBuySecondHand] = useState<ShoppingData['buySecondHand']>(initial?.buySecondHand ?? 'sometimes');
  const [budgetLevel, setBudgetLevel] = useState<ShoppingData['budgetLevel']>(initial?.budgetLevel ?? 'medium');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext({
      newClothingItemsPerMonth: { never: 0, rarely: 1, sometimes: 3, often: 6, always: 10 }[fastFashionFrequency] ?? 3,
      fastFashionFrequency,
      newElectronicsPerYear,
      deliveryOrdersPerWeek,
      budgetLevel,
      buySecondHand,
    });
  }

  return (
    <div>
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(45,122,79,0.15)] flex items-center justify-center mb-4">
          <span className="text-2xl">🛍</span>
        </div>
        <h2 className="font-display text-3xl text-ink mb-2">Your shopping habits</h2>
        <p className="text-ink-soft">Consumer goods have a surprisingly large carbon footprint. Source: DEFRA 2023 spend-based factors.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fast fashion frequency */}
        <div>
          <label className="block text-sm font-medium text-ink mb-3">How often do you buy fast fashion?</label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {fastFashionOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFastFashion(opt.value as ShoppingData['fastFashionFrequency'])}
                className={[
                  'flex-shrink-0 flex flex-col items-center gap-1 px-3 py-3 rounded-xl border text-center transition-all min-w-[76px]',
                  fastFashionFrequency === opt.value
                    ? 'border-forest-action bg-[rgba(45,122,79,0.08)] text-forest-deep'
                    : 'border-border hover:border-forest-action/50 text-ink',
                ].join(' ')}
              >
                {opt.icon && <span className="text-lg">{opt.icon}</span>}
                <p className="text-xs font-semibold">{opt.label}</p>
                {opt.desc && <p className="text-[10px] text-ink-soft">{opt.desc}</p>}
              </button>
            ))}
          </div>
        </div>

        {/* New electronics */}
        <div>
          <label htmlFor="electronics-slider" className="block text-sm font-medium text-ink mb-2">
            New electronics per year: <span className="font-mono text-forest-action">{newElectronicsPerYear}</span>
          </label>
          <input
            id="electronics-slider"
            type="range"
            min={0}
            max={10}
            step={1}
            value={newElectronicsPerYear}
            onChange={(e) => setElectronics(Number(e.target.value))}
            className="w-full accent-forest-action"
          />
          <p className="text-xs text-ink-soft mt-1">Includes phones, laptops, tablets, TVs, appliances</p>
        </div>

        {/* Online delivery orders */}
        <div>
          <label htmlFor="delivery-slider" className="block text-sm font-medium text-ink mb-2">
            Online delivery orders/week: <span className="font-mono text-forest-action">{deliveryOrdersPerWeek}</span>
          </label>
          <input
            id="delivery-slider"
            type="range"
            min={0}
            max={20}
            step={1}
            value={deliveryOrdersPerWeek}
            onChange={(e) => setDelivery(Number(e.target.value))}
            className="w-full accent-forest-action"
          />
        </div>

        {/* Second hand */}
        <div>
          <label className="block text-sm font-medium text-ink mb-3">
            Do you buy second-hand? (clothes, electronics, furniture)
          </label>
          <div className="space-y-2">
            {secondHandOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBuySecondHand(opt.value as ShoppingData['buySecondHand'])}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                  buySecondHand === opt.value
                    ? 'border-forest-action bg-[rgba(45,122,79,0.08)]'
                    : 'border-border hover:border-forest-action/50',
                ].join(' ')}
              >
                <span className="text-xl">{opt.icon}</span>
                <span className="text-sm font-medium text-ink">{opt.label}</span>
                {buySecondHand === opt.value && <span className="ml-auto text-forest-action">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Budget level */}
        <div>
          <label className="block text-sm font-medium text-ink mb-3">Overall spending on goods</label>
          <div className="grid grid-cols-3 gap-2">
            {budgetOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setBudgetLevel(opt.value as ShoppingData['budgetLevel'])}
                className={[
                  'flex flex-col items-start p-3 rounded-xl border text-left transition-all',
                  budgetLevel === opt.value
                    ? 'border-forest-action bg-[rgba(45,122,79,0.08)]'
                    : 'border-border hover:border-forest-action/50',
                ].join(' ')}
              >
                <p className="text-xs font-semibold text-ink">{opt.label}</p>
                <p className="text-[11px] text-ink-soft mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onBack} size="lg" className="flex-1" disabled={isSaving}>
            ← Back
          </Button>
          <Button id="step-shopping-next" type="submit" variant="primary" size="lg" className="flex-[2]" isLoading={isSaving}>
            {isSaving ? 'Calculating...' : 'See My Footprint →'}
          </Button>
        </div>
      </form>

      <p className="mt-4 text-xs text-center text-ink-soft">Step 5 of 5 · Shopping</p>
    </div>
  );
}
