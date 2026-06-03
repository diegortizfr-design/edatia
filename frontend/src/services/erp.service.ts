// frontend/src/services/erp.service.ts
// Centraliza todos los endpoints de los módulos migrados desde localStorage

import api from './api'

// ─── Impuestos ────────────────────────────────────────────────────────────────
export const getImpuestos = () => api.get('/impuestos').then(r => r.data)
export const createImpuesto = (dto: any) => api.post('/impuestos', dto).then(r => r.data)
export const updateImpuesto = (id: number, dto: any) => api.patch(`/impuestos/${id}`, dto).then(r => r.data)
export const deleteImpuesto = (id: number) => api.delete(`/impuestos/${id}`).then(r => r.data)

// ─── Monedas ──────────────────────────────────────────────────────────────────
export const getMonedas = () => api.get('/monedas').then(r => r.data)
export const createMoneda = (dto: any) => api.post('/monedas', dto).then(r => r.data)
export const updateMoneda = (id: number, dto: any) => api.patch(`/monedas/${id}`, dto).then(r => r.data)
export const deleteMoneda = (id: number) => api.delete(`/monedas/${id}`).then(r => r.data)

// ─── Cajas y Bancos ───────────────────────────────────────────────────────────
export const getCajasBancos = () => api.get('/cajas-bancos').then(r => r.data)
export const createCajaBanco = (dto: any) => api.post('/cajas-bancos', dto).then(r => r.data)
export const updateCajaBanco = (id: number, dto: any) => api.patch(`/cajas-bancos/${id}`, dto).then(r => r.data)
export const deleteCajaBanco = (id: number) => api.delete(`/cajas-bancos/${id}`).then(r => r.data)

// ─── Roles ────────────────────────────────────────────────────────────────────
export const getRoles = () => api.get('/roles').then(r => r.data)
export const createRol = (dto: any) => api.post('/roles', dto).then(r => r.data)
export const updateRol = (id: number, dto: any) => api.patch(`/roles/${id}`, dto).then(r => r.data)
export const deleteRol = (id: number) => api.delete(`/roles/${id}`).then(r => r.data)

// ─── Vendedores ───────────────────────────────────────────────────────────────
export const getVendedores = () => api.get('/vendedores').then(r => r.data)
export const createVendedor = (dto: any) => api.post('/vendedores', dto).then(r => r.data)
export const updateVendedor = (id: number, dto: any) => api.patch(`/vendedores/${id}`, dto).then(r => r.data)
export const deleteVendedor = (id: number) => api.delete(`/vendedores/${id}`).then(r => r.data)

// ─── Grupos de Producto ───────────────────────────────────────────────────────
export const getGruposProducto = () => api.get('/grupos-producto').then(r => r.data)
export const createGrupoProducto = (dto: any) => api.post('/grupos-producto', dto).then(r => r.data)
export const updateGrupoProducto = (id: number, dto: any) => api.patch(`/grupos-producto/${id}`, dto).then(r => r.data)
export const deleteGrupoProducto = (id: number) => api.delete(`/grupos-producto/${id}`).then(r => r.data)

// ─── Auditoría ERP ────────────────────────────────────────────────────────────
export const getAuditoriaERP = (params?: {
  modulo?: string
  accion?: string
  from?: string
  to?: string
  page?: number
  limit?: number
}) => api.get('/auditoria-erp', { params }).then(r => r.data)

// ─── Notificaciones ───────────────────────────────────────────────────────────
export const getNotificaciones = () => api.get('/notificaciones').then(r => r.data)
export const createNotificacion = (dto: any) => api.post('/notificaciones', dto).then(r => r.data)
export const marcarNotificacionLeida = (id: number) => api.patch(`/notificaciones/${id}/leer`).then(r => r.data)
export const marcarTodasLeidas = () => api.patch('/notificaciones/leer-todas').then(r => r.data)
export const deleteNotificacion = (id: number) => api.delete(`/notificaciones/${id}`).then(r => r.data)

