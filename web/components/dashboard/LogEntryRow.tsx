import React from 'react';
import type { LogEntry } from '@earthprint/types';

const CATEGORY_CONFIG = {
  travel: { icon: '🚗', label: 'Travel', color: '#3B82F6', bgClass: 'category-bg-travel', textClass: 'category-travel' },
  food: { icon: '🍽', label: 'Food', color: '#10B981', bgClass: 'category-bg-food', textClass: 'category-food' },
  energy: { icon: '⚡', label: 'Energy', color: '#F59E0B', bgClass: 'category-bg-energy', textClass: 'category-energy' },
  shopping: { icon: '🛍', label: 'Shopping', color: '#8B5CF6', bgClass: 'category-bg-shopping', textClass: 'category-shopping' },
};

interface LogEntryRowProps {
  log: LogEntry;
}

export function LogEntryRow({ log }: LogEntryRowProps) {
  const config = CATEGORY_CONFIG[log.category as keyof typeof CATEGORY_CONFIG] ?? CATEGORY_CONFIG.travel;
  const date = new Date(log.activityDate);
  const dayLabel = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="flex items-center gap-4 p-4 hover:bg-tint/50 transition-colors">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${config.bgClass} shrink-0`}>
        <span className="text-xl">{config.icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-ink truncate">{log.source}</p>
        <p className="text-xs text-ink-soft">{config.label} · {dayLabel}</p>
      </div>
      <div className="text-right shrink-0">
        <p className={`text-sm font-mono font-bold ${config.textClass}`}>
          {log.kgCo2e.toFixed(1)} kg
        </p>
      </div>
    </div>
  );
}
