import api from './api'

// ── Clientes ─────────────────────────────────────────────────────────────────
export const getClientes = (q?: string) =>
  api.get('/ventas/clientes', { params: q ? { q } : {} }).then(r => r.data)
export const getCliente = (id: number) =>
  api.get(`/ventas/clientes/${id}`).then(r => r.data)
export const createCliente = (data: any) =>
  api.post('/ventas/clientes', data).then(r => r.data)
export const updateCliente = (id: number, data: any) =>
  api.patch(`/ventas/clientes/${id}`, data).then(r => r.data)
export const toggleCliente = (id: number) =>
  api.patch(`/ventas/clientes/${id}/toggle`).then(r => r.data)
export const getSaldosClientes = () =>
  api.get('/ventas/clientes/saldos').then(r => r.data)

// ── Configuración DIAN ────────────────────────────────────────────────────────
export const getConfigDian = () =>
  api.get('/ventas/config-dian').then(r => r.data)
export const upsertConfigDian = (data: any) =>
  api.put('/ventas/config-dian', data).then(r => r.data)
export const addResolucionDian = (data: any) =>
  api.post('/ventas/config-dian/resoluciones', data).then(r => r.data)
export const toggleResolucionDian = (id: number) =>
  api.patch(`/ventas/config-dian/resoluciones/${id}/toggle`).then(r => r.data)

// ── Cotizaciones ──────────────────────────────────────────────────────────────
export const getCotizaciones = (params?: { clienteId?: number; estado?: string }) =>
  api.get('/ventas/cotizaciones', { params }).then(r => r.data)
export const getCotizacion = (id: number) =>
  api.get(`/ventas/cotizaciones/${id}`).then(r => r.data)
export const createCotizacion = (data: any) =>
  api.post('/ventas/cotizaciones', data).then(r => r.data)
export const updateCotizacion = (id: number, data: any) =>
  api.patch(`/ventas/cotizaciones/${id}`, data).then(r => r.data)
export const cambiarEstadoCotizacion = (id: number, estado: string) =>
  api.patch(`/ventas/cotizaciones/${id}/estado`, { estado }).then(r => r.data)

// ── Facturas de Venta ─────────────────────────────────────────────────────────
export const getFacturas = (params?: { clienteId?: number; estado?: string; desde?: string; hasta?: string }) =>
  api.get('/ventas/facturas', { params }).then(r => r.data)
export const getFactura = (id: number) =>
  api.get(`/ventas/facturas/${id}`).then(r => r.data)
export const createFactura = (data: any) =>
  api.post('/ventas/facturas', data).then(r => r.data)
export const emitirFactura = (id: number) =>
  api.patch(`/ventas/facturas/${id}/emitir`).then(r => r.data)
export const anularFactura = (id: number) =>
  api.patch(`/ventas/facturas/${id}/anular`).then(r => r.data)
export const getFacturaXmlUrl = (id: number) => `/ventas/facturas/${id}/xml`

// ── Notas Crédito ─────────────────────────────────────────────────────────────
export const getNotasCredito = (facturaId?: number) =>
  api.get('/ventas/notas-credito', { params: facturaId ? { facturaId } : {} }).then(r => r.data)
export const getNotaCredito = (id: number) =>
  api.get(`/ventas/notas-credito/${id}`).then(r => r.data)
export const createNotaCredito = (data: any) =>
  api.post('/ventas/notas-credito', data).then(r => r.data)
export const anularNotaCredito = (id: number) =>
  api.patch(`/ventas/notas-credito/${id}/anular`).then(r => r.data)

// ── Recibos de Caja ───────────────────────────────────────────────────────────
export const getRecibos = (clienteId?: number) =>
  api.get('/ventas/recibos', { params: clienteId ? { clienteId } : {} }).then(r => r.data)
export const getRecibo = (id: number) =>
  api.get(`/ventas/recibos/${id}`).then(r => r.data)
export const getFacturasPendientes = (clienteId: number) =>
  api.get('/ventas/recibos/facturas-pendientes', { params: { clienteId } }).then(r => r.data)
export const createRecibo = (data: any) =>
  api.post('/ventas/recibos', data).then(r => r.data)
export const anularRecibo = (id: number) =>
  api.patch(`/ventas/recibos/${id}/anular`).then(r => r.data)

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getVentasKpis = () =>
  api.get('/ventas/dashboard').then(r => r.data)
