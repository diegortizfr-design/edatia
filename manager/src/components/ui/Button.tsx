import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: React.ReactNode;
}

const variants = {
  primary:   'bg-gradient-brand text-white shadow-glow-brand hover:opacity-90 hover:shadow-glow-blue',
  secondary: 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 dark:bg-navy-500 dark:text-white dark:border-white/10 dark:hover:bg-navy-400 dark:hover:border-white/20',
  ghost:     'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/5',
  danger:    'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20 dark:hover:bg-red-500/20',
  outline:   'border border-brand-blue/40 text-brand-blue hover:bg-brand-blue/10',
};

const sizes = {
  sm:  'px-3 py-1.5 text-sm gap-1.5',
  md:  'px-4 py-2 text-sm gap-2',
  lg:  'px-6 py-3 text-base gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brand-blue/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="animate-spin shrink-0" size={14} />}
      {children}
    </button>
  );
}
