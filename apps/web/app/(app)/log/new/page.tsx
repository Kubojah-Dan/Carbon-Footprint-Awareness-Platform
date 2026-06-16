'use client';

import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useLogs } from '@/hooks/useLogs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  calculateTransportEmission,
  calculateFoodEmission,
  calculateEnergyEmission,
  calculateShoppingEmission,
} from '@earthprint/emission-engine';
import type { EmissionCategory } from '@earthprint/types';

const CATEGORIES: Array<{ value: EmissionCategory; label: string; icon: string }> = [
  { value: 'travel', label: 'Travel', icon: '🚗' },
  { value: 'food', label: 'Food', icon: '🍽' },
  { value: 'energy', label: 'Energy', icon: '⚡' },
  { value: 'shopping', label: 'Shopping', icon: '🛍' },
];

// ─── Category-specific form fields ────────────────────────────────────────────

const TRANSPORT_MODES = [
  { value: 'car-petrol', label: 'Petrol Car' },
  { value: 'car-diesel', label: 'Diesel Car' },
  { value: 'car-electric', label: 'Electric Car' },
  { value: 'car-hybrid', label: 'Hybrid Car' },
  { value: 'car-phev', label: 'Plug-in Hybrid' },
  { value: 'bus', label: 'Bus' },
  { value: 'train-local', label: 'Train' },
  { value: 'tram', label: 'Tram / Metro' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'cycling', label: 'Cycling' },
  { value: 'walking', label: 'Walking' },
  { value: 'flight-domestic', label: 'Domestic Flight' },
  { value: 'flight-short-haul', label: 'Short-haul Flight (<3h)' },
  { value: 'flight-long-haul', label: 'Long-haul Flight (>3h)' },
];

