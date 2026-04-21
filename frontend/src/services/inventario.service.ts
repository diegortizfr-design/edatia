import api from './api'

// ── Types ──────────────────────────────────────────────────────────────────

export interface Categoria {
  id: number; nombre: string; slug: string; descripcion?: string
  parentId?: number; parent?: { id: number; nombre: string }
  activo: boolean; _count?: { hijos: number; productos: number }
}

export interface Marca {
  id: number; nombre: string; activo: boolean
  _count?: { productos: number }
}

export interface UnidadMedida {
  id: number; nombre: string; abreviatura: string
  tipo: string; factorBase: number; activo: boolean
}

export interface Bodega {
  id: number; codigo: string; nombre: string; tipo: string
  direccion?: string; esPrincipal: boolean; activo: boolean
  _count?: { stock: number }
}

export interface Producto {
  id: number; sku: string; codigoBarras?: string
  nombre: string; descripcion?: string; referencia?: string
  categoriaId?: number; categoria?: { id: number; nombre: string }
  marcaId?: number; marca?: { id: number; nombre: string }
  unidadMedidaId?: number; unidadMedida?: { id: number; nombre: string; abreviatura: string }
  costoPromedio: number; precioBase: number
  tipoIva: string; manejaBodega: boolean; manejaLotes: boolean; manejaSerial: boolean
  stockMinimo: number; stockMaximo?: number; puntoReorden: number
  claseAbc?: string; activo: boolean; imagen?: string
  stock?: StockItem[]
}

export interface StockItem {
  id: number; productoId: number; bodegaId: number
  cantidad: number; cantidadReservada: number
  bodega: { id: number; nombre: string; codigo: string }
  producto?: Producto
}

export interface Movimiento {
  id: number; numero: string; tipo: string; concepto: string
  productoId: number; producto?: { id: number; nombre: string; sku: string }
  bodegaOrigenId?: number; bodegaOrigen?: { nombre: string; codigo: string }
  bodegaDestinoId?: number; bodegaDestino?: { nombre: string; codigo: string }
  cantidad: number; costoUnitario: number; costoTotal: number
  saldoCantidad: number; saldoCostoTotal: number; saldoCpp: number
  notas?: string; fechaMovimiento: string
}

export interface InvKpis {
  totalProductos: number; totalBodegas: number
  movimientosRecientes: number; valorTotal: number
  productosAlertas: number
  topProductos: Array<{ productoId: number; nombre: string; sku: string; cantidad: number; valor: number; claseAbc?: string }>
  alertasCriticas: StockItem[]
  // Extended dashboard fields
  totalProveedores?: number
  movimientosDelMes?: number
  movimientosPorTipo?: Array<{ tipo: string; cantidad: number; total: number }>
  claseAbcDistribucion?: { A?: number; B?: number; C?: number; sinClase?: number; [k: string]: number | undefined }
  ocPorEstado?: Record<string, number>
  ultimosMovimientos?: Array<any>
}

// ── API calls ──────────────────────────────────────────────────────────────

// Categorías
export const getCategorias = () => api.get<Categoria[]>('/inventario/categorias').then(r => r.data)
export const createCategoria = (data: any) => api.post('/inventario/categorias', data).then(r => r.data)
export const updateCategoria = (id: number, data: any) => api.patch(`/inventario/categorias/${id}`, data).then(r => r.data)

// Marcas
export const getMarcas = () => api.get<Marca[]>('/inventario/marcas').then(r => r.data)
export const createMarca = (data: any) => api.post('/inventario/marcas', data).then(r => r.data)
export const updateMarca = (id: number, data: any) => api.patch(`/inventario/marcas/${id}`, data).then(r => r.data)

// Unidades de medida
export const getUnidades = () => api.get<UnidadMedida[]>('/inventario/unidades-medida').then(r => r.data)
export const createUnidad = (data: any) => api.post('/inventario/unidades-medida', data).then(r => r.data)
export const updateUnidad = (id: number, data: any) => api.patch(`/inventario/unidades-medida/${id}`, data).then(r => r.data)

// Bodegas
export const getBodegas = () => api.get<Bodega[]>('/inventario/bodegas').then(r => r.data)
export const createBodega = (data: any) => api.post('/inventario/bodegas', data).then(r => r.data)
export const updateBodega = (id: number, data: any) => api.patch(`/inventario/bodegas/${id}`, data).then(r => r.data)

