const ACCENT_DICT: Record<string, string> = {
  jugueteria: 'Juguetería',
  jugueterias: 'Jugueterías',
  panal: 'Pañal',
  panales: 'Pañales',
  pañales: 'Pañales',
  bebe: 'Bebé',
  bebes: 'Bebés',
  alimentacion: 'Alimentación',
  lactancia: 'Lactancia',
  didactico: 'Didáctico',
  didacticos: 'Didácticos',
  didactica: 'Didáctica',
  didacticas: 'Didácticas',
  estimulacion: 'Estimulación',
  lenceria: 'Lencería',
  bano: 'Baño',
  baño: 'Baño',
  calzado: 'Calzado',
  ropa: 'Ropa',
  leches: 'Leches',
  teteros: 'Teteros',
  variedades: 'Variedades',
  cuidado: 'Cuidado',
  pomadas: 'Pomadas',
  panitos: 'Pañitos',
  pañitos: 'Pañitos',
  toallitas: 'Toallitas',
  higiene: 'Higiene',
  aseo: 'Aseo',
  otros: 'Otros',
  todos: 'Todos',
}

const MINOR_WORDS = new Set([
  'de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'en', 'para', 'por', 'con', 'o', 'u', '&'
])

/**
 * Convierte cualquier texto de categoría/subcategoría de ERP (ej: "CALZADO", "JUGUETERIA", "PAÑALES")
 * a formato título ("Calzado", "Juguetería", "Pañales") respetando acentos ortográficos en español.
 */
export function toCategoryTitleCase(str?: string | null): string {
  if (!str) return ''
  const trimmed = str.trim()
  if (!trimmed) return ''
  if (trimmed.toLowerCase() === 'todos') return 'Todos'
  if (trimmed.toLowerCase() === 'otros') return 'Otros'

  return trimmed
    .split(/\s+/)
    .map((word, idx) => {
      const cleanWord = word.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      if (ACCENT_DICT[cleanWord]) {
        return ACCENT_DICT[cleanWord]
      }
      if (idx > 0 && MINOR_WORDS.has(word.toLowerCase())) {
        return word.toLowerCase()
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

/**
 * Compara dos nombres de categoría sin importar mayúsculas, minúsculas o tildes.
 */
export function matchesCategoryName(catA?: string | null, catB?: string | null): boolean {
  if (!catA || !catB) return false
  if (catA === catB) return true
  const normA = catA.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  const normB = catB.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
  return normA === normB
}
