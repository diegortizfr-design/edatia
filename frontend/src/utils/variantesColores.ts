export interface ColorItem {
  nombre: string
  hex: string
  border?: boolean
}

export const PALETA_COLORES: ColorItem[] = [
  { nombre: 'Blanco', hex: '#FFFFFF', border: true },
  { nombre: 'Negro', hex: '#0F172A' },
  { nombre: 'Gris Perla', hex: '#E2E8F0', border: true },
  { nombre: 'Gris Oscuro', hex: '#64748B' },
  { nombre: 'Beige', hex: '#E8DCB9' },
  { nombre: 'Rosa Pastel', hex: '#FBCFE8' },
  { nombre: 'Rosado', hex: '#F472B6' },
  { nombre: 'Fucsia', hex: '#EC4899' },
  { nombre: 'Palo de Rosa', hex: '#D47391' },
  { nombre: 'Azul Celeste', hex: '#BAE6FD' },
  { nombre: 'Azul Rey', hex: '#2563EB' },
  { nombre: 'Azul Marino', hex: '#1E3A8A' },
  { nombre: 'Verde Menta', hex: '#A7F3D0' },
  { nombre: 'Verde Oliva', hex: '#4D6B53' },
  { nombre: 'Amarillo Claro', hex: '#FEF08A' },
  { nombre: 'Amarillo Mostaza', hex: '#EAB308' },
  { nombre: 'Rojo', hex: '#EF4444' },
  { nombre: 'Naranja', hex: '#F97316' },
  { nombre: 'Lila', hex: '#D8B4FE' },
  { nombre: 'Café', hex: '#78350F' },
]

export const PRESETS_COLORES = [
  { id: 'bebe-pastel', label: '🍼 Bebé Pastel', colores: ['Blanco', 'Rosa Pastel', 'Azul Celeste', 'Beige', 'Amarillo Claro'] },
  { id: 'neutros', label: '👔 Básicos & Neutros', colores: ['Blanco', 'Negro', 'Gris Oscuro', 'Azul Marino', 'Beige'] },
  { id: 'vivos', label: '🌈 Colores Vivos', colores: ['Rojo', 'Azul Rey', 'Amarillo Mostaza', 'Fucsia', 'Verde Menta'] },
  { id: 'nina', label: '🌸 Niña / Rosas', colores: ['Rosa Pastel', 'Rosado', 'Fucsia', 'Palo de Rosa', 'Blanco'] },
  { id: 'nino', label: '🧢 Niño / Azules', colores: ['Azul Celeste', 'Azul Rey', 'Azul Marino', 'Gris Perla', 'Verde Menta'] },
]

export const PRESETS_TALLAS = [
  { id: 'bebe', label: '👶 Bebé / Pasos (14 a 17)', tallas: ['14', '15', '16', '17'] },
  { id: 'nino', label: '🧒 Infantil / Niños (18 a 26)', tallas: ['18', '19', '20', '21', '22', '23', '24', '25', '26'] },
  { id: 'junior', label: '👟 Junior (27 a 34)', tallas: ['27', '28', '29', '30', '31', '32', '33', '34'] },
  { id: 'adulto', label: '👞 Adulto (35 a 42)', tallas: ['35', '36', '37', '38', '39', '40', '41', '42'] },
  { id: 'ropa-bebe', label: '🍼 Ropa Bebé (Meses)', tallas: ['0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M'] },
  { id: 'ropa', label: '👕 Ropa / Textil (XS a XL)', tallas: ['XS', 'S', 'M', 'L', 'XL'] },
]

