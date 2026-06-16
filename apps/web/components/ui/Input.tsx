'use client';

import React, { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  isRequired?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftElement, rightElement, isRequired, className = '', id, ...props }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 9)}`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-ink"
          >
            {label}
            {isRequired && <span className="text-earth-coral ml-1" aria-label="required">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftElement && (
            <div className="absolute left-3 text-ink-soft pointer-events-none">
              {leftElement}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={[
              'w-full rounded-lg border bg-white px-3 py-2.5',
              'font-body text-base text-ink',
              'placeholder:text-ink-soft/60',
              'transition-colors duration-150',
              'focus:outline-none focus:ring-2 focus:ring-forest-action focus:border-forest-action',
              error
                ? 'border-earth-coral focus:ring-earth-coral'
                : 'border-border hover:border-forest-action/50',
              leftElement ? 'pl-9' : '',
              rightElement ? 'pr-9' : '',
              props.disabled ? 'opacity-50 cursor-not-allowed bg-tint' : '',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />

          {rightElement && (
            <div className="absolute right-3 text-ink-soft">
              {rightElement}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} role="alert" className="text-sm text-earth-coral flex items-center gap-1">
            <span aria-hidden="true">⚠</span> {error}
          </p>
        )}

        {hint && !error && (
          <p id={`${inputId}-hint`} className="text-sm text-ink-soft">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
