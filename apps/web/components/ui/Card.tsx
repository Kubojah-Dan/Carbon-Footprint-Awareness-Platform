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
  default: 'bg-white/50 backdrop-blur-lg border border-[#D1E8D9]/40 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-emerald-500/20 transition-all duration-300',
  dark: 'bg-[#132B1F]/70 backdrop-blur-lg border border-[#2D4A38]/40 shadow-[0_4px_20px_rgba(0,0,0,0.05)]',
  glass: 'bg-white/30 backdrop-blur-xl border border-[#D1E8D9]/30 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all duration-300',
  elevated: 'bg-white/65 backdrop-blur-lg border border-[#D1E8D9]/50 shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:border-emerald-500/30 transition-all duration-300',
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
        'rounded-lg',
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
