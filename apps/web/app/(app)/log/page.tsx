'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { useLogs } from '@/hooks/useLogs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import type { LogEntry } from '@earthprint/types';

const CATEGORIES = ['all', 'travel', 'food', 'energy', 'shopping'] as const;
type CategoryFilter = (typeof CATEGORIES)[number];

const CATEGORY_CONFIG = {
  travel: { icon: '🚗', label: 'Travel', color: '#3B82F6', bgClass: 'category-bg-travel', textClass: 'category-travel' },
  food: { icon: '🍽', label: 'Food', color: '#10B981', bgClass: 'category-bg-food', textClass: 'category-food' },
  energy: { icon: '⚡', label: 'Energy', color: '#F59E0B', bgClass: 'category-bg-energy', textClass: 'category-energy' },
  shopping: { icon: '🛍', label: 'Shopping', color: '#8B5CF6', bgClass: 'category-bg-shopping', textClass: 'category-shopping' },
};

export default function ActivityLogPage() {
  const { user } = useAuth();
  const { logs, summary, loading, error, deleteLog } = useLogs(user?.uid, 90);
  const [filter, setFilter] = useState<CategoryFilter>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filteredLogs = filter === 'all' ? logs : logs.filter((l) => l.category === filter);

  // Group by date
  const logsByDate = filteredLogs.reduce<Record<string, LogEntry[]>>((acc, log) => {
    const date = log.activityDate;
    if (!acc[date]) acc[date] = [];
    acc[date]!.push(log);
    return acc;
  }, {});

  const sortedDates = Object.keys(logsByDate).sort((a, b) => b.localeCompare(a));

  async function handleDelete(log: LogEntry) {
    if (!confirm('Delete this log entry?')) return;
    setDeletingId(log.id);
    try {
      await deleteLog(log.id, log.activityDate);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Activity Log</h1>
          <p className="text-ink-soft mt-1">Last 90 days</p>
        </div>
        <Link href="/log/new">
          <Button id="btn-add-log" variant="primary" leftIcon={<span>+</span>}>
            Log Activity
          </Button>
        </Link>
      </div>

      {/* Summary row */}
      {!loading && summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((cat) => {
            const config = CATEGORY_CONFIG[cat];
            const value = summary.byCategory[cat];
            return (
              <button
                key={cat}
                id={`filter-${cat}`}
                onClick={() => setFilter(filter === cat ? 'all' : cat)}
                className={[
                  'rounded-xl p-3 text-center border transition-all',
                  filter === cat
                    ? 'border-current ring-2 ring-offset-1 shadow-sm'
                    : 'border-border hover:border-current',
                  config.textClass,
                ].join(' ')}
              >
                <p className="text-xl mb-1">{config.icon}</p>
                <p className="text-lg font-mono font-bold">{Math.round(value)}</p>
                <p className="text-xs text-ink-soft">kg CO₂e</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Category filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            id={`filter-pill-${cat}`}
            onClick={() => setFilter(cat)}
            className={[
              'px-4 py-1.5 rounded-2xl text-sm font-medium border shrink-0 transition-all',
              filter === cat
                ? 'bg-forest-action text-white border-forest-action'
                : 'border-border text-ink-soft hover:border-forest-action hover:text-ink',
            ].join(' ')}
          >
            {cat === 'all' ? '📋 All' : `${CATEGORY_CONFIG[cat].icon} ${CATEGORY_CONFIG[cat].label}`}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div role="alert" className="p-4 rounded-xl bg-[rgba(217,79,59,0.1)] border border-earth-coral/30 text-earth-coral text-sm">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <Card>
          <div className="space-y-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton width={40} height={40} rounded />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Logs grouped by date */}
      {!loading && sortedDates.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-4xl mb-4">📋</p>
            <p className="font-medium text-ink mb-2">No logs yet</p>
            <p className="text-sm text-ink-soft mb-6">
              {filter !== 'all'
                ? `No ${filter} logs in the past 90 days`
                : 'Start logging your activities to track your footprint'}
            </p>
            <Link href="/log/new">
              <Button id="btn-first-log-empty" variant="primary">Log Your First Activity →</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!loading && sortedDates.map((date) => {
        const entries = logsByDate[date] ?? [];
        const dateObj = new Date(date);
        const dayTotal = entries.reduce((sum, e) => sum + e.kgCo2e, 0);

        return (
          <div key={date}>
            {/* Date header */}
            <div className="flex items-center justify-between mb-3 mt-4 sticky top-16 lg:top-0 bg-[#E6EEC9]/40 backdrop-blur-md py-2 px-3 z-10 rounded-xl border border-[#1A4A2E]/10 shadow-sm">
              <p className="text-sm font-semibold text-forest-deep flex items-center gap-1.5">
                <span className="text-base lively-emoji">📅</span>
                {dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="bg-forest-action/10 border border-forest-action/20 text-forest-deep text-xs font-mono font-bold px-2.5 py-1 rounded-full shadow-sm">
                {dayTotal.toFixed(1)} kg CO₂e
              </div>
            </div>

            <Card padding="none">
              <div className="divide-y divide-border">
                {entries.map((log) => {
                  const config = CATEGORY_CONFIG[log.category] ?? CATEGORY_CONFIG.travel;
                  return (
                    <div key={log.id} className="flex items-center gap-4 p-4 hover:bg-tint/50 transition-colors group">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bgClass} shrink-0`}>
                        <span className="text-xl">{config.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{log.source}</p>
                        <p className="text-xs text-ink-soft">{config.label}</p>
                        {log.notes && (
                          <p className="text-xs text-ink-soft mt-0.5 truncate">{log.notes}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-2">
                        <div>
                          <p className={`text-sm font-mono font-bold ${config.textClass}`}>
                            {log.kgCo2e.toFixed(2)} kg
                          </p>
                        </div>
                        <button
                          onClick={() => handleDelete(log)}
                          disabled={deletingId === log.id}
                          aria-label={`Delete ${log.source} log entry`}
                          className="opacity-0 group-hover:opacity-100 text-ink-soft hover:text-earth-coral transition-all p-1 rounded"
                        >
                          {deletingId === log.id ? '⏳' : '🗑'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}