const FOOD_TYPES = [
  { value: 'beef', label: 'Beef / Lamb' },
  { value: 'pork', label: 'Pork' },
  { value: 'chicken', label: 'Chicken / Poultry' },
  { value: 'fish-farmed', label: 'Fish (farmed)' },
  { value: 'fish-wild', label: 'Fish (wild-caught)' },
  { value: 'dairy-milk', label: 'Milk' },
  { value: 'dairy-cheese', label: 'Cheese' },
  { value: 'eggs', label: 'Eggs' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruit' },
  { value: 'legumes', label: 'Legumes / Beans' },
  { value: 'grains', label: 'Bread / Cereals' },
  { value: 'nuts', label: 'Nuts' },
  { value: 'coffee', label: 'Coffee' },
  { value: 'chocolate', label: 'Chocolate' },
  { value: 'tofu', label: 'Tofu' },
  { value: 'oat-milk', label: 'Oat milk' },
  { value: 'almond-milk', label: 'Almond milk' },
];

const ENERGY_SOURCES = [
  { value: 'grid-electricity', label: 'Electricity (grid)' },
  { value: 'natural-gas', label: 'Natural gas' },
  { value: 'heating-oil', label: 'Heating oil' },
  { value: 'lpg', label: 'LPG' },
  { value: 'biomass', label: 'Biomass / Wood' },
  { value: 'solar-owned', label: 'Solar (own panels)' },
];

const SHOPPING_CATEGORIES = [
  { value: 'clothing-fast-fashion', label: 'Clothing — fast fashion' },
  { value: 'clothing-sustainable', label: 'Clothing — sustainable' },
  { value: 'clothing-secondhand', label: 'Clothing — second-hand' },
  { value: 'electronics-large', label: 'Large electronics' },
  { value: 'electronics-small', label: 'Small electronics' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'appliances', label: 'Appliances' },
  { value: 'food-delivery', label: 'Food delivery / takeaway' },
  { value: 'online-delivery', label: 'Online shopping (general)' },
  { value: 'services', label: 'Services / subscriptions' },
];

// ─── Main Form ─────────────────────────────────────────────────────────────────

export default function NewLogEntryPage() {
  const { user, userProfile } = useAuth();
  const { addLog } = useLogs(user?.uid);
  const router = useRouter();

  const [category, setCategory] = useState<EmissionCategory>('travel');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]!);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [previewKg, setPreviewKg] = useState<number | null>(null);
  const [error, setError] = useState('');

  // Category-specific fields
  const [transportMode, setTransportMode] = useState('car-petrol');
  const [distanceKm, setDistanceKm] = useState('');
  const [passengers, setPassengers] = useState('1');

  const [foodType, setFoodType] = useState('beef');
  const [weightGrams, setWeightGrams] = useState('');
  const [isOrganic, setIsOrganic] = useState(false);
  const [isLocal, setIsLocal] = useState(false);

  const [energySource, setEnergySource] = useState('grid-electricity');
  const [energyAmount, setEnergyAmount] = useState('');
  const [energyUnit, setEnergyUnit] = useState<'kwh' | 'therm' | 'litre' | 'm3'>('kwh');

  const [shoppingCategory, setShoppingCategory] = useState('clothing-fast-fashion');
  const [spendAmount, setSpendAmount] = useState('');
  const [spendCurrency, setSpendCurrency] = useState(userProfile?.preferredCurrency ?? 'GBP');
  const [isSecondHand, setIsSecondHand] = useState(false);

  function calculatePreview() {
    try {
      let kg = 0;
      let source = '';

      if (category === 'travel' && distanceKm) {
        const result = calculateTransportEmission({
          mode: transportMode as never,
          distanceKm: parseFloat(distanceKm),
          passengers: parseInt(passengers, 10),
        });
        kg = result.kgCo2e;
        source = transportMode;
      } else if (category === 'food' && weightGrams) {
        const result = calculateFoodEmission({
          foodType: foodType as never,
          weightGrams: parseFloat(weightGrams),
          isOrganic,
          isLocal,
        });
        kg = result.kgCo2e;
        source = foodType;
      } else if (category === 'energy' && energyAmount) {
        const result = calculateEnergyEmission({
          source: energySource as never,
          amount: parseFloat(energyAmount),
          unit: energyUnit,
          gridRegion: userProfile?.onboardingAnswers?.location?.gridRegion ?? 'GLOBAL',
        });
        kg = result.kgCo2e;
        source = energySource;
      } else if (category === 'shopping' && spendAmount) {
        const result = calculateShoppingEmission({
          category: shoppingCategory as never,
          spendAmount: parseFloat(spendAmount),
          spendCurrency,
          isSecondHand,
        });
        kg = result.kgCo2e;
        source = shoppingCategory;
      }

      setPreviewKg(kg);
      return { kg, source };
    } catch {
      return null;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    const calc = calculatePreview();
    if (!calc || calc.kg === 0) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!user) { setError('You must be signed in to log entries.'); return; }

    setIsSaving(true);
    try {
      await addLog({
        uid: user.uid,
        category,
        source: calc.source,
        kgCo2e: calc.kg,
        activityDate: date,
        notes: notes.trim() || undefined,
        loggedAt: new Date().toISOString(),
        isManualEntry: true,
      } as never);

      router.push('/log');
    } catch (err) {
      setError('Failed to save your log entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-ink-soft hover:text-ink text-sm mb-4 flex items-center gap-1">
          ← Back
        </button>
        <h1 className="font-display text-3xl text-ink">Log an Activity</h1>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-4 rounded-xl bg-[rgba(217,79,59,0.1)] border border-earth-coral/30 text-earth-coral text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category selector */}
        <Card>
          <CardHeader><CardTitle>Category</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  id={`cat-${cat.value}`}
                  onClick={() => { setCategory(cat.value); setPreviewKg(null); }}
                  className={[
                    'flex items-center gap-3 p-3 rounded-xl border text-left transition-all',
                    category === cat.value
                      ? 'border-forest-action bg-[rgba(45,122,79,0.08)]'
                      : 'border-border hover:border-forest-action/50',
                  ].join(' ')}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-sm font-semibold text-ink">{cat.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Date */}
        <Input
          id="log-date"
          label="Date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          isRequired
        />

        {/* Category-specific fields */}
        <Card>
          <CardHeader><CardTitle>Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {category === 'travel' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Transport mode</label>
                  <select
                    id="transport-mode"
                    value={transportMode}
                    onChange={(e) => { setTransportMode(e.target.value); setPreviewKg(null); }}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-forest-action"
                  >
                    {TRANSPORT_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <Input id="distance-km" label="Distance (km)" type="number" placeholder="e.g. 25" value={distanceKm} onChange={(e) => { setDistanceKm(e.target.value); setPreviewKg(null); }} isRequired min="0" step="0.1" />
                <Input id="passengers" label="Passengers (including you)" type="number" value={passengers} onChange={(e) => { setPassengers(e.target.value); setPreviewKg(null); }} min="1" max="9" hint="For shared car journeys — divides emissions by number of passengers" />
              </>
            )}

            {category === 'food' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Food type</label>
                  <select
                    id="food-type"
                    value={foodType}
                    onChange={(e) => { setFoodType(e.target.value); setPreviewKg(null); }}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-forest-action"
                  >
                    {FOOD_TYPES.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <Input id="weight-grams" label="Quantity (grams)" type="number" placeholder="e.g. 200" value={weightGrams} onChange={(e) => { setWeightGrams(e.target.value); setPreviewKg(null); }} isRequired min="0" hint="Approximate serving weight" />
                <div className="flex gap-4">
                  <ToggleField label="Organic" checked={isOrganic} onChange={(v) => { setIsOrganic(v); setPreviewKg(null); }} id="organic-toggle" />
                  <ToggleField label="Locally sourced" checked={isLocal} onChange={(v) => { setIsLocal(v); setPreviewKg(null); }} id="local-toggle" />
                </div>
              </>
            )}

            {category === 'energy' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Energy source</label>
                  <select
                    id="energy-source"
                    value={energySource}
                    onChange={(e) => { setEnergySource(e.target.value); setPreviewKg(null); }}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-forest-action"
                  >
                    {ENERGY_SOURCES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input id="energy-amount" label="Amount" type="number" placeholder="e.g. 100" value={energyAmount} onChange={(e) => { setEnergyAmount(e.target.value); setPreviewKg(null); }} isRequired min="0" step="0.1" />
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Unit</label>
                    <select
                      id="energy-unit"
                      value={energyUnit}
                      onChange={(e) => { setEnergyUnit(e.target.value as never); setPreviewKg(null); }}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-forest-action"
                    >
                      <option value="kwh">kWh</option>
                      <option value="therm">Therm</option>
                      <option value="m3">m³ (gas)</option>
                      <option value="litre">Litres (oil/LPG)</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            {category === 'shopping' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-ink mb-2">Shopping category</label>
                  <select
                    id="shopping-category"
                    value={shoppingCategory}
                    onChange={(e) => { setShoppingCategory(e.target.value); setPreviewKg(null); }}
                    className="w-full rounded-lg border border-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-forest-action"
                  >
                    {SHOPPING_CATEGORIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input id="spend-amount" label="Amount spent" type="number" placeholder="e.g. 75" value={spendAmount} onChange={(e) => { setSpendAmount(e.target.value); setPreviewKg(null); }} isRequired min="0" step="0.01" />
                  <div>
                    <label className="block text-sm font-medium text-ink mb-2">Currency</label>
                    <select
                      id="spend-currency"
                      value={spendCurrency}
                      onChange={(e) => { setSpendCurrency(e.target.value); setPreviewKg(null); }}
                      className="w-full rounded-lg border border-border px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-forest-action"
                    >
                      {['GBP', 'USD', 'EUR', 'INR', 'AUD', 'CAD', 'JPY', 'CNY'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <ToggleField label="Second-hand / refurbished?" checked={isSecondHand} onChange={(v) => { setIsSecondHand(v); setPreviewKg(null); }} id="secondhand-toggle" />
              </>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <div>
          <label htmlFor="log-notes" className="block text-sm font-medium text-ink mb-1.5">Notes (optional)</label>
          <textarea
            id="log-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Round trip to work, Organic steak, Monthly electric bill..."
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm text-ink resize-none focus:outline-none focus:ring-2 focus:ring-forest-action"
            maxLength={200}
          />
        </div>

        {/* CO₂e Preview */}
        {previewKg !== null && (
          <div className="p-4 rounded-xl bg-[rgba(45,122,79,0.08)] border border-forest-action/30 text-center animate-scale-in">
            <p className="text-sm text-ink-soft mb-1">Estimated CO₂e</p>
            <p className="font-mono text-4xl font-bold text-forest-action">
              {previewKg.toFixed(2)} <span className="text-xl">kg</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            id="btn-preview-emission"
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={calculatePreview}
          >
            Preview CO₂e
          </Button>
          <Button
            id="btn-save-log"
            type="submit"
            variant="primary"
            size="lg"
            className="flex-[2]"
            isLoading={isSaving}
          >
            Save Entry
          </Button>
        </div>
      </form>
    </div>
  );
}

function ToggleField({ label, checked, onChange, id }: { label: string; checked: boolean; onChange: (v: boolean) => void; id: string }) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-forest-action' : 'bg-border'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <label htmlFor={id} className="text-sm text-ink cursor-pointer" onClick={() => onChange(!checked)}>{label}</label>
    </div>
  );
}
