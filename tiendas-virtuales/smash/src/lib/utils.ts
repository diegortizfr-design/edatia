import { Product } from '../types';

export function formatCOP(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Consultar precio';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export const FREE_SHIPPING_THRESHOLD = 200000;
export const WHATSAPP_PHONE = '573105559876';

export function getProductCode(p: Product): string {
  return p.code || p.referencia || p.sku || String(p.id);
}

export function getProductName(p: Product): string {
  return p.name || p.nombre || 'Producto Smash';
}

export function getProductPrice(p: Product): number {
  return p.price || p.precioWeb || p.precioBase || p.precio || 0;
}

export function getProductCategory(p: Product): string {
  if (typeof p.category === 'string') return p.category;
  if (p.categoria && typeof p.categoria === 'object') return p.categoria.nombre;
  if (typeof p.categoria === 'string') return p.categoria;
  return 'General';
}

export function getProductBrand(p: Product): string {
  if (typeof p.brand === 'string') return p.brand;
  if (p.marca && typeof p.marca === 'object') return p.marca.nombre;
  if (typeof p.marca === 'string') return p.marca;
  return 'Smash';
}

export function getProductDescription(p: Product): string {
  return p.description || p.descripcionWeb || p.descripcion || 'Sin descripción disponible.';
}

export function getProductImage(p: Product): string | null {
  return p.image || p.imagen || null;
}
