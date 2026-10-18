import { type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  variant?: 'light' | 'dark';
}

export function Input({ label, error, leftIcon, rightIcon, variant = 'light', className = '', id, ...props }: InputProps) {
  const isDark = variant === 'dark';
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-white/80' : 'text-ink-700'}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-ink-400'}`}>{leftIcon}</span>
        )}
        <input
          id={id}
          className={`w-full h-11 rounded-xl border px-3.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
            isDark
              ? 'bg-[#222222] border-white/10 text-white placeholder:text-white/30'
              : 'bg-white text-ink-900 placeholder:text-ink-400'
          } ${error ? 'border-red-400' : isDark ? '' : 'border-ink-200'} ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${className}`}
          {...props}
        />
        {rightIcon && (
          <span className={`absolute right-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-white/40' : 'text-ink-400'}`}>{rightIcon}</span>
        )}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className = '', id, children, ...props }: SelectProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-ink-700 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={id}
        className={`w-full h-11 rounded-xl border bg-white px-3.5 text-sm text-ink-900 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
          error ? 'border-red-400' : 'border-ink-200'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className = '', id, ...props }: TextareaProps) {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-sm font-semibold text-ink-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 ${
          error ? 'border-red-400' : 'border-ink-200'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
}
