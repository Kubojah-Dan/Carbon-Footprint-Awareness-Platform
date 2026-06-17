'use client';

import React, { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'glass' | 'elevated';
  padding?: 'sm' | 'md' | 'lg' | 'none';
  onClick?: () => void;
  id?: string;
  role?: string;
  'aria-label'?: string;
}

const variantClasses = {
  default: 'bg-white/40 backdrop-blur-xl border border-[#D1E8D9]/50 shadow-[0_8px_32px_0_rgba(10,35,24,0.04)] hover:shadow-[0_12px_40px_0_rgba(77,184,122,0.1)] hover:border-emerald-500/35 transition-all duration-300',
  dark: 'bg-[#132B1F]/60 backdrop-blur-xl border border-[#2D4A38]/30 shadow-[0_8px_32px_rgba(10,35,24,0.08)]',
  glass: 'bg-white/25 backdrop-blur-2xl border border-white/30 shadow-[0_8px_32px_0_rgba(10,35,24,0.03)] hover:shadow-[0_12px_40px_0_rgba(77,184,122,0.12)] hover:border-emerald-400/40 transition-all duration-300',
  elevated: 'bg-white/55 backdrop-blur-xl border border-[#D1E8D9]/60 shadow-[0_12px_36px_rgba(10,35,24,0.05)] hover:shadow-[0_16px_48px_rgba(77,184,122,0.15)] hover:-translate-y-0.5 hover:border-emerald-500/40 transition-all duration-300',
};

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  onClick,
  id,
  role,
  'aria-label': ariaLabel,
}: CardProps) {
  const isInteractive = !!onClick;

  return (
    <div
      id={id}
      role={role ?? (isInteractive ? 'button' : undefined)}
      aria-label={ariaLabel}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={isInteractive ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={[
        'rounded-2xl',
        variantClasses[variant],
        paddingClasses[padding],
        isInteractive ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

/** Card subcomponents for consistent structure */
export function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  const hasDisplay = /\b(block|grid|flex|inline-flex|hidden)\b/.test(className);
  const baseClasses = hasDisplay ? 'mb-4' : 'flex items-center justify-between mb-4';
  return <div className={`${baseClasses} ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <h3 className={`font-display text-lg text-ink ${className}`}>{children}</h3>;
}

export function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mt-4 pt-4 border-t border-border flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
}
