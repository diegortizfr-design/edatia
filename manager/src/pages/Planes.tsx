import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CreditCard, Plus, X, Pencil, Users, Check, Package, Calculator, Percent, ArrowRight, CalendarDays, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { cn, formatCOP, formatDate, MODULO_ICONS } from '@/lib/utils';

interface Modulo {
  id: number;
  nombre: string;
  slug: string;
  precioAnual: number;
}

interface PlanBase {
  id: number;
  nombre: string;
  descripcion?: string;
  precioBase: number;
  descuentoDefinitivo: number;
  descuentoParcial: number;
  mesesDescuentoParcial: number;
  precioAnualFinal: number;
  precioMensualFinal: number;
  limiteUsuarios?: number;
  modulos?: { modulo: Modulo }[];
  activo: boolean;
  createdAt: string;
}

interface PlanForm {
  nombre: string;
  descripcion: string;
  limiteUsuarios: string;
  descuentoDefinitivo: string;
  descuentoParcial: string;
  mesesDescuentoParcial: string;
  moduloIds: number[];
}

export function PlanesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<PlanBase | null>(null);
  
  const [form, setForm] = useState<PlanForm>({ 
    nombre: '', 
    descripcion: '', 
    limiteUsuarios: '5',
    descuentoDefinitivo: '0',
    descuentoParcial: '0',
    mesesDescuentoParcial: '0',
    moduloIds: []
  });

  const { data: planes = [], isLoading: loadingPlanes } = useQuery<PlanBase[]>({
    queryKey: ['manager', 'planes-base'],
    queryFn: () => api.get('/manager/planes-base').then((r) => r.data),
  });

  const { data: modulos = [] } = useQuery<Modulo[]>({
    queryKey: ['manager', 'modulos'],
    queryFn: () => api.get('/manager/modulos').then((r) => r.data),
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editing
        ? api.patch(`/manager/planes-base/${editing.id}`, data)
        : api.post('/manager/planes-base', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'planes-base'] });
      toast.success(editing ? 'Plan actualizado' : 'Plan creado exitosamente');
      closeForm();
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    },
  });

  function openEdit(p: PlanBase) {
    setEditing(p);
    setForm({
      nombre: p.nombre,
      descripcion: p.descripcion ?? '',
      limiteUsuarios: p.limiteUsuarios ? String(p.limiteUsuarios) : '5',
      descuentoDefinitivo: String(p.descuentoDefinitivo ?? 0),
      descuentoParcial: String(p.descuentoParcial ?? 0),
      mesesDescuentoParcial: String(p.mesesDescuentoParcial ?? 0),
      moduloIds: p.modulos ? p.modulos.map(m => m.modulo.id) : [],
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm({ 
      nombre: '', descripcion: '', limiteUsuarios: '5',
      descuentoDefinitivo: '0', descuentoParcial: '0', mesesDescuentoParcial: '0', moduloIds: []
    });
  }

  function toggleModulo(id: number) {
    setForm(prev => {
      const exists = prev.moduloIds.includes(id);
      return {
        ...prev,
        moduloIds: exists ? prev.moduloIds.filter(x => x !== id) : [...prev.moduloIds, id]
      };
    });
  }

  // --- CALCULADORA MATEMÁTICA ---
  const { 
    sumaAnualSinDescuento, 
    sumaMensualSinDescuento,
    precioAnualPermanente,
    precioMensualPermanente,
    precioAnualIntro,
    precioMensualIntro
  } = useMemo(() => {
    // 1. Suma de precios base anuales de los módulos seleccionados
    const sumaAnual = form.moduloIds.reduce((acc, id) => {
      const mod = modulos.find(m => m.id === id);
      return acc + (mod ? Number(mod.precioAnual) : 0);
    }, 0);
    
    const sumaMensual = sumaAnual / 12;

    // 2. Descuento definitivo (fija el precio permanente del plan)
    const descDef = Number(form.descuentoDefinitivo) || 0;
    const descDefFactor = Math.max(0, 100 - descDef) / 100;
    
    const precioAnualPerm = Math.round(sumaAnual * descDefFactor);
    const precioMensualPerm = Math.round(precioAnualPerm / 12);

    // 3. Descuento parcial temporal (precio introductorio para negociación)
    const descParcial = Number(form.descuentoParcial) || 0;
    const descParcialFactor = Math.max(0, 100 - descParcial) / 100;

    const precioAnualIntro = Math.round(precioAnualPerm * descParcialFactor);
    const precioMensualIntro = Math.round(precioMensualPerm * descParcialFactor);

    return {
      sumaAnualSinDescuento: sumaAnual,
      sumaMensualSinDescuento: sumaMensual,
      precioAnualPermanente: precioAnualPerm,
      precioMensualPermanente: precioMensualPerm,
      precioAnualIntro: precioAnualIntro,
      precioMensualIntro: precioMensualIntro
    };
  }, [form.moduloIds, form.descuentoDefinitivo, form.descuentoParcial, modulos]);

  const handleSave = () => {
    if (!form.nombre.trim()) {
      toast.error('El nombre del plan es requerido');
      return;
    }
    
    saveMutation.mutate({
      nombre: form.nombre,
      descripcion: form.descripcion || undefined,
      limiteUsuarios: form.limiteUsuarios ? Number(form.limiteUsuarios) : undefined,
      moduloIds: form.moduloIds,
      precioBase: sumaMensualSinDescuento, // Retro-compatibility (or base monthly val)
      descuentoDefinitivo: Number(form.descuentoDefinitivo) || 0,
      descuentoParcial: Number(form.descuentoParcial) || 0,
      mesesDescuentoParcial: Number(form.mesesDescuentoParcial) || 0,
      precioAnualFinal: precioAnualPermanente,
      precioMensualFinal: precioMensualPermanente,
    });
  };

  const planGradients = [
    'from-slate-500/10 border-slate-500/20',
    'from-brand-blue/10 border-brand-blue/20',
    'from-brand-purple/10 border-brand-purple/20',
    'from-amber-500/10 border-amber-500/20',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard size={20} className="text-brand-blue" />
            Planes Base
          </h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">Empaqueta módulos y configura precios base corporativos</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditing(null); }}
          title="Nuevo plan"
          className="p-2 rounded-lg bg-gradient-brand text-white shadow-glow-brand hover:opacity-90 transition-all flex items-center gap-2 px-4"
        >
          <Plus size={18} />
          <span className="hidden sm:inline font-medium text-sm">Nuevo Plan</span>
        </button>
      </div>

      {/* Cards */}
      {loadingPlanes ? (
        <div className="text-center py-12 text-gray-400 dark:text-slate-500 text-sm">Cargando planes configurados...</div>
      ) : planes.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-gray-400 dark:text-slate-500 text-sm">No hay planes configurados</p>
          <p className="text-xs text-gray-400 dark:text-slate-600 mt-2">Crea un plan agrupando módulos de software</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {planes.map((p, i) => (
            <Card
              key={p.id}
              hover
              className={`bg-gradient-to-br ${planGradients[i % planGradients.length]} border shadow-sm`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center shadow-inner">
                  <CreditCard size={20} className="text-brand-blue" />
                </div>
                <button
                  onClick={() => openEdit(p)}
                  title="Editar plan"
                  className="text-gray-400 dark:text-slate-500 hover:text-brand-blue bg-white dark:bg-navy-900 rounded-lg p-2 shadow-sm border border-gray-200 dark:border-white/5 transition-all hover:scale-105"
                >
                  <Pencil size={14} />
                </button>
              </div>

              <h3 className="font-bold text-gray-900 dark:text-white text-xl mb-1">{p.nombre}</h3>
              {p.descripcion && (
                <p className="text-sm text-gray-500 dark:text-slate-400 mb-4 line-clamp-2 min-h-[40px]">{p.descripcion}</p>
              )}

              <div className="space-y-4 mb-4">
                {/* Precios Base vs Final */}
                <div className="bg-white/50 dark:bg-navy-900/50 rounded-xl p-3 border border-gray-100 dark:border-white/5">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Precio Permanente</p>
                    {Number(p.descuentoDefinitivo) > 0 && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded">
                        -{p.descuentoDefinitivo}% OFF
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-black bg-gradient-brand bg-clip-text text-transparent">
                      {formatCOP(p.precioMensualFinal)}
                    </p>
                    <span className="text-xs text-gray-400 font-medium">/mes</span>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">Anual: {formatCOP(p.precioAnualFinal)}</p>
                </div>
                
                {/* Modulos List */}
                {p.modulos && p.modulos.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                      <Package size={12} /> {p.modulos.length} Módulos incluidos
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.modulos.slice(0, 3).map(m => (
                        <span key={m.modulo.id} className="text-[10px] bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-slate-300 px-2 py-1 rounded-md flex items-center gap-1">
                          {MODULO_ICONS[m.modulo.slug] ?? '📦'} {m.modulo.nombre}
                        </span>
                      ))}
                      {p.modulos.length > 3 && (
                        <span className="text-[10px] bg-gray-100 dark:bg-navy-700 text-gray-500 px-2 py-1 rounded-md">
                          +{p.modulos.length - 3} más
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-200/50 dark:border-white/10">
                {p.limiteUsuarios ? (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-slate-400">
                    <Users size={14} className="text-brand-purple" />
                    <span>Max. {p.limiteUsuarios} usuarios</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    <Users size={14} />
                    <span>Ilimitados</span>
                  </div>
                )}
                
                {Number(p.descuentoParcial) > 0 && (
                  <div className="flex items-center gap-1 text-[10px] font-medium text-brand-blue bg-blue-50 dark:bg-brand-blue/10 px-2 py-1 rounded-full border border-blue-100 dark:border-brand-blue/20">
                    <Percent size={10} />
                    Tiene desc. intro
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Configurador Modal (Pantalla Completa en Móvil, Modal Grande en PC) */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-gray-100/80 dark:bg-black/80 backdrop-blur-md">
          <div className="w-full h-full md:h-auto md:max-h-[95vh] md:max-w-6xl bg-white dark:bg-navy-900 md:rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col animate-fade-in overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-5 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-navy-800/50">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Package className="text-brand-blue" />
                  {editing ? 'Editar Configurador de Plan' : 'Configurador de Plan Base'}
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Arrastra o selecciona los módulos para estructurar la oferta.</p>
              </div>
              <button
                onClick={closeForm}
                className="p-2 bg-white dark:bg-navy-800 border border-gray-200 dark:border-white/10 rounded-lg text-gray-400 dark:text-slate-400 hover:text-red-500 hover:border-red-200 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body - 2 Columns */}
            <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
              
              {/* Left Column: Data & Modules */}
              <div className="flex-1 p-5 md:p-6 lg:border-r border-gray-200 dark:border-white/5 space-y-6 bg-white dark:bg-navy-900">
                
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
                    <Info size={16} className="text-brand-purple" />
                    Información Básica
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        label="Nombre del plan *"
                        placeholder="ej. ERP Corporativo Plus"
                        value={form.nombre}
                        onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1.5">Descripción pública</label>
                      <textarea
                        value={form.descripcion}
                        onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
                        rows={2}
                        placeholder="Descripción corta para los clientes..."
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-brand-blue/60 resize-none"
                      />
                    </div>
                    <Input
                      label="Límite de usuarios"
                      type="number"
                      placeholder="Dejar en blanco si es ilimitado"
                      value={form.limiteUsuarios}
                      onChange={(e) => setForm((f) => ({ ...f, limiteUsuarios: e.target.value }))}
                    />
                  </div>
                </section>

                <section className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-white/5 pb-2">
                    <Package size={16} className="text-brand-blue" />
                    Módulos del Sistema
                  </h3>
                  <p className="text-xs text-gray-500">Selecciona los módulos que componen este plan. El precio bruto se calculará sumándolos.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {modulos.map((m) => {
                      const isSelected = form.moduloIds.includes(m.id);
                      return (
                        <div
                          key={m.id}
                          onClick={() => toggleModulo(m.id)}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-200 select-none",
                            isSelected 
                              ? "bg-blue-50/50 dark:bg-brand-blue/10 border-brand-blue/50 shadow-sm" 
                              : "bg-white dark:bg-navy-800 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                          )}
                        >
                          <div className={cn(
                            "w-5 h-5 rounded flex items-center justify-center border transition-colors flex-shrink-0",
                            isSelected ? "bg-brand-blue border-brand-blue text-white" : "border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-navy-900"
                          )}>
                            {isSelected && <Check size={12} strokeWidth={3} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={cn("text-sm font-medium truncate", isSelected ? "text-brand-blue dark:text-blue-400" : "text-gray-700 dark:text-slate-300")}>
                              {MODULO_ICONS[m.slug] ?? '📦'} {m.nombre}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{formatCOP(m.precioAnual)} / año</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              </div>

              {/* Right Column: Calculator */}
              <div className="w-full lg:w-[450px] bg-gray-50 dark:bg-navy-800/30 p-5 md:p-6 flex flex-col border-t lg:border-t-0 border-gray-200 dark:border-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
                  <Calculator size={16} className="text-brand-blue" />
                  Calculadora de Precios
                </h3>

                <div className="flex-1 space-y-6">
                  {/* Summary Raw */}
                  <div className="bg-white dark:bg-navy-900 p-4 rounded-xl border border-gray-200 dark:border-white/5 shadow-sm">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Suma Bruta (Sin Descuentos)</p>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600 dark:text-slate-400">Total Anual:</span>
                      <span className="font-mono text-sm line-through text-gray-400">{formatCOP(sumaAnualSinDescuento)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-slate-400">Total Mensual:</span>
                      <span className="font-mono text-sm line-through text-gray-400">{formatCOP(sumaMensualSinDescuento)}</span>
                    </div>
                  </div>

                  {/* Descuento Permanente */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                        Descuento Definitivo
                        <div className="group relative">
                          <Info size={14} className="text-gray-400 cursor-help" />
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 text-center">
                            Aplica a toda la vida del contrato (sujeto a IPC).
                          </div>
                        </div>
                      </label>
                      <div className="relative w-24">
                        <input
                          type="number"
                          value={form.descuentoDefinitivo}
                          onChange={(e) => setForm(f => ({ ...f, descuentoDefinitivo: e.target.value }))}
                          className="w-full pl-3 pr-8 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-right font-bold focus:outline-none focus:ring-2 ring-emerald-500/50"
                          min="0" max="100"
                        />
                        <Percent size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-emerald-600/50" />
                      </div>
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                      <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Precio Base Permanente</p>
                      <div className="flex justify-between items-end">
                        <div className="flex flex-col">
                          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                            {formatCOP(precioMensualPermanente)}
                          </span>
                          <span className="text-[10px] font-medium text-emerald-600/70 mt-1">PAGO MENSUAL</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-emerald-700 dark:text-emerald-500">{formatCOP(precioAnualPermanente)}</span>
                          <p className="text-[10px] font-medium text-emerald-600/70">PAGO ANUAL</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Descuento Temporal */}
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-white/10">
                    <div className="flex items-center justify-between gap-4">
                      <label className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                        Descuento Parcial (Intro)
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative w-20">
                          <input
                            type="number"
                            value={form.descuentoParcial}
                            onChange={(e) => setForm(f => ({ ...f, descuentoParcial: e.target.value }))}
                            className="w-full pl-2 pr-7 py-1.5 rounded-lg border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-right font-bold focus:outline-none"
                            min="0" max="100"
                          />
                          <Percent size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-amber-600/50" />
                        </div>
                        <span className="text-xs text-gray-500">por</span>
                        <div className="relative w-20">
                          <input
                            type="number"
                            value={form.mesesDescuentoParcial}
                            onChange={(e) => setForm(f => ({ ...f, mesesDescuentoParcial: e.target.value }))}
                            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-900 text-center text-sm focus:outline-none"
                            min="0" max="120"
                          />
                        </div>
                        <span className="text-xs text-gray-500">meses</span>
                      </div>
                    </div>

                    {Number(form.descuentoParcial) > 0 && Number(form.mesesDescuentoParcial) > 0 && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-center justify-between animate-fade-in">
                        <div>
                          <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase">Oferta Inicial ({form.mesesDescuentoParcial} meses)</p>
                          <p className="text-lg font-bold text-amber-600 dark:text-amber-500">{formatCOP(precioMensualIntro)} <span className="text-xs font-normal opacity-70">/mes</span></p>
                        </div>
                        <ArrowRight className="text-amber-500/50" />
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Luego sube a</p>
                          <p className="text-sm font-bold text-gray-700 dark:text-slate-300">{formatCOP(precioMensualPermanente)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Save */}
                <div className="mt-6 pt-5 border-t border-gray-200 dark:border-white/10">
                  <Button
                    className="w-full text-lg py-6 bg-brand-blue hover:bg-brand-blue/90 text-white shadow-xl shadow-brand-blue/20"
                    loading={saveMutation.isPending}
                    onClick={handleSave}
                    disabled={!form.nombre || form.moduloIds.length === 0}
                  >
                    {!saveMutation.isPending && <Check size={20} className="mr-2" />}
                    Guardar Plan ({form.moduloIds.length} Módulos)
                  </Button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
