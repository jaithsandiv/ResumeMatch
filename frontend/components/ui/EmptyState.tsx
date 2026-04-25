import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-16 gap-3 text-text-muted">
      <Icon size={48} strokeWidth={1.5} className="text-text-muted" />
      <p className="text-text-primary text-base">{title}</p>
      {subtitle && <div className="text-text-secondary text-sm">{subtitle}</div>}
    </div>
  );
}
