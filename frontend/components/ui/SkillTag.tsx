import { clsx } from 'clsx';

interface SkillTagProps {
  label: string;
  variant: 'matched' | 'missing' | 'extra' | 'neutral';
}

const variantStyles: Record<SkillTagProps['variant'], string> = {
  matched:
    'bg-[#00E5A0]/10 border border-[#00E5A0]/30 text-[#00E5A0] font-mono text-xs',
  missing:
    'bg-[#F5A623]/10 border border-[#F5A623]/30 text-[#F5A623] font-mono text-xs',
  extra:
    'bg-[#4F8EF7]/10 border border-[#4F8EF7]/30 text-[#4F8EF7] font-mono text-xs',
  neutral:
    'bg-bg-elevated border border-border-bright text-text-secondary text-xs',
};

export function SkillTag({ label, variant }: SkillTagProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full leading-tight',
        variantStyles[variant]
      )}
    >
      {label}
    </span>
  );
}
