import { useState, useMemo } from 'react'
import { Store, Plus, Search, Trash2, Edit3, SlidersHorizontal, MapPin } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSucursales, createSucursal, updateSucursal, deleteSucursal, getGeolocationState } from '../../services/configuracion.service'
import { getApiError } from '../../services/api'

// ─── Helper Components ────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', disabled = false }: any) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
    />
  )
}

function SelectField({ value, onChange, options, disabled = false }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
}) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all bg-white cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────
export function ConfigSucursales() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<any>({})

  // ── Query ──
  const { data: sucursales = [], isLoading } = useQuery({
    queryKey: ['sucursales'],
    queryFn: getSucursales,
  })

  // ── Query Geolocalización ──
  const { data: geoData = { paises: [], departamentos: [], ciudades: [], comunas: [], barrios: [] } } = useQuery({
    queryKey: ['geolocation-state'],
    queryFn: getGeolocationState,
  })

  // ── Derived dynamic geo cascade ──
  const paisesList = useMemo(() => {
    return geoData.paises.map((p: any) => ({ value: p.codigo, label: p.nombre }))
  }, [geoData.paises])

  const depts = useMemo(() => {
    const country = geoData.paises.find((p: any) => p.codigo === (form.pais || 'CO'))
    if (!country) return []
    return geoData.departamentos
      .filter((d: any) => d.paisId === country.id)
      .map((d: any) => ({ value: d.nombre, label: d.nombre }))
  }, [geoData.paises, geoData.departamentos, form.pais])

  const cities = useMemo(() => {
    const country = geoData.paises.find((p: any) => p.codigo === (form.pais || 'CO'))
    if (!country) return []
    const dept = geoData.departamentos.find((d: any) => d.nombre === form.departamento && d.paisId === country.id)
    if (!dept) return []
    return geoData.ciudades
      .filter((c: any) => c.departamentoId === dept.id)
      .map((c: any) => ({ value: c.nombre, label: c.nombre }))
  }, [geoData.paises, geoData.departamentos, geoData.ciudades, form.pais, form.departamento])

  // ── Mutations ──
  const mutCreate = useMutation({
    mutationFn: (dto: any) => createSucursal(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sucursales'] })
      toast.success('Sucursal creada correctamente')
      setViewMode('list')
    },
    onError: (e: any) => toast.error(getApiError(e, 'Error al crear sucursal')),
  })

  const mutUpdate = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: any }) => updateSucursal(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sucursales'] })
      toast.success('Sucursal actualizada correctamente')
      setViewMode('list')
    },
    onError: (e: any) => toast.error(getApiError(e, 'Error al actualizar sucursal')),
  })

  const mutDelete = useMutation({
    mutationFn: ({ id, code }: { id: number; code: string }) => deleteSucursal(id, code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sucursales'] })
      toast.success('Sucursal eliminada y registrada en histórico')
    },
    onError: (e: any) => {
      if (e?.response?.status === 403) {
        toast.error('Código de autorización incorrecto')
      } else {
        toast.error(getApiError(e, 'Error al eliminar sucursal'))
      }
    },
  })

  const handleOpenNew = () => {
    setEditingId(null)
    const country = geoData.paises.find((p: any) => p.codigo === 'CO')
    const firstDeptObj = country
      ? geoData.departamentos.find((d: any) => d.paisId === country.id)
      : null
    const firstDept = firstDeptObj?.nombre || ''
    const firstCityObj = firstDeptObj
      ? geoData.ciudades.find((c: any) => c.departamentoId === firstDeptObj.id)
      : null
    const firstCity = firstCityObj?.nombre || ''

    setForm({
      codigo: '',
      nombre: '',
      correo: '',
      pais: 'CO',
      departamento: firstDept,
      municipio: firstCity,
      codigoPostal: firstCityObj?.codigoDian || '',
      direccion: '',
      estado: 'ACTIVO',
    })
    setViewMode('form')
  }

  const handleOpenEdit = (suc: any) => {
    setEditingId(suc.id)
    setForm({
      codigo: suc.codigo,
      nombre: suc.nombre,
      correo: suc.correo || '',
      pais: suc.pais || 'CO',
      departamento: suc.departamento || '',
      municipio: suc.municipio || '',
      codigoPostal: suc.codigoPostal || '',
      direccion: suc.direccion,
      estado: suc.estado || 'ACTIVO',
    })
    setViewMode('form')
  }

  const handleDelete = (suc: any) => {
    const warningMsg = `¿Está seguro de que desea eliminar la sucursal "${suc.nombre}"?\n\nEsta acción requiere un código de autorización y afectará los documentos y movimientos vinculados a ella.`
    if (!window.confirm(warningMsg)) return

    const entered = window.prompt('Ingrese el código de autorización del administrador para confirmar la eliminación:')
    if (entered === null) return
    if (!entered.trim()) {
      toast.error('Debe ingresar el código de autorización')
      return
    }

    mutDelete.mutate({ id: suc.id, code: entered.trim() })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.codigo || !form.nombre || !form.direccion || !form.pais) {
      toast.error('Los campos Código, Nombre, Dirección y País son obligatorios')
      return
    }
    const dto = {
      codigo: form.codigo.toUpperCase(),
      nombre: form.nombre,
      correo: form.correo || undefined,
      pais: form.pais,
      departamento: form.departamento || undefined,
      municipio: form.municipio || undefined,
      codigoPostal: form.codigoPostal || undefined,
      direccion: form.direccion,
      estado: form.estado || 'ACTIVO',
    }
    if (editingId) {
      mutUpdate.mutate({ id: editingId, dto })
    } else {
      mutCreate.mutate(dto)
    }
  }

  const isSaving = mutCreate.isPending || mutUpdate.isPending

  const filteredSucursales = (sucursales as any[]).filter((s: any) =>
    s.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    s.codigo?.toLowerCase().includes(search.toLowerCase()) ||
    s.direccion?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="w-full space-y-6">
      <Toaster position="top-right" />

      {viewMode === 'list' ? (
        <>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Configuración</span>
                <span className="text-slate-300">/</span>
                <span>General</span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">Sucursales</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <Store size={24} className="text-indigo-600" />
                Configuración de Sucursales
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Administración de sucursales, ubicaciones operativas, direcciones y códigos de establecimientos comerciales.
              </p>
            </div>
            <button
              onClick={handleOpenNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:shadow-lg active:scale-[0.98] transition-all"
            >
              <Plus size={16} />
              Crear Sucursal
            </button>
          </div>

          {/* Search bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-2.5">
            <div className="flex items-center gap-2 text-xs text-indigo-700 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
              <MapPin size={14} className="flex-shrink-0" />
              <span>Sucursales Activas: <span className="font-extrabold">{(sucursales as any[]).filter((s: any) => s.estado === 'ACTIVO').length}</span></span>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por código, nombre o dirección..."
                className="w-full pl-9 pr-3.5 py-1.5 bg-slate-100/60 border border-slate-200/50 rounded-lg text-xs text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden w-full">
            {isLoading ? (
              <div className="p-8 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full" />
                Cargando sucursales del servidor...
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/75 border-b border-slate-100">
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Código</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre de Sucursal</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Dirección Física</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Ubicación Geográfica</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredSucursales.length > 0 ? (
                      filteredSucursales.map((suc: any) => (
                        <tr key={suc.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-indigo-600">{suc.codigo}</td>
                          <td className="p-4">
                            <div className="font-bold text-slate-800">{suc.nombre}</div>
                            {suc.correo && (
                              <div className="text-xs text-slate-400 font-normal mt-0.5">{suc.correo}</div>
                            )}
                          </td>
                          <td className="p-4 text-slate-600">{suc.direccion}</td>
                          <td className="p-4 text-slate-500 text-xs">
                            <div className="font-semibold text-slate-700">
                              {suc.municipio && `${suc.municipio}, `}{suc.departamento}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{suc.pais}</div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold leading-none ${
                              suc.estado === 'ACTIVO' ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${suc.estado === 'ACTIVO' ? 'bg-green-500' : 'bg-slate-400'}`} />
                              {suc.estado}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEdit(suc)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                title="Editar sucursal"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDelete(suc)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Eliminar sucursal"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          {search ? 'No se encontraron sucursales con ese filtro.' : 'No hay sucursales registradas. Crea la primera.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Form Header */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                <span>Configuración</span>
                <span className="text-slate-300">/</span>
                <span>General</span>
                <span className="text-slate-300">/</span>
                <span
                  className="text-slate-500 cursor-pointer hover:text-indigo-600"
                  onClick={() => setViewMode('list')}
                >
                  Sucursales
                </span>
                <span className="text-slate-300">/</span>
                <span className="text-slate-600 font-medium">{editingId ? 'Editar' : 'Crear'}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2 tracking-tight">
                <SlidersHorizontal size={24} className="text-indigo-600" />
                {editingId ? 'Editar Sucursal' : 'Crear Sucursal'}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">
                Completa los datos de ubicación y asignación de código del establecimiento comercial.
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 w-full">
            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-2">
                  <Field label="Código de Sucursal *">
                    <Input
                      value={form.codigo}
                      onChange={(v: string) => setForm((f: any) => ({ ...f, codigo: v }))}
                      placeholder="Ej. SUC01"
                    />
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="Nombre de Sucursal *">
                    <Input
                      value={form.nombre}
                      onChange={(v: string) => setForm((f: any) => ({ ...f, nombre: v }))}
                      placeholder="Ej. Sucursal Medellín Norte"
                    />
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="Correo Electrónico">
                    <Input
                      type="email"
                      value={form.correo}
                      onChange={(v: string) => setForm((f: any) => ({ ...f, correo: v }))}
                      placeholder="correo@sucursal.com"
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field label="Estado">
                    <SelectField
                      value={form.estado || 'ACTIVO'}
                      onChange={(v) => setForm((f: any) => ({ ...f, estado: v }))}
                      options={[
                        { value: 'ACTIVO', label: 'Activo' },
                        { value: 'INACTIVO', label: 'Inactivo' },
                      ]}
                    />
                  </Field>
                </div>

                {/* Geografía cascada */}
                <div className="md:col-span-4">
                  <Field label="País *">
                    <SelectField
                      value={form.pais || 'CO'}
                      onChange={(v) => {
                        const country = geoData.paises.find((p: any) => p.codigo === v)
                        const matchingDepts = country
                          ? geoData.departamentos.filter((d: any) => d.paisId === country.id)
                          : []
                        const firstDept = matchingDepts[0]?.nombre || ''
                        const firstDeptId = matchingDepts[0]?.id
                        const matchingCities = firstDeptId
                          ? geoData.ciudades.filter((c: any) => c.departamentoId === firstDeptId)
                          : []
                        const firstCity = matchingCities[0]?.nombre || ''
                        const firstCityObj = matchingCities[0]
                        setForm((f: any) => ({
                          ...f,
                          pais: v,
                          departamento: firstDept,
                          municipio: firstCity,
                          codigoPostal: firstCityObj?.codigoDian || '',
                        }))
                      }}
                      options={paisesList}
                    />
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="Departamento">
                    {depts.length > 0 ? (
                      <SelectField
                        value={form.departamento || ''}
                        onChange={(v) => {
                          const country = geoData.paises.find((p: any) => p.codigo === (form.pais || 'CO'))
                          const deptObj = country
                            ? geoData.departamentos.find((d: any) => d.nombre === v && d.paisId === country.id)
                            : null
                          const matchingCities = deptObj
                            ? geoData.ciudades.filter((c: any) => c.departamentoId === deptObj.id)
                            : []
                          const firstCity = matchingCities[0]?.nombre || ''
                          const firstCityObj = matchingCities[0]
                          setForm((f: any) => ({
                            ...f,
                            departamento: v,
                            municipio: firstCity,
                            codigoPostal: firstCityObj?.codigoDian || '',
                          }))
                        }}
                        options={depts}
                      />
                    ) : (
                      <Input
                        value={form.departamento}
                        onChange={(v: string) => setForm((f: any) => ({ ...f, departamento: v }))}
                        placeholder="Ej. Cundinamarca"
                      />
                    )}
                  </Field>
                </div>

                <div className="md:col-span-4">
                  <Field label="Ciudad / Municipio">
                    {cities.length > 0 ? (
                      <SelectField
                        value={form.municipio || ''}
                        onChange={(v) => {
                          const country = geoData.paises.find((p: any) => p.codigo === (form.pais || 'CO'))
                          const deptObj = country
                            ? geoData.departamentos.find((d: any) => d.nombre === form.departamento && d.paisId === country.id)
                            : null
                          const cityObj = deptObj
                            ? geoData.ciudades.find((c: any) => c.nombre === v && c.departamentoId === deptObj.id)
                            : null
                          setForm((f: any) => ({
                            ...f,
                            municipio: v,
                            codigoPostal: cityObj?.codigoDian || f.codigoPostal || '',
                          }))
                        }}
                        options={cities}
                      />
                    ) : (
                      <Input
                        value={form.municipio}
                        onChange={(v: string) => setForm((f: any) => ({ ...f, municipio: v }))}
                        placeholder="Ej. Bogotá"
                      />
                    )}
                  </Field>
                </div>

                <div className="col-span-12">
                  <Field label="Dirección Física Completa *">
                    <Input
                      value={form.direccion}
                      onChange={(v: string) => setForm((f: any) => ({ ...f, direccion: v }))}
                      placeholder="Ej. Calle 50 # 80 - 45 Oficina 301"
                    />
                  </Field>
                </div>
              </div>

              {/* Botones */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold active:scale-[0.98] transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-100 active:scale-[0.98] transition-all"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  )
}
