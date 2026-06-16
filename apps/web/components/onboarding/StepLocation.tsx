'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { LocationData } from '@earthprint/types';

// Country list with grid region codes for Electricity Maps
const COUNTRIES = [
  { code: 'AU', name: 'Australia', gridRegion: 'AU' },
  { code: 'BR', name: 'Brazil', gridRegion: 'BR' },
  { code: 'CA', name: 'Canada', gridRegion: 'CA' },
  { code: 'CN', name: 'China', gridRegion: 'CN' },
  { code: 'DE', name: 'Germany', gridRegion: 'DE' },
  { code: 'DK', name: 'Denmark', gridRegion: 'DK' },
  { code: 'EG', name: 'Egypt', gridRegion: 'EG' },
  { code: 'ES', name: 'Spain', gridRegion: 'ES' },
  { code: 'FR', name: 'France', gridRegion: 'FR' },
  { code: 'GB', name: 'United Kingdom', gridRegion: 'GB' },
  { code: 'IE', name: 'Ireland', gridRegion: 'IE' },
  { code: 'IN', name: 'India', gridRegion: 'IN' },
  { code: 'IT', name: 'Italy', gridRegion: 'IT' },
  { code: 'JP', name: 'Japan', gridRegion: 'JP' },
  { code: 'KR', name: 'South Korea', gridRegion: 'KR' },
  { code: 'MX', name: 'Mexico', gridRegion: 'MX' },
  { code: 'NG', name: 'Nigeria', gridRegion: 'NG' },
  { code: 'NL', name: 'Netherlands', gridRegion: 'NL' },
  { code: 'NO', name: 'Norway', gridRegion: 'NO' },
  { code: 'NZ', name: 'New Zealand', gridRegion: 'NZ' },
  { code: 'PL', name: 'Poland', gridRegion: 'PL' },
  { code: 'PT', name: 'Portugal', gridRegion: 'PT' },
  { code: 'SE', name: 'Sweden', gridRegion: 'SE' },
  { code: 'SG', name: 'Singapore', gridRegion: 'SG' },
  { code: 'US', name: 'United States', gridRegion: 'US' },
  { code: 'ZA', name: 'South Africa', gridRegion: 'ZA' },
];

interface StepLocationProps {
  initial: LocationData | null;
  onNext: (data: LocationData) => void;
}

export default function StepLocation({ initial, onNext }: StepLocationProps) {
  const [country, setCountry] = useState(initial?.country ?? '');
  const [countryName, setCountryName] = useState(initial?.countryName ?? '');
  const [city, setCity] = useState(initial?.city ?? '');
  const [error, setError] = useState('');

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!city.trim() || city.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            city
          )}&format=json&limit=5&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'EarthPrint-Carbon-Footprint-Awareness-Platform/1.0',
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.warn('Nominatim suggestions fetch failed:', err);
      } finally {
        setSearching(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [city]);

  const handleSelectSuggestion = (sug: any) => {
    const addr = sug.address || {};
    const cityName = addr.city || addr.town || addr.village || addr.suburb || sug.name || city;
    setCity(cityName);
    
    const cc = (addr.country_code || '').toUpperCase();
    const matchedCountry = COUNTRIES.find((c) => c.code === cc);
    if (matchedCountry) {
      setCountry(matchedCountry.code);
      setCountryName(matchedCountry.name);
    }
    
    setSuggestions([]);
    setShowDropdown(false);
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!country) { setError('Please select your country.'); return; }
    if (!city.trim()) { setError('Please enter your city.'); return; }

    const selectedCountry = COUNTRIES.find((c) => c.code === country);
    onNext({
      country,
      countryName: selectedCountry?.name ?? countryName,
      city: city.trim(),
      gridRegion: selectedCountry?.gridRegion ?? country,
    });
  }

  return (
    <div>
      <div className="mb-8">
        <div className="w-12 h-12 rounded-2xl bg-[rgba(45,122,79,0.15)] flex items-center justify-center mb-4">
          <span className="text-2xl">📍</span>
        </div>
        <h2 className="font-display text-3xl text-ink mb-2">Where are you based?</h2>
        <p className="text-ink-soft">
          Your location helps us use the right electricity grid carbon intensity factor for your home energy calculations.
        </p>
      </div>

      {error && (
        <div role="alert" className="mb-4 p-3 rounded-lg bg-[rgba(217,79,59,0.1)] border border-earth-coral/30 text-earth-coral text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="country-select" className="block text-sm font-medium text-ink mb-1.5">
            Country <span className="text-earth-coral" aria-label="required">*</span>
          </label>
          <select
            id="country-select"
            value={country}
            onChange={(e) => {
              const selected = COUNTRIES.find((c) => c.code === e.target.value);
              setCountry(e.target.value);
              setCountryName(selected?.name ?? '');
              setError('');
            }}
            className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base text-ink focus:outline-none focus:ring-2 focus:ring-forest-action focus:border-forest-action transition-colors"
            required
          >
            <option value="">Select your country...</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="relative">
          <Input
            id="city-input"
            label="City or town"
            placeholder="e.g. London, Manchester, Bristol"
            value={city}
            onChange={(e) => { setCity(e.target.value); setError(''); }}
            isRequired
            hint="Start typing your city name to see autocomplete suggestions"
            leftElement={<span className="text-sm">🏙</span>}
          />
          {searching && (
            <span className="absolute right-3 top-[38px] text-xs text-ink-soft animate-pulse">
              🔍 Searching...
            </span>
          )}
          {showDropdown && suggestions.length > 0 && (
            <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-border">
              {suggestions.map((sug, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleSelectSuggestion(sug)}
                    className="w-full text-left px-4 py-2.5 hover:bg-[#E6EEC9]/30 text-sm text-ink transition-colors font-medium"
                  >
                    <span className="font-semibold text-forest-deep">{sug.name}</span>
                    {sug.address?.state && <span className="text-ink-soft">, {sug.address.state}</span>}
                    {sug.address?.country && <span className="text-ink-soft">, {sug.address.country}</span>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="pt-4">
          <Button id="step-location-next" type="submit" variant="primary" fullWidth size="lg">
            Continue →
          </Button>
        </div>
      </form>

      <p className="mt-4 text-xs text-center text-ink-soft">
        Step 1 of 5 · Location
      </p>
    </div>
  );
}
