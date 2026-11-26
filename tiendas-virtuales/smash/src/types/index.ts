export interface Product {
  id: string | number;
  code?: string;
  sku?: string;
  referencia?: string;
  name: string;
  nombre?: string;
  category: string;
  categoria?: string | { id: number; nombre: string; slug: string };
  brand?: string;
  marca?: string | { id: number; nombre: string };
  price: number;
  precio?: number;
  precioBase?: number;
  precioWeb?: number;
  gender?: 'Unisex' | 'Hombre' | 'Mujer' | 'Niños';
  sizes?: string[];
  badge?: string;
  description: string;
  descripcion?: string;
  descripcionWeb?: string;
  image?: string | null;
  imagen?: string | null;
  slug?: string;
  stock?: number;
  esDestacado?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize?: string;
}

export interface FilterState {
  search: string;
  category: string;
  brand: string;
  gender: string;
  maxPrice: number;
  sortBy: 'recommended' | 'price-asc' | 'price-desc' | 'name-asc';
}

export interface StringingOrder {
  stringType: string;
  tension: number;
  isExpress: boolean;
  totalPrice: number;
}