// Productos
export const getProductos = (params?: { q?: string; categoriaId?: number; marcaId?: number; activo?: boolean }) =>
  api.get<Producto[]>('/inventario/productos', { params }).then(r => r.data)
export const getProducto = (id: number) => api.get<Producto>(`/inventario/productos/${id}`).then(r => r.data)
export const buscarProductos = (q: string) => api.get<Producto[]>('/inventario/productos/buscar', { params: { q } }).then(r => r.data)
export const createProducto = (data: any) => api.post('/inventario/productos', data).then(r => r.data)
export const updateProducto = (id: number, data: any) => api.patch(`/inventario/productos/${id}`, data).then(r => r.data)

// Stock
export const getStock = (params?: { bodegaId?: number; soloAlertas?: boolean }) =>
  api.get<StockItem[]>('/inventario/stock', { params }).then(r => r.data)
export const getStockProducto = (id: number) => api.get<StockItem[]>(`/inventario/stock/producto/${id}`).then(r => r.data)
export const getAlertas = () => api.get('/inventario/stock/alertas').then(r => r.data)
export const getValoracion = () => api.get('/inventario/stock/valoracion').then(r => r.data)

// Movimientos
export const getMovimientos = (params?: any) =>
  api.get<{ total: number; data: Movimiento[] }>('/inventario/movimientos', { params }).then(r => r.data)
export const getKardex = (productoId: number, bodegaId?: number) =>
  api.get<Movimiento[]>(`/inventario/movimientos/kardex/${productoId}`, { params: { bodegaId } }).then(r => r.data)
export const postEntrada = (data: any) => api.post('/inventario/movimientos/entrada', data).then(r => r.data)
export const postSalida = (data: any) => api.post('/inventario/movimientos/salida', data).then(r => r.data)
export const postAjuste = (data: any) => api.post('/inventario/movimientos/ajuste', data).then(r => r.data)
export const postTraslado = (data: any) => api.post('/inventario/movimientos/traslado', data).then(r => r.data)

// Dashboard
export const getInvKpis = () => api.get<InvKpis>('/inventario/dashboard').then(r => r.data)

// ABC
export const clasificarAbc = () => api.post('/inventario/productos/clasificar-abc').then(r => r.data)

// Reportes Sprint 3
export const getReporteStock = () => api.get('/inventario/reportes/stock').then(r => r.data)
export const getReporteMovimientos = (params?: { desde?: string; hasta?: string; tipo?: string; bodegaId?: number }) =>
  api.get('/inventario/reportes/movimientos', { params }).then(r => r.data)
export const getReporteAbc = () => api.get('/inventario/reportes/abc').then(r => r.data)

// ── Sprint 2 types ─────────────────────────────────────────────────────────

export interface Proveedor {
  id: number
  nombre: string
  nombreComercial?: string
  tipoDocumento?: string
  numeroDocumento?: string
  email?: string
  telefono?: string
  contactoNombre?: string
  direccion?: string
  ciudad?: string
  pais: string
  plazoEntregaDias?: number
  condicionesPago?: string
  descuentoBase?: number
  activo: boolean
  notas?: string
  _count?: { ordenesCompra: number }
}

export interface OrdenCompraItem {
  id: number
  productoId: number
  producto: { id: number; nombre: string; sku: string; costoPromedio: number; unidadMedida?: { abreviatura: string } }
  cantidad: number
  cantidadRecibida: number
  costoUnitario: number
  descuentoPct: number
  subtotal: number
  ivaValor: number
  total: number
}

export interface RecepcionItem {
  id: number
  ordenCompraItemId: number
  cantidadRecibida: number
  costoUnitario: number
  ordenCompraItem?: { producto: { nombre: string; sku: string } }
}

export interface Recepcion {
  id: number
  numero: string
  fecha: string
  notas?: string
  items: RecepcionItem[]
}

export interface OrdenCompra {
  id: number
  numero: string
  proveedorId: number
  proveedor: { id: number; nombre: string; nombreComercial?: string; email?: string; telefono?: string }
  bodegaId: number
  bodega: { id: number; nombre: string; codigo: string }
  estado: string
  fechaEmision: string
  fechaEsperada?: string
  fechaRecepcion?: string
  subtotal: number
  descuento: number
  iva: number
  total: number
  notas?: string
  items: OrdenCompraItem[]
  recepciones: Recepcion[]
  _count?: { items: number; recepciones: number }
}

