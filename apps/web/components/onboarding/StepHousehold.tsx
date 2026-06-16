'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import type { HouseholdData } from '@earthprint/types';

interface StepHouseholdProps {
  initial: HouseholdData | null;
  onNext: (data: HouseholdData) => void;
  onBack: () => void;
}

const heatingOptions = [
  { value: 'gas', label: 'Gas (mains)', icon: '🔥' },
  { value: 'electric', label: 'Electric / Heat pump', icon: '⚡' },
  { value: 'heat-pump', label: 'Dedicated heat pump', icon: '🌡' },
  { value: 'oil', label: 'Heating oil', icon: '🛢' },
  { value: 'biomass', label: 'Biomass / Wood pellets', icon: '🪵' },
  { value: 'district', label: 'District heating', icon: '🏙' },
  { value: 'none', label: 'None / Other', icon: '❓' },
];

const dwellingOptions = [
  { value: 'detached', label: 'Detached house', icon: '🏡' },
  { value: 'semi-detached', label: 'Semi-detached', icon: '🏠' },
  { value: 'terraced', label: 'Terraced house', icon: '🏘' },
  { value: 'flat', label: 'Flat / Apartment', icon: '🏢' },
];

export default function StepHousehold({ initial, onNext, onBack }: StepHouseholdProps) {
  const [size, setSize] = useState(initial?.size ?? 2);
  const [dwellingType, setDwellingType] = useState<HouseholdData['dwellingType']>(initial?.dwellingType ?? 'flat');
  const [heatingType, setHeatingType] = useState<HouseholdData['heatingType']>(initial?.heatingType ?? 'gas');
  const [hasAirConditioning, setHasAirConditioning] = useState(initial?.hasAirConditioning ?? false);
  const [homeOwnership, setHomeOwnership] = useState<HouseholdData['homeOwnership']>(initial?.homeOwnership ?? 'rented');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext({ size, dwellingType, heatingType, hasAirConditioning, homeOwnership });
  }

  return (
    <div>
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(45,122,79,0.15)] flex items-center justify-center mb-4">
          <span className="text-2xl">🏠</span>
        </div>
        <h2 className="font-display text-3xl text-ink mb-2">Tell us about your home</h2>
        <p className="text-ink-soft">Home energy is typically 25% of individual emissions. This helps us estimate yours accurately.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Household size */}
        <div>
          <label className="block text-sm font-medium text-ink mb-3">
            How many people in your household?
          </label>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setSize((s) => Math.max(1, s - 1))}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-ink hover:border-forest-action hover:text-forest-action transition-colors text-xl font-bold"
              aria-label="Decrease household size"
            >
              −
            </button>
            <span className="font-mono text-3xl font-bold text-ink w-12 text-center" aria-live="polite">
              {size}
            </span>
            <button
              type="button"
              onClick={() => setSize((s) => Math.min(10, s + 1))}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-ink hover:border-forest-action hover:text-forest-action transition-colors text-xl font-bold"
              aria-label="Increase household size"
            >
              +
            </button>
            <span className="text-ink-soft text-sm">{size === 1 ? 'person' : 'people'}</span>
          </div>
        </div>

        {/* Dwelling type */}
        <div>
          <label className="block text-sm font-medium text-ink mb-3">Dwelling type</label>
          <div className="grid grid-cols-2 gap-2">
            {dwellingOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDwellingType(opt.value as HouseholdData['dwellingType'])}
                className={[
                  'flex items-center gap-2.5 px-4 py-3 rounded-xl border text-left transition-all',
                  dwellingType === opt.value
                    ? 'border-forest-action bg-[rgba(45,122,79,0.08)] text-forest-deep'
                    : 'border-border hover:border-forest-action/50 text-ink',
                ].join(' ')}
              >
                <span>{opt.icon}</span>
                <span className="text-sm font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Heating type */}
        <div>
          <label className="block text-sm font-medium text-ink mb-3">Primary heating source</label>
          <div className="space-y-2">
            {heatingOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setHeatingType(opt.value as HouseholdData['heatingType'])}
                className={[
                  'w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all',
                  heatingType === opt.value
                    ? 'border-forest-action bg-[rgba(45,122,79,0.08)] text-forest-deep'
                    : 'border-border hover:border-forest-action/50 text-ink',
                ].join(' ')}
              >
                <span>{opt.icon}</span>
                <span className="text-sm font-medium">{opt.label}</span>
                {heatingType === opt.value && <span className="ml-auto text-forest-action">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Air conditioning */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-border">
          <div>
            <p className="text-sm font-medium text-ink">Air conditioning</p>
            <p className="text-xs text-ink-soft mt-0.5">Do you regularly use A/C in summer?</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={hasAirConditioning}
            onClick={() => setHasAirConditioning((v) => !v)}
            className={[
              'relative w-12 h-6 rounded-full transition-colors duration-200',
              hasAirConditioning ? 'bg-forest-action' : 'bg-border',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200',
                hasAirConditioning ? 'translate-x-6' : 'translate-x-0',
              ].join(' ')}
            />
          </button>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onBack} size="lg" className="flex-1">
            ← Back
          </Button>
          <Button id="step-household-next" type="submit" variant="primary" size="lg" className="flex-[2]">
            Continue →
          </Button>
        </div>
      </form>

      <p className="mt-4 text-xs text-center text-ink-soft">Step 2 of 5 · Household</p>
    </div>
  );
}
