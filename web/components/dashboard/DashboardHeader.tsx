import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface DashboardHeaderProps {
  firstName: string;
}

export function DashboardHeader({ firstName }: DashboardHeaderProps) {
  const todayLabel = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="font-display text-3xl text-ink">
          Hey {firstName} 👋
        </h1>
        <p className="text-ink-soft mt-1">
          {todayLabel}
        </p>
      </div>
      <Link href="/log/new" id="dashboard-add-log">
        <Button variant="primary" leftIcon={<span>+</span>} size="md">
          Log Activity
        </Button>
      </Link>
    </div>
  );
}
