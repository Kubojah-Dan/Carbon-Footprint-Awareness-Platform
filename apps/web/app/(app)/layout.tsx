'use client';

import React, { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav, TopNav } from '@/components/layout/MobileNav';
import { Skeleton } from '@/components/ui/Skeleton';
import { ChatAssistant } from '@/components/layout/ChatAssistant';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Redirect to onboarding if not yet completed or profile is missing
  useEffect(() => {
    if (!loading && user && (!userProfile || !userProfile.onboardingCompleted)) {
      // Check current path to avoid redirect loop
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/onboarding')) {
        router.replace('/onboarding');
      }
    }
  }, [user, userProfile, loading, router]);

  // Full-screen loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-tint flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-green flex items-center justify-center shadow-glow mx-auto animate-pulse-green">
            <span className="text-3xl">🌿</span>
          </div>
          <Skeleton className="h-3 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated or not onboarded
  if (!user || !userProfile || !userProfile.onboardingCompleted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-tint relative">
      {/* Biophilic Glowing Blobs in Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 opacity-60">
        <div 
          className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-emerald-300/30 to-teal-400/20 blur-[100px] animate-pulse" 
          style={{ animationDuration: '8s' }} 
        />
        <div 
          className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-green-300/20 to-emerald-400/25 blur-[120px] animate-pulse" 
          style={{ animationDuration: '12s' }} 
        />
        <div className="absolute top-[35%] right-[15%] w-[350px] h-[350px] rounded-full bg-pale-green/30 blur-[80px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] rounded-full bg-emerald-200/25 blur-[90px]" />
      </div>

      {/* Desktop sidebar */}
      <div className="relative z-20 flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative z-10">
        {/* Mobile top nav */}
        <TopNav />

        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 lg:pb-8 relative"
          aria-label="Main content"
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="relative z-20">
        <MobileNav />
      </div>

      {/* Chat Assistant */}
      <ChatAssistant />
    </div>
  );
}
