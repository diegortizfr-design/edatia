export interface Product {
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

export const PRODUCTOS_BABY_WORLD: Product[] = []
