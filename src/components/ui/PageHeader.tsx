import { type ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: { label: string; onClick: () => void };
}

export function PageHeader({ title, description, actions, back }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {back && (
          <button
            onClick={back.onClick}
            className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-white/60 hover:text-white transition-colors"
          >
            <span>←</span> {back.label}
          </button>
        )}
        <h1 className="text-2xl font-extrabold text-white tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-white/60 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </div>
  );
}
