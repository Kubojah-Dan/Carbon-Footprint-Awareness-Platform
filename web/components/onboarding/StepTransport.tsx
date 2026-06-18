'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { TransportData } from '@earthprint/types';

interface StepTransportProps {
  initial: TransportData | null;
  onNext: (data: TransportData) => void;
  onBack: () => void;
}

const vehicleTypes = [
  { value: 'petrol', label: 'Petrol', icon: '⛽' },
  { value: 'diesel', label: 'Diesel', icon: '🛢' },
  { value: 'hybrid', label: 'Hybrid', icon: '🔄' },
  { value: 'phev', label: 'Plug-in Hybrid', icon: '🔌' },
  { value: 'electric', label: 'Electric', icon: '⚡' },
];

const flightClasses = [
  { value: 'economy', label: 'Economy', icon: '💺' },
  { value: 'business', label: 'Business', icon: '🛋' },
  { value: 'first', label: 'First Class', icon: '✨' },
];

export default function StepTransport({ initial, onNext, onBack }: StepTransportProps) {
  const [hasCarOrVan, setHasCarOrVan] = useState(initial?.hasCarOrVan ?? false);
  const [vehicleFuelType, setVehicleFuelType] = useState<TransportData['vehicleFuelType']>(initial?.vehicleFuelType ?? 'petrol');
  const [weeklyCarKm, setWeeklyCarKm] = useState(initial?.weeklyCarKm ?? 100);
  const [usesPublicTransport, setUsesPublicTransport] = useState(initial?.usesPublicTransport ?? true);
  const [weeklyPublicTransportKm, setWeeklyPublicTransportKm] = useState(initial?.weeklyPublicTransportKm ?? 30);
  const [flightsPerYear, setFlightsPerYear] = useState(initial?.flightsPerYear ?? 0);
  const [longHaulFlightsPerYear, setLongHaulFlightsPerYear] = useState(initial?.longHaulFlightsPerYear ?? 0);
  const [flightClass, setFlightClass] = useState<TransportData['flightClass']>(initial?.flightClass ?? 'economy');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onNext({
      hasCarOrVan,
      vehicleFuelType: hasCarOrVan ? vehicleFuelType : 'none',
      carUsageFrequency: 'daily',
      weeklyCarKm: hasCarOrVan ? weeklyCarKm : 0,
      usesPublicTransport,
      weeklyPublicTransportKm: usesPublicTransport ? weeklyPublicTransportKm : 0,
      flightsPerYear,
      longHaulFlightsPerYear,
      flightClass,
    });
  }

  return (
    <div>
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(45,122,79,0.15)] flex items-center justify-center mb-4">
          <span className="text-2xl">🚗</span>
        </div>
        <h2 className="font-display text-3xl text-ink mb-2">How do you get around?</h2>
        <p className="text-ink-soft">Transport is typically the biggest source of personal emissions. Be honest — no judgment here!</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Car */}
        <div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-border mb-3">
            <div>
              <p className="text-sm font-medium text-ink">Do you own or regularly use a car or van?</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={hasCarOrVan}
              onClick={() => setHasCarOrVan((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${hasCarOrVan ? 'bg-forest-action' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${hasCarOrVan ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {hasCarOrVan && (
            <div className="space-y-4 pl-0">
              <div>
                <label className="block text-sm font-medium text-ink mb-2">Fuel type</label>
                <div className="grid grid-cols-5 gap-2">
                  {vehicleTypes.map((vt) => (
                    <button
                      key={vt.value}
                      type="button"
                      onClick={() => setVehicleFuelType(vt.value as TransportData['vehicleFuelType'])}
                      className={[
                        'flex flex-col items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all',
                        vehicleFuelType === vt.value
                          ? 'border-forest-action bg-[rgba(45,122,79,0.08)] text-forest-deep'
                          : 'border-border hover:border-forest-action/50 text-ink',
                      ].join(' ')}
                    >
                      <span className="text-xl">{vt.icon}</span>
                      <span>{vt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink mb-2">
                  Approximate weekly driving distance: <span className="font-mono text-forest-action">{weeklyCarKm} km</span>
                </label>
                <input
                  type="range"
                  min={0}
                  max={1000}
                  step={10}
                  value={weeklyCarKm}
                  onChange={(e) => setWeeklyCarKm(Number(e.target.value))}
                  className="w-full accent-forest-action"
                  aria-label="Weekly car distance in km"
                />
                <div className="flex justify-between text-xs text-ink-soft mt-1">
                  <span>0 km</span><span>500 km</span><span>1000 km</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Public transport */}
        <div>
          <div className="flex items-center justify-between p-4 rounded-xl border border-border mb-3">
            <p className="text-sm font-medium text-ink">Do you use public transport?</p>
            <button
              type="button"
              role="switch"
              aria-checked={usesPublicTransport}
              onClick={() => setUsesPublicTransport((v) => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors ${usesPublicTransport ? 'bg-forest-action' : 'bg-border'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${usesPublicTransport ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          {usesPublicTransport && (
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Weekly public transport distance: <span className="font-mono text-forest-action">{weeklyPublicTransportKm} km</span>
              </label>
              <input
                type="range"
                min={0}
                max={500}
                step={5}
                value={weeklyPublicTransportKm}
                onChange={(e) => setWeeklyPublicTransportKm(Number(e.target.value))}
                className="w-full accent-forest-action"
                aria-label="Weekly public transport distance in km"
              />
            </div>
          )}
        </div>

        {/* Flights */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-ink">Flights per year</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="short-haul-flights" className="text-xs text-ink-soft mb-1 block">Short-haul (&lt;3h)</label>
              <input
                id="short-haul-flights"
                type="number"
                min={0}
                max={50}
                value={flightsPerYear}
                onChange={(e) => setFlightsPerYear(Number(e.target.value))}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-base text-ink focus:outline-none focus:ring-2 focus:ring-forest-action"
              />
            </div>
            <div>
              <label htmlFor="long-haul-flights" className="text-xs text-ink-soft mb-1 block">Long-haul (&gt;3h)</label>
              <input
                id="long-haul-flights"
                type="number"
                min={0}
                max={20}
                value={longHaulFlightsPerYear}
                onChange={(e) => setLongHaulFlightsPerYear(Number(e.target.value))}
                className="w-full rounded-lg border border-border px-3 py-2.5 text-base text-ink focus:outline-none focus:ring-2 focus:ring-forest-action"
              />
            </div>
          </div>

          {(flightsPerYear > 0 || longHaulFlightsPerYear > 0) && (
            <div>
              <label className="block text-sm font-medium text-ink mb-2">Typical cabin class</label>
              <div className="flex gap-2">
                {flightClasses.map((fc) => (
                  <button
                    key={fc.value}
                    type="button"
                    onClick={() => setFlightClass(fc.value as TransportData['flightClass'])}
                    className={[
                      'flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all',
                      flightClass === fc.value
                        ? 'border-forest-action bg-[rgba(45,122,79,0.08)] text-forest-deep'
                        : 'border-border hover:border-forest-action/50 text-ink',
                    ].join(' ')}
                  >
                    <span>{fc.icon}</span> {fc.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onBack} size="lg" className="flex-1">← Back</Button>
          <Button id="step-transport-next" type="submit" variant="primary" size="lg" className="flex-[2]">Continue →</Button>
        </div>
      </form>

      <p className="mt-4 text-xs text-center text-ink-soft">Step 3 of 5 · Transport</p>
    </div>
  );
}
