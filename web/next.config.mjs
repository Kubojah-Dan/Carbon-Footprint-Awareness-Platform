import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages
  transpilePackages: [
    '@earthprint/emission-engine',
    '@earthprint/types',
    '@earthprint/ui',
  ],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile photos
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // Firebase Storage
      },
      {
        protocol: 'https',
        hostname: 'images.openfoodfacts.org', // Open Food Facts product images
      },
    ],
  },

  // Experimental features
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },

  // Environment variable type safety (public vars only)
  env: {
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? 'EarthPrint',
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(self)',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.sentry.io",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://api.groq.com https://api.electricitymap.org https://world.openfoodfacts.org https://lh3.googleusercontent.com https://firebasestorage.googleapis.com https://*.googleapis.com https://*.firebaseapp.com https://*.sentry.io",
              "img-src 'self' data: blob: https://lh3.googleusercontent.com https://firebasestorage.googleapis.com https://images.openfoodfacts.org",
              "media-src 'self' blob: data:",
              "frame-src 'self' https://*.firebaseapp.com",
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: 'earthprint',
    project: 'web-app',
  },
  {
    widenClientSandbox: true,
    tunnelRoute: '/monitoring',
    hideSourceMaps: true,
    disableLogger: true,
    disableServerWebpackPlugin: true,
    disableClientWebpackPlugin: true,
  }
);