// ── Proveedores API ────────────────────────────────────────────────────────
export const getProveedores = (q?: string) =>
  api.get<Proveedor[]>('/inventario/proveedores', { params: q ? { q } : {} }).then(r => r.data)
export const getProveedor = (id: number) =>
  api.get<Proveedor>(`/inventario/proveedores/${id}`).then(r => r.data)
export const createProveedor = (data: any) =>
  api.post('/inventario/proveedores', data).then(r => r.data)
export const updateProveedor = (id: number, data: any) =>
  api.patch(`/inventario/proveedores/${id}`, data).then(r => r.data)

// ── Órdenes de Compra API ──────────────────────────────────────────────────
export const getOrdenesCompra = (params?: { estado?: string; proveedorId?: number }) =>
  api.get<OrdenCompra[]>('/inventario/ordenes-compra', { params }).then(r => r.data)
export const getOrdenCompra = (id: number) =>
  api.get<OrdenCompra>(`/inventario/ordenes-compra/${id}`).then(r => r.data)
export const createOrdenCompra = (data: any) =>
  api.post('/inventario/ordenes-compra', data).then(r => r.data)
export const updateOrdenCompra = (id: number, data: any) =>
  api.patch(`/inventario/ordenes-compra/${id}`, data).then(r => r.data)
export const aprobarOrdenCompra = (id: number) =>
  api.post(`/inventario/ordenes-compra/${id}/aprobar`).then(r => r.data)
export const anularOrdenCompra = (id: number) =>
  api.post(`/inventario/ordenes-compra/${id}/anular`).then(r => r.data)
export const recibirOrdenCompra = (id: number, data: any) =>
  api.post(`/inventario/ordenes-compra/${id}/recibir`, data).then(r => r.data)

// ── Sprint 4: Devoluciones ─────────────────────────────────────────────────
export const postDevolucionProveedor = (data: any) =>
  api.post('/inventario/movimientos/devolucion-proveedor', data).then(r => r.data)
export const postDevolucionCliente = (data: any) =>
  api.post('/inventario/movimientos/devolucion-cliente', data).then(r => r.data)

// ── Sprint 4: Lotes ────────────────────────────────────────────────────────
export const getLotes = (params?: { productoId?: number; soloConStock?: boolean }) =>
  api.get('/inventario/lotes', { params }).then(r => r.data)
export const getProximosVencer = (dias = 30) =>
  api.get('/inventario/lotes/proximos-vencer', { params: { dias } }).then(r => r.data)
export const getLoteFefo = (productoId: number, cantidad: number) =>
  api.get('/inventario/lotes/fefo', { params: { productoId, cantidad } }).then(r => r.data)
export const createLote = (data: any) =>
  api.post('/inventario/lotes', data).then(r => r.data)
export const updateLote = (id: number, data: any) =>
  api.patch(`/inventario/lotes/${id}`, data).then(r => r.data)

// ── Sprint 4: Seriales ─────────────────────────────────────────────────────
export const getSeriales = (params?: { estado?: string; productoId?: number }) =>
  api.get('/inventario/seriales', { params }).then(r => r.data)
export const getStatsSeriales = () =>
  api.get('/inventario/seriales/stats').then(r => r.data)
export const ingresarSeriales = (data: any) =>
  api.post('/inventario/seriales/ingresar', data).then(r => r.data)
export const actualizarEstadoSerial = (id: number, data: { estado: string }) =>
  api.patch(`/inventario/seriales/${id}/estado`, data).then(r => r.data)

// ── Sprint 4: Variantes ────────────────────────────────────────────────────
export const getVariantes = (productoId: number) =>
  api.get(`/inventario/variantes/producto/${productoId}`).then(r => r.data)
export const createVariante = (data: any) =>
  api.post('/inventario/variantes', data).then(r => r.data)
export const updateVariante = (id: number, data: any) =>
  api.patch(`/inventario/variantes/${id}`, data).then(r => r.data)
export const toggleVariante = (id: number) =>
  api.patch(`/inventario/variantes/${id}/toggle`).then(r => r.data)
export const ajustarStockVariante = (id: number, data: any) =>
  api.post(`/inventario/variantes/${id}/stock`, data).then(r => r.data)
