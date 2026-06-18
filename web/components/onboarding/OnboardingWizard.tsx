'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { getFirebaseDb } from '@/lib/firebase';
import { useAuth } from '@/providers/AuthProvider';
import { calculateBaseline } from '@earthprint/emission-engine';
import { analytics } from '@/lib/analytics';
import type { OnboardingAnswers, LocationData, HouseholdData, TransportData, DietData, ShoppingData } from '@earthprint/types';

import StepLocation from './StepLocation';
import StepHousehold from './StepHousehold';
import StepTransport from './StepTransport';
import StepDiet from './StepDiet';
import StepShopping from './StepShopping';
import { BaselineResult } from './BaselineResult';

const TOTAL_STEPS = 5;

type WizardData = {
  location: LocationData | null;
  household: HouseholdData | null;
  transport: TransportData | null;
  diet: DietData | null;
  shopping: ShoppingData | null;
};

export default function OnboardingWizard() {
  const { user, userProfile, loading, refreshProfile } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({
    location: null, household: null, transport: null, diet: null, shopping: null,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [baselineResult, setBaselineResult] = useState<ReturnType<typeof calculateBaseline> | null>(null);

  // Redirect guard logic
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (userProfile && userProfile.onboardingCompleted) {
        router.replace('/dashboard');
      }
    }
  }, [user, userProfile, loading, router]);

  const progress = ((step - 1) / TOTAL_STEPS) * 100;

  function goNext() {
    setStep((s) => Math.min(TOTAL_STEPS + 1, s + 1));
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1));
  }

  // Full-screen loading state
  if (loading || (user && !userProfile)) {
    return (
      <div className="h-screen max-h-screen bg-tint flex flex-col justify-center items-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-green flex items-center justify-center shadow-glow mx-auto animate-pulse-green">
            <span className="text-3xl">🌿</span>
          </div>
          <p className="text-pale-green/70 text-sm font-mono animate-pulse">Syncing profile...</p>
        </div>
      </div>
    );
  }

  // Do not render form if not authenticated or onboarding completed (waiting for redirect)
  if (!user || (userProfile && userProfile.onboardingCompleted)) {
    return null;
  }

  async function handleShoppingComplete(shopping: ShoppingData) {
    setData((d) => ({ ...d, shopping }));
    const answers = data as Required<WizardData>;

    if (!answers.location || !answers.household || !answers.transport || !answers.diet || !user) {
      return;
    }

    setIsSaving(true);

    try {
      const fullAnswers: OnboardingAnswers = {
        location: answers.location,
        household: answers.household,
        transport: answers.transport,
        diet: answers.diet,
        shopping,
        completedAt: new Date().toISOString(),
      };

      // Calculate baseline using emission-engine
      // Sources: DEFRA 2023, Poore & Nemecek 2018, IEA 2022, Scarborough 2014
      const baseline = calculateBaseline(fullAnswers);
      setBaselineResult(baseline);

      // Save to Firestore users/{uid}
      const db = getFirebaseDb();
      const userRef = doc(db, 'users', user.uid);

      await setDoc(
        userRef,
        {
          onboardingCompleted: true,
          onboardingAnswers: fullAnswers,
          baselineKgCo2ePerYear: baseline.annualKgCo2e,
          monthlyTargetKgCo2e: baseline.monthlyTarget,
          updatedAt: new Date().toISOString(),
          _onboardingCompletedAt: Timestamp.now(),
        },
        { merge: true }
      );

      // Refresh user profile state to sync onboardingCompleted: true
      if (refreshProfile) {
        await refreshProfile();
      }

      // Track Google Analytics event
      analytics.onboardingComplete(baseline.annualKgCo2e);

      // Show baseline result screen
      goNext();
    } catch (err) {
      console.error('[Onboarding] Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  }

  // Step 6: Baseline result (after all 5 steps)
  if (step > TOTAL_STEPS && baselineResult) {
    return (
      <BaselineResult
        baseline={baselineResult}
        onContinue={() => router.push('/dashboard')}
      />
    );
  }

  return (
    <div className="h-screen max-h-screen bg-tint flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-forest-deep px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🌿</span>
          <span className="font-display text-xl text-ink-inverse">EarthPrint</span>
        </div>
        <span className="text-sm text-pale-green/70 font-mono">
          Step {Math.min(step, TOTAL_STEPS)} of {TOTAL_STEPS}
        </span>
      </header>

      {/* Progress bar */}
      <div className="h-1.5 bg-pale-green flex-shrink-0">
        <div
          className="h-full bg-growth-green transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={step}
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-label={`Onboarding progress: step ${step} of ${TOTAL_STEPS}`}
        />
      </div>

      {/* Content */}
      <main className="flex-1 overflow-y-auto flex items-start justify-center px-4 py-4 md:py-8">
        <div className="w-full max-w-xl animate-slide-up">
          {step === 1 && (
            <StepLocation
              initial={data.location}
              onNext={(location) => { setData((d) => ({ ...d, location })); goNext(); }}
            />
          )}
          {step === 2 && (
            <StepHousehold
              initial={data.household}
              onNext={(household) => { setData((d) => ({ ...d, household })); goNext(); }}
              onBack={goBack}
            />
          )}
          {step === 3 && (
            <StepTransport
              initial={data.transport}
              onNext={(transport) => { setData((d) => ({ ...d, transport })); goNext(); }}
              onBack={goBack}
            />
          )}
          {step === 4 && (
            <StepDiet
              initial={data.diet}
              onNext={(diet) => { setData((d) => ({ ...d, diet })); goNext(); }}
              onBack={goBack}
            />
          )}
          {step === 5 && (
            <StepShopping
              initial={data.shopping}
              onNext={handleShoppingComplete}
              onBack={goBack}
              isSaving={isSaving}
            />
          )}
        </div>
      </main>
    </div>
  );
}
