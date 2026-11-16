// Utilidades para identificación y representación visual de variantes (colores y tallas) en la tienda virtual

export interface ColorDef {
  label: string
  hex: string
  synonyms: string[]
}

export const PALETA_COLORES: ColorDef[] = [
  { label: 'Blanco', hex: '#FFFFFF', synonyms: ['blanco', 'white', 'blanca'] },
  { label: 'Negro', hex: '#0F172A', synonyms: ['negro', 'black', 'negra'] },
  { label: 'Gris', hex: '#64748B', synonyms: ['gris', 'grey', 'gray', 'plata'] },
  { label: 'Azul', hex: '#2563EB', synonyms: ['azul', 'blue', 'rey'] },
  { label: 'Azul Marino', hex: '#1E3A8A', synonyms: ['azul marino', 'marino', 'navy', 'azul oscuro'] },
  { label: 'Azul Cielo', hex: '#38BDF8', synonyms: ['azul cielo', 'celeste', 'sky', 'azul bebe', 'azul claro'] },
  { label: 'Rosa / Rosado', hex: '#F472B6', synonyms: ['rosa', 'rosado', 'rosada', 'pink'] },
  { label: 'Fucsia', hex: '#E11D48', synonyms: ['fucsia', 'fuchsia', 'magenta'] },
  { label: 'Rojo', hex: '#DC2626', synonyms: ['rojo', 'roja', 'red'] },
  { label: 'Verde', hex: '#16A34A', synonyms: ['verde', 'green'] },
  { label: 'Verde Menta', hex: '#34D399', synonyms: ['menta', 'verde menta', 'mint'] },
  { label: 'Verde Militar', hex: '#4D7C0F', synonyms: ['verde militar', 'militar', 'oliva', 'olive'] },
  { label: 'Amarillo', hex: '#EAB308', synonyms: ['amarillo', 'amarilla', 'yellow'] },
  { label: 'Naranja', hex: '#EA580C', synonyms: ['naranja', 'orange'] },
  { label: 'Morado / Lila', hex: '#9333EA', synonyms: ['morado', 'morada', 'lila', 'purple', 'violeta'] },
  { label: 'Beige / Crema', hex: '#F5F5DC', synonyms: ['beige', 'crema', 'marfil', 'ivory', 'hueso'] },
  { label: 'Café / Marrón', hex: '#78350F', synonyms: ['cafe', 'marron', 'brown', 'chocolate'] },
  { label: 'Dorado', hex: '#D97706', synonyms: ['dorado', 'oro', 'gold'] },
  { label: 'Salmón', hex: '#FB7185', synonyms: ['salmon', 'coral'] },
  { label: 'Turquesa', hex: '#06B6D4', synonyms: ['turquesa', 'cyan', 'aguamarina'] },
]

export function normalizeStr(str: string): string {
  return (str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function buscarHexColor(nombreOValor: string): string | undefined {
  const norm = normalizeStr(nombreOValor)
  for (const c of PALETA_COLORES) {
    if (c.synonyms.some(s => norm === s || norm.includes(s))) {
      return c.hex
    }
  }
  return undefined
}

export function extraerAtributosVisuales(atributos: any, nombreVariante?: string): {
  colorHex?: string
  colorLabel?: string
  tallaLabel?: string
} {
  let colorLabel: string | undefined
  let tallaLabel: string | undefined
  let colorHex: string | undefined

  if (Array.isArray(atributos)) {
    for (const a of atributos) {
      const nombreAttr = normalizeStr(a.nombre || '')
      const valorAttr = String(a.valor || '').trim()

      if (nombreAttr.includes('color')) {
        colorLabel = valorAttr
        colorHex = a.hex || buscarHexColor(valorAttr)
      } else if (nombreAttr.includes('talla')) {
        const hexPosible = buscarHexColor(valorAttr)
        if (hexPosible) {
          colorLabel = valorAttr
          colorHex = hexPosible
        } else {
          tallaLabel = valorAttr
        }
      }
    }
  }

  if (!colorLabel && nombreVariante) {
    const hex = buscarHexColor(nombreVariante)
    if (hex) {
      colorHex = hex
      colorLabel = nombreVariante.replace(/^color\s*/i, '').trim()
    }
  }

  return { colorHex, colorLabel, tallaLabel }
}

