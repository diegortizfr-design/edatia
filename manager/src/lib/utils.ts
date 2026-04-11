import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCOP(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export const ESTADO_COLORS: Record<string, string> = {
  PROSPECTO:  'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  ACTIVO:     'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  SUSPENDIDO: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  CANCELADO:  'text-red-400 bg-red-400/10 border-red-400/20',
};

export const ROL_COLORS: Record<string, string> = {
  ADMIN:        'text-brand-purple bg-brand-purple/10 border-brand-purple/20',
  COMERCIAL:    'text-brand-blue bg-brand-blue/10 border-brand-blue/20',
  COORDINACION: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  OPERACION:    'text-slate-300 bg-slate-300/10 border-slate-300/20',
};

export const MODULO_ICONS: Record<string, string> = {
  inventario: '📦',
  ventas:     '💼',
  administrativo: '🏢',
  contable:   '📊',
  digital:    '🌐',
};
