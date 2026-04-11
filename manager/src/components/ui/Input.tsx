import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700 dark:text-slate-300">{label}</label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full rounded-lg border text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500',
              'bg-white dark:bg-navy-800',
              'border-gray-300 dark:border-white/10',
              'focus:border-brand-blue/60 focus:ring-1 focus:ring-brand-blue/30',
              'transition-all duration-150 outline-none',
              'py-2.5 pr-4',
              leftIcon ? 'pl-10' : 'pl-4',
              rightIcon && 'pr-10',
              error && 'border-red-400 dark:border-red-500/50 focus:border-red-500 dark:focus:border-red-500/70',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-400">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';
