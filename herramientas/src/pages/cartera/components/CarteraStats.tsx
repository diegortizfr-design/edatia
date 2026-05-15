import React from 'react';
import { formatCOP } from '../types';

interface CarteraStatsProps {
  stats: {
    total: number;
    buckets: Array<{ label: string; value: number; percent: number }>;
  };
}

export const CarteraStats: React.FC<CarteraStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
      {/* Total Card */}
      <div className="bg-white dark:bg-navy-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-800 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-blue"></div>
        <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cuentas por Cobrar</p>
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCOP(stats.total)}</h3>
        <p className="text-xs text-blue-500 mt-2 font-medium">Cartera Total</p>
      </div>

      {/* Bucket Cards */}
      {stats.buckets.map((bucket, idx) => {
        const colors = [
          'bg-emerald-500',
          'bg-amber-500',
          'bg-orange-500',
          'bg-red-500'
        ];
        const borderColors = [
          'bg-emerald-500/10',
          'bg-amber-500/10',
          'bg-orange-500/10',
          'bg-red-500/10'
        ];
        const textColors = [
          'text-emerald-600',
          'text-amber-600',
          'text-orange-600',
          'text-red-600'
        ];

        return (
          <div key={idx} className="bg-white dark:bg-navy-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-navy-800 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${colors[idx]}`}></div>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{bucket.label}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{formatCOP(bucket.value)}</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 bg-gray-100 dark:bg-navy-800 rounded-full overflow-hidden">
                <div className={`h-full ${colors[idx]}`} style={{ width: `${bucket.percent}%` }}></div>
              </div>
              <span className={`text-xs font-bold ${textColors[idx]}`}>{bucket.percent.toFixed(1)}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
