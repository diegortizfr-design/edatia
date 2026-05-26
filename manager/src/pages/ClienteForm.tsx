import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Check, Building2, MapPin, Phone, Briefcase,
  Receipt, Landmark, SlidersHorizontal, ChevronRight, Key, ShieldCheck, User, Trash2, FileText, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getApiError } from '@/lib/api';
import { Input } from '@/components/ui/Input';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Colaborador { id: number; nombre: string; rol: string }
interface PlanBase    { id: number; nombre: string }

interface FormData {
  // Identificación
  tipoPersona: string;
  tipoDocumento: string;
  nit: string;
  digitoVerificacion: string;
  nombre: string;
  // Ubicación
  pais: string;
  departamento: string;
  ciudad: string;
  direccion: string;
  codigoPostal: string;
  // Contacto
  email: string;
  telefono: string;
  telefonoAlternativo: string;
  paginaWeb: string;
  contacto: string;
  // Comercial
  tipoCliente: string;
  listaPrecios: string;
  cupoCredito: string;
  condicionesPago: string;
  estado: string;
  asesorId: string;
  planBaseId: string;
  // Tributario
  regimenTributario: string;
  responsabilidadFiscal: string;
  actividadEconomica: string;
  granContribuyente: boolean;
  autorretenedor: boolean;
  agenteRetencion: boolean;
  // Financiero
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  // Interno
  segmento: string;
  observaciones: string;
}

const EMPTY: FormData = {
  tipoPersona: '', tipoDocumento: 'NIT', nit: '', digitoVerificacion: '', nombre: '',
  pais: 'Colombia', departamento: '', ciudad: '', direccion: '', codigoPostal: '',
  email: '', telefono: '', telefonoAlternativo: '', paginaWeb: '', contacto: '',
  tipoCliente: '', listaPrecios: '', cupoCredito: '', condicionesPago: '', estado: 'PROSPECTO', asesorId: '', planBaseId: '',
  regimenTributario: '', responsabilidadFiscal: '', actividadEconomica: '',
  granContribuyente: false, autorretenedor: false, agenteRetencion: false,
  banco: '', tipoCuenta: '', numeroCuenta: '',
  segmento: '', observaciones: '',
};

// ─── Secciones nav ────────────────────────────────────────────────────────────
const SECCIONES = [
  { id: 'identificacion', label: 'Identificación',  icon: Building2 },
  { id: 'ubicacion',      label: 'Ubicación',        icon: MapPin },
  { id: 'contacto',       label: 'Contacto',         icon: Phone },
  { id: 'comercial',      label: 'Comercial',        icon: Briefcase },
  { id: 'tributario',     label: 'Tributario',       icon: Receipt },
  { id: 'financiero',     label: 'Financiero',       icon: Landmark },
  { id: 'interno',        label: 'Interno',          icon: SlidersHorizontal },
  { id: 'erp',            label: 'Accesos ERP',      icon: Key },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const selectCls = 'w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:border-brand-blue/60';
const labelCls  = 'text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1.5';
const checkboxCls = 'w-4 h-4 rounded border-gray-300 dark:border-white/20 text-brand-blue focus:ring-brand-blue/30 bg-white dark:bg-navy-700 cursor-pointer';

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
      <span className="h-px flex-1 bg-gray-200 dark:bg-white/5" />
      {children}
      <span className="h-px flex-1 bg-gray-200 dark:bg-white/5" />
    </h2>
  );
}

function BoolRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <input type="checkbox" className={checkboxCls} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="text-sm text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{label}</span>
    </label>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export function ClienteForm() {
  const { id }  = useParams<{ id: string }>();
  const isEdit  = !!id;
  const navigate = useNavigate();
  const qc       = useQueryClient();

  const [form, setForm]           = useState<FormData>(EMPTY);
  const [activeSection, setActive] = useState('identificacion');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const [erpUsuario, setErpUsuario] = useState('');
  const [erpPassword, setErpPassword] = useState('');

  const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.edatia.com';

  // Intentar parsear las observaciones si es un JSON estructurado de auto-registro
  let parsedObs: any = null;
  try {
    if (form.observaciones && form.observaciones.trim().startsWith('{')) {
      parsedObs = JSON.parse(form.observaciones);
    }
  } catch (e) {
    // No es JSON
  }

  // Cargar datos si es edición
  const { data: cliente, isLoading } = useQuery({
    queryKey: ['manager', 'clientes', id],
    queryFn: () => api.get(`/manager/clientes/${id}`).then((r) => r.data),
    enabled: isEdit,
  });

  // Colaboradores y planes para selects
  const { data: colaboradores = [] } = useQuery<Colaborador[]>({
    queryKey: ['manager', 'colaboradores'],
    queryFn: () => api.get('/manager/colaboradores').then((r) => r.data),
  });
  const { data: planes = [] } = useQuery<PlanBase[]>({
    queryKey: ['manager', 'planes-base'],
    queryFn: () => api.get('/manager/planes-base').then((r) => r.data),
  });

  useEffect(() => {
    if (cliente) {
      setForm({
        tipoPersona: cliente.tipoPersona ?? '',
        tipoDocumento: cliente.tipoDocumento ?? 'NIT',
        nit: cliente.nit ?? '',
        digitoVerificacion: cliente.digitoVerificacion ?? '',
        nombre: cliente.nombre ?? '',
        pais: cliente.pais ?? 'Colombia',
        departamento: cliente.departamento ?? '',
        ciudad: cliente.ciudad ?? '',
        direccion: cliente.direccion ?? '',
        codigoPostal: cliente.codigoPostal ?? '',
        email: cliente.email ?? '',
        telefono: cliente.telefono ?? '',
        telefonoAlternativo: cliente.telefonoAlternativo ?? '',
        paginaWeb: cliente.paginaWeb ?? '',
        contacto: cliente.contacto ?? '',
        tipoCliente: cliente.tipoCliente ?? '',
        listaPrecios: cliente.listaPrecios ?? '',
        cupoCredito: cliente.cupoCredito?.toString() ?? '',
        condicionesPago: cliente.condicionesPago ?? '',
        estado: cliente.estado ?? 'PROSPECTO',
        asesorId: cliente.asesorId?.toString() ?? '',
        planBaseId: cliente.planBaseId?.toString() ?? '',
        regimenTributario: cliente.regimenTributario ?? '',
        responsabilidadFiscal: cliente.responsabilidadFiscal ?? '',
        actividadEconomica: cliente.actividadEconomica ?? '',
        granContribuyente: cliente.granContribuyente ?? false,
        autorretenedor: cliente.autorretenedor ?? false,
        agenteRetencion: cliente.agenteRetencion ?? false,
        banco: cliente.banco ?? '',
        tipoCuenta: cliente.tipoCuenta ?? '',
        numeroCuenta: cliente.numeroCuenta ?? '',
        segmento: cliente.segmento ?? '',
        observaciones: cliente.observaciones ?? '',
      });
      if (cliente.email && !erpUsuario) {
        setErpUsuario(cliente.email);
      }
    }
  }, [cliente]);

  // Scroll spy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setBool = (key: keyof FormData) => (v: boolean) =>
    setForm((f) => ({ ...f, [key]: v }));

  const payload = () => ({
    tipoPersona: form.tipoPersona || undefined,
    tipoDocumento: form.tipoDocumento || undefined,
    nit: form.nit,
    digitoVerificacion: form.digitoVerificacion || undefined,
    nombre: form.nombre,
    pais: form.pais || undefined,
    departamento: form.departamento || undefined,
    ciudad: form.ciudad || undefined,
    direccion: form.direccion || undefined,
    codigoPostal: form.codigoPostal || undefined,
    email: form.email || undefined,
    telefono: form.telefono || undefined,
    telefonoAlternativo: form.telefonoAlternativo || undefined,
    paginaWeb: form.paginaWeb || undefined,
    contacto: form.contacto || undefined,
    tipoCliente: form.tipoCliente || undefined,
    listaPrecios: form.listaPrecios || undefined,
    cupoCredito: form.cupoCredito ? Number(form.cupoCredito) : undefined,
    condicionesPago: form.condicionesPago || undefined,
    estado: form.estado,
    asesorId: form.asesorId ? Number(form.asesorId) : undefined,
    planBaseId: form.planBaseId ? Number(form.planBaseId) : undefined,
    regimenTributario: form.regimenTributario || undefined,
    responsabilidadFiscal: form.responsabilidadFiscal || undefined,
    actividadEconomica: form.actividadEconomica || undefined,
    granContribuyente: form.granContribuyente,
    autorretenedor: form.autorretenedor,
    agenteRetencion: form.agenteRetencion,
    banco: form.banco || undefined,
    tipoCuenta: form.tipoCuenta || undefined,
    numeroCuenta: form.numeroCuenta || undefined,
    segmento: form.segmento || undefined,
    observaciones: form.observaciones || undefined,
  });

  const createMutation = useMutation({
    mutationFn: (data: ReturnType<typeof payload>) => api.post('/manager/clientes', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'clientes'] });
      toast.success('Cliente creado');
      navigate('/clientes');
    },
    onError: (err: unknown) => {
      toast.error(getApiError(err, 'Error al crear cliente'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ReturnType<typeof payload>) => api.patch(`/manager/clientes/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'clientes'] });
      toast.success('Cliente actualizado');
      navigate('/clientes');
    },
    onError: (err: unknown) => {
      toast.error(getApiError(err, 'Error al actualizar cliente'));
    },
  });

  const provisionarMutation = useMutation({
    mutationFn: (data: { usuario: string; password: string }) => 
      api.post(`/manager/clientes/${id}/provisionar-erp`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'clientes', id] });
      toast.success('Inquilino ERP y credenciales aprovisionadas correctamente');
      setErpPassword('');
    },
    onError: (err: unknown) => {
      toast.error(getApiError(err, 'Error al aprovisionar en el ERP'));
    },
  });

  const eliminarUsuarioErpMutation = useMutation({
    mutationFn: (userId: number) => 
      api.delete(`/manager/clientes/${id}/erp-usuarios/${userId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'clientes', id] });
      toast.success('Usuario del ERP eliminado');
    },
    onError: (err: unknown) => {
      toast.error(getApiError(err, 'Error al eliminar usuario'));
    },
  });

  const handleSave = () => {
    if (!form.nit.trim() || !form.nombre.trim()) {
      toast.error('Nombre e identificación son obligatorios');
      return;
    }
    if (isEdit) updateMutation.mutate(payload());
    else createMutation.mutate(payload());
  };

  const handleProvisionar = () => {
    if (!erpUsuario || erpPassword.length < 6) {
      toast.error('El usuario es requerido y la contraseña debe tener al menos 6 caracteres');
      return;
    }
    provisionarMutation.mutate({ usuario: erpUsuario, password: erpPassword });
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const scrollTo = (sectionId: string) => {
    sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(sectionId);
  };

  if (isEdit && isLoading) {
    return <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">Cargando cliente...</div>;
  }

  return (
    <div className="flex flex-col h-full -m-6">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-white dark:bg-navy-900 border-b border-gray-200 dark:border-white/5 px-6 py-3 flex items-center gap-4 shadow-sm dark:shadow-none">
        <button
          onClick={() => navigate('/clientes')}
          title="Volver"
          className="p-2 rounded-lg text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Building2 size={16} className="text-brand-blue shrink-0" />
          <input
            type="text"
            placeholder="Nombre de la empresa o razón social *"
            value={form.nombre}
            onChange={set('nombre')}
            className="flex-1 bg-transparent text-base font-semibold text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-slate-600 focus:outline-none min-w-0"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={isPending || !form.nit || !form.nombre}
          title="Guardar"
          className="p-2 rounded-lg bg-gradient-brand text-white shadow-glow-brand hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check size={18} />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Nav lateral sticky */}
        <aside className="w-52 shrink-0 border-r border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-navy-900 overflow-y-auto">
          <nav className="p-3 space-y-0.5 sticky top-0">
            {SECCIONES.map(({ id: sid, label, icon: Icon }) => (
              <button
                key={sid}
                onClick={() => scrollTo(sid)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                  activeSection === sid
                    ? 'bg-brand-blue/10 text-brand-blue dark:text-brand-blue'
                    : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                <Icon size={14} className="shrink-0" />
                <span className="truncate">{label}</span>
                {activeSection === sid && <ChevronRight size={12} className="ml-auto shrink-0" />}
              </button>
            ))}
          </nav>
        </aside>

        {/* Contenido con scroll */}
        <main className="flex-1 overflow-y-auto p-8 space-y-14">

          {/* ── 1. Identificación ── */}
          <section id="identificacion" ref={(el) => { sectionRefs.current['identificacion'] = el; }}>
            <SectionTitle>Identificación</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tipo de persona</label>
                <select value={form.tipoPersona} onChange={set('tipoPersona')} className={selectCls}>
                  <option value="">Seleccionar...</option>
                  <option value="JURIDICA">Persona jurídica</option>
                  <option value="NATURAL">Persona natural</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Tipo de documento</label>
                <select value={form.tipoDocumento} onChange={set('tipoDocumento')} className={selectCls}>
                  <option value="NIT">NIT</option>
                  <option value="CC">Cédula de ciudadanía (CC)</option>
                  <option value="CE">Cédula de extranjería (CE)</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="TI">Tarjeta de identidad</option>
                  <option value="RUT">RUT</option>
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input
                    label="Número de identificación *"
                    placeholder="900123456"
                    value={form.nit}
                    onChange={set('nit')}
                  />
                </div>
                {form.tipoDocumento === 'NIT' && (
                  <div className="w-20">
                    <Input
                      label="DV"
                      placeholder="7"
                      value={form.digitoVerificacion}
                      onChange={set('digitoVerificacion')}
                      maxLength={1}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4">
              <div>
                <label className={labelCls}>Estado del cliente</label>
                <select value={form.estado} onChange={set('estado')} className={selectCls}>
                  <option value="PROSPECTO">Prospecto</option>
                  <option value="ACTIVO">Activo</option>
                  <option value="SUSPENDIDO">Suspendido</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>
              </div>
            </div>
          </section>

          {/* ── 2. Ubicación ── */}
          <section id="ubicacion" ref={(el) => { sectionRefs.current['ubicacion'] = el; }}>
            <SectionTitle>Ubicación</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="País" placeholder="Colombia" value={form.pais} onChange={set('pais')} />
              <Input label="Departamento" placeholder="Cundinamarca" value={form.departamento} onChange={set('departamento')} />
              <Input label="Ciudad / municipio" placeholder="Bogotá" value={form.ciudad} onChange={set('ciudad')} />
              <Input label="Código postal" placeholder="110111" value={form.codigoPostal} onChange={set('codigoPostal')} />
              <div className="sm:col-span-2">
                <Input label="Dirección completa" placeholder="Cra 15 # 93-47, Oficina 302" value={form.direccion} onChange={set('direccion')} />
              </div>
            </div>
          </section>

          {/* ── 3. Contacto ── */}
          <section id="contacto" ref={(el) => { sectionRefs.current['contacto'] = el; }}>
            <SectionTitle>Contacto</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Correo electrónico *"
                type="email"
                placeholder="contacto@empresa.com"
                value={form.email}
                onChange={set('email')}
                helperText="Obligatorio para facturación electrónica"
              />
              <Input label="Contacto principal" placeholder="Nombre de la persona" value={form.contacto} onChange={set('contacto')} />
              <Input label="Teléfono principal" placeholder="+57 601 000 0000" value={form.telefono} onChange={set('telefono')} />
              <Input label="Teléfono alternativo" placeholder="+57 300 000 0000" value={form.telefonoAlternativo} onChange={set('telefonoAlternativo')} />
              <div className="sm:col-span-2">
                <Input label="Página web" placeholder="https://www.empresa.com" value={form.paginaWeb} onChange={set('paginaWeb')} />
              </div>
            </div>
          </section>

          {/* ── 4. Comercial ── */}
          <section id="comercial" ref={(el) => { sectionRefs.current['comercial'] = el; }}>
            <SectionTitle>Comercial</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Tipo de cliente</label>
                <select value={form.tipoCliente} onChange={set('tipoCliente')} className={selectCls}>
                  <option value="">Seleccionar...</option>
                  <option value="MINORISTA">Minorista</option>
                  <option value="MAYORISTA">Mayorista</option>
                  <option value="VIP">VIP</option>
                  <option value="DISTRIBUIDOR">Distribuidor</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Vendedor asignado</label>
                <select value={form.asesorId} onChange={set('asesorId')} className={selectCls}>
                  <option value="">Sin asignar</option>
                  {colaboradores.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Plan base (Edatia)</label>
                <select value={form.planBaseId} onChange={set('planBaseId')} className={selectCls}>
                  <option value="">Sin plan asignado</option>
                  {planes.map((p) => (
                    <option key={p.id} value={p.id}>{p.nombre}</option>
                  ))}
                </select>
              </div>
              <Input label="Lista de precios" placeholder="Lista 1 / Lista especial" value={form.listaPrecios} onChange={set('listaPrecios')} />
              <Input
                label="Cupo de crédito (COP)"
                type="number"
                placeholder="0"
                value={form.cupoCredito}
                onChange={set('cupoCredito')}
              />
              <div>
                <label className={labelCls}>Condiciones de pago</label>
                <select value={form.condicionesPago} onChange={set('condicionesPago')} className={selectCls}>
                  <option value="">Seleccionar...</option>
                  <option value="CONTADO">Contado</option>
                  <option value="CREDITO_15">Crédito 15 días</option>
                  <option value="CREDITO_30">Crédito 30 días</option>
                  <option value="CREDITO_45">Crédito 45 días</option>
                  <option value="CREDITO_60">Crédito 60 días</option>
                  <option value="CREDITO_90">Crédito 90 días</option>
                </select>
              </div>
            </div>
          </section>

          {/* ── 5. Tributario ── */}
          <section id="tributario" ref={(el) => { sectionRefs.current['tributario'] = el; }}>
            <SectionTitle>Información tributaria</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Régimen tributario</label>
                <select value={form.regimenTributario} onChange={set('regimenTributario')} className={selectCls}>
                  <option value="">Seleccionar...</option>
                  <option value="RESPONSABLE_IVA">Responsable de IVA</option>
                  <option value="NO_RESPONSABLE">No responsable de IVA</option>
                  <option value="SIMPLE">Régimen Simple de Tributación (SIMPLE)</option>
                  <option value="ESPECIAL">Régimen Especial</option>
                </select>
              </div>
              <Input
                label="Actividad económica (CIIU)"
                placeholder="Ej: 4711"
                value={form.actividadEconomica}
                onChange={set('actividadEconomica')}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Responsabilidades fiscales (RUT)"
                  placeholder="O-13, O-15, R-99-PN..."
                  value={form.responsabilidadFiscal}
                  onChange={set('responsabilidadFiscal')}
                  helperText="Códigos según RUT, separados por coma"
                />
              </div>
              <div className="sm:col-span-2 space-y-3 pt-1">
                <BoolRow label="Gran contribuyente" checked={form.granContribuyente} onChange={setBool('granContribuyente')} />
                <BoolRow label="Autorretenedor" checked={form.autorretenedor} onChange={setBool('autorretenedor')} />
                <BoolRow label="Agente de retención en la fuente" checked={form.agenteRetencion} onChange={setBool('agenteRetencion')} />
              </div>
            </div>
          </section>

          {/* ── 6. Financiero ── */}
          <section id="financiero" ref={(el) => { sectionRefs.current['financiero'] = el; }}>
            <SectionTitle>Información financiera</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Banco" placeholder="Bancolombia" value={form.banco} onChange={set('banco')} />
              <div>
                <label className={labelCls}>Tipo de cuenta</label>
                <select value={form.tipoCuenta} onChange={set('tipoCuenta')} className={selectCls}>
                  <option value="">Seleccionar...</option>
                  <option value="AHORROS">Ahorros</option>
                  <option value="CORRIENTE">Corriente</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <Input label="Número de cuenta" placeholder="123-456789-00" value={form.numeroCuenta} onChange={set('numeroCuenta')} />
              </div>
            </div>
          </section>

          {/* ── 7. Interno ── */}
          <section id="interno" ref={(el) => { sectionRefs.current['interno'] = el; }}>
            <SectionTitle>Datos internos</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Clasificación / segmento</label>
                <select value={form.segmento} onChange={set('segmento')} className={selectCls}>
                  <option value="">Sin clasificar</option>
                  <option value="A">Segmento A (alto valor)</option>
                  <option value="B">Segmento B (medio valor)</option>
                  <option value="C">Segmento C (bajo valor)</option>
                  <option value="STRATEGIC">Estratégico</option>
                </select>
              </div>
              {parsedObs ? (
                <div className="sm:col-span-2 space-y-6 bg-slate-50 dark:bg-navy-800/40 p-5 rounded-2xl border border-slate-200 dark:border-white/5">
                  <div className="flex items-center gap-2 text-indigo-500 font-semibold text-xs uppercase tracking-wider">
                    <Sparkles size={14} />
                    <span>Datos de Auto-Registro</span>
                  </div>

                  {parsedObs.representanteLegal && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Representante Legal:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400">Nombre:</span>{' '}
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {parsedObs.representanteLegal.nombre}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Cédula:</span>{' '}
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {parsedObs.representanteLegal.cedula}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Correo:</span>{' '}
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {parsedObs.representanteLegal.email}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400">Teléfono:</span>{' '}
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {parsedObs.representanteLegal.telefono}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {parsedObs.archivos && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Documentos Adjuntos:</h4>
                      <div className="flex flex-wrap gap-3">
                        {parsedObs.archivos.rut && (
                          <a
                            href={`${API_BASE_URL}/api/v1/manager/public-clientes/documento/${parsedObs.archivos.rut.split('/').pop()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-white/5 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 font-semibold transition-all"
                          >
                            <FileText size={14} />
                            <span>RUT</span>
                          </a>
                        )}
                        {parsedObs.archivos.cedula && (
                          <a
                            href={`${API_BASE_URL}/api/v1/manager/public-clientes/documento/${parsedObs.archivos.cedula.split('/').pop()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-white/5 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 font-semibold transition-all"
                          >
                            <FileText size={14} />
                            <span>Cédula</span>
                          </a>
                        )}
                        {parsedObs.archivos.camaraComercio && (
                          <a
                            href={`${API_BASE_URL}/api/v1/manager/public-clientes/documento/${parsedObs.archivos.camaraComercio.split('/').pop()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-navy-800 border border-slate-200 dark:border-white/5 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 font-semibold transition-all"
                          >
                            <FileText size={14} />
                            <span>Cámara de Comercio</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className={labelCls}>Notas Adicionales</label>
                    <textarea
                      value={parsedObs.notasInternas || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        const updated = {
                          ...parsedObs,
                          notasInternas: val,
                        };
                        setForm((f) => ({ ...f, observaciones: JSON.stringify(updated) }));
                      }}
                      rows={3}
                      placeholder="Escribe notas adicionales sobre este prospecto..."
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none"
                    />
                    <p className="text-[10px] text-amber-500 font-medium leading-relaxed">
                      * Este cliente se registró vía auto-servicio. Modificar estas notas guardará los datos estructurados sin alterar las rutas de sus archivos y datos de representación legal.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="sm:col-span-2">
                  <label className={labelCls}>Observaciones</label>
                  <textarea
                    value={form.observaciones}
                    onChange={set('observaciones')}
                    rows={4}
                    placeholder="Notas internas sobre el cliente, acuerdos especiales, historial relevante..."
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none"
                  />
                </div>
              )}
            </div>
          </section>

          {/* ── 8. Accesos ERP ── */}
          {isEdit && (
            <section id="erp" ref={(el) => { sectionRefs.current['erp'] = el; }}>
              <SectionTitle>Aprovisionamiento ERP</SectionTitle>
              
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-navy-800 dark:to-navy-800/80 rounded-2xl border border-indigo-100 dark:border-white/5 p-6 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                      Entorno de Trabajo ERP
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                      Crea o restablece las credenciales del administrador principal para este cliente. 
                      Al aprovisionar, el sistema creará automáticamente la Empresa en el ERP (con NIT <strong>{form.nit}</strong>) y le asignará este usuario raíz. El ERP limitará su acceso a los módulos incluidos en su <strong>Plan Base</strong>.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                  <Input
                    label="Usuario (Email corporativo)"
                    type="email"
                    placeholder="admin@empresa.com"
                    value={erpUsuario}
                    onChange={(e) => setErpUsuario(e.target.value)}
                  />
                  <Input
                    label="Contraseña"
                    type="text"
                    placeholder="Min 6 caracteres"
                    value={erpPassword}
                    onChange={(e) => setErpPassword(e.target.value)}
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleProvisionar}
                    disabled={provisionarMutation.isPending || !form.nit || form.estado !== 'ACTIVO'}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {provisionarMutation.isPending ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Key size={16} />
                    )}
                    {provisionarMutation.isPending ? 'Provisionando...' : 'Aprovisionar / Actualizar Credenciales'}
                  </button>
                  {form.estado !== 'ACTIVO' && (
                    <p className="text-[10px] text-amber-600 mt-2 font-medium">
                      * El cliente debe estar en estado ACTIVO para aprovisionar su entorno.
                    </p>
                  )}
                </div>

                {cliente?.empresa?.usuarios && cliente.empresa.usuarios.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-indigo-100 dark:border-white/5">
                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4">
                      Usuarios Activos en el ERP
                    </h4>
                    <div className="space-y-3">
                      {cliente.empresa.usuarios.map((u: any) => (
                        <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-white/60 dark:bg-navy-900 border border-indigo-50 dark:border-white/5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                              <User size={14} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-800 dark:text-white">
                                {u.nombre || u.usuario}
                              </p>
                              <p className="text-xs text-slate-500">{u.email}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Estás seguro de eliminar el usuario ${u.email} del ERP?`)) {
                                eliminarUsuarioErpMutation.mutate(u.id);
                              }
                            }}
                            disabled={eliminarUsuarioErpMutation.isPending}
                            title="Eliminar usuario"
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Spacer final */}
          <div className="h-24" />
        </main>
      </div>
    </div>
  );
}
