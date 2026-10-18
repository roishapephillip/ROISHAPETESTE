import { type ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: 'brand' | 'blue' | 'orange' | 'purple';
  onClick?: () => void;
}

const toneClasses: Record<string, { bg: string; text: string }> = {
  brand: { bg: 'bg-brand-50', text: 'text-brand-600' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600' },
};

export function StatCard({ label, value, icon, tone = 'brand', onClick }: StatCardProps) {
  const t = toneClasses[tone];
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`group flex w-full items-center gap-4 rounded-2xl border border-ink-100 bg-white p-5 text-left shadow-card transition-all ${
        onClick ? 'hover:shadow-cardHover hover:border-ink-200 cursor-pointer' : ''
      }`}
    >
      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${t.bg} ${t.text}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-extrabold text-ink-900 leading-tight">{value}</p>
        <p className="text-sm font-medium text-ink-500 truncate">{label}</p>
      </div>
      {onClick && (
        <ArrowRight className="h-5 w-5 text-ink-300 transition-transform group-hover:translate-x-1 group-hover:text-ink-500" />
      )}
    </Component>
  );
}
