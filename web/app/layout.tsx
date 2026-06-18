import type { Metadata } from 'next';
import { DM_Sans, DM_Serif_Display, Space_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/providers/AuthProvider';
import { LocaleProvider } from '@/providers/LocaleProvider';

// ─── Fonts ────────────────────────────────────────────────────────────────────
const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700'],
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-serif',
  weight: '400',
  style: ['normal', 'italic'],
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-space-mono',
  weight: ['400', '700'],
});

// ─── Metadata ─────────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: 'EarthPrint — Track & Reduce Your Carbon Footprint',
    template: '%s | EarthPrint',
  },
  description:
    'EarthPrint helps you understand, track, and reduce your personal carbon footprint across travel, food, home energy, and shopping. Get AI-powered tips personalized to your lifestyle.',
  keywords: [
    'carbon footprint',
    'CO2 tracker',
    'sustainability',
    'climate action',
    'carbon calculator',
    'green living',
    'emission tracker',
  ],
  authors: [{ name: 'EarthPrint' }],
  creator: 'EarthPrint',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'EarthPrint',
    title: 'EarthPrint — Track & Reduce Your Carbon Footprint',
    description:
      'Understand your carbon footprint, get AI-personalized tips, and take action that actually matters.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EarthPrint — Carbon Footprint Tracker',
    description: 'Track your CO₂, get AI tips, join community challenges.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmSerifDisplay.variable} ${spaceMono.variable}`}
    >
      <body className="font-body antialiased">
        <AuthProvider>
          <LocaleProvider>
            {children}
          </LocaleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
