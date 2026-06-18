'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import en from '../lib/locales/en.json';
import fr from '../lib/locales/fr.json';
import es from '../lib/locales/es.json';
import hi from '../lib/locales/hi.json';
import pt from '../lib/locales/pt.json';

export type SupportedLocale = 'en' | 'fr' | 'es' | 'hi' | 'pt';

const localesMap = { en, fr, es, hi, pt };

interface LocaleContextValue {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => Promise<void>;
  t: (path: string, replacements?: Record<string, string>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const { user, userProfile, refreshProfile } = useAuth();
  const [locale, setLocaleState] = useState<SupportedLocale>('en');

  // 1. Sync locale with userProfile on load
  useEffect(() => {
    if (userProfile?.locale) {
      const dbLocale = userProfile.locale.toLowerCase() as SupportedLocale;
      if (localesMap[dbLocale]) {
        setLocaleState(dbLocale);
      }
    }
  }, [userProfile?.locale]);

  // 2. Set and update locale preferences
  const setLocale = async (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    
    if (user?.uid) {
      try {
        const { getFirebaseDb } = await import('@/lib/firebase');
        const { doc, updateDoc } = await import('firebase/firestore');
        
        const db = getFirebaseDb();
        const userRef = doc(db, 'users', user.uid);
        
        await updateDoc(userRef, {
          locale: newLocale,
          updatedAt: new Date().toISOString(),
        });
        
        if (refreshProfile) {
          await refreshProfile();
        }
      } catch (err) {
        console.error('[LocaleProvider] Failed to update user locale preference:', err);
      }
    }
  };

  // 3. Translation path lookup helper with placeholder replacement
  const t = (path: string, replacements?: Record<string, string>): string => {
    const dictionary = localesMap[locale] || en;
    const parts = path.split('.');
    
    let current: any = dictionary;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        // Fallback to English dictionary if not found in active dictionary
        let fallback: any = en;
        for (const fallbackPart of parts) {
          if (fallback && typeof fallback === 'object' && fallbackPart in fallback) {
            fallback = fallback[fallbackPart];
          } else {
            fallback = path; // Return path name directly if not found anywhere
            break;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    // Replace placeholders e.g., {name}
    let translated = current;
    if (replacements) {
      Object.entries(replacements).forEach(([key, val]) => {
        translated = translated.replace(new RegExp(`{${key}}`, 'g'), val);
      });
    }

    return translated;
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
