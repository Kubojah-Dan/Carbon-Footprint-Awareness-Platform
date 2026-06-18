'use client';

import React, { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupPage() {
  const { signUpWithEmail, signInWithGoogle, user, userProfile, loading, error, clearError } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [localError, setLocalError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Auto-redirect if already logged in
  useEffect(() => {
    if (!loading && user && userProfile) {
      if (userProfile.onboardingCompleted) {
        router.replace('/dashboard');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [user, userProfile, loading, router]);

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    clearError();
    setLocalError('');

    if (password !== passwordConfirm) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      await signUpWithEmail(email, password, displayName.trim() || 'EarthPrint User');
      // New users go to onboarding
      router.push('/onboarding');
    } catch {
      // Error handled by AuthProvider
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignup() {
    clearError();
    setGoogleLoading(true);
    try {
      const { isNewUser } = await signInWithGoogle();
      if (isNewUser) {
        router.push('/onboarding');
      } else {
        router.push('/dashboard');
      }
    } catch {
      // Error handled by AuthProvider
    } finally {
      setGoogleLoading(false);
    }
  }

  function setGoogleLoading(v: boolean) {
    setIsGoogleLoading(v);
  }

  const displayError = localError || error;

  if (loading || user) {
    return (
      <div className="w-full max-w-md my-auto flex justify-center items-center py-12">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-green flex items-center justify-center shadow-glow mx-auto animate-pulse">
            <span className="text-2xl">🌿</span>
          </div>
          <p className="text-pale-green/70 text-xs font-mono animate-pulse">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md my-auto animate-slide-up">
      <div className="glass-card-dark rounded-2xl p-5 md:p-6 border border-forest-action/30 shadow-lg">
        <div className="text-center mb-4">
          <h1 className="font-display text-2xl md:text-3xl text-ink-inverse mb-1">Start your journey</h1>
          <p className="text-pale-green/80 text-sm">It takes 2 minutes. No credit card needed.</p>
        </div>

        {displayError && (
          <div role="alert" className="mb-4 p-3 rounded-lg bg-[rgba(217,79,59,0.15)] border border-earth-coral/30 text-earth-coral text-sm">
            {displayError}
          </div>
        )}

        {/* Google Sign Up */}
        <Button
          id="btn-google-signup"
          variant="secondary"
          fullWidth
          isLoading={isGoogleLoading}
          onClick={handleGoogleSignup}
          leftIcon={
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
          }
        >
          Sign up with Google
        </Button>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-border-dark" />
          <span className="text-xs text-pale-green/75 font-mono">or</span>
          <div className="flex-1 h-px bg-border-dark" />
        </div>

        <form onSubmit={handleSignup} className="space-y-2.5" noValidate>
          <Input
            id="signup-name"
            label="Your name"
            type="text"
            placeholder="Alex Green"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            autoComplete="name"
            disabled={isLoading}
            className="!py-2 !text-sm"
            leftElement={<span className="text-sm">👤</span>}
          />

          <Input
            id="signup-email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            isRequired
            disabled={isLoading}
            className="!py-2 !text-sm"
            leftElement={<span className="text-sm">✉</span>}
          />

          <Input
            id="signup-password"
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            isRequired
            disabled={isLoading}
            className="!py-2 !text-sm"
            leftElement={<span className="text-sm">🔒</span>}
          />

          <Input
            id="signup-password-confirm"
            label="Confirm password"
            type="password"
            placeholder="Same password again"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            autoComplete="new-password"
            isRequired
            disabled={isLoading}
            className="!py-2 !text-sm"
            leftElement={<span className="text-sm">🔒</span>}
          />

          <Button id="btn-email-signup" type="submit" variant="primary" fullWidth isLoading={isLoading}>
            Create My Account →
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-pale-green/80">
          Already have an account?{' '}
          <Link href="/login" className="text-growth-green hover:underline font-medium">
            Sign in
          </Link>
        </p>

        <p className="mt-2 text-center text-xs text-pale-green/70 leading-relaxed">
          By signing up, you agree to our Terms of Service. We never sell your data.
        </p>
      </div>
    </div>
  );
}
