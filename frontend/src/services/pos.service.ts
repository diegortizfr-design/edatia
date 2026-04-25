import api from './api'

// ─── Cajas ───────────────────────────────────────────────────────────────────

export const getCajas = () => api.get('/pos/cajas').then(r => r.data)
export const createCaja = (dto: any) => api.post('/pos/cajas', dto).then(r => r.data)
export const updateCaja = (id: number, dto: any) => api.patch(`/pos/cajas/${id}`, dto).then(r => r.data)

// ─── Sesiones ────────────────────────────────────────────────────────────────

export const getSesiones = (params?: { cajaId?: number; estado?: string }) =>
  api.get('/pos/sesiones', { params }).then(r => r.data)

export const getSesion = (id: number) => api.get(`/pos/sesiones/${id}`).then(r => r.data)

export const abrirCaja = (dto: { cajaId: number; montoInicial: number; vendedorId?: number; vendedorNombre?: string }) =>
  api.post('/pos/sesiones/abrir', dto).then(r => r.data)

export const cerrarCaja = (sesionId: number, dto: any) =>
  api.post(`/pos/sesiones/${sesionId}/cerrar`, dto).then(r => r.data)

export const movimientoCaja = (sesionId: number, dto: { tipo: 'INGRESO' | 'RETIRO'; concepto: string; monto: number }) =>
  api.post(`/pos/sesiones/${sesionId}/movimiento`, dto).then(r => r.data)

// ─── Productos para POS ──────────────────────────────────────────────────────

export const buscarProductosPos = (q: string, bodegaId: number) =>
  api.get('/pos/productos', { params: { q, bodegaId } }).then(r => r.data)

// ─── Ventas POS ──────────────────────────────────────────────────────────────

export const getVentasPos = (params?: { sesionId?: number; fecha?: string }) =>
  api.get('/pos/ventas', { params }).then(r => r.data)

export const crearVentaPos = (dto: any) => api.post('/pos/ventas', dto).then(r => r.data)

export const anularVentaPos = (id: number, motivo: string) =>
  api.patch(`/pos/ventas/${id}/anular`, { motivo }).then(r => r.data)

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const getDashboardPos = () => api.get('/pos/dashboard').then(r => r.data)
