export interface ConfigAliadosPrograma {
  activo: boolean;
  porcentajeUtilidad: number;
  montoMinimoRetiro: number;
  requiereAprobacion: boolean;
  codigoInvitacion: string;
  categoriasHabilitadas: number[];
  bloquearAutocompra: boolean;
  stockMinimoCatalogo: number;
  redondeoComision: number;
}

export const DEFAULT_CONFIG_ALIADOS: ConfigAliadosPrograma = {
  activo: true,
  porcentajeUtilidad: 30,
  montoMinimoRetiro: 30000,
  requiereAprobacion: false,
  codigoInvitacion: '',
  categoriasHabilitadas: [],
  bloquearAutocompra: true,
  stockMinimoCatalogo: 1,
  redondeoComision: 100,
};

export function mergeConfigAliados(raw: any): ConfigAliadosPrograma {
  const src = raw && typeof raw === 'object' ? raw : {};
  const pct = Number(src.porcentajeUtilidad);
  const minRetiro = Number(src.montoMinimoRetiro);
  const stockMin = Number(src.stockMinimoCatalogo);
  const redondeo = Number(src.redondeoComision);

  return {
    activo: src.activo !== undefined ? Boolean(src.activo) : DEFAULT_CONFIG_ALIADOS.activo,
    porcentajeUtilidad: !isNaN(pct) && pct > 0 && pct <= 80 ? pct : DEFAULT_CONFIG_ALIADOS.porcentajeUtilidad,
    montoMinimoRetiro: !isNaN(minRetiro) && minRetiro >= 0 ? minRetiro : DEFAULT_CONFIG_ALIADOS.montoMinimoRetiro,
    requiereAprobacion: Boolean(src.requiereAprobacion),
    codigoInvitacion: typeof src.codigoInvitacion === 'string' ? src.codigoInvitacion.trim().toUpperCase() : '',
    categoriasHabilitadas: Array.isArray(src.categoriasHabilitadas)
      ? src.categoriasHabilitadas.map((id: any) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0)
      : [],
    bloquearAutocompra: src.bloquearAutocompra !== undefined ? Boolean(src.bloquearAutocompra) : true,
    stockMinimoCatalogo: !isNaN(stockMin) && stockMin >= 1 ? Math.floor(stockMin) : DEFAULT_CONFIG_ALIADOS.stockMinimoCatalogo,
    redondeoComision: [1, 10, 100, 500, 1000].includes(redondeo) ? redondeo : DEFAULT_CONFIG_ALIADOS.redondeoComision,
  };
}

export function normalizarTexto(val?: string | null): string {
  return String(val || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/** Normaliza teléfonos colombianos comparando los últimos 10 dígitos (ej: 3001234567). */
export function normalizarTelefonoCol(val?: string | null): string {
  const digits = String(val || '').replace(/\D/g, '');
  if (digits.length >= 10) return digits.slice(-10);
  return digits;
}

export function esCategoriaHabilitadaAliado(
  categoria: { id?: number | null; nombre?: string | null; parentId?: number | null; parent?: { id?: number | null; nombre?: string | null } | null } | null | undefined,
  categoriaId: number | null | undefined,
  config: ConfigAliadosPrograma,
): boolean {
  const seleccionadas = config.categoriasHabilitadas || [];
  if (seleccionadas.length > 0) {
    const ids = [categoriaId, categoria?.id, categoria?.parentId, categoria?.parent?.id]
      .filter((x): x is number => typeof x === 'number' && x > 0);
    return ids.some((id) => seleccionadas.includes(id));
  }

  // Por defecto para el piloto: Juguetería / Juguetes
  const nombres = [normalizarTexto(categoria?.nombre), normalizarTexto(categoria?.parent?.nombre)].filter(Boolean);
  return nombres.some((n) => n.includes('juguete') || n.includes('didactico') || n.includes('estimulacion'));
}

export interface ResultadoGananciaAliado {
  elegible: boolean;
  precioSubtotal: number;
  precioPublico: number;
  costo: number;
  utilidad: number;
  ganancia: number;
  porcentajeAplicado: number;
}

export function calcularGananciaUnitariaAliado(params: {
  precioSubtotal: number;
  precioTotal: number;
  costoPromedio: any;
  comisionValor?: any;
  porcentajeUtilidad: number;
  redondeo: number;
}): ResultadoGananciaAliado {
  const precioSubtotal = Math.max(0, Number(params.precioSubtotal || 0));
  const precioPublico = Math.max(0, Number(params.precioTotal || 0));
  const comisionFija = Number(params.comisionValor || 0);
  const costo = Math.max(0, Number(params.costoPromedio || 0));
  const pct = Math.max(0, Number(params.porcentajeUtilidad || 0));
  const redondeo = params.redondeo > 0 ? params.redondeo : 100;

  if (precioPublico <= 0) {
    return { elegible: false, precioSubtotal, precioPublico, costo, utilidad: 0, ganancia: 0, porcentajeAplicado: pct };
  }

  // Si tiene comisión fija manual en el producto, la respeta aunque costoPromedio sea 0
  if (comisionFija > 0) {
    const utilidad = costo > 0 ? Math.max(0, precioSubtotal - costo) : comisionFija;
    return {
      elegible: true,
      precioSubtotal,
      precioPublico,
      costo,
      utilidad,
      ganancia: Math.round(comisionFija),
      porcentajeAplicado: pct,
    };
  }

  // Protección de margen: sin costo cargado (> 0), nunca se calcula % de utilidad para no regalar % del precio bruto
  if (costo <= 0) {
    return { elegible: false, precioSubtotal, precioPublico, costo: 0, utilidad: 0, ganancia: 0, porcentajeAplicado: pct };
  }

  const utilidad = Math.max(0, precioSubtotal - costo);
  if (utilidad <= 0 || pct <= 0) {
    return { elegible: false, precioSubtotal, precioPublico, costo, utilidad: 0, ganancia: 0, porcentajeAplicado: pct };
  }

  const bruto = (utilidad * pct) / 100;
  const ganancia = Math.round(bruto / redondeo) * redondeo;
  if (ganancia <= 0 || ganancia > utilidad) {
    return { elegible: false, precioSubtotal, precioPublico, costo, utilidad, ganancia: 0, porcentajeAplicado: pct };
  }

  return {
    elegible: true,
    precioSubtotal,
    precioPublico,
    costo,
    utilidad,
    ganancia,
    porcentajeAplicado: pct,
  };
}

