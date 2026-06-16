'use client';

import React from 'react';

interface ProgressBarProps {
  value: number;       // 0–100
  max?: number;        // Default 100
  label?: string;
  showValue?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'amber';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
  id?: string;
}

const variantClasses = {
  default: 'bg-forest-action',
  success: 'bg-growth-green',
  warning: 'bg-sunlight-amber',
  danger: 'bg-earth-coral',
  amber: 'bg-sunlight-amber',
};

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showValue = false,
  variant = 'default',
  size = 'md',
  animated = true,
  className = '',
  id,
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  // Determine variant based on percentage if not overridden
  const autoVariant =
    variant === 'default'
      ? percentage >= 80
        ? 'danger'
        : percentage >= 60
        ? 'warning'
        : 'success'
      : variant;

  return (
    <div className={`w-full ${className}`} id={id}>
      {(label || showValue) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-sm text-ink-soft">{label}</span>}
          {showValue && (
            <span className="text-sm font-mono text-ink font-medium">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div
        className={`w-full rounded-full bg-pale-green ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? `${Math.round(percentage)}% complete`}
      >
        <div
          className={[
            'h-full rounded-full',
            variantClasses[autoVariant],
            animated ? 'transition-all duration-700 ease-out' : '',
          ].join(' ')}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

/** Circular progress variant for compact display */
interface CircularProgressProps {
  value: number;   // 0–100
  size?: number;   // px — default 56
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

const circularColors = {
  default: '#2D7A4F',
  success: '#4DB87A',
  warning: '#E8960A',
  danger: '#D94F3B',
};

export function CircularProgress({
  value,
  size = 56,
  strokeWidth = 6,
  label,
  sublabel,
  variant = 'default',
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  const center = size / 2;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#C8F0DC"
          strokeWidth={strokeWidth}
        />
        {/* Fill */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={circularColors[variant]}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 700ms ease-out' }}
        />
      </svg>

      {label && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs font-mono font-bold text-ink leading-none">{label}</span>
          {sublabel && <span className="text-[9px] text-ink-soft mt-0.5">{sublabel}</span>}
        </div>
      )}
    </div>
  );
}
