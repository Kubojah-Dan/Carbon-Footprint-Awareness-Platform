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

export function Navbar() {
  const pathname = usePathname();
  const { user, userProfile, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await signOut();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="sticky top-0 z-[100] w-full px-4 py-3 bg-white/40 backdrop-blur-xl border-b border-[#D1E8D9]/40 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left Side: Logo & Name */}
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#5a9e6f] to-[#4ecdc4] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200">
            <span className="text-lg lively-emoji" role="img" aria-label="EarthPrint Logo">🌿</span>
          </div>
          <span className="font-display text-lg text-forest-deep tracking-tight font-bold">
            Earth<span className="text-forest-action">Print</span>
          </span>
        </Link>

        {/* Center: Desktop Navigation links */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                id={item.id}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all duration-200 ${
                  isActive
                    ? 'bg-forest-action text-white shadow-sm border border-emerald-500/20'
                    : 'text-forest-deep/85 hover:bg-forest-action/10 hover:text-forest-deep'
                }`}
              >
                <span className="text-sm lively-emoji" aria-hidden="true">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Side: User Profile & Actions */}
        <div className="flex items-center gap-2">
          {/* User Profile Info (Desktop) */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-forest-action/10 transition-colors"
                aria-label="User menu"
              >
                <Avatar
                  src={user.photoURL}
                  name={userProfile?.displayName ?? user.email}
                  size="sm"
                />
              </button>
              
              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setProfileDropdownOpen(false)} 
                  />
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white/95 backdrop-blur-xl border border-[#D1E8D9]/50 p-2 shadow-lg z-50 animate-scale-in">
                    <div className="px-3 py-2 border-b border-border/50">
                      <p className="text-xs font-bold text-forest-deep truncate">
                        {userProfile?.displayName ?? 'EarthPrint User'}
                      </p>
                      <p className="text-[10px] text-ink-soft truncate font-mono">{user.email}</p>
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-forest-deep hover:bg-forest-action/10 rounded-lg transition-colors mt-1"
                    >
                      <span aria-hidden="true">👤</span> View Profile
                    </Link>
                    <button
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        handleSignOut();
                      }}
                      disabled={isSigningOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-earth-coral hover:bg-earth-coral/10 rounded-lg transition-colors text-left"
                    >
                      <span aria-hidden="true">↩</span> {isSigningOut ? 'Signing out...' : 'Sign Out'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Mobile Hamburger Menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-forest-action/10 text-forest-deep transition-all"
            aria-label="Toggle navigation menu"
          >
            <span className="text-xl" aria-hidden="true">{mobileMenuOpen ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Glassmorphic Drawer Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 top-[57px] bg-forest-deep/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed top-[57px] left-0 right-0 bg-white/90 backdrop-blur-2xl border-b border-[#D1E8D9]/40 p-4 shadow-xl z-50 animate-slide-up lg:hidden flex flex-col gap-2 rounded-b-2xl">
            <p className="text-[10px] font-bold text-ink-soft uppercase tracking-wider font-mono px-2 mb-1">Navigation Menu</p>
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-forest-action text-white shadow-sm'
                        : 'text-forest-deep hover:bg-forest-action/10'
                    }`}
                  >
                    <span className="text-base" aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
            
            {/* Mobile Account Details & Sign Out */}
            {user && (
              <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <Avatar
                    src={user.photoURL}
                    name={userProfile?.displayName ?? user.email}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-forest-deep truncate">
                      {userProfile?.displayName ?? 'EarthPrint User'}
                    </p>
                    <p className="text-[10px] text-ink-soft truncate font-mono">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  disabled={isSigningOut}
                  className="px-3 py-1.5 rounded-xl border border-earth-coral/30 hover:border-earth-coral text-xs font-semibold text-earth-coral hover:bg-earth-coral/10 transition-all"
                >
                  <span aria-hidden="true">↩</span> {isSigningOut ? 'Signing out...' : 'Sign Out'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </header>
  );
}
