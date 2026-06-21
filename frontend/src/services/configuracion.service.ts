import api from './api'

// ─────────────────────────────────────────────────────────────────────────────
// EMPRESA (datos legales)
// ─────────────────────────────────────────────────────────────────────────────

export const getEmpresaConfig = () =>
  api.get('/configuracion/empresa').then(r => r.data)

export const updateEmpresaConfig = (dto: any) =>
  api.patch('/configuracion/empresa', dto).then(r => r.data)

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN ERP OPERATIVA (contabilidad, costos, ventas, cartera, DIAN,
//   códigos de administrador — antes estaban en localStorage)
// ─────────────────────────────────────────────────────────────────────────────

export const getConfigERP = () =>
  api.get('/configuracion/erp').then(r => r.data)

export const updateConfigERP = (dto: any) =>
  api.patch('/configuracion/erp', dto).then(r => r.data)

// ─────────────────────────────────────────────────────────────────────────────
// SUCURSALES
// ─────────────────────────────────────────────────────────────────────────────

export const getSucursales = () =>
  api.get('/configuracion/sucursales').then(r => r.data)

export const getSucursalesEliminadas = () =>
  api.get('/configuracion/sucursales/eliminadas').then(r => r.data)

export const createSucursal = (dto: any) =>
  api.post('/configuracion/sucursales', dto).then(r => r.data)

export const updateSucursal = (id: number, dto: any) =>
  api.patch(`/configuracion/sucursales/${id}`, dto).then(r => r.data)

export const deleteSucursal = (id: number, codigoAutorizacion: string) =>
  api.delete(`/configuracion/sucursales/${id}`, {
    data: { codigoAutorizacion },
  }).then(r => r.data)

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENTOS DE CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────────────────

export const getDocumentosConfig = () =>
  api.get('/configuracion/documentos').then(r => r.data)

export const getDocumentosEliminados = () =>
  api.get('/configuracion/documentos/eliminados').then(r => r.data)

export const createDocumentoConfig = (dto: any) =>
  api.post('/configuracion/documentos', dto).then(r => r.data)

export const updateDocumentoConfig = (id: number, dto: any) =>
  api.patch(`/configuracion/documentos/${id}`, dto).then(r => r.data)

export const incrementarConsecutivo = (id: number) =>
  api.post(`/configuracion/documentos/${id}/incrementar-consecutivo`).then(r => r.data)

export const deleteDocumentoConfig = (id: number, codigoAutorizacion: string) =>
  api.delete(`/configuracion/documentos/${id}`, {
    data: { codigoAutorizacion },
  }).then(r => r.data)

// ─────────────────────────────────────────────────────────────────────────────
// FORMATOS DE IMPRESIÓN
// ─────────────────────────────────────────────────────────────────────────────

export const getFormatosImpresion = () =>
  api.get('/configuracion/formatos').then(r => r.data)

export const updateFormatoImpresion = (tipo: string, dto: any) =>
  api.patch(`/configuracion/formatos/${tipo}`, dto).then(r => r.data)

// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGOS CONTABLES
// ─────────────────────────────────────────────────────────────────────────────

// Regímenes Fiscales
export const getRegimenesFiscales = () =>
  api.get('/configuracion/regimenes').then(r => r.data)

export const createRegimenFiscal = (dto: { codigo: string; nombre: string }) =>
  api.post('/configuracion/regimenes', dto).then(r => r.data)

export const updateRegimenFiscal = (id: number, dto: any) =>
  api.patch(`/configuracion/regimenes/${id}`, dto).then(r => r.data)

export const deleteRegimenFiscal = (id: number) =>
  api.delete(`/configuracion/regimenes/${id}`).then(r => r.data)

// Códigos CIIU
export const getCodigosCIIU = () =>
  api.get('/configuracion/ciiu').then(r => r.data)

export const createCodigoCIIU = (dto: { codigo: string; descripcion: string }) =>
  api.post('/configuracion/ciiu', dto).then(r => r.data)

export const updateCodigoCIIU = (id: number, dto: any) =>
  api.patch(`/configuracion/ciiu/${id}`, dto).then(r => r.data)

export const deleteCodigoCIIU = (id: number) =>
  api.delete(`/configuracion/ciiu/${id}`).then(r => r.data)

// Responsabilidades Fiscales
export const getResponsabilidadesFiscales = () =>
  api.get('/configuracion/responsabilidades').then(r => r.data)

export const createResponsabilidadFiscal = (dto: { codigo: string; descripcion: string }) =>
  api.post('/configuracion/responsabilidades', dto).then(r => r.data)

export const updateResponsabilidadFiscal = (id: number, dto: any) =>
  api.patch(`/configuracion/responsabilidades/${id}`, dto).then(r => r.data)

export const deleteResponsabilidadFiscal = (id: number) =>
  api.delete(`/configuracion/responsabilidades/${id}`).then(r => r.data)

// Tipos de Identificación
export const getTiposIdentificacion = () =>
  api.get('/configuracion/identificaciones').then(r => r.data)

export const createTipoIdentificacion = (dto: { codigoDian: string; nombreCorto: string; descripcion: string; activo?: boolean }) =>
  api.post('/configuracion/identificaciones', dto).then(r => r.data)

export const updateTipoIdentificacion = (id: number, dto: any) =>
  api.patch(`/configuracion/identificaciones/${id}`, dto).then(r => r.data)

export const deleteTipoIdentificacion = (id: number) =>
  api.delete(`/configuracion/identificaciones/${id}`).then(r => r.data)

// ─────────────────────────────────────────────────────────────────────────────
// GEOLOCALIZACIÓN
// ─────────────────────────────────────────────────────────────────────────────

export const getGeolocationState = () =>
  api.get('/configuracion/geolocalizacion').then(r => r.data)

export const resetGeolocationToDefaults = () =>
  api.post('/configuracion/geolocalizacion/reset').then(r => r.data)

// Paises
export const createPais = (dto: any) =>
  api.post('/configuracion/geolocalizacion/paises', dto).then(r => r.data)

export const updatePais = (id: number, dto: any) =>
  api.patch(`/configuracion/geolocalizacion/paises/${id}`, dto).then(r => r.data)

export const deletePais = (id: number) =>
  api.delete(`/configuracion/geolocalizacion/paises/${id}`).then(r => r.data)

// Departamentos
export const createDepartamento = (dto: any) =>
  api.post('/configuracion/geolocalizacion/departamentos', dto).then(r => r.data)

export const updateDepartamento = (id: number, dto: any) =>
  api.patch(`/configuracion/geolocalizacion/departamentos/${id}`, dto).then(r => r.data)

export const deleteDepartamento = (id: number) =>
  api.delete(`/configuracion/geolocalizacion/departamentos/${id}`).then(r => r.data)

// Ciudades
export const createCiudad = (dto: any) =>
  api.post('/configuracion/geolocalizacion/ciudades', dto).then(r => r.data)

export const updateCiudad = (id: number, dto: any) =>
  api.patch(`/configuracion/geolocalizacion/ciudades/${id}`, dto).then(r => r.data)

export const deleteCiudad = (id: number) =>
  api.delete(`/configuracion/geolocalizacion/ciudades/${id}`).then(r => r.data)

// Comunas
export const createComuna = (dto: any) =>
  api.post('/configuracion/geolocalizacion/comunas', dto).then(r => r.data)

export const updateComuna = (id: number, dto: any) =>
  api.patch(`/configuracion/geolocalizacion/comunas/${id}`, dto).then(r => r.data)

export const deleteComuna = (id: number) =>
  api.delete(`/configuracion/geolocalizacion/comunas/${id}`).then(r => r.data)

// Barrios
export const createBarrio = (dto: any) =>
  api.post('/configuracion/geolocalizacion/barrios', dto).then(r => r.data)

export const updateBarrio = (id: number, dto: any) =>
  api.patch(`/configuracion/geolocalizacion/barrios/${id}`, dto).then(r => r.data)

export const deleteBarrio = (id: number) =>
  api.delete(`/configuracion/geolocalizacion/barrios/${id}`).then(r => r.data)

// Colaboradores
export const getColaboradores = () =>
  api.get('/colaboradores').then(r => r.data)

// ─────────────────────────────────────────────────────────────────────────────
// FORMAS Y MEDIOS DE PAGO
// ─────────────────────────────────────────────────────────────────────────────

export const getFormasPago = () =>
  api.get('/configuracion/formas-pago').then(r => r.data)

export const createFormaPago = (dto: { codigo: string; nombre: string; activo?: boolean }) =>
  api.post('/configuracion/formas-pago', dto).then(r => r.data)

export const updateFormaPago = (id: number, dto: { codigo?: string; nombre?: string; activo?: boolean }) =>
  api.patch(`/configuracion/formas-pago/${id}`, dto).then(r => r.data)

export const deleteFormaPago = (id: number) =>
  api.delete(`/configuracion/formas-pago/${id}`).then(r => r.data)

export const getMediosPago = () =>
  api.get('/configuracion/medios-pago').then(r => r.data)

export const createMedioPago = (dto: { codigo: string; nombre: string; activo?: boolean }) =>
  api.post('/configuracion/medios-pago', dto).then(r => r.data)

export const updateMedioPago = (id: number, dto: { codigo?: string; nombre?: string; activo?: boolean }) =>
  api.patch(`/configuracion/medios-pago/${id}`, dto).then(r => r.data)

export const deleteMedioPago = (id: number) =>
  api.delete(`/configuracion/medios-pago/${id}`).then(r => r.data)

