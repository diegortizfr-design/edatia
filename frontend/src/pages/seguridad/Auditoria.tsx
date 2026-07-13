import { useState, useEffect } from 'react'
import { ClipboardList, Search, RefreshCw, Filter, Laptop, User } from 'lucide-react'
import { getAuditoriaERP } from '../../services/erp.service'

interface AuditLog {
  id: string;
  fecha: string; // ISO string
  usuario: string; // HECTOR, patricia, etc.
  modulo: 'INVENTARIO' | 'VENTAS' | 'CONTABILIDAD' | 'POS' | 'SEGURIDAD';
  accion: string; // ej. "Modificó Producto #10", "Inicio de sesión exitoso"
  ip: string;
  dispositivo: string;
}

export function Auditoria() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [search, setSearch] = useState('')
  const [userFilter, setUserFilter] = useState('ALL')
  const [moduleFilter, setModuleFilter] = useState('ALL')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAuditoriaERP({ limit: 100 })
      const mapped = (res.data || []).map((item: any) => ({
        id: String(item.id),
        fecha: item.createdAt,
        usuario: item.usuarioNombre || 'Sistema',
        modulo: item.modulo as any,
        accion: item.descripcion || `${item.accion} en ${item.entidad || ''}`,
        ip: item.ip || '0.0.0.0',
        dispositivo: item.userAgent || 'Desconocido'
      }))
      setLogs(mapped)
    } catch (e: any) {
      console.error(e)
      setError('Fallo al obtener los registros de auditoría del servidor.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  const handleRefresh = () => {
    fetchLogs()
  }

  // Extraer lista única de usuarios para el filtro
  const uniqueUsers = Array.from(new Set(logs.map(l => l.usuario)))

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.accion.toLowerCase().includes(search.toLowerCase()) || 
                          l.usuario.toLowerCase().includes(search.toLowerCase()) ||
                          l.modulo.toLowerCase().includes(search.toLowerCase())
    const matchesUser = userFilter === 'ALL' || l.usuario === userFilter
    const matchesModule = moduleFilter === 'ALL' || l.modulo === moduleFilter

    return matchesSearch && matchesUser && matchesModule
  })

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Seguridad</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-600 font-medium">Auditoría</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
            <ClipboardList size={24} className="text-indigo-600" />
            Logs de Auditoría y Transacciones
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Registro detallado e inalterable de todos los movimientos operacionales y configuraciones críticas del ERP.
          </p>
        </div>

        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold active:scale-[0.98] transition-all border border-slate-200"
          title="Refrescar logs del sistema"
        >
          <RefreshCw size={14} className="text-slate-500" />
          Actualizar
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por acción o palabra clave..."
            className="w-full pl-9 pr-3.5 py-2.0 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all focus:bg-white"
          />
        </div>

        {/* Filters Dropdown */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter by User */}
          <div className="flex items-center gap-2">
            <User size={14} className="text-slate-400" />
            <select
              value={userFilter}
              onChange={e => setUserFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none cursor-pointer focus:bg-white"
            >
              <option value="ALL">-- Todos los Usuarios --</option>
              {uniqueUsers.map(usr => (
                <option key={usr} value={usr}>{usr}</option>
              ))}
            </select>
          </div>

          {/* Filter by Module */}
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 outline-none cursor-pointer focus:bg-white"
            >
              <option value="ALL">-- Todos los Módulos --</option>
              <option value="INVENTARIO">Inventario</option>
              <option value="VENTAS">Ventas</option>
              <option value="CONTABILIDAD">Contabilidad</option>
              <option value="POS">Punto de Venta</option>
              <option value="SEGURIDAD">Seguridad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de Logs */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-100">
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-44">Fecha / Hora</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">Usuario</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-36">Módulo</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Acción / Evento Auditado</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-32">IP de Origen</th>
                <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-48">Dispositivo / Agente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                    <span className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin text-indigo-600" />
                      Cargando registros de auditoría...
                    </span>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-rose-500 font-semibold bg-rose-50/50">
                    {error}
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/25 transition-colors">
                    <td className="p-4 font-mono text-slate-500">
                      {new Date(log.fecha).toLocaleString('es-CO', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded font-mono">
                        {log.usuario}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide border uppercase ${
                        log.modulo === 'INVENTARIO' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        log.modulo === 'VENTAS' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        log.modulo === 'CONTABILIDAD' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                        log.modulo === 'POS' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        'bg-slate-50 text-slate-600 border-slate-200'
                      }`}>
                        {log.modulo}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-slate-800 leading-relaxed">{log.accion}</td>
                    <td className="p-4 font-mono text-slate-600">{log.ip}</td>
                    <td className="p-4 text-slate-400 truncate max-w-xs" title={log.dispositivo}>
                      <span className="flex items-center gap-1">
                        <Laptop size={12} className="shrink-0 text-slate-300" />
                        {log.dispositivo}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 italic">
                    No se encontraron registros de auditoría bajo los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
