'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { STARTER_BADGES } from '@earthprint/emission-engine';
import type { UserProfile } from '@earthprint/types';

const COUNTRIES = [
  { code: 'AU', name: 'Australia' },
  { code: 'BR', name: 'Brazil' },
  { code: 'CA', name: 'Canada' },
  { code: 'CN', name: 'China' },
  { code: 'DE', name: 'Germany' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EG', name: 'Egypt' },
  { code: 'ES', name: 'Spain' },
  { code: 'FR', name: 'France' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IN', name: 'India' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NO', name: 'Norway' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'SE', name: 'Sweden' },
  { code: 'SG', name: 'Singapore' },
  { code: 'US', name: 'United States' },
  { code: 'ZA', name: 'South Africa' },
];

const BIOMES = [
  {
    id: 'temperate-forest',
    name: 'Temperate Forest 🌲',
    description: 'A lush canopy of ancient oaks, ferns, and winding rivers. High carbon budgets murky the waters, while green acts bring back wildlife.',
    themeBg: 'bg-emerald-950/20 border-emerald-500/30 text-emerald-900',
    icon: '🌲',
  },
  {
    id: 'coral-reef',
    name: 'Coral Reef 🪸',
    description: 'An aquatic biome with neon coral branches and sea life. High carbon budgets bleach the reef, while eco actions keep it blooming.',
    themeBg: 'bg-cyan-950/20 border-cyan-500/30 text-cyan-900',
    icon: '🪸',
  },
  {
    id: 'alpine-meadow',
    name: 'Alpine Meadow 🏔️',
    description: 'A serene mountain peak with wildflowers and wildlife. Overdraft shrinks the glacier, while sustainable acts restore the snow caps.',
    themeBg: 'bg-amber-950/20 border-amber-500/30 text-amber-900',
    icon: '🏔️',
  },
] as const;

export default function ProfilePage() {
  const { user, userProfile, refreshProfile, signOut } = useAuth();
  const uid = user?.uid;

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [preferredUnits, setPreferredUnits] = useState<'metric' | 'imperial'>('metric');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [bio, setBio] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [switchingBiome, setSwitchingBiome] = useState(false);
  const [activeBiome, setActiveBiome] = useState<'temperate-forest' | 'coral-reef' | 'alpine-meadow'>('temperate-forest');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state with userProfile
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName ?? '');
      setCity(userProfile.onboardingAnswers?.location.city ?? userProfile.city ?? '');
      setCountry(userProfile.onboardingAnswers?.location.country ?? userProfile.country ?? '');
      setPreferredUnits(userProfile.preferredUnits ?? 'metric');
      setNotificationsEnabled(userProfile.notificationsEnabled ?? false);
      setBio(userProfile.bio ?? '');
      if (userProfile.activeBiome) {
        setActiveBiome(userProfile.activeBiome);
      }
    }
  }, [userProfile]);

  // Handle Profile save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid) return;

    try {
      setSavingProfile(true);
      setMessage(null);

      const { getFirebaseDb } = await import('@/lib/firebase');
      const { doc: firestoreDoc, updateDoc } = await import('firebase/firestore');
      
      const db = getFirebaseDb();
      const userRef = firestoreDoc(db, 'users', uid);

      const countryName = COUNTRIES.find((c) => c.code === country)?.name ?? '';

      // Update Firestore document
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        city: city.trim(),
        country,
        bio: bio.trim(),
        preferredUnits,
        notificationsEnabled,
        'onboardingAnswers.location.city': city.trim(),
        'onboardingAnswers.location.country': country,
        'onboardingAnswers.location.countryName': countryName,
        updatedAt: new Date().toISOString(),
      });

      if (refreshProfile) {
        await refreshProfile();
      }

      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  // Switch active biome
  const handleSwitchBiome = async (biome: typeof activeBiome) => {
    if (!uid || switchingBiome) return;
    try {
      setSwitchingBiome(true);
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
    } catch (err) {
      console.error('Failed to switch biome:', err);
    } finally {
      setSwitchingBiome(false);
    }
  };

  // Evaluate earned badge ids (supporting Firestore list + local evaluation fallbacks)
  const earnedBadgeIds = React.useMemo(() => {
    const list = new Set(userProfile?.earnedBadgeIds ?? []);
    
    // Fallback: unlock badges dynamically based on user stats so the profile feels alive
    if (userProfile) {
      const pts = userProfile.points || 0;
      const str = userProfile.streakDays || 0;

      if (pts > 0) list.add('first-log');
      if (str >= 3) list.add('streak-3');
      if (str >= 7) list.add('streak-7');
      if (str >= 14) list.add('streak-14');
      if (str >= 30) list.add('streak-30');
      
      if (pts >= 10) list.add('co2-saved-10');
      if (pts >= 50) list.add('co2-saved-50');
      if (pts >= 100) list.add('co2-saved-100');
      if (pts >= 500) list.add('co2-saved-500');
      
      if (userProfile.orgId) list.add('team-challenge-1');
    }
    
    return Array.from(list);
  }, [userProfile]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ─── Profile Summary Banner ─── */}
      <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 bg-gradient-green text-emerald-950 p-6 rounded-2xl shadow-glow">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="w-20 h-20 rounded-full bg-forest-deep text-white text-3xl font-bold flex items-center justify-center border-4 border-white/60 shadow-lg shrink-0">
            {userProfile?.displayName?.charAt(0).toUpperCase() ?? 'U'}
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-ink leading-tight">
              {userProfile?.displayName ?? 'TerraPulse User'}
            </h1>
            <p className="text-emerald-950/70 text-sm font-mono mt-0.5">{userProfile?.email}</p>
            <p className="text-emerald-900/90 text-sm font-semibold mt-1">
              📍 {city ? `${city}, ` : ''}{COUNTRIES.find((c) => c.code === country)?.name || 'Earth'}
            </p>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-4 text-center min-w-[100px]">
            <p className="text-xl">🏆</p>
            <p className="font-mono text-2xl font-bold text-ink">
              {userProfile?.points?.toLocaleString() ?? 0}
            </p>
            <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider">Points</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-4 text-center min-w-[100px]">
            <p className="text-xl">🔥</p>
            <p className="font-mono text-2xl font-bold text-ink">
              {userProfile?.streakDays ?? 0}
            </p>
            <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider">Streak</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-emerald-200/50 rounded-2xl p-4 text-center min-w-[100px]">
            <p className="text-xl">💚</p>
            <p className="font-mono text-2xl font-bold text-ink">
              {userProfile?.terraScore ?? 100}
            </p>
            <p className="text-[10px] text-ink-soft font-bold uppercase tracking-wider">Terra Score</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ─── Column 1 & 2: Edit Form & Biomes ─── */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile & Settings</CardTitle>
            </CardHeader>
            <CardContent>
              {message && (
                <div
                  role="alert"
                  className={`mb-4 p-4 rounded-xl text-sm border ${
                    message.type === 'success'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="profile-name"
                    label="Display Name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />

                  <div>
                    <label htmlFor="profile-country" className="block text-sm font-medium text-ink mb-1.5">
                      Country
                    </label>
                    <select
                      id="profile-country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base text-ink focus:outline-none focus:ring-2 focus:ring-forest-action focus:border-forest-action transition-colors"
                    >
                      <option value="">Select country...</option>
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    id="profile-city"
                    label="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />

                  <div>
                    <label htmlFor="profile-units" className="block text-sm font-medium text-ink mb-1.5">
                      Preferred Units
                    </label>
                    <select
                      id="profile-units"
                      value={preferredUnits}
                      onChange={(e) => setPreferredUnits(e.target.value as any)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-2.5 text-base text-ink focus:outline-none focus:ring-2 focus:ring-forest-action focus:border-forest-action transition-colors"
                    >
                      <option value="metric">Metric (kg, km)</option>
                      <option value="imperial">Imperial (lbs, miles)</option>
                    </select>
                  </div>
                </div>

                <Input
                  id="profile-bio"
                  label="Bio"
                  placeholder="Share your carbon-reduction mission..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />

                <div className="flex items-center gap-3 py-2">
                  <input
                    type="checkbox"
                    id="profile-notifications"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                    className="w-4 h-4 text-forest-action border-border focus:ring-forest-action rounded"
                  />
                  <label htmlFor="profile-notifications" className="text-sm font-medium text-ink">
                    Enable FCM push notification reminders
                  </label>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Button
                    id="btn-signout"
                    type="button"
                    variant="ghost"
                    className="text-earth-coral hover:bg-rose-50"
                    onClick={() => signOut()}
                  >
                    Logout Account ↩
                  </Button>
                  <Button id="btn-save-profile" type="submit" variant="primary" isLoading={savingProfile}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Biome Switcher */}
          <Card>
            <CardHeader>
              <CardTitle>Your Active Ecosystem Biome</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-ink-soft leading-relaxed">
                Your ecosystem avatar is a living representation of your carbon footprint. Select your preferred biome below to switch its visual representation on your AI Insights panel.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {BIOMES.map((b) => {
                  const isActive = activeBiome === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => handleSwitchBiome(b.id)}
                      disabled={switchingBiome}
                      className={`text-left p-4 rounded-xl border-2 transition-all hover:scale-[1.02] flex flex-col justify-between ${
                        isActive
                          ? 'border-forest-action bg-forest-mid/10 ring-2 ring-forest-action/20'
                          : 'border-border bg-white hover:border-forest-action/40'
                      }`}
                    >
                      <div>
                        <div className="text-3xl mb-2">{b.icon}</div>
                        <h4 className="font-semibold text-ink text-sm sm:text-base mb-1">{b.name}</h4>
                        <p className="text-xs text-ink-soft leading-relaxed">{b.description}</p>
                      </div>
                      {isActive && (
                        <span className="text-[10px] mt-4 uppercase font-bold text-forest-action font-mono">
                          ✓ Active Biome
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ─── Column 3: Badges Gallery ─── */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Unlocked Badges ({earnedBadgeIds.length} / 20)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                {STARTER_BADGES.map((badge) => {
                  const isUnlocked = earnedBadgeIds.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center relative group ${
                        isUnlocked
                          ? 'bg-emerald-50/40 border-emerald-100'
                          : 'bg-slate-50 border-slate-100 opacity-40 grayscale'
                      }`}
                      title={badge.description}
                    >
                      <span className="text-2xl mb-1">{badge.iconEmoji}</span>
                      <span className="text-[10px] font-semibold text-ink line-clamp-1">
                        {badge.name}
                      </span>
                      {badge.isRare && (
                        <span className="absolute -top-1 -right-1 text-[8px] bg-amber-500 text-white font-bold font-mono px-1 rounded-full scale-90">
                          RARE
                        </span>
                      )}
                      
                      {/* Tooltip on hover */}
                      <div className="hidden group-hover:block absolute bottom-full mb-2 z-30 w-48 bg-forest-deep text-white text-[10px] leading-relaxed rounded-lg p-2.5 shadow-xl font-body text-left">
                        <p className="font-bold text-pale-green">{badge.name}</p>
                        <p className="text-white/80 mt-0.5">{badge.description}</p>
                        <p className="text-growth-green font-mono font-bold mt-1 text-[9px]">
                          Requirement: {badge.requirement.type.replace(/-/g, ' ')} ({badge.requirement.threshold})
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
