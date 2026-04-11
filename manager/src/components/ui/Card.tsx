import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: 'blue' | 'purple' | 'none';
  hover?: boolean;
}

export function Card({ children, className, glow = 'none', hover = false }: CardProps) {
  const glowClasses = {
    blue:   'border-brand-blue/20 hover:border-brand-blue/40',
    purple: 'border-brand-purple/20 hover:border-brand-purple/40',
    none:   'border-white/5 hover:border-white/10',
  };

  return (
    <div
      className={cn(
        'rounded-xl border bg-gradient-card p-5 shadow-card',
        glowClasses[glow],
        hover && 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
        className,
      )}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  color?: 'blue' | 'purple' | 'emerald' | 'yellow';
}

const colorMap = {
  blue:    'from-brand-blue/20 to-brand-blue/5 border-brand-blue/20 text-brand-blue',
  purple:  'from-brand-purple/20 to-brand-purple/5 border-brand-purple/20 text-brand-purple',
  emerald: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400',
  yellow:  'from-yellow-500/20 to-yellow-500/5 border-yellow-500/20 text-yellow-400',
};

export function StatCard({ label, value, icon, trend, color = 'blue' }: StatCardProps) {
  return (
    <Card
      hover
      className={cn(
        'bg-gradient-to-br',
        colorMap[color].split(' ').slice(0, 2).join(' '),
        'border',
        colorMap[color].split(' ')[2],
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1">{label}</p>
          <p className="text-2xl font-bold text-white truncate">{value}</p>
          {trend && <p className="text-xs text-slate-500 mt-1">{trend}</p>}
        </div>
        <div className={cn('shrink-0 p-2 rounded-lg bg-white/5', colorMap[color].split(' ')[3])}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
