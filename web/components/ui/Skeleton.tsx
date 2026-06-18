'use client';

import React from 'react';

// ─── Skeleton ──────────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: boolean;
}

export function Skeleton({ className = '', width, height, rounded = false }: SkeletonProps) {
  return (
    <div
      className={[
        'skeleton',
        rounded ? 'rounded-full' : 'rounded-lg',
        className,
      ].join(' ')}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

// ─── Chip / Pill ──────────────────────────────────────────────────────────────

type ChipVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'amber';

interface ChipProps {
  label: string;
  variant?: ChipVariant;
  icon?: React.ReactNode;
  onRemove?: () => void;
  size?: 'sm' | 'md';
}

const chipVariants: Record<ChipVariant, string> = {
  default: 'bg-pale-green text-forest-deep border-transparent',
  success: 'bg-[rgba(77,184,122,0.15)] text-growth-green border-[rgba(77,184,122,0.3)]',
  warning: 'bg-[rgba(232,150,10,0.12)] text-sunlight-amber border-[rgba(232,150,10,0.3)]',
  danger: 'bg-[rgba(217,79,59,0.12)] text-earth-coral border-[rgba(217,79,59,0.3)]',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
};

export function Chip({ label, variant = 'default', icon, onRemove, size = 'md' }: ChipProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-body font-medium border',
        chipVariants[variant],
        size === 'sm' ? 'px-2 py-0.5 text-xs rounded-full' : 'px-3 py-1 text-sm rounded-2xl',
      ].join(' ')}
    >
      {icon && <span className="shrink-0 -ml-0.5">{icon}</span>}
      {label}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 hover:opacity-70 transition-opacity"
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  count?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  showDot?: boolean;
  className?: string;
}

export function Badge({ count, variant = 'default', showDot = false, className = '' }: BadgeProps) {
  const variantStyles: Record<string, string> = {
    default: 'bg-forest-action text-white',
    success: 'bg-growth-green text-white',
    warning: 'bg-sunlight-amber text-white',
    danger: 'bg-earth-coral text-white',
  };

  if (showDot) {
    return (
      <span
        className={`inline-block w-2 h-2 rounded-full ${variantStyles[variant]} ${className}`}
        aria-hidden="true"
      />
    );
  }

  if (count === undefined) return null;

  return (
    <span
      className={[
        'inline-flex items-center justify-center',
        'min-w-[18px] h-[18px] px-1',
        'text-xs font-mono font-bold rounded-full',
        variantStyles[variant],
        className,
      ].join(' ')}
      aria-label={`${count} notifications`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const avatarSizes = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
};

export function Avatar({ src, name, size = 'md', className = '' }: AvatarProps) {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? 'User avatar'}
        className={`rounded-full object-cover shrink-0 ${avatarSizes[size]} ${className}`}
      />
    );
  }

  return (
    <div
      className={[
        'rounded-full bg-forest-action text-ink-inverse',
        'flex items-center justify-center font-body font-semibold shrink-0',
        avatarSizes[size],
        className,
      ].join(' ')}
      aria-label={name ?? 'User'}
    >
      {initials}
    </div>
  );
}
