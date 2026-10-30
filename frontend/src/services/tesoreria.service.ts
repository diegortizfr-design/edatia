import api from './api';

export interface Egreso {
  id: number;
  numero: string;
  fecha: string;
  terceroId?: number;
  tercero?: { id: number; nombre: string; numeroDocumento: string; telefono?: string };
  beneficiarioNombre?: string;
  beneficiarioDoc?: string;
  categoriaGasto: string;
  concepto: string;
  referencia?: string;
  cuentaGastoId: number;
  cuentaGasto?: { id: number; codigo: string; nombre: string };
  cajaBancoId?: number;
  cajaBanco?: { id: number; nombre: string; tipo: string; cuentaPUC?: string };
  medioPago: string;
  monto: number;
  aplicaRetencion: boolean;
  tarifaRetencion: number;
  valorRetencion: number;
  cuentaRetencionId?: number;
  cuentaRetencion?: { id: number; codigo: string; nombre: string };
  montoNeto: number;
  comprobanteId?: number;
  documentoConfigId?: number;
  documentoConfig?: { id: number; nombre: string; prefijo: string; plantillaImpresion?: string; resolucionDian?: string };
  comprobante?: {
    id: number;
    numero: string;
    estado: string;
    lineas?: Array<{
      id: number;
      descripcion: string;
      debito: number;
      credito: number;
      cuenta?: { codigo: string; nombre: string };
    }>;
  };
  estado: string; // APROBADO | ANULADO
  notas?: string;
  createdAt: string;
}

export interface CajaMenor {
  id: number;
  nombre: string;
  codigo: string;
  responsable: string;
  montoAsignado: number;
  cuentaPUC: string;
  cajaBancoId?: number;
  cajaBancoNombre?: string;
  activo: boolean;
  notas?: string;
  totalGastosPendientes: number;
  saldoDisponible: number;
  conteoGastosPendientes: number;
}

export interface GastoCajaMenor {
  id: number;
  cajaMenorId: number;
  fecha: string;
  numeroRecibo?: string;
  beneficiario: string;
  beneficiarioDoc?: string;
  concepto: string;
  categoriaGasto: string;
  cuentaGastoId: number;
  cuentaGasto?: { id: number; codigo: string; nombre: string };
  valor: number;
  estado: string; // PENDIENTE | REEMBOLSADO | ANULADO
  reembolsoId?: number;
  reembolso?: { id: number; consecutivo: string; fecha: string };
  createdAt: string;
}

export interface ReembolsoCajaMenor {
  id: number;
  cajaMenorId: number;
  consecutivo: string;
  fecha: string;
  totalReembolsado: number;
  origenCajaBancoId?: number;
  origenCajaBanco?: { id: number; nombre: string };
  comprobanteId?: number;
  documentoConfigId?: number;
  documentoConfig?: { id: number; nombre: string; prefijo: string; plantillaImpresion?: string; resolucionDian?: string };
  comprobante?: { id: number; numero: string };
  observaciones?: string;
  gastos?: GastoCajaMenor[];
  createdAt: string;
}

export interface CategoriaGasto {
  id: number;
  nombre: string;
  descripcion?: string;
  cuentaPUCId?: number;
  cuentaPUC?: { id: number; codigo: string; nombre: string };
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CuentaGastoPUC {
  id: number;
  codigo: string;
  nombre: string;
  nivel: number;
  tipo: string;
}

// ─── Categorías de Gasto (Configuración Tesorería) ─────────────────────────

export const getCategoriasTesoreria = () =>
  api.get<CategoriaGasto[]>('/contabilidad/tesoreria/categorias').then(r => r.data);

export const createCategoriaTesoreria = (data: { nombre: string; descripcion?: string; cuentaPUCId?: number; activo?: boolean }) =>
  api.post<CategoriaGasto>('/contabilidad/tesoreria/categorias', data).then(r => r.data);

export const updateCategoriaTesoreria = (id: number, data: Partial<{ nombre: string; descripcion?: string; cuentaPUCId?: number; activo?: boolean }>) =>
  api.patch<CategoriaGasto>(`/contabilidad/tesoreria/categorias/${id}`, data).then(r => r.data);

export const deleteCategoriaTesoreria = (id: number) =>
  api.delete(`/contabilidad/tesoreria/categorias/${id}`).then(r => r.data);

export const getCuentasGastoPUC = () =>
  api.get<CuentaGastoPUC[]>('/contabilidad/tesoreria/cuentas-gasto').then(r => r.data);

// ─── Egresos / Gastos ─────────────────────────────────────────────────────────

export const getEgresos = (params?: { desde?: string; hasta?: string; categoria?: string; cajaBancoId?: number; query?: string }) =>
  api.get<Egreso[]>('/contabilidad/tesoreria/egresos', { params }).then(r => r.data);

export const getEgreso = (id: number) =>
  api.get<Egreso>(`/contabilidad/tesoreria/egresos/${id}`).then(r => r.data);

export const createEgreso = (data: any) =>
  api.post<Egreso>('/contabilidad/tesoreria/egresos', data).then(r => r.data);

export const anularEgreso = (id: number) =>
  api.patch<Egreso>(`/contabilidad/tesoreria/egresos/${id}/anular`).then(r => r.data);

export const getCategoriasGasto = () =>
  api.get<{ categorias: Array<{ id: string; nombre: string; prefijoPUC: string; descripcion: string }>; cuentasPUC: any[] }>(
    '/contabilidad/tesoreria/egresos/categorias'
  ).then(r => r.data);

// ─── Caja Menor ──────────────────────────────────────────────────────────────

export const getCajasMenores = () =>
  api.get<CajaMenor[]>('/contabilidad/tesoreria/cajas-menores').then(r => r.data);

export const createCajaMenor = (data: any) =>
  api.post<CajaMenor>('/contabilidad/tesoreria/cajas-menores', data).then(r => r.data);

export const updateCajaMenor = (id: number, data: any) =>
  api.patch<CajaMenor>(`/contabilidad/tesoreria/cajas-menores/${id}`, data).then(r => r.data);

export const getGastosCajaMenor = (cajaMenorId: number, estado?: string) =>
  api.get<GastoCajaMenor[]>(`/contabilidad/tesoreria/cajas-menores/${cajaMenorId}/gastos`, { params: estado ? { estado } : {} }).then(r => r.data);

export const createGastoCajaMenor = (cajaMenorId: number, data: any) =>
  api.post<GastoCajaMenor>(`/contabilidad/tesoreria/cajas-menores/${cajaMenorId}/gastos`, data).then(r => r.data);

export const deleteGastoCajaMenor = (gastoId: number) =>
  api.delete(`/contabilidad/tesoreria/cajas-menores/gastos/${gastoId}`).then(r => r.data);

export const reembolsarCajaMenor = (cajaMenorId: number, data: any) =>
  api.post<ReembolsoCajaMenor>(`/contabilidad/tesoreria/cajas-menores/${cajaMenorId}/reembolso`, data).then(r => r.data);

export const getReembolsosCajaMenor = (cajaMenorId: number) =>
  api.get<ReembolsoCajaMenor[]>(`/contabilidad/tesoreria/cajas-menores/${cajaMenorId}/reembolsos`).then(r => r.data);

