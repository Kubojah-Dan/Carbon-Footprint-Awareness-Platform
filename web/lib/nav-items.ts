/**
 * Shared navigation route definitions.
 * Single source of truth used by both Navbar and MobileNav.
 */

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  id: string;
}

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '🌿', id: 'nav-dashboard' },
  { href: '/log', label: 'Activity Log', icon: '📋', id: 'nav-log' },
  { href: '/insights', label: 'AI Insights', icon: '✨', id: 'nav-insights' },
  { href: '/awareness', label: 'Earth Awareness', icon: '🌍', id: 'nav-awareness' },
  { href: '/challenges', label: 'Challenges', icon: '🏆', id: 'nav-challenges' },
  { href: '/community', label: 'Community', icon: '🤝', id: 'nav-community' },
  { href: '/marketplace', label: 'Marketplace', icon: '🛍️', id: 'nav-marketplace' },
  { href: '/workplace', label: 'Workplace', icon: '🏢', id: 'nav-workplace' },
];

export const profileNavItem: NavItem = {
  href: '/profile',
  label: 'Profile',
  icon: '👤',
  id: 'nav-profile',
};
