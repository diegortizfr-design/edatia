import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variants = {
  default: 'text-slate-300 bg-slate-300/10 border-slate-300/20',
  success: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  warning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  danger:  'text-red-400 bg-red-400/10 border-red-400/20',
  info:    'text-brand-blue bg-brand-blue/10 border-brand-blue/20',
};

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
