'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to Sentry or monitoring
    console.error('[Dashboard Error Boundary]:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6 space-y-6">
      <div className="text-6xl animate-bounce-slow">🍂</div>
      <h2 className="font-display text-3xl font-bold text-ink leading-tight">
        Ecosystem Disturbance Detected
      </h2>
      <p className="text-sm text-ink-soft max-w-md leading-relaxed">
        Something went wrong while rendering this section of your biosphere. Don't worry, nature is resilient—let's try to restore the balance.
      </p>
      <div className="flex gap-4">
        <Button variant="primary" onClick={() => reset()} size="md">
          Retry Rendering
        </Button>
        <Button variant="ghost" onClick={() => (window.location.href = '/dashboard')} size="md">
          Go to Dashboard
        </Button>
      </div>
      {error.digest && (
        <p className="text-[10px] text-ink-soft/50 font-mono">
          Error signature: {error.digest}
        </p>
      )}
    </div>
  );
}
