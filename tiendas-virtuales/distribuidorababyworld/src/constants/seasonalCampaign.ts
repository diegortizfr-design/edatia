import { Product } from '../data/productos'

export interface SeasonalCampaign {
  id: string
  active: boolean
  categoryName: string
  badgeText: string
  icon: string
  title: string
  subtitle: string
  actionText: string
  gradient: string
  borderColor: string
  accentColor: string
  ringColor: string
  isCampaignProduct: (product: Product) => boolean
}

/**
 * Campaña estacional activa actualmente en Baby World.
 * Para cambiar de temporada (ej. a Navidad o Temporada Escolar), basta con ajustar
 * esta configuración o seleccionar uno de los preajustes de abajo.
 */
export const ACTIVE_CAMPAIGN: SeasonalCampaign = {
  id: 'black-friday',
  active: true,
  categoryName: '🔥 Black Friday',
  badgeText: 'Black Friday',
  icon: '🔥',
  title: '🔥 Black Friday',
  subtitle: 'Hasta 60% OFF en referencias seleccionadas',
  actionText: 'Ver ofertas',
  gradient: 'from-slate-950 via-slate-900 to-amber-950',
  borderColor: 'border-amber-400/30 hover:border-amber-400',
  accentColor: 'text-amber-300',
  ringColor: 'hover:ring-amber-400',
  isCampaignProduct: (p: Product) =>
    Boolean(
      (p.precioAnterior && p.precioAnterior > p.precio) ||
      p.categoria?.toLowerCase().includes('juguet') ||
      p.categoria?.toLowerCase().includes('black')
    ),
}

/**
 * Plantillas listas para usar en futuras temporadas comerciales
 */
export const SEASONAL_PRESETS: Record<string, Omit<SeasonalCampaign, 'isCampaignProduct'>> = {
  'black-friday': {
    id: 'black-friday',
    active: true,
    categoryName: '🔥 Black Friday',
    badgeText: 'Black Friday',
    icon: '🔥',
    title: '🔥 Black Friday',
    subtitle: 'Hasta 60% OFF en referencias seleccionadas',
    actionText: 'Ver ofertas',
    gradient: 'from-slate-950 via-slate-900 to-amber-950',
    borderColor: 'border-amber-400/30 hover:border-amber-400',
    accentColor: 'text-amber-300',
    ringColor: 'hover:ring-amber-400',
  },
  'black-days': {
    id: 'black-days',
    active: true,
    categoryName: '🔥 Black Days',
    badgeText: 'Black Days',
    icon: '🔥',
    title: '🔥 Black Days',
    subtitle: 'Hasta 60% OFF en referencias seleccionadas',
    actionText: 'Ver ofertas',
    gradient: 'from-slate-950 via-slate-900 to-amber-950',
    borderColor: 'border-amber-400/30 hover:border-amber-400',
    accentColor: 'text-amber-300',
    ringColor: 'hover:ring-amber-400',
  },
  'navidad': {
    id: 'navidad',
    active: true,
    categoryName: '🎄 Especial Navidad',
    badgeText: 'Navidad Baby World',
    icon: '🎄',
    title: '🎄 Especial Navidad',
    subtitle: 'Los mejores regalos y juguetes para celebrar en familia',
    actionText: 'Ver regalos navideños',
    gradient: 'from-red-950 via-emerald-950 to-slate-950',
    borderColor: 'border-emerald-400/30 hover:border-emerald-400',
    accentColor: 'text-emerald-300',
    ringColor: 'hover:ring-emerald-400',
  },
  'regreso-clases': {
    id: 'regreso-clases',
    active: true,
    categoryName: '🎒 Regreso a Clases',
    badgeText: 'Temporada Escolar',
    icon: '🎒',
    title: '🎒 Regreso a Clases',
    subtitle: 'Mochilas, termos, calzado y accesorios infantiles',
    actionText: 'Ver escolares',
    gradient: 'from-blue-950 via-indigo-950 to-slate-950',
    borderColor: 'border-sky-400/30 hover:border-sky-400',
    accentColor: 'text-sky-300',
    ringColor: 'hover:ring-sky-400',
  },
  'mes-bebe': {
    id: 'mes-bebe',
    active: true,
    categoryName: '🍼 Mes del Bebé',
    badgeText: 'Especial Bebés',
    icon: '🍼',
    title: '🍼 Mes del Bebé',
    subtitle: 'Grandes descuentos en pañales, aseo y coches',
    actionText: 'Explorar promociones',
    gradient: 'from-sky-950 via-teal-950 to-slate-950',
    borderColor: 'border-sky-300/40 hover:border-sky-300',
    accentColor: 'text-sky-200',
    ringColor: 'hover:ring-sky-300',
  },
}

