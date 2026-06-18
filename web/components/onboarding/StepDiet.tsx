'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { DietData } from '@earthprint/types';

interface StepDietProps {
  initial: DietData | null;
  onNext: (data: DietData) => void;
  onBack: () => void;
}

const dietTypes = [
  {
    value: 'omnivore',
    label: 'Omnivore',
    description: 'I eat meat most days',
    icon: '🥩',
    co2Hint: '~2,055 kg CO₂e/year',
  },
  {
    value: 'pescatarian',
    label: 'Pescatarian',
    description: 'I eat fish but not meat',
    icon: '🐟',
    co2Hint: '~1,391 kg CO₂e/year',
  },
  {
    value: 'vegetarian',
    label: 'Vegetarian',
    description: 'No meat or fish',
    icon: '🥦',
    co2Hint: '~1,055 kg CO₂e/year',
  },
  {
    value: 'vegan',
    label: 'Vegan',
    description: 'No animal products',
    icon: '🌱',
    co2Hint: '~738 kg CO₂e/year',
  },
];

const wasteOptions = [
  { value: 'none', label: 'None', desc: 'I waste very little food' },
  { value: 'low', label: 'Low', desc: 'Occasional waste' },
  { value: 'medium', label: 'Medium', desc: 'Typical household amount' },
  { value: 'high', label: 'High', desc: 'I throw away quite a bit' },
];

export default function StepDiet({ initial, onNext, onBack }: StepDietProps) {
  const [dietType, setDietType] = useState<DietData['dietType']>(initial?.dietType ?? 'omnivore');
  const [organicPercent, setOrganicPercent] = useState(initial?.organicPercent ?? 0);
  const [localFoodPercent, setLocalFoodPercent] = useState(initial?.localFoodPercent ?? 0);
  const [foodWasteLevel, setFoodWasteLevel] = useState<DietData['foodWasteLevel']>(initial?.foodWasteLevel ?? 'low');
  const [mealsOutPerWeek, setMealsOutPerWeek] = useState(initial?.mealsOutPerWeek ?? 3);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext({ dietType, organicPercent, localFoodPercent, foodWasteLevel, mealsOutPerWeek });
  }

  return (
    <div>
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(45,122,79,0.15)] flex items-center justify-center mb-4">
          <span className="text-2xl">🍽</span>
        </div>
        <h2 className="font-display text-3xl text-ink mb-2">What do you eat?</h2>
        <p className="text-ink-soft">
          Food accounts for ~25–30% of personal emissions. Source: Poore & Nemecek 2018 (Oxford).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Diet type */}
        <div>
          <label className="block text-sm font-medium text-ink mb-3">Your diet</label>
          <div className="space-y-2">
            {dietTypes.map((diet) => (
              <button
                key={diet.value}
                type="button"
                onClick={() => setDietType(diet.value as DietData['dietType'])}
                className={[
                  'w-full flex items-center gap-4 px-4 py-3.5 rounded-xl border text-left transition-all',
                  dietType === diet.value
                    ? 'border-forest-action bg-[rgba(45,122,79,0.08)]'
                    : 'border-border hover:border-forest-action/50',
                ].join(' ')}
              >
                <span className="text-2xl shrink-0">{diet.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">{diet.label}</p>
                  <p className="text-xs text-ink-soft">{diet.description}</p>
                </div>
                <span className="text-xs font-mono text-ink-soft shrink-0">{diet.co2Hint}</span>
                {dietType === diet.value && <span className="text-forest-action text-lg shrink-0">✓</span>}
              </button>
            ))}
          </div>
          <p className="text-xs text-ink-soft mt-2">CO₂ estimates: Scarborough et al. 2014, Climatic Change</p>
        </div>

        {/* Organic */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            How much of your food is organic? <span className="font-mono text-forest-action">{organicPercent}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={organicPercent}
            onChange={(e) => setOrganicPercent(Number(e.target.value))}
            className="w-full accent-forest-action"
            aria-label="Percentage of organic food"
          />
          <div className="flex justify-between text-xs text-ink-soft mt-1">
            <span>None</span><span>Half</span><span>All organic</span>
          </div>
        </div>

        {/* Local food */}
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            How much is locally sourced? <span className="font-mono text-forest-action">{localFoodPercent}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={10}
            value={localFoodPercent}
            onChange={(e) => setLocalFoodPercent(Number(e.target.value))}
            className="w-full accent-forest-action"
            aria-label="Percentage of locally sourced food"
          />
        </div>

        {/* Food waste */}
        <div>
          <label className="block text-sm font-medium text-ink mb-3">How much food do you waste?</label>
          <div className="grid grid-cols-2 gap-2">
            {wasteOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setFoodWasteLevel(opt.value as DietData['foodWasteLevel'])}
                className={[
                  'flex flex-col items-start p-3 rounded-xl border text-left transition-all',
                  foodWasteLevel === opt.value
                    ? 'border-forest-action bg-[rgba(45,122,79,0.08)]'
                    : 'border-border hover:border-forest-action/50',
                ].join(' ')}
              >
                <p className="text-sm font-medium text-ink">{opt.label}</p>
                <p className="text-xs text-ink-soft">{opt.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Meals out */}
        <div>
          <label htmlFor="meals-out" className="block text-sm font-medium text-ink mb-2">
            Meals out / takeaway per week: <span className="font-mono text-forest-action">{mealsOutPerWeek}</span>
          </label>
          <input
            id="meals-out"
            type="range"
            min={0}
            max={21}
            step={1}
            value={mealsOutPerWeek}
            onChange={(e) => setMealsOutPerWeek(Number(e.target.value))}
            className="w-full accent-forest-action"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onBack} size="lg" className="flex-1">← Back</Button>
          <Button id="step-diet-next" type="submit" variant="primary" size="lg" className="flex-[2]">Continue →</Button>
        </div>
      </form>

      <p className="mt-4 text-xs text-center text-ink-soft">Step 4 of 5 · Diet</p>
    </div>
  );
}
