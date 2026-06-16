'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { Avatar } from '@/components/ui/Skeleton';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  id: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '🌿', id: 'nav-dashboard' },
  { href: '/log', label: 'Activity Log', icon: '📋', id: 'nav-log' },
  { href: '/insights', label: 'AI Insights', icon: '✨', id: 'nav-insights' },
  { href: '/awareness', label: 'Earth Awareness', icon: '🌍', id: 'nav-awareness' },
  { href: '/challenges', label: 'Challenges', icon: '🏆', id: 'nav-challenges' },
  { href: '/community', label: 'Community', icon: '🤝', id: 'nav-community' },
  { href: '/marketplace', label: 'Marketplace', icon: '🛍️', id: 'nav-marketplace' },
  { href: '/workplace', label: 'Workplace', icon: '🏢', id: 'nav-workplace' },
];

const bottomItems: NavItem[] = [
  { href: '/profile', label: 'Profile', icon: '👤', id: 'nav-profile' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, userProfile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <aside
      className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-[#B0E4CC]/85 backdrop-blur-xl border-r border-[#1A4A2E]/10 overflow-hidden shadow-lg"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="p-6 border-b border-[#1A4A2E]/10">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5a9e6f] to-[#4ecdc4] flex items-center justify-center animate-pulse-logo group-hover:scale-105 transition-transform duration-200">
            <span className="text-xl lively-emoji" role="img" aria-label="EarthPrint logo">🌿</span>
          </div>
          <div>
            <span
              className="font-display text-xl text-white select-none"
              style={{ textShadow: '0 1px 3px rgba(10, 35, 24, 0.7), 0 0 8px rgba(10, 35, 24, 0.4)' }}
            >
              Earth<span style={{ color: '#285A48', textShadow: '0 1px 2px rgba(255, 255, 255, 0.3)' }}>Print</span>
            </span>
            <p className="text-sm text-forest-deep/60 font-mono font-bold">
              Carbon Tracker
            </p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1" aria-label="Primary navigation">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              id={item.id}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg group',
                'text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-forest-action/80 text-white shadow-sm border border-growth-green/20 backdrop-blur-sm'
                  : 'text-forest-deep/75 hover:bg-forest-deep/10 hover:text-forest-deep',
              ].join(' ')}
            >
              <span className="text-lg lively-emoji" aria-hidden="true">{item.icon}</span>
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-growth-green animate-pulse-green" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-[#1A4A2E]/10 space-y-1">
        {bottomItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              id={item.id}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-lg group',
                'text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-forest-action/80 text-white border border-growth-green/20'
                  : 'text-forest-deep/75 hover:bg-forest-deep/10 hover:text-forest-deep',
              ].join(' ')}
            >
              <span className="text-lg lively-emoji" aria-hidden="true">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {/* User card */}
        {user && (
          <div className="mt-3 p-3 rounded-lg bg-white/40 border border-[#1A4A2E]/10 backdrop-blur-md flex items-center gap-3">
            <Avatar
              src={user.photoURL}
              name={userProfile?.displayName ?? user.email}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-forest-deep truncate">
                {userProfile?.displayName ?? 'EarthPrint User'}
              </p>
              <p className="text-xs text-forest-deep/60 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              disabled={isSigningOut}
              aria-label="Sign out"
              className="text-forest-deep/60 hover:text-earth-coral transition-colors text-lg shrink-0"
              title="Sign out"
            >
              {isSigningOut ? '⏳' : '↩'}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
