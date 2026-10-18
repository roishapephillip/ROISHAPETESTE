import { type ReactNode } from 'react';

type Tone = 'brand' | 'blue' | 'orange' | 'purple' | 'gray' | 'red' | 'green';

const toneClasses: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  purple: 'bg-purple-50 text-purple-700 ring-purple-200',
  gray: 'bg-ink-100 text-ink-700 ring-ink-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  green: 'bg-green-50 text-green-700 ring-green-200',
};

interface BadgeProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
