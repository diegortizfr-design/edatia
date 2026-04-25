import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCajas, createCaja, updateCaja } from '../../services/pos.service'
import { getCuentasPUC } from '../../services/contabilidad.service'
import { getBodegas } from '../../services/inventario.service'
import { Monitor, Plus, X, Settings, Printer, Warehouse, BookOpen } from 'lucide-react'

const EMPTY = {
  nombre: '', bodegaId: '', cuentaPUCId: '', vendedorNombre: '',
  impresora: '', tipoConexion: 'NINGUNA', anchoPapel: 80,
  permiteCreditoPos: false, permiteDescuento: true, maxDescuento: 100,
}

export function PosConfig() {
  const qc = useQueryClient()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<any>(EMPTY)
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const { data: cajas = [] } = useQuery(['pos-cajas'], getCajas)
  const { data: bodegas = [] } = useQuery(['bodegas'], () => getBodegas())
  const { data: cuentas = [] } = useQuery(['puc'], () => getCuentasPUC())

  // Filtrar cuentas de efectivo (clase 1 — Activo, nivel 3-5)
  const cuentasEfectivo = (cuentas as any[]).filter(c =>
    c.codigo?.startsWith('11') && c.nivel >= 3
  )

  const mutCreate = useMutation({ mutationFn: createCaja, onSuccess: () => { qc.invalidateQueries(['pos-cajas']); setShowForm(false); setForm(EMPTY) } })
  const mutUpdate = useMutation({ mutationFn: ({ id, dto }: any) => updateCaja(id, dto), onSuccess: () => { qc.invalidateQueries(['pos-cajas']); setEditing(null); setForm(EMPTY) } })

  const openEdit = (caja: any) => {
    setEditing(caja)
    setForm({
      nombre: caja.nombre, bodegaId: String(caja.bodegaId),
      cuentaPUCId: caja.cuentaPUCId ? String(caja.cuentaPUCId) : '',
      vendedorNombre: caja.vendedorNombre ?? '',
      impresora: caja.impresora ?? '', tipoConexion: caja.tipoConexion ?? 'NINGUNA',
      anchoPapel: caja.anchoPapel ?? 80,
      permiteCreditoPos: caja.permiteCreditoPos, permiteDescuento: caja.permiteDescuento,
      maxDescuento: caja.maxDescuento,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()
    const dto = {
      ...form,
      bodegaId: +form.bodegaId,
      cuentaPUCId: form.cuentaPUCId ? +form.cuentaPUCId : null,
      anchoPapel: +form.anchoPapel,
      maxDescuento: +form.maxDescuento,
    }
    if (editing) mutUpdate.mutate({ id: editing.id, dto })
    else mutCreate.mutate(dto)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings size={22} className="text-indigo-600" /> Configuración de Cajas POS
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">Configura las cajas registradoras del punto de venta</p>
        </div>
        <button onClick={() => { setEditing(null); setForm(EMPTY); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">
          <Plus size={16} /> Nueva caja
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {(cajas as any[]).map((caja: any) => (
          <div key={caja.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Monitor size={16} className="text-indigo-600" />
                <span className="font-bold text-slate-800">{caja.nombre}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${caja.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                {caja.activo ? 'Activa' : 'Inactiva'}
              </span>
            </div>
            <div className="p-4 space-y-2 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Warehouse size={14} className="text-slate-400" />
                <span><strong>Bodega:</strong> {caja.bodega?.nombre ?? '—'}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-slate-400" />
                <span><strong>Cuenta PUC:</strong> {caja.cuentaPUC ? `${caja.cuentaPUC.codigo} — ${caja.cuentaPUC.nombre}` : 'Sin asignar'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Printer size={14} className="text-slate-400" />
                <span><strong>Impresora:</strong> {caja.impresora || 'No configurada'} ({caja.anchoPapel}mm)</span>
              </div>
              <div className="text-xs text-slate-400 pt-1">
                Desc. máx: {caja.maxDescuento}% • Crédito: {caja.permiteCreditoPos ? 'Sí' : 'No'}
              </div>
            </div>
            <div className="px-4 pb-4">
              <button onClick={() => openEdit(caja)}
                className="w-full border border-slate-200 rounded-lg py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Editar configuración
              </button>
            </div>
          </div>
        ))}

        {(cajas as any[]).length === 0 && (
          <div className="col-span-3 text-center py-16 text-slate-400">
            <Monitor size={40} className="mx-auto mb-3 opacity-30" />
            <p>No hay cajas configuradas aún.</p>
          </div>
        )}
      </div>

      {/* Modal formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h2 className="font-bold text-slate-800">{editing ? 'Editar' : 'Nueva'} caja POS</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-slate-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Datos básicos */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Nombre de la caja *</label>
                <input required value={form.nombre} onChange={set('nombre')} placeholder="ej: Caja 1"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bodega *</label>
                  <select required value={form.bodegaId} onChange={set('bodegaId')}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                    <option value="">Seleccionar...</option>
                    {(bodegas as any[]).map((b: any) => <option key={b.id} value={b.id}>{b.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Cuenta PUC (efectivo)</label>
                  <select value={form.cuentaPUCId} onChange={set('cuentaPUCId')}
                    className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                    <option value="">Sin asignar</option>
                    {cuentasEfectivo.map((c: any) => <option key={c.id} value={c.id}>{c.codigo} — {c.nombre}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Vendedor por defecto</label>
                <input value={form.vendedorNombre} onChange={set('vendedorNombre')} placeholder="Nombre del vendedor habitual"
                  className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
              </div>

              {/* Impresora */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-1">
                  <Printer size={12} /> Impresora de tirillas
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Tipo de conexión</label>
                    <select value={form.tipoConexion} onChange={set('tipoConexion')}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                      <option value="NINGUNA">Sin impresora</option>
                      <option value="NETWORK">Red (IP:Puerto)</option>
                      <option value="USB">USB</option>
                      <option value="SERIAL">Serial/COM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">Ancho de papel</label>
                    <select value={form.anchoPapel} onChange={set('anchoPapel')}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200 bg-white">
                      <option value={58}>58 mm</option>
                      <option value={80}>80 mm</option>
                    </select>
                  </div>
                </div>
                {form.tipoConexion !== 'NINGUNA' && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {form.tipoConexion === 'NETWORK' ? 'IP:Puerto (ej: 192.168.1.100:9100)' : 'Puerto (ej: COM3 o /dev/usb/lp0)'}
                    </label>
                    <input value={form.impresora} onChange={set('impresora')}
                      placeholder={form.tipoConexion === 'NETWORK' ? '192.168.1.100:9100' : 'COM3'}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:ring-2 focus:ring-indigo-200" />
                  </div>
                )}
              </div>

              {/* Reglas de venta */}
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Reglas de venta</p>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.permiteDescuento} onChange={set('permiteDescuento')}
                      className="w-4 h-4 accent-indigo-600" />
                    <span className="text-sm text-slate-700">Permitir descuentos por ítem</span>
                  </label>
                  {form.permiteDescuento && (
                    <div className="ml-7">
                      <label className="block text-xs font-medium text-slate-600 mb-1">Descuento máximo (%)</label>
                      <input type="number" min={0} max={100} value={form.maxDescuento} onChange={set('maxDescuento')}
                        className="w-24 p-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-200" />
                    </div>
                  )}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={form.permiteCreditoPos} onChange={set('permiteCreditoPos')}
                      className="w-4 h-4 accent-indigo-600" />
                    <span className="text-sm text-slate-700">Permitir ventas a crédito desde POS</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" disabled={mutCreate.isLoading || mutUpdate.isLoading}
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
                  {mutCreate.isLoading || mutUpdate.isLoading ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
