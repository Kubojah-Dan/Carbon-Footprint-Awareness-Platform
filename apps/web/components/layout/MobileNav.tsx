'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MobileNavItem {
  href: string;
  label: string;
  icon: string;
  id: string;
}

const mobileNavItems: MobileNavItem[] = [
  { href: '/dashboard', label: 'Home', icon: '🌿', id: 'mobile-nav-dashboard' },
  { href: '/log', label: 'Log', icon: '📋', id: 'mobile-nav-log' },
  { href: '/awareness', label: 'Awareness', icon: '🌍', id: 'mobile-nav-awareness' },
  { href: '/challenges', label: 'Challenges', icon: '🏆', id: 'mobile-nav-challenges' },
  { href: '/community', label: 'Community', icon: '🤝', id: 'mobile-nav-community' },
  { href: '/profile', label: 'Profile', icon: '👤', id: 'mobile-nav-profile' },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className="lg:hidden fixed bottom-5 left-4 right-4 z-[200] bg-white/45 backdrop-blur-2xl border border-white/30 rounded-[24px] shadow-[0_12px_40px_-4px_rgba(10,35,24,0.12)] max-w-md mx-auto"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-1.5 py-1.5">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              id={item.id}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl',
                'transition-all duration-155 min-w-[52px]',
                isActive
                  ? 'text-forest-action bg-forest-action/10 scale-105 font-bold'
                  : 'text-ink-soft hover:text-forest-deep',
              ].join(' ')}
            >
              <span
                className={[
                  'text-xl transition-transform duration-150',
                  isActive ? 'scale-110' : '',
                ].join(' ')}
                aria-hidden="true"
              >
                {item.icon}
              </span>
              <span
                className={[
                  'text-[9px] font-bold font-body leading-none',
                  isActive ? 'text-forest-action' : '',
                ].join(' ')}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-forest-action mt-0.5" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function TopNav({ title }: { title?: string }) {
  return (
    <header className="lg:hidden sticky top-0 z-[100] bg-forest-deep/95 backdrop-blur border-b border-border-dark px-4 py-3 flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg bg-gradient-green flex items-center justify-center">
        <span className="text-sm" aria-hidden="true">🌿</span>
      </div>
      <span className="font-display text-lg text-ink-inverse">
        {title ?? 'EarthPrint'}
      </span>
    </header>
  );
}