// ─── Cierre de Periodo ────────────────────────────────────────────────────────
export const getPeriodosCierre = () => api.get('/cierre-periodo').then(r => r.data)
export const getPeriodoActivo = () => api.get('/cierre-periodo/activo').then(r => r.data)
export const createPeriodoCierre = (dto: any) => api.post('/cierre-periodo', dto).then(r => r.data)
export const cerrarPeriodo = (id: number, dto?: { observaciones?: string }) =>
  api.patch(`/cierre-periodo/${id}/cerrar`, dto ?? {}).then(r => r.data)

// ─── Maestros de Inventario (ya existen en BD, solo faltaban los endpoints) ───
export const getCategorias = () => api.get('/inventario/categorias').then(r => r.data)
export const createCategoria = (dto: any) => api.post('/inventario/categorias', dto).then(r => r.data)
export const updateCategoria = (id: number, dto: any) => api.patch(`/inventario/categorias/${id}`, dto).then(r => r.data)
export const deleteCategoria = (id: number) => api.delete(`/inventario/categorias/${id}`).then(r => r.data)

export const getMarcas = () => api.get('/inventario/marcas').then(r => r.data)
export const createMarca = (dto: any) => api.post('/inventario/marcas', dto).then(r => r.data)
export const updateMarca = (id: number, dto: any) => api.patch(`/inventario/marcas/${id}`, dto).then(r => r.data)
export const deleteMarca = (id: number) => api.delete(`/inventario/marcas/${id}`).then(r => r.data)

export const getUnidadesMedida = () => api.get('/inventario/unidades-medida').then(r => r.data)
export const createUnidadMedida = (dto: any) => api.post('/inventario/unidades-medida', dto).then(r => r.data)
export const updateUnidadMedida = (id: number, dto: any) => api.patch(`/inventario/unidades-medida/${id}`, dto).then(r => r.data)
export const deleteUnidadMedida = (id: number) => api.delete(`/inventario/unidades-medida/${id}`).then(r => r.data)

// ─── Usuarios del ERP (User model existente) ──────────────────────────────────
export const getUsuariosERP = () => api.get('/users').then(r => r.data)
export const createUsuarioERP = (dto: any) => api.post('/users', dto).then(r => r.data)
export const updateUsuarioERP = (id: number, dto: any) => api.patch(`/users/${id}`, dto).then(r => r.data)
export const deleteUsuarioERP = (id: number) => api.delete(`/users/${id}`).then(r => r.data)

// ─── Terceros / Clientes ERP ──────────────────────────────────────────────────
export const getClientesERP = () => api.get('/ventas/clientes').then(r => r.data)
export const createClienteERP = (dto: any) => api.post('/ventas/clientes', dto).then(r => r.data)
export const updateClienteERP = (id: number, dto: any) => api.patch(`/ventas/clientes/${id}`, dto).then(r => r.data)
export const deleteClienteERP = (id: number) => api.delete(`/ventas/clientes/${id}`).then(r => r.data)

// ─── Proveedores ──────────────────────────────────────────────────────────────
export const getProveedores = () => api.get('/inventario/proveedores').then(r => r.data)
export const createProveedor = (dto: any) => api.post('/inventario/proveedores', dto).then(r => r.data)
export const updateProveedor = (id: number, dto: any) => api.patch(`/inventario/proveedores/${id}`, dto).then(r => r.data)
export const deleteProveedor = (id: number) => api.delete(`/inventario/proveedores/${id}`).then(r => r.data)

// ─── Formatos de Impresión (ya existen en BD) ────────────────────────────────
export const getFormatosImpresion = () => api.get('/configuracion/formatos').then(r => r.data)
export const updateFormatoImpresion = (tipo: string, dto: any) =>
  api.patch(`/configuracion/formatos/${tipo}`, dto).then(r => r.data)
