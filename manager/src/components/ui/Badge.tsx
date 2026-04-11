import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

const variants = {
  default: 'text-gray-600 bg-gray-100 border-gray-200 dark:text-slate-300 dark:bg-slate-300/10 dark:border-slate-300/20',
  success: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20',
  warning: 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-400/10 dark:border-yellow-400/20',
  danger:  'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-400/10 dark:border-red-400/20',
  info:    'text-brand-blue bg-blue-50 border-blue-200 dark:text-brand-blue dark:bg-brand-blue/10 dark:border-brand-blue/20',
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