export function slugifyAttr(text: string): string {
  if (!text) return ''
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function buscarHexColor(nombreColor: string): string {
  if (!nombreColor) return '#94A3B8'
  const limpio = nombreColor.trim().toLowerCase()
  const encontrado = PALETA_COLORES.find(c => c.nombre.toLowerCase() === limpio)
  if (encontrado) return encontrado.hex

  // Mapeos aproximados para colores escritos libremente
  if (limpio.includes('blanco')) return '#FFFFFF'
  if (limpio.includes('negro')) return '#0F172A'
  if (limpio.includes('rosa') || limpio.includes('rosad')) return '#F472B6'
  if (limpio.includes('fucsia')) return '#EC4899'
  if (limpio.includes('celeste')) return '#BAE6FD'
  if (limpio.includes('azul')) return '#2563EB'
  if (limpio.includes('gris')) return '#94A3B8'
  if (limpio.includes('beige') || limpio.includes('crema') || limpio.includes('arena')) return '#E8DCB9'
  if (limpio.includes('verde')) return '#10B981'
  if (limpio.includes('amarillo')) return '#FDE047'
  if (limpio.includes('rojo')) return '#EF4444'
  if (limpio.includes('naranja')) return '#F97316'
  if (limpio.includes('lila') || limpio.includes('morad') || limpio.includes('lavanda')) return '#C084FC'
  if (limpio.includes('cafe') || limpio.includes('café') || limpio.includes('marron') || limpio.includes('marrón')) return '#78350F'
  return '#94A3B8'
}

/**
 * Analiza una variante y extrae limpiamente talla, color y colorHex.
 * Incluye autocorrección inteligente para variantes legadas que guardaban el color como talla (ej. Talla ROSA).
 */
export function extraerAtributosVisuales(v: any) {
  let tallaAttr = (v?.atributos ?? []).find((a: any) => a.nombre?.toLowerCase() === 'talla')
  let colorAttr = (v?.atributos ?? []).find((a: any) => a.nombre?.toLowerCase() === 'color')

  // Si no tiene colorAttr pero tallaAttr contiene el nombre de un color sin dígitos (ej. "ROSA"),
  // lo reclasificamos automáticamente como color para una visualización perfecta.
  if (!colorAttr && tallaAttr) {
    const valLimpio = String(tallaAttr.valor || '').trim().toLowerCase()
    const esColor = PALETA_COLORES.some(c => c.nombre.toLowerCase().includes(valLimpio) || valLimpio.includes(c.nombre.toLowerCase()))
      || ['rosa', 'rosado', 'rojo', 'azul', 'blanco', 'negro', 'verde', 'amarillo', 'beige', 'fucsia', 'morado', 'lila', 'gris', 'cafe', 'café'].some(c => valLimpio.includes(c))
    
    if (esColor && !/\d/.test(valLimpio)) {
      colorAttr = {
        nombre: 'Color',
        valor: tallaAttr.valor,
        hex: tallaAttr.hex || buscarHexColor(tallaAttr.valor),
      }
      tallaAttr = null
    }
  }

  // Si ni talla ni color están en atributos, verificar v.nombre
  if (!colorAttr && !tallaAttr && v?.nombre) {
    const nomLimpio = String(v.nombre).trim().toLowerCase()
    if (nomLimpio.startsWith('talla ')) {
      const valTalla = v.nombre.replace(/^talla\s+/i, '').trim()
      if (/\d/.test(valTalla)) {
        tallaAttr = { nombre: 'Talla', valor: valTalla }
      } else {
        colorAttr = { nombre: 'Color', valor: valTalla, hex: buscarHexColor(valTalla) }
      }
    } else if (nomLimpio.startsWith('color ')) {
      const valColor = v.nombre.replace(/^color\s+/i, '').trim()
      colorAttr = { nombre: 'Color', valor: valColor, hex: buscarHexColor(valColor) }
    }
  }

  const hex = colorAttr?.hex || (colorAttr ? buscarHexColor(colorAttr.valor) : null)

  return {
    talla: tallaAttr?.valor || null,
    color: colorAttr?.valor || null,
    colorHex: hex,
    esTalla: !!tallaAttr,
    esColor: !!colorAttr,
  }
}

