import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCajas, createCaja, updateCaja } from '../../services/pos.service'
import { getCajasBancos, getVendedores } from '../../services/erp.service'
import { getDocumentosConfig } from '../../services/configuracion.service'
import { getClientes } from '../../services/ventas.service'
import { Monitor, Plus, X, Settings, Printer, Warehouse, Landmark, FileCheck, ArrowLeft, Tag, User, Users } from 'lucide-react'

const EMPTY = {
  nombre: '',
  codigo: '',
  referencia: '',
  cajaBancoId: '',
  documentoConfigId: '',
  vendedorId: '',
  vendedorNombre: '',
  clienteDefaultId: '',
  impresora: '',
  tipoConexion: 'NINGUNA',
  anchoPapel: 80,
  permiteCreditoPos: false,
  permiteDescuento: true,
  maxDescuento: 100,
}

export function PosConfig() {
  const qc = useQueryClient()
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const { data: cajas = [] } = useQuery(['pos-cajas'], getCajas)
  const { data: cajasBancos = [] } = useQuery(['cajas-bancos'], getCajasBancos)
  const { data: documentosConfig = [] } = useQuery(['documentos-config'], getDocumentosConfig)
  const { data: vendedores = [] } = useQuery(['vendedores'], getVendedores)
  const { data: clientes = [] } = useQuery(['clientes'], () => getClientes())

  // Filtrar documentos tipo POS / FVP o FVE (Facturación de punto de venta)
  const docPosOptions = (documentosConfig as any[]).filter(d =>
    d.sigla?.toLowerCase() === 'pos' || d.sigla?.toLowerCase() === 'fvp' || d.prefijo?.toLowerCase().includes('pos') || d.prefijo?.toLowerCase().includes('fvp')
  )

  const mutCreate = useMutation({ mutationFn: createCaja, onSuccess: () => { qc.invalidateQueries(['pos-cajas']); setViewMode('list'); setForm(EMPTY) } })
  const mutUpdate = useMutation({ mutationFn: ({ id, dto }: any) => updateCaja(id, dto), onSuccess: () => { qc.invalidateQueries(['pos-cajas']); setEditing(null); setViewMode('list'); setForm(EMPTY) } })

  const openEdit = (caja: any) => {
    setEditing(caja)
    setForm({
      nombre: caja.nombre,
      codigo: caja.codigo ?? '',
      referencia: caja.referencia ?? '',
      cajaBancoId: caja.cajaBancoId ? String(caja.cajaBancoId) : '',
      documentoConfigId: caja.documentoConfigId ? String(caja.documentoConfigId) : '',
      vendedorId: caja.vendedorId ? String(caja.vendedorId) : '',
      vendedorNombre: caja.vendedorNombre ?? '',
      clienteDefaultId: caja.clienteDefaultId ? String(caja.clienteDefaultId) : '',
      impresora: caja.impresora ?? '',
      tipoConexion: caja.tipoConexion ?? 'NINGUNA',
      anchoPapel: caja.anchoPapel ?? 80,
      permiteCreditoPos: caja.permiteCreditoPos,
      permiteDescuento: caja.permiteDescuento,
      maxDescuento: caja.maxDescuento,
    })
    setViewMode('form')
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    const dto = {
      ...form,
      cajaBancoId: form.cajaBancoId ? +form.cajaBancoId : null,
      documentoConfigId: form.documentoConfigId ? +form.documentoConfigId : null,
      vendedorId: form.vendedorId ? +form.vendedorId : null,
      clienteDefaultId: form.clienteDefaultId ? +form.clienteDefaultId : null,
      anchoPapel: +form.anchoPapel,
      maxDescuento: +form.maxDescuento,
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Documento POS por Defecto *</label>
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
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Caja / Banco Contable (PUC) (Opcional)</label>
              <select
                value={form.cajaBancoId}
                onChange={set('cajaBancoId')}
                className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white cursor-pointer"
              >
                <option value="">Seleccionar cuenta contable...</option>
                {cajasBancos.map((cb: any) => (
                  <option key={cb.id} value={cb.id}>
                    {cb.nombre} (PUC: {cb.cuentaPUC || 'Sin PUC'})
                  </option>
                ))}
              </select>
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
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${caja.activo ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {caja.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              
              <div className="p-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Tag size={12} className="text-slate-400 shrink-0" />
                  <span><strong>Código de caja:</strong> <span className="font-mono font-bold text-indigo-700 bg-indigo-50/50 px-1.5 py-0.5 rounded">{caja.codigo || '—'}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <Warehouse size={12} className="text-slate-400 shrink-0" />
                  <span><strong>Sucursal:</strong> {caja.documentoConfig?.sucursal?.nombre || caja.bodega?.nombre || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Landmark size={12} className="text-slate-400 shrink-0" />
                  <span><strong>Caja / Banco Contable:</strong> {caja.cajaBanco?.nombre || 'Sin asignar'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck size={12} className="text-slate-400 shrink-0" />
                  <span><strong>Resolución / Prefijo:</strong> {caja.documentoConfig?.nombre || 'Ninguno'} ({caja.documentoConfig?.prefijo || '—'})</span>
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
              </div>
            </div>

            <div className="p-4 pt-0">
              <button
                onClick={() => openEdit(caja)}
                className="w-full border border-slate-200 rounded-xl py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm bg-white"
              >
                Editar Configuración
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
    </div>
  )
}
