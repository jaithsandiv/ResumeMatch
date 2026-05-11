import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 gap-4 text-center animate-fade-in">
      <div className="relative">
        <div
          aria-hidden="true"
          className="absolute inset-0 rounded-full blur-2xl opacity-30"
          style={{
            background:
              'radial-gradient(circle, rgba(79, 142, 247, 0.4) 0%, transparent 70%)',
          }}
        />
        <div className="relative w-16 h-16 rounded-2xl bg-bg-elevated border border-border-dim flex items-center justify-center">
          <Icon size={28} strokeWidth={1.5} className="text-text-secondary" />
        </div>
      </div>
      <div className="space-y-1.5 max-w-sm">
        <p className="text-text-primary text-base font-medium">{title}</p>
        {subtitle && (
          <div className="text-text-secondary text-sm leading-relaxed">{subtitle}</div>
        )}
      </div>
    </div>
  );
}
