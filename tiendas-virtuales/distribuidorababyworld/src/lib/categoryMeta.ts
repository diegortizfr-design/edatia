import { ACTIVE_CAMPAIGN } from '../constants/seasonalCampaign'

export interface CategoryCardMeta {
  icon: string
  bgLight: string
  textColor: string
  borderColor: string
  ringColor: string
  gradient?: string
  badgeText?: string
  isSpecialCampaign?: boolean
}

/**
 * Normaliza y devuelve el emoji/icono correspondiente a cualquier categoría.
 */
export function getCategoryIcon(catName: string): string {
  const c = catName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

  if (c === 'todos') return '✨'
  if (ACTIVE_CAMPAIGN.active && (c.includes(ACTIVE_CAMPAIGN.id) || c.includes('black') || c.includes('oferta') || c.includes('navidad') || c.includes('clases'))) {
    return ACTIVE_CAMPAIGN.icon
  }
  if (c.includes('toalla')) return '🫧'
  if (c.includes('cuidado') || c.includes('aseo') || c.includes('bano') || c.includes('higiene')) return '🧴'
  if (c.includes('panal')) return '🍼'
  if (c.includes('calzado') || c.includes('zapato') || c.includes('tenis')) return '👟'
  if (c.includes('juguet') || c.includes('estimul') || c.includes('didact')) return '🧸'
  if (c.includes('ropa') || c.includes('vest') || c.includes('ajuar') || c.includes('moda')) return '👕'
  if (c.includes('aliment') || c.includes('leche') || c.includes('lactanc') || c.includes('tetero')) return '🥣'
  if (c.includes('coche') || c.includes('paseo') || c.includes('silla') || c.includes('cuna') || c.includes('corral')) return '🛒'
  if (c.includes('variedad') || c.includes('accesori')) return '🎀'

  return '🏷️'
}

/**
 * Genera los metadatos visuales (colores, fondos, bordes, badges) para tarjetas de categoría.
 */
export function getCategoryMeta(catName: string): CategoryCardMeta {
  const c = catName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

  // Campaña Estacional Especial (ej. Black Days, Navidad, etc.)
  if (
    ACTIVE_CAMPAIGN.active &&
    (c.includes('black') || c.includes('oferta') || c.includes('navidad') || c.includes('clases') || c.includes(ACTIVE_CAMPAIGN.id))
  ) {
    return {
      icon: ACTIVE_CAMPAIGN.icon,
      bgLight: 'bg-amber-50',
      textColor: ACTIVE_CAMPAIGN.accentColor,
      borderColor: ACTIVE_CAMPAIGN.borderColor,
      ringColor: ACTIVE_CAMPAIGN.ringColor,
      gradient: ACTIVE_CAMPAIGN.gradient,
      badgeText: ACTIVE_CAMPAIGN.badgeText,
      isSpecialCampaign: true,
    }
  }

  if (c.includes('panal') || c.includes('toalla')) {
    return {
      icon: '🍼',
      bgLight: 'bg-sky-50',
      textColor: 'text-sky-600',
      borderColor: 'border-sky-200',
      ringColor: 'hover:ring-sky-400',
    }
  }

  if (c.includes('juguet') || c.includes('estimul') || c.includes('didact')) {
    return {
      icon: '🧸',
      bgLight: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200',
      ringColor: 'hover:ring-amber-400',
    }
  }

  if (c.includes('cuidado') || c.includes('aseo') || c.includes('bano') || c.includes('higiene')) {
    return {
      icon: '🧴',
      bgLight: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      ringColor: 'hover:ring-emerald-400',
    }
  }

  if (c.includes('calzado') || c.includes('zapato') || c.includes('tenis')) {
    return {
      icon: '👟',
      bgLight: 'bg-purple-50',
      textColor: 'text-purple-600',
      borderColor: 'border-purple-200',
      ringColor: 'hover:ring-purple-400',
    }
  }

  if (c.includes('ropa') || c.includes('vest') || c.includes('ajuar') || c.includes('moda')) {
    return {
      icon: '👕',
      bgLight: 'bg-rose-50',
      textColor: 'text-rose-600',
      borderColor: 'border-rose-200',
      ringColor: 'hover:ring-rose-400',
    }
  }

  if (c.includes('aliment') || c.includes('leche') || c.includes('lactanc') || c.includes('tetero')) {
    return {
      icon: '🥣',
      bgLight: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
      ringColor: 'hover:ring-indigo-400',
    }
  }

  if (c.includes('coche') || c.includes('paseo') || c.includes('silla') || c.includes('cuna') || c.includes('corral')) {
    return {
      icon: '🛒',
      bgLight: 'bg-teal-50',
      textColor: 'text-teal-600',
      borderColor: 'border-teal-200',
      ringColor: 'hover:ring-teal-400',
    }
  }

  if (c.includes('variedad') || c.includes('accesori')) {
    return {
      icon: '🎀',
      bgLight: 'bg-pink-50',
      textColor: 'text-pink-600',
      borderColor: 'border-pink-200',
      ringColor: 'hover:ring-pink-400',
    }
  }

  return {
    icon: '🏷️',
    bgLight: 'bg-slate-50',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-200',
    ringColor: 'hover:ring-slate-400',
  }
}

