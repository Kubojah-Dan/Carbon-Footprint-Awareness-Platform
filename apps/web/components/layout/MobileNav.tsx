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
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] bg-forest-deep border-t border-border-dark"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              id={item.id}
              aria-current={isActive ? 'page' : undefined}
              className={[
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl',
                'transition-all duration-150 min-w-[56px]',
                isActive
                  ? 'text-growth-green'
                  : 'text-ink-soft hover:text-ink-inverse',
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
                  'text-[10px] font-medium font-body leading-none',
                  isActive ? 'text-growth-green' : '',
                ].join(' ')}
              >
                {item.label}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-growth-green mt-0.5" />
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
