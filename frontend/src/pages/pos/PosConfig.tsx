import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCajas, createCaja, updateCaja, deleteCaja } from '../../services/pos.service'
import { getCajasBancos, getVendedores } from '../../services/erp.service'
import { getDocumentosConfig } from '../../services/configuracion.service'
import { getClientes } from '../../services/ventas.service'
import { getBodegas } from '../../services/inventario.service'
import { Monitor, Plus, X, Settings, Printer, Warehouse, Landmark, FileCheck, ArrowLeft, Tag, User, Users, Trash2, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { getApiError } from '../../services/api'

const EMPTY = {
  nombre: '',
  codigo: '',
  referencia: '',
  bodegaId: '',
  cajaBancoId: '',
  documentoConfigId: '',
  documentoReciboConfigId: '',
  documentoCierreConfigId: '',
  vendedorId: '',
  vendedorNombre: '',
  clienteDefaultId: '',
  impresora: '',
  tipoConexion: 'NINGUNA',
  anchoPapel: 80,
  permiteCreditoPos: false,
  permiteDescuento: true,
  maxDescuento: 100,
  permiteStockNegativo: false,
}

export function PosConfig() {
  const qc = useQueryClient()
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const { data: cajas = [] } = useQuery(['pos-cajas'], getCajas)
  const { data: bodegas = [] } = useQuery(['bodegas'], getBodegas)
  const { data: cajasBancos = [] } = useQuery(['cajas-bancos'], getCajasBancos)
  const { data: documentosConfig = [] } = useQuery(['documentos-config'], getDocumentosConfig)
  const { data: vendedores = [] } = useQuery(['vendedores'], getVendedores)
  const { data: clientes = [] } = useQuery(['clientes'], () => getClientes())

  // Filtrar documentos tipo POS / FVP o FVE (Facturación de punto de venta)
  const docPosOptions = (documentosConfig as any[]).filter(d =>
    d.sigla?.toLowerCase() === 'pos' || d.sigla?.toLowerCase() === 'fvp' || d.prefijo?.toLowerCase().includes('pos') || d.prefijo?.toLowerCase().includes('fvp')
  )

  // Filtrar documentos tipo Recibo de Caja (RC / Tesorería)
  const docRcOptions = (documentosConfig as any[]).filter(d =>
    d.sigla?.toLowerCase() === 'rc' || d.prefijo?.toLowerCase().includes('rc') || d.tipoOperacion === 'TESORERIA'
  )

  // Filtrar documentos tipo Comprobante de Cierre (CF / Contabilidad)
  const docCierreOptions = (documentosConfig as any[]).filter(d =>
    d.sigla?.toLowerCase() === 'cf' || d.prefijo?.toLowerCase().includes('cf') || d.nombre?.toLowerCase().includes('cierre')
  )

  const [modalDelete, setModalDelete] = useState<{ open: boolean; caja: any; code: string }>({
    open: false,
    caja: null,
    code: '',
  })

  const mutCreate = useMutation({ mutationFn: createCaja, onSuccess: () => { qc.invalidateQueries(['pos-cajas']); setViewMode('list'); setForm(EMPTY); toast.success('Caja POS creada exitosamente') } })
  const mutUpdate = useMutation({ mutationFn: ({ id, dto }: any) => updateCaja(id, dto), onSuccess: () => { qc.invalidateQueries(['pos-cajas']); setEditing(null); setViewMode('list'); setForm(EMPTY); toast.success('Configuración actualizada') } })

  const mutDelete = useMutation({
    mutationFn: ({ id, code }: { id: number; code: string }) => deleteCaja(id, code),
    onSuccess: () => {
      qc.invalidateQueries(['pos-cajas'])
      qc.invalidateQueries(['pos-dashboard'])
      toast.success('Caja POS eliminada correctamente')
      setModalDelete({ open: false, caja: null, code: '' })
    },
    onError: (e: any) => {
      if (e?.response?.status === 403) {
        toast.error('Código de autorización incorrecto')
      } else {
        toast.error(getApiError(e, 'Error al eliminar la caja'))
      }
    },
  })

  const handleConfirmDelete = () => {
    if (!modalDelete.caja) return
    if (!modalDelete.code.trim()) {
      toast.error('Debe ingresar el código de autorización')
      return
    }
    mutDelete.mutate({ id: modalDelete.caja.id, code: modalDelete.code.trim() })
  }

  const openEdit = (caja: any) => {
    setEditing(caja)
    setForm({
      nombre: caja.nombre,
      codigo: caja.codigo ?? '',
      referencia: caja.referencia ?? '',
      bodegaId: caja.bodegaId ? String(caja.bodegaId) : (caja.bodega?.id ? String(caja.bodega.id) : ''),
      cajaBancoId: caja.cajaBancoId ? String(caja.cajaBancoId) : '',
      documentoConfigId: caja.documentoConfigId ? String(caja.documentoConfigId) : '',
      documentoReciboConfigId: caja.documentoReciboConfigId ? String(caja.documentoReciboConfigId) : (caja.documentoReciboConfig?.id ? String(caja.documentoReciboConfig.id) : ''),
      documentoCierreConfigId: caja.documentoCierreConfigId ? String(caja.documentoCierreConfigId) : (caja.documentoCierreConfig?.id ? String(caja.documentoCierreConfig.id) : ''),
      vendedorId: caja.vendedorId ? String(caja.vendedorId) : '',
      vendedorNombre: caja.vendedorNombre ?? '',
      clienteDefaultId: caja.clienteDefaultId ? String(caja.clienteDefaultId) : '',
      impresora: caja.impresora ?? '',
      tipoConexion: caja.tipoConexion ?? 'NINGUNA',
      anchoPapel: caja.anchoPapel ?? 80,
      permiteCreditoPos: caja.permiteCreditoPos ?? false,
      permiteDescuento: caja.permiteDescuento ?? true,
      maxDescuento: caja.maxDescuento ?? 100,
      permiteStockNegativo: caja.permiteStockNegativo ?? false,
    })
    setViewMode('form')
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    const dto = {
      ...form,
      bodegaId: form.bodegaId ? +form.bodegaId : null,
      cajaBancoId: form.cajaBancoId ? +form.cajaBancoId : null,
      documentoConfigId: form.documentoConfigId ? +form.documentoConfigId : null,
      documentoReciboConfigId: form.documentoReciboConfigId ? +form.documentoReciboConfigId : null,
      documentoCierreConfigId: form.documentoCierreConfigId ? +form.documentoCierreConfigId : null,
      vendedorId: form.vendedorId ? +form.vendedorId : null,
      clienteDefaultId: form.clienteDefaultId ? +form.clienteDefaultId : null,
      anchoPapel: +form.anchoPapel,
      maxDescuento: +form.maxDescuento,
      permiteStockNegativo: !!form.permiteStockNegativo,
    }
    if (editing) mutUpdate.mutate({ id: editing.id, dto })
    else mutCreate.mutate(dto)
  }

  if (viewMode === 'form') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => { setViewMode('list'); setEditing(null); setForm(EMPTY) }}
            className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 border border-slate-200 bg-white shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              {editing ? 'Editar Configuración de Caja POS' : 'Registrar Nueva Caja POS'}
            </h1>
            <p className="text-slate-550 text-xs mt-0.5">
              Defina las credenciales fiscales, impresora térmica de tirillas y cuenta contable.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Código Único *</label>
              <input
                required
                disabled={!!editing}
                value={form.codigo}
                onChange={set('codigo')}
                placeholder="Ej: POS-01"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-indigo-200 disabled:bg-slate-50 disabled:text-slate-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                {editing ? 'El código no puede modificarse tras ser creado.' : 'Identificador interno único de esta caja.'}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Nombre Comercial *</label>
              <input
                required
                value={form.nombre}
                onChange={set('nombre')}
                placeholder="Ej: Caja Principal Norte"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Referencia / Serial de Pantalla</label>
              <input
                value={form.referencia}
                onChange={set('referencia')}
                placeholder="Ej: Serial Hw-98234-A"
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Bodega (Por Defecto) *</label>
              <select
                required
                value={form.bodegaId}
                onChange={set('bodegaId')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white cursor-pointer"
              >
                <option value="">Seleccionar bodega...</option>
                {bodegas.map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre} ({b.codigo || `ID: ${b.id}`}) {b.esPrincipal ? '★ Principal' : ''}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Solo productos de esta bodega.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Documento POS *</label>
              <select
                required
                value={form.documentoConfigId}
                onChange={set('documentoConfigId')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white cursor-pointer"
              >
                <option value="">Seleccionar resolución...</option>
                {docPosOptions.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.prefijo})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Tirilla POS fiscal DIAN.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Documento Recibo de Caja *</label>
              <select
                required
                value={form.documentoReciboConfigId}
                onChange={set('documentoReciboConfigId')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white cursor-pointer"
              >
                <option value="">Seleccionar recibo...</option>
                {docRcOptions.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.prefijo})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Obligatorio para respaldar los cobros.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Comprobante de Cierre (CF) *</label>
              <select
                required
                value={form.documentoCierreConfigId}
                onChange={set('documentoCierreConfigId')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white cursor-pointer"
              >
                <option value="">Seleccionar comprobante de cierre...</option>
                {docCierreOptions.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre} ({d.prefijo})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Obligatorio para respaldar el cierre de caja.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Caja / Banco PUC</label>
              <select
                value={form.cajaBancoId}
                onChange={set('cajaBancoId')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white cursor-pointer"
              >
                <option value="">Seleccionar cuenta...</option>
                {cajasBancos.map((cb: any) => (
                  <option key={cb.id} value={cb.id}>
                    {cb.nombre} (PUC: {cb.cuentaPUC || 'Sin PUC'})
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Cuenta de tesorería para efectivo.
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cliente por Defecto (Terceros)</label>
            <select
              value={form.clienteDefaultId}
              onChange={e => setForm((f: any) => ({ ...f, clienteDefaultId: e.target.value }))}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white cursor-pointer"
            >
              <option value="">Seleccionar cliente por defecto...</option>
              {clientes.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} ({c.numeroDocumento || 'Sin doc'})
                </option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Vendedor por Defecto</label>
            <select
              value={form.vendedorId}
              onChange={e => {
                const val = e.target.value
                const found = vendedores.find((v: any) => String(v.id) === val)
                setForm((f: any) => ({
                  ...f,
                  vendedorId: val,
                  vendedorNombre: found ? `${found.nombre} ${found.apellido || ''}`.trim() : ''
                }))
              }}
              className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white cursor-pointer"
            >
              <option value="">Ninguno — Asignar al momento de la venta</option>
              {vendedores.map((v: any) => (
                <option key={v.id} value={v.id}>
                  {v.nombre} {v.apellido || ''} ({v.codigo})
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Printer size={14} className="text-indigo-600" /> Configuración de Impresora de Tirillas
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5">Tipo de conexión</label>
                <select value={form.tipoConexion} onChange={set('tipoConexion')}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white cursor-pointer">
                  <option value="NINGUNA">Sin impresora</option>
                  <option value="AGENTE_LOCAL">Edatia Print Agent (Recomendado)</option>
                  <option value="NETWORK">Conexión de Red (IP:Puerto)</option>
                  <option value="USB">Conexión USB directa</option>
                  <option value="SERIAL">Puerto Serial / COM</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-550 mb-1.5">Ancho de papel térmico</label>
                <select value={form.anchoPapel} onChange={set('anchoPapel')}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white cursor-pointer">
                  <option value={58}>58 mm (Tirilla angosta)</option>
                  <option value={80}>80 mm (Estándar POS)</option>
                </select>
              </div>
            </div>

            {form.tipoConexion !== 'NINGUNA' && (
              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-550 mb-1.5">
                  {form.tipoConexion === 'NETWORK' ? 'Dirección IP e Impresora (Ej: 192.168.1.100:9100)' : 'Puerto de Impresora (Ej: COM3 o /dev/usb/lp0)'}
                </label>
                <input value={form.impresora} onChange={set('impresora')}
                  placeholder={form.tipoConexion === 'NETWORK' ? '192.168.1.100:9100' : 'COM3'}
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Reglas de Operación y Descuentos</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.permiteDescuento} onChange={set('permiteDescuento')}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600" />
                <span className="text-sm text-slate-700 font-semibold">Permitir descuentos manuales por ítem</span>
              </label>
              
              {form.permiteDescuento && (
                <div className="ml-7">
                  <label className="block text-xs font-semibold text-slate-650 mb-1">Porcentaje de descuento máximo permitido (%)</label>
                  <input type="number" min={0} max={100} value={form.maxDescuento} onChange={set('maxDescuento')}
                    className="w-24 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 font-bold" />
                </div>
              )}

              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.permiteCreditoPos} onChange={set('permiteCreditoPos')}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600" />
                <span className="text-sm text-slate-700 font-semibold">Habilitar ventas con medio de pago crédito (Cartera)</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer pt-1 border-t border-slate-100/60">
                <input type="checkbox" checked={form.permiteStockNegativo} onChange={set('permiteStockNegativo')}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 accent-indigo-600 mt-0.5" />
                <div>
                  <span className="text-sm text-slate-700 font-semibold block">Permitir facturar con stock en negativo</span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Habilita la venta de artículos sin existencias físicas (incluyendo creaciones rápidas en POS).
                    <strong className="text-amber-600 dark:text-amber-500 block mt-0.5">
                      Requiere que la bodega asignada por defecto también tenga autorizado el stock negativo en Configuración &gt; Empresa &gt; Inventario y Compras.
                    </strong>
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => { setViewMode('list'); setEditing(null); setForm(EMPTY) }}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={mutCreate.isLoading || mutUpdate.isLoading}
              className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {mutCreate.isLoading || mutUpdate.isLoading ? 'Guardando...' : editing ? 'Guardar Cambios' : 'Registrar Caja'}
            </button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings size={26} className="text-indigo-600" /> Configuración de Cajas POS
          </h1>
          <p className="text-slate-550 text-sm mt-0.5">Configure las cajas físicas del Punto de Venta y sus integraciones contables.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm(EMPTY); setViewMode('form') }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus size={16} /> Nueva Caja POS
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(cajas as any[]).map((caja: any) => (
          <div key={caja.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
            <div>
              <div className="bg-slate-50/70 px-4 py-3 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Monitor size={16} className="text-indigo-600" />
                  <span className="font-bold text-slate-800 text-sm">{caja.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${caja.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                    {caja.activo ? 'Activa' : 'Inactiva'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalDelete({ open: true, caja, code: '' })}
                    title="Eliminar caja POS"
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Tag size={12} className="text-slate-400 shrink-0" />
                  <span><strong>Código de caja:</strong> <span className="font-mono font-bold text-indigo-700 bg-indigo-50/50 px-1.5 py-0.5 rounded">{caja.codigo || '—'}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Warehouse size={12} className="text-slate-400 shrink-0" />
                  <span><strong>Bodega de Despacho:</strong> <span className="font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100/60">{caja.bodega?.nombre || 'Sin bodega'}</span></span>
                </div>
                {caja.documentoConfig?.sucursal?.nombre && (
                  <div className="flex items-center gap-2">
                    <Warehouse size={12} className="text-slate-400 shrink-0" />
                    <span><strong>Sucursal:</strong> {caja.documentoConfig.sucursal.nombre}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Landmark size={12} className="text-slate-400 shrink-0" />
                  <span><strong>Caja / Banco Contable:</strong> {caja.cajaBanco?.nombre || 'Sin asignar'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck size={12} className="text-slate-400 shrink-0" />
                  <span><strong>Resolución / Prefijo POS:</strong> {caja.documentoConfig?.nombre || 'Ninguno'} ({caja.documentoConfig?.prefijo || '—'})</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck size={12} className={caja.documentoReciboConfig ? 'text-indigo-500 shrink-0' : 'text-rose-500 shrink-0'} />
                  <span>
                    <strong>Recibo de Caja (RC):</strong>{' '}
                    {caja.documentoReciboConfig ? (
                      <span className="font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                        {caja.documentoReciboConfig.nombre} ({caja.documentoReciboConfig.prefijo})
                      </span>
                    ) : (
                      <span className="font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                        ⚠️ Sin anclar (Requerido para cobrar)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck size={12} className={caja.documentoCierreConfig ? 'text-amber-500 shrink-0' : 'text-rose-500 shrink-0'} />
                  <span>
                    <strong>Comprobante Cierre (CF):</strong>{' '}
                    {caja.documentoCierreConfig ? (
                      <span className="font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        {caja.documentoCierreConfig.nombre} ({caja.documentoCierreConfig.prefijo})
                      </span>
                    ) : (
                      <span className="font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                        ⚠️ Sin anclar (Requerido para cierre)
                      </span>
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User size={12} className="text-slate-400 shrink-0" />
                  <span><strong>Vendedor habitual:</strong> {caja.vendedorNombre || 'Sin asignar'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-slate-400 shrink-0" />
                  <span><strong>Cliente por defecto:</strong> {caja.clienteDefault?.nombre || 'Consumidor Final'}</span>
                </div>
                {caja.referencia && (
                  <div className="flex items-center gap-2">
                    <Settings size={12} className="text-slate-400 shrink-0" />
                    <span><strong>Ref / Serial hardware:</strong> <span className="font-mono text-slate-500">{caja.referencia}</span></span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Printer size={12} className="text-slate-400 shrink-0" />
                  <span><strong>Impresora térmica:</strong> {caja.impresora || 'No configurada'} ({caja.anchoPapel}mm)</span>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <span className="text-slate-400 font-bold shrink-0 text-xs">±</span>
                  <span>
                    <strong>Stock Negativo:</strong>{' '}
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      caja.permiteStockNegativo 
                        ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {caja.permiteStockNegativo ? 'Autorizado en Caja' : 'Bloqueado'}
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 pt-0 flex items-center gap-2">
              <button
                onClick={() => openEdit(caja)}
                className="flex-1 border border-slate-200 rounded-xl py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm bg-white"
              >
                Editar Configuración
              </button>
              <button
                type="button"
                onClick={() => setModalDelete({ open: true, caja, code: '' })}
                title="Eliminar caja POS"
                className="p-2 border border-rose-200 text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors shadow-sm bg-white"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}

        {(cajas as any[]).length === 0 && (
          <div className="col-span-3 text-center py-20 bg-white rounded-2xl border border-slate-200 text-slate-400">
            <Monitor size={48} className="mx-auto mb-3 opacity-25" />
            <p className="text-sm font-semibold">No se encontraron cajas configuradas aún.</p>
          </div>
        )}
      </div>

      {/* Modal Confirmación Eliminación con Contraseña */}
      {modalDelete.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-800">Eliminar Caja POS</h3>
                <p className="text-xs text-slate-500 mt-1">
                  ¿Está seguro de eliminar la caja <strong className="text-slate-700 font-semibold">{modalDelete.caja?.nombre}</strong>?
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Esta acción requiere autorización de administrador y retirará la caja del punto de venta.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalDelete({ open: false, caja: null, code: '' })}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="block text-xs font-bold text-slate-700">
                Clave de Autorización de Administrador *
              </label>
              <input
                type="password"
                autoFocus
                value={modalDelete.code}
                onChange={e => setModalDelete(prev => ({ ...prev, code: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter' && modalDelete.code.trim()) {
                    handleConfirmDelete()
                  }
                }}
                placeholder="Ingrese clave de administrador..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-500 transition-all"
              />
              <span className="text-[10px] text-slate-400 block">
                Configurada en Configuración → Empresa → pestaña Código de Administrador.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalDelete({ open: false, caja: null, code: '' })}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!modalDelete.code.trim() || mutDelete.isPending}
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {mutDelete.isPending ? 'Eliminando...' : 'Confirmar Eliminación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
