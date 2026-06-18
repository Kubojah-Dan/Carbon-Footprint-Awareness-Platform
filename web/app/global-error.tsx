'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="bg-sand-light text-ink antialiased">
        <div className="flex flex-col items-center justify-center min-h-screen text-center p-6 space-y-6">
          <div className="text-7xl">🌋</div>
          <h2 className="font-display text-4xl font-bold text-ink leading-tight">
            Planetary Disruption
          </h2>
          <p className="text-sm text-ink-soft max-w-md leading-relaxed">
            A critical system exception has interrupted the platform's core services. We are working to restore the connection.
          </p>
          <div className="flex gap-4 justify-center">
            <Button variant="primary" onClick={() => reset()} size="md">
              Recover Connection
            </Button>
          </div>
          {error.digest && (
            <p className="text-[10px] text-ink-soft/40 font-mono mt-4">
              Diagnostic code: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
