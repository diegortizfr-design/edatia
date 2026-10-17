const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, 'productos_zapatos.json');
const tsPath = path.join(__dirname, '../../tiendas-virtuales/distribuidorababyworld/src/data/productos.ts');

const productos = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const mappedProducts = productos.map((p, idx) => ({
  id: p.id || (idx + 1),
  nombre: p.nombre,
  descripcion: p.descripcion,
  descripcionLarga: p.descripcionLarga,
  precio: p.precio,
  categoria: 'Calzado',
  subcategoria: p.subcategoria,
  genero: p.genero,
  imagen: p.imagen,
  imagenes: p.imagenes,
  rating: p.esDestacado ? 5.0 : 4.8,
  reviewsCount: 15 + (idx * 2),
  stock: p.stock || 25,
  esDestacado: !!p.esDestacado,
  detalles: p.detalles,
  especificaciones: {
    'SKU': p.sku,
    'Tallas': (p.tallas || []).join(', '),
    'Tipo de Cierre': p.tipoCierre || 'Velcro',
    'Material': p.material || 'Sintético'
  }
}));

const tsContent = `export interface Product {
  id: number
  nombre: string
  descripcion: string
  descripcionLarga: string
  precio: number
  precioAnterior?: number
  categoria: string
  subcategoria?: string
  genero?: 'Niño' | 'Niña' | 'Unisex'
  etapa?: string
  imagen: string
  imagenes?: string[]
  rating: number
  reviewsCount?: number
  stock: number
  esDestacado?: boolean
  esOferta?: boolean
  esNovedad?: boolean
  detalles: string[]
  especificaciones?: { [key: string]: string }
}

export const CATEGORIAS_PRODUCTOS = [
  'Todos',
  'Calzado',
  'Juguetería',
  'Ropa',
  'Alimentación',
  'Pañales y Cuidado',
  'Variedades'
] as const

export const SUBCATEGORIAS_CUIDADO = [
  'Todos',
  'Pañales',
  'Cremas & Pomadas',
  'Toallitas & Pañitos',
  'Aseo & Baño',
  'Alimentación & Chupos'
] as const

export const PRODUCTOS_BABY_WORLD: Product[] = ${JSON.stringify(mappedProducts, null, 2)}
`;

fs.writeFileSync(tsPath, tsContent, 'utf8');
console.log(`✅ productos.ts actualizado con ${mappedProducts.length} productos de Calzado.`);
