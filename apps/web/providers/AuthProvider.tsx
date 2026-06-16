'use client';

/**
 * Authentication Provider
 *
 * Wraps the app with Firebase Auth state.
 * Listens to onAuthStateChanged and provides auth context to all child components.
 *
 * Google Service: Firebase Authentication
 */

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  type User,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseDb } from '@/lib/firebase';
import { analytics } from '@/lib/analytics';
import type { UserProfile } from '@earthprint/types';

// ─── Context Types ────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<{ isNewUser: boolean }>;
  signOut: () => Promise<void>;
  clearError: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Subscribe to Firebase Auth state changes and real-time profile updates
  useEffect(() => {
    const auth = getFirebaseAuth();
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      // Clean up previous profile listener
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        const db = getFirebaseDb();
        const profileRef = doc(db, 'users', firebaseUser.uid);

        unsubscribeProfile = onSnapshot(
          profileRef,
          (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile(docSnap.data() as UserProfile);
            } else {
              setUserProfile(null);
            }
            setLoading(false);
          },
          (err) => {
            console.error('[AuthProvider] Profile listener failed:', err);
            setLoading(false);
          }
        );
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // Evaluate and update daily streak when user session is loaded
  useEffect(() => {
    if (user) {
      fetch('/api/v1/gamification/streak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: user.uid }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log('[AuthProvider] Streak evaluated:', data.message);
          }
        })
        .catch((err) => console.error('[AuthProvider] Failed to evaluate streak:', err));
    }
  }, [user]);

  // ── Auth Actions ────────────────────────────────────────────────────────────

  async function signInWithEmail(email: string, password: string): Promise<void> {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      await signInWithEmailAndPassword(auth, email, password);
      analytics.login('email');
    } catch (err) {
      setError(getAuthErrorMessage(err));
      throw err;
    }
  }

  async function signUpWithEmail(
    email: string,
    password: string,
    displayName: string
  ): Promise<void> {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const { user: newUser } = await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      await updateProfile(newUser, { displayName });

      // Create initial user profile in Firestore
      const profile = await createUserProfile(newUser, displayName);
      setUserProfile(profile);

      analytics.signUp('email');
    } catch (err) {
      setError(getAuthErrorMessage(err));
      throw err;
    }
  }

  async function signInWithGoogle(): Promise<{ isNewUser: boolean }> {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.addScope('profile');
      provider.addScope('email');

      const { user: googleUser } = await signInWithPopup(auth, provider);

      // Create profile if first sign-in (check by document existence)
      const db = getFirebaseDb();
      const profileRef = doc(db, 'users', googleUser.uid);
      const profileSnap = await getDoc(profileRef);

      let isNewUser = false;
      let profile: UserProfile;
      if (!profileSnap.exists()) {
        profile = await createUserProfile(googleUser, googleUser.displayName ?? 'TerraPulse User');
        setUserProfile(profile);
        analytics.signUp('google');
        isNewUser = true;
      } else {
        profile = profileSnap.data() as UserProfile;
        setUserProfile(profile);
        analytics.login('google');
      }
      return { isNewUser };
    } catch (err) {
      setError(getAuthErrorMessage(err));
      throw err;
    }
  }

  async function signOut(): Promise<void> {
    setError(null);
    try {
      const auth = getFirebaseAuth();
      await firebaseSignOut(auth);
      setUserProfile(null);
    } catch (err) {
      setError('Failed to sign out. Please try again.');
      throw err;
    }
  }

  const clearError = () => setError(null);

  async function refreshProfile(): Promise<void> {
    if (user) {
      try {
        const profile = await loadUserProfile(user.uid);
        setUserProfile(profile);
      } catch (err) {
        console.error('[AuthProvider] Failed to refresh profile:', err);
      }
    }
  }

  const value: AuthContextValue = {
    user,
    userProfile,
    loading,
    error,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    clearError,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function loadUserProfile(uid: string): Promise<UserProfile | null> {
  const db = getFirebaseDb();
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

async function createUserProfile(user: User, displayName: string): Promise<UserProfile> {
  const db = getFirebaseDb();
  const profileRef = doc(db, 'users', user.uid);

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email ?? '',
    displayName,
    photoURL: user.photoURL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    onboardingCompleted: false,
    points: 0,
    streakDays: 0,
    graceUsedThisWeek: false,
    terraScore: 100, // New user starts with full score
    activeBiome: 'temperate-forest', // Default biome
    preferredUnits: 'metric',
    notificationsEnabled: false,
    locale: 'en',
    isPublicProfile: false,
  };

  await setDoc(profileRef, { ...profile, _createdAt: serverTimestamp() });
  return profile;
}

function getAuthErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const code = (err as { code?: string }).code;
    const suffix = code ? ` (${code})` : '';
    switch (code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please check your credentials.';
      case 'auth/email-already-in-use':
        return 'This email is already registered. Try signing in instead.';
      case 'auth/weak-password':
        return 'Password must be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled. Please try again.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection and try again.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please wait a few minutes before trying again.';
      case 'auth/operation-not-allowed':
        return 'Email/Password authentication is not enabled in your Firebase Console. Go to Authentication -> Sign-in method to enable it.';
      default:
        return `Authentication failed. Please try again.${suffix}`;
    }
  }
  return 'An unexpected error occurred. Please try again.';
}
