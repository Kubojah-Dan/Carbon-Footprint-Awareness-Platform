import React from 'react';
import { render, screen } from '@testing-library/react';
import { MobileNav, TopNav } from '../components/layout/MobileNav';

// Mock next/navigation
let mockPathname = '/dashboard';
jest.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
}));

describe('MobileNav and TopNav Components', () => {
  beforeEach(() => {
    mockPathname = '/dashboard';
  });

  it('renders all mobile navigation items', () => {
    render(<MobileNav />);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Log')).toBeInTheDocument();
    expect(screen.getByText('Awareness')).toBeInTheDocument();
    expect(screen.getByText('Challenges')).toBeInTheDocument();
    expect(screen.getByText('Community')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('renders the TopNav title correctly', () => {
    render(<TopNav title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders default TopNav title when none is provided', () => {
    render(<TopNav />);
    expect(screen.getByText('EarthPrint')).toBeInTheDocument();
  });
});
