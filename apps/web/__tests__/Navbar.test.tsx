import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../components/layout/Navbar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock AuthProvider
const mockSignOut = jest.fn();
let mockUser: any = null;
let mockUserProfile: any = null;

jest.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({
    user: mockUser,
    userProfile: mockUserProfile,
    signOut: mockSignOut,
  }),
}));

describe('Navbar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockUserProfile = null;
  });

  it('renders the EarthPrint logo and branding', () => {
    render(<Navbar />);
    expect(screen.getByText('Earth')).toBeInTheDocument();
    expect(screen.getByText('Print')).toBeInTheDocument();
  });

  it('renders navigation links on desktop views', () => {
    render(<Navbar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Activity Log')).toBeInTheDocument();
    expect(screen.getByText('Earth Awareness')).toBeInTheDocument();
    expect(screen.getByText('Marketplace')).toBeInTheDocument();
  });

  it('displays user profile initials when user is signed in but has no photoURL', () => {
    mockUser = { uid: 'user-123', email: 'test@example.com' };
    mockUserProfile = { displayName: 'John Doe', onboardingCompleted: true };

    render(<Navbar />);

    // JD are the initials of John Doe
    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('opens and closes profile dropdown when clicking user menu', async () => {
    mockUser = { uid: 'user-123', email: 'test@example.com' };
    mockUserProfile = { displayName: 'John Doe', onboardingCompleted: true };

    render(<Navbar />);

    const userMenuButton = screen.getByLabelText('User menu');
    fireEvent.click(userMenuButton);

    // Dropdown items should be visible
    expect(screen.getByText('View Profile')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();

    // Click Sign Out
    const signOutButton = screen.getByText('Sign Out');
    
    // Wrap the click event in async act() so React state changes can resolve
    await React.act(async () => {
      fireEvent.click(signOutButton);
    });

    expect(mockSignOut).toHaveBeenCalledTimes(1);
  });
});
