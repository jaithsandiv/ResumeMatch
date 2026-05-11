import { clsx } from 'clsx';

interface SkillTagProps {
  label: string;
  variant: 'matched' | 'missing' | 'extra' | 'neutral';
}

const variantStyles: Record<SkillTagProps['variant'], string> = {
  matched:
    'bg-accent-green/10 border-accent-green/30 text-accent-green font-mono hover:bg-accent-green/15 hover:border-accent-green/50',
  missing:
    'bg-accent-amber/10 border-accent-amber/30 text-accent-amber font-mono hover:bg-accent-amber/15 hover:border-accent-amber/50',
  extra:
    'bg-accent-blue/10 border-accent-blue/30 text-accent-blue font-mono hover:bg-accent-blue/15 hover:border-accent-blue/50',
  neutral:
    'bg-bg-elevated border-border-bright text-text-secondary hover:border-border-bright hover:text-text-primary',
};

export function SkillTag({ label, variant }: SkillTagProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full leading-tight text-xs border transition-colors duration-150',
        variantStyles[variant]
      )}
    >
      {label}
    </span>
  );
}
