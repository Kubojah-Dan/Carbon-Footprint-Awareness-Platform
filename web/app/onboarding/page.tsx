import type { Metadata } from 'next';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export const metadata: Metadata = {
  title: 'Set Up Your Profile — EarthPrint',
  description: 'Answer a few questions so we can calculate your carbon footprint and personalize your action plan.',
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
