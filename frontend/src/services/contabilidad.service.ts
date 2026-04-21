import api from './api'

// ── PUC ───────────────────────────────────────────────────────────────────────
export const getCuentasPUC = (params?: { nivel?: number; tipo?: string }) =>
  api.get('/contabilidad/puc', { params }).then(r => r.data)
export const getArbolPUC = () =>
  api.get('/contabilidad/puc/arbol').then(r => r.data)
export const getCuentasAuxiliares = (q?: string) =>
  api.get('/contabilidad/puc/auxiliares', { params: q ? { q } : {} }).then(r => r.data)
export const seedPUC = () =>
  api.post('/contabilidad/puc/seed').then(r => r.data)
export const createCuentaPUC = (data: any) =>
  api.post('/contabilidad/puc', data).then(r => r.data)
export const updateCuentaPUC = (id: number, data: any) =>
  api.patch(`/contabilidad/puc/${id}`, data).then(r => r.data)
export const toggleCuentaPUC = (id: number) =>
  api.patch(`/contabilidad/puc/${id}/toggle`).then(r => r.data)

// ── Comprobantes ──────────────────────────────────────────────────────────────
export const getComprobantes = (params?: { tipo?: string; desde?: string; hasta?: string }) =>
  api.get('/contabilidad/comprobantes', { params }).then(r => r.data)
export const getComprobante = (id: number) =>
  api.get(`/contabilidad/comprobantes/${id}`).then(r => r.data)
export const createComprobante = (data: any) =>
  api.post('/contabilidad/comprobantes', data).then(r => r.data)
export const anularComprobante = (id: number) =>
  api.patch(`/contabilidad/comprobantes/${id}/anular`).then(r => r.data)
export const getLibroMayor = (cuentaId: number, desde?: string, hasta?: string) =>
  api.get('/contabilidad/comprobantes/libro-mayor', { params: { cuentaId, desde, hasta } }).then(r => r.data)

// ── Reportes Contables ────────────────────────────────────────────────────────
export const getBalanceComprobacion = (desde: string, hasta: string) =>
  api.get('/contabilidad/reportes/balance-comprobacion', { params: { desde, hasta } }).then(r => r.data)
export const getEstadoResultados = (desde: string, hasta: string) =>
  api.get('/contabilidad/reportes/estado-resultados', { params: { desde, hasta } }).then(r => r.data)
export const getBalanceGeneral = (hasta: string) =>
  api.get('/contabilidad/reportes/balance-general', { params: { hasta } }).then(r => r.data)
export const getPeriodos = () =>
  api.get('/contabilidad/reportes/periodos').then(r => r.data)
export const cerrarPeriodo = (anio: number, mes: number) =>
  api.post('/contabilidad/reportes/periodos/cerrar', { anio, mes }).then(r => r.data)
