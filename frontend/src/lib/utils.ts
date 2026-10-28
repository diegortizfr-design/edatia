import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combina clases de Tailwind de forma inteligente evitando conflictos.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un número como moneda COP.
 * @param value Valor numérico
 * @param showDecimals Si se deben mostrar centavos
 */
export function formatCOP(value: number | string | null, showDecimals = false): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === null || isNaN(num)) return '$ 0';
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);
}

/**
 * Formatea un número con separadores de miles.
 */
export function formatNum(value: number | string | null): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('es-CO').format(num);
}

/**
 * Formatea una cantidad sin decimales forzados si es un número entero.
 * Ej: 1 -> '1', 2 -> '2', 1000 -> '1.000', 1.5 -> '1,5'
 */
export function fmtCantidad(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '0';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '0';
  if (num % 1 === 0) {
    return num.toLocaleString('es-CO');
  }
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 3 }).format(num);
}

/**
 * Formatea un valor numérico para inputs con separador de miles (puntos).
 * En pesos COP no se usan decimales para valores monetarios estándar.
 * Ej: '10000' -> '10.000', 1500000 -> '1.500.000'
 */
export function formatMiles(val: number | string | null | undefined): string {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val).replace(/\D/g, '');
  if (!str) return '';
  const num = parseInt(str, 10);
  if (isNaN(num)) return '';
  return num.toLocaleString('es-CO');
}

/**
 * Extrae solo los dígitos limpios de un string con separadores.
 * Ej: '10.000' -> '10000', '$ 1.500.000' -> '1500000'
 */
export function parseMiles(val: string | null | undefined): string {
  if (!val) return '';
  return String(val).replace(/\D/g, '');
}


/**
 * Formatea una fecha de forma legible (ej: 15 May, 2026).
 */
export function formatDate(date: string | Date | null): string {
  if (!date) return '—';
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

/**
 * Formatea una fecha y hora (ej: 15 May, 2026 3:30 PM).
 */
export function formatDateTime(date: string | Date | null): string {
  if (!date) return '—';
  const d = new Date(date);
  return new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);
}

/**
 * Acorta un ID o string largo (ej: UUID).
 */
export function truncateId(id: string, length = 8): string {
  if (!id) return '';
  if (id.length <= length) return id;
  return `${id.substring(0, length)}...`;
}
