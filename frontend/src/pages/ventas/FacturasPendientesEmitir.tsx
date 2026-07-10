import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { getFacturas, emitirFactura } from '../../services/ventas.service'
import { ArrowLeft, Send, CheckCircle2, XCircle, Loader2, FileText, AlertCircle } from 'lucide-react'

const cop = (n: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n)

export function FacturasPendientesEmitir() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [emittingIds, setEmittingIds] = useState<number[]>([])
  const [completedIds, setCompletedIds] = useState<number[]>([])
  const [failedIds, setFailedIds] = useState<Record<number, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)

  const { data: facturas = [], isLoading } = useQuery({
    queryKey: ['facturas-pendientes-dian'],
    queryFn: () => getFacturas(),
  })

  // Filtrar solo facturas de venta tipo POS (con prefijo FVP o POS) en estado CREADA o con DIAN estado Pendiente/Rechazada
  const pendientes = useMemo(() => {
    return (facturas as any[]).filter((f: any) => {
      const isPos =
        f.prefijoDIAN?.toLowerCase().startsWith('fvp') ||
        f.prefijoDIAN?.toLowerCase().startsWith('pos') ||
        f.numero?.toLowerCase().startsWith('fvp') ||
        f.numero?.toLowerCase().startsWith('pos')
      
      const isPending = f.estado === 'CREADA' || f.dianEstado === 'PENDIENTE' || !f.dianEstado || f.dianEstado === 'RECHAZADA'
      
      return isPos && isPending
    })
  }, [facturas])

  const toggleSelectAll = () => {
    if (selectedIds.length === pendientes.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(pendientes.map((f: any) => f.id))
    }
  }

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(x => x !== id))
    } else {
      setSelectedIds(prev => [...prev, id])
    }
  }

  const handleEmitirMasivo = async () => {
    if (selectedIds.length === 0) return
    setIsProcessing(true)
    setCompletedIds([])
    setFailedIds({})

    // Emitir de forma secuencial para no sobrecargar el API de la DIAN y registrar el estado de cada una
    for (const id of selectedIds) {
      setEmittingIds(prev => [...prev, id])
      try {
        await emitirFactura(id)
        setCompletedIds(prev => [...prev, id])
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || 'Error en validación DIAN'
        setFailedIds(prev => ({ ...prev, [id]: errorMsg }))
      } finally {
        setEmittingIds(prev => prev.filter(x => x !== id))
      }
    }

    setIsProcessing(false)
    setSelectedIds([])
    qc.invalidateQueries({ queryKey: ['facturas-pendientes-dian'] })
    qc.invalidateQueries({ queryKey: ['facturas'] })
  }

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/pos/ventas')}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 border border-slate-200 bg-white"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Send className="text-orange-500" size={24} /> Emisión Masiva a la DIAN
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Seleccione las facturas electrónicas pendientes de validación fiscal para firmar y enviar en lote
          </p>
        </div>
      </div>

      {/* Controles de Acción Masiva */}
      {pendientes.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="text-xs font-semibold text-orange-850">
            <span>{selectedIds.length} de {pendientes.length} facturas seleccionadas</span>
          </div>

          <button
            onClick={handleEmitirMasivo}
            disabled={selectedIds.length === 0 || isProcessing}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white font-bold text-xs rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isProcessing ? (
              <>
                <Loader2 className="animate-spin" size={14} /> Procesando emisión masiva...
              </>
            ) : (
              <>
                <Send size={14} /> Emitir {selectedIds.length} Factura(s) a la DIAN
              </>
            )}
          </button>
        </div>
      )}

      {/* Listado */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading && <p className="text-center py-16 text-slate-400 text-xs font-semibold">Buscando documentos pendientes...</p>}
        {!isLoading && pendientes.length === 0 && (
          <div className="p-16 text-center text-slate-400">
            <CheckCircle2 className="mx-auto mb-3 text-emerald-500" size={40} />
            <p className="text-sm font-bold text-slate-800">¡Al día! No hay facturas pendientes de emisión.</p>
            <p className="text-xs text-slate-400 mt-1">Todas las facturas electrónicas FVE activas han sido enviadas y procesadas.</p>
          </div>
        )}

        {!isLoading && pendientes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100 bg-slate-50/20">
                  <th className="px-6 py-3.5 text-center w-12">
                    <input
                      type="checkbox"
                      disabled={isProcessing}
                      checked={selectedIds.length === pendientes.length && pendientes.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded accent-indigo-650 h-4 w-4 cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-3.5 text-left">Número</th>
                  <th className="px-6 py-3.5 text-left">Cliente</th>
                  <th className="px-6 py-3.5 text-left">Fecha de Creación</th>
                  <th className="px-6 py-3.5 text-right">Monto Total</th>
                  <th className="px-6 py-3.5 text-center">Estado DIAN</th>
                  <th className="px-6 py-3.5 text-left">Progreso / Resultado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendientes.map((f: any) => {
                  const isEmitting = emittingIds.includes(f.id)
                  const isCompleted = completedIds.includes(f.id)
                  const isFailed = failedIds[f.id] !== undefined
                  const isSelected = selectedIds.includes(f.id)

                  return (
                    <tr key={f.id} className={`transition-colors ${isSelected ? 'bg-slate-50/30' : ''}`}>
                      <td className="px-6 py-4 text-center">
                        {!isEmitting && !isCompleted && (
                          <input
                            type="checkbox"
                            disabled={isProcessing}
                            checked={isSelected}
                            onChange={() => toggleSelectOne(f.id)}
                            className="rounded accent-indigo-650 h-4 w-4 cursor-pointer"
                          />
                        )}
                        {isEmitting && <Loader2 className="animate-spin text-orange-500 mx-auto" size={16} />}
                        {isCompleted && <CheckCircle2 className="text-emerald-500 mx-auto" size={16} />}
                        {isFailed && <XCircle className="text-red-500 mx-auto" size={16} />}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-xs text-indigo-700">
                        {f.prefijo || ''}{f.numero}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <span className="font-bold text-slate-800 block">{f.cliente?.nombre}</span>
                        <span className="text-[10px] text-slate-400 font-semibold">{f.cliente?.numeroDocumento}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs">
                        {new Date(f.fecha).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-slate-800 text-xs">
                        {cop(Number(f.total))}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          f.dianEstado === 'RECHAZADA'
                            ? 'bg-red-50 text-red-700 border-red-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {f.dianEstado || 'PENDIENTE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold max-w-xs truncate">
                        {isEmitting && <span className="text-orange-600 flex items-center gap-1"><Loader2 className="animate-spin" size={12} /> Enviando firma a la DIAN...</span>}
                        {isCompleted && <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 size={12} /> Emitida con éxito (Aceptada)</span>}
                        {isFailed && (
                          <span className="text-red-600 flex items-start gap-1 whitespace-normal leading-tight" title={failedIds[f.id]}>
                            <AlertCircle className="shrink-0 mt-0.5" size={12} /> {failedIds[f.id]}
                          </span>
                        )}
                        {!isEmitting && !isCompleted && !isFailed && (
                          <span className="text-slate-400 italic">Listo para emitir</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
