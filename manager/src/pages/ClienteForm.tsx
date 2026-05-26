import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Check, Building2, MapPin, Phone, Briefcase,
  Receipt, Landmark, SlidersHorizontal, ChevronRight, Key, ShieldCheck, User, Trash2, FileText, Sparkles,
  Star, Calendar, Clock, Percent, AlertCircle, Plus, Upload
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api, getApiError } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { cn, formatCOP } from '@/lib/utils';

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

// ─── Secciones nav (Obsoleto, usando tabs horizontales) ───────────────────────
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
const calcularDV = (nit: string): string => {
  if (!nit || isNaN(Number(nit.trim()))) return "";
  const tempNit = nit.trim();
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let sum = 0;
  const len = tempNit.length;
  for (let i = 0; i < len; i++) {
    const digit = Number(tempNit.charAt(len - 1 - i));
    sum += digit * weights[i];
  }
  const remainder = sum % 11;
  return remainder > 1 ? String(11 - remainder) : String(remainder);
};

const selectCls = 'w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-slate-200 focus:outline-none focus:border-brand-blue/60';
const labelCls  = 'text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1.5';
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

  // Estados del Formulario Principal
  const [form, setForm] = useState<FormData>(EMPTY);
  const [activeTab, setActiveTab] = useState<string>('principales');

  const [erpUsuario, setErpUsuario] = useState('');
  const [erpPassword, setErpPassword] = useState('');

  // ─── Estados para Campos del JSON de Observaciones (Auto-registro) ───
  // Representante Legal
  const [repNombre, setRepNombre] = useState('');
  const [repCedula, setRepCedula] = useState('');
  const [repEmail, setRepEmail] = useState('');
  const [repTelefono, setRepTelefono] = useState('');

  // Contactos Auxiliares
  const [tesoreriaNombre, setTesoreriaNombre] = useState('');
  const [tesoreriaEmail, setTesoreriaEmail] = useState('');
  const [tesoreriaTelefono, setTesoreriaTelefono] = useState('');

  const [contabilidadNombre, setContabilidadNombre] = useState('');
  const [contabilidadEmail, setContabilidadEmail] = useState('');
  const [contabilidadTelefono, setContabilidadTelefono] = useState('');

  const [rrhhNombre, setRrhhNombre] = useState('');
  const [rrhhEmail, setRrhhEmail] = useState('');
  const [rrhhTelefono, setRrhhTelefono] = useState('');

  const [facturacionNombre, setFacturacionNombre] = useState('');
  const [facturacionEmail, setFacturacionEmail] = useState('');
  const [facturacionTelefono, setFacturacionTelefono] = useState('');

  // Límite de usuarios y encuestas de satisfacción
  const [limiteUsuarios, setLimiteUsuarios] = useState<number>(5);
  const [encuestas, setEncuestas] = useState<any[]>([]);
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  // Estados para simular nueva encuesta
  const [surveyStars, setSurveyStars] = useState<number>(5);
  const [surveyComment, setSurveyComment] = useState<string>('');

  const [nombreComercial, setNombreComercial] = useState('');

  // Archivos adjuntos y notas
  const [archivos, setArchivos] = useState<any>(null);
  const [notasInternas, setNotasInternas] = useState('');
  
  const [uploadingFile, setUploadingFile] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleFileUpload = async (key: string, file: File) => {
    setUploadingFile((prev) => ({ ...prev, [key]: true }));
    setUploadProgress((prev) => ({ ...prev, [key]: 0 }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/manager/public-clientes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setUploadProgress((prev) => ({ ...prev, [key]: percent }));
        },
      });

      const data = res.data;
      setArchivos((prev: any) => ({
        ...(prev || {}),
        [key]: data.filepath,
        [`${key}Nombre`]: file.name
      }));
      toast.success('Archivo cargado correctamente');
    } catch (err) {
      toast.error(getApiError(err, 'Error al subir el archivo'));
    } finally {
      setUploadingFile((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleRemoveFile = (key: string) => {
    setArchivos((prev: any) => {
      if (!prev) return null;
      const next = { ...prev };
      delete next[key];
      delete next[`${key}Nombre`];
      return next;
    });
    toast.success('Archivo eliminado');
  };


  const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://api.edatia.com';

  // Cargar datos del cliente
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
  const { data: todosModulos = [] } = useQuery<any[]>({
    queryKey: ['manager', 'modulos'],
    queryFn: () => api.get('/manager/modulos').then((r) => r.data),
  });

  const asignarModuloMutation = useMutation({
    mutationFn: (moduloId: number) => api.post(`/manager/clientes/${id}/modulos`, { moduloId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'clientes', id] });
      toast.success('Módulo activado');
    },
    onError: (err: unknown) => {
      toast.error(getApiError(err, 'Error al activar módulo'));
    }
  });

  const desactivarModuloMutation = useMutation({
    mutationFn: (moduloId: number) => api.delete(`/manager/clientes/${id}/modulos/${moduloId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'clientes', id] });
      toast.success('Módulo desactivado');
    },
    onError: (err: unknown) => {
      toast.error(getApiError(err, 'Error al desactivar módulo'));
    }
  });

  // Efecto para mapear los campos cargados y el JSON en observaciones
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
        regimenTributario: (() => {
          const r = cliente.regimenTributario ?? '';
          if (r === 'RESPONSABLE_IVA' || r === '48' || r === 'NO_RESPONSABLE' || r === '49') return 'ORDINARIO';
          return r;
        })(),
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

      // Deserializar observaciones si contienen formato JSON
      try {
        if (cliente.observaciones && cliente.observaciones.trim().startsWith('{')) {
          const parsed = JSON.parse(cliente.observaciones);
          
          if (parsed.representanteLegal) {
            setRepNombre(parsed.representanteLegal.nombre ?? '');
            setRepCedula(parsed.representanteLegal.cedula ?? '');
            setRepEmail(parsed.representanteLegal.email ?? '');
            setRepTelefono(parsed.representanteLegal.telefono ?? '');
          } else {
            setRepNombre(''); setRepCedula(''); setRepEmail(''); setRepTelefono('');
          }

          if (parsed.contactosAuxiliares) {
            const aux = parsed.contactosAuxiliares;
            setTesoreriaNombre(aux.tesoreria?.nombre ?? '');
            setTesoreriaEmail(aux.tesoreria?.email ?? '');
            setTesoreriaTelefono(aux.tesoreria?.telefono ?? '');

            setContabilidadNombre(aux.contabilidad?.nombre ?? '');
            setContabilidadEmail(aux.contabilidad?.email ?? '');
            setContabilidadTelefono(aux.contabilidad?.telefono ?? '');

            setRrhhNombre(aux.rrhh?.nombre ?? '');
            setRrhhEmail(aux.rrhh?.email ?? '');
            setRrhhTelefono(aux.rrhh?.telefono ?? '');

            setFacturacionNombre(aux.facturacion?.nombre ?? '');
            setFacturacionEmail(aux.facturacion?.email ?? '');
            setFacturacionTelefono(aux.facturacion?.telefono ?? '');
          } else {
            // Vaciar auxiliares
            setTesoreriaNombre(''); setTesoreriaEmail(''); setTesoreriaTelefono('');
            setContabilidadNombre(''); setContabilidadEmail(''); setContabilidadTelefono('');
            setRrhhNombre(''); setRrhhEmail(''); setRrhhTelefono('');
            setFacturacionNombre(''); setFacturacionEmail(''); setFacturacionTelefono('');
          }

          setLimiteUsuarios(parsed.limiteUsuarios ?? 5);
          setEncuestas(parsed.encuestas ?? []);
          setNombreComercial(parsed.nombreComercial ?? '');
          setArchivos(parsed.archivos || null);
          setNotasInternas(parsed.notasInternas || '');
        } else {
          setNotasInternas(cliente.observaciones ?? '');
          setRepNombre(''); setRepCedula(''); setRepEmail(''); setRepTelefono('');
          setTesoreriaNombre(''); setTesoreriaEmail(''); setTesoreriaTelefono('');
          setContabilidadNombre(''); setContabilidadEmail(''); setContabilidadTelefono('');
          setRrhhNombre(''); setRrhhEmail(''); setRrhhTelefono('');
          setFacturacionNombre(''); setFacturacionEmail(''); setFacturacionTelefono('');
          setArchivos(null);
          setLimiteUsuarios(5);
          setEncuestas([]);
          setNombreComercial('');
        }
      } catch (e) {
        setNotasInternas(cliente.observaciones ?? '');
        setLimiteUsuarios(5);
        setEncuestas([]);
        setNombreComercial('');
      }
    }
  }, [cliente]);

  // Calcular DV automáticamente para NIT
  useEffect(() => {
    if (form.tipoDocumento === 'NIT' && form.nit) {
      const calculated = calcularDV(form.nit);
      setForm((f) => ({ ...f, digitoVerificacion: calculated }));
    } else if (form.tipoDocumento !== 'NIT') {
      setForm((f) => ({ ...f, digitoVerificacion: '' }));
    }
  }, [form.nit, form.tipoDocumento]);

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const setBool = (key: keyof FormData) => (v: boolean) =>
    setForm((f) => ({ ...f, [key]: v }));

  // Preparar payload enviando observaciones estructuradas en JSON
  const payload = () => {
    const observacionesObj = {
      representanteLegal: form.tipoPersona === 'JURIDICA' ? {
        nombre: repNombre,
        cedula: repCedula,
        email: repEmail,
        telefono: repTelefono,
      } : null,
      contactosAuxiliares: {
        tesoreria: { nombre: tesoreriaNombre, email: tesoreriaEmail, telefono: tesoreriaTelefono },
        contabilidad: { nombre: contabilidadNombre, email: contabilidadEmail, telefono: contabilidadTelefono },
        rrhh: { nombre: rrhhNombre, email: rrhhEmail, telefono: rrhhTelefono },
        facturacion: { nombre: facturacionNombre, email: facturacionEmail, telefono: facturacionTelefono },
      },
      archivos,
      notasInternas,
      limiteUsuarios,
      encuestas,
      nombreComercial,
    };

    return {
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
      contacto: form.tipoPersona === 'JURIDICA' ? repNombre : form.contacto || undefined,
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
      observaciones: JSON.stringify(observacionesObj),
    };
  };

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

  if (isEdit && isLoading) {
    return <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-sm">Cargando cliente...</div>;
  }

  // Definición de Tabs Horizontales
  const TABS = [
    { id: 'principales', label: 'Datos de la Empresa', icon: Building2 },
    { id: 'representante', label: 'Representante Legal', icon: User, hiddenIfNatural: true },
    { id: 'contactos', label: 'Datos de Contacto', icon: Phone },
    { id: 'usuarios_erp', label: 'Usuarios ERP', icon: Key },
    { id: 'planes_comercial', label: 'Planes e Historial', icon: Briefcase },
    { id: 'documentos', label: 'Documentos', icon: FileText },
  ];

  return (
    <div className="flex flex-col h-full -m-6 bg-slate-50 dark:bg-navy-950">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-20 bg-white dark:bg-navy-900 border-b border-gray-200 dark:border-white/5 px-6 py-3.5 flex items-center gap-4 shadow-sm dark:shadow-none">
        <button
          onClick={() => navigate('/clientes')}
          title="Volver"
          className="p-2 rounded-lg text-gray-400 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Building2 size={18} className="text-brand-blue shrink-0" />
          <span className={cn(
            "text-base font-bold truncate",
            form.nombre ? "text-gray-900 dark:text-white" : "text-gray-300 dark:text-slate-500"
          )}>
            {form.nombre || 'Nombre de la empresa o razón social *'}
          </span>
        </div>

        <button
          onClick={handleSave}
          disabled={isPending || !form.nit || !form.nombre}
          title="Guardar Cliente"
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-brand text-white text-xs font-bold shadow-glow-brand hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check size={14} />
          Guardar
        </button>
      </div>

      {/* ── Sub-header con Tablas Horizontales (Estilo ERP) ── */}
      <div className="px-8 pt-4 border-b border-gray-200 dark:border-white/5 bg-white dark:bg-navy-900">
        <div className="flex flex-wrap gap-2 pb-3.5">
          {TABS.filter(t => !(t.hiddenIfNatural && form.tipoPersona === 'NATURAL')).map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-5 py-2.5 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all ${
                  isActive
                    ? 'bg-white dark:bg-navy-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-white/10 shadow-sm shadow-indigo-100/10'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              >
                <t.icon size={13} className={isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Tab Content Area ── */}
      <div className="flex-1 overflow-y-auto p-8 max-w-5xl w-full mx-auto space-y-6">

        {/* ─── TAB 1: DATOS PRINCIPALES ─── */}
        {activeTab === 'principales' && (
          <div className="space-y-6">
            {/* Card 1: Identificación */}
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">
                Información Principal
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <div className="w-16 shrink-0">
                    <Input
                      label="DV"
                      placeholder="-"
                      value={form.digitoVerificacion}
                      onChange={set('digitoVerificacion')}
                      maxLength={1}
                      readOnly={form.tipoDocumento === 'NIT'}
                      className={form.tipoDocumento === 'NIT' ? "bg-slate-50 dark:bg-navy-900/60 font-semibold select-none cursor-not-allowed" : ""}
                    />
                  </div>
                </div>
                
                <div className="sm:col-span-3">
                  <Input
                    label="Nombre o Razón Social *"
                    placeholder="Nombre Completo o Razón Social de la empresa"
                    value={form.nombre}
                    onChange={set('nombre')}
                  />
                </div>
                <div className="sm:col-span-3">
                  <Input
                    label="Nombre comercial"
                    placeholder="Nombre de establecimiento o fantasía"
                    value={nombreComercial}
                    onChange={(e) => setNombreComercial(e.target.value)}
                  />
                </div>

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
            </div>

            {/* Card 2: Ubicación */}
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">
                Ubicación
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="País" placeholder="Colombia" value={form.pais} onChange={set('pais')} />
                <Input label="Departamento" placeholder="Cundinamarca" value={form.departamento} onChange={set('departamento')} />
                <Input label="Ciudad / municipio" placeholder="Bogotá" value={form.ciudad} onChange={set('ciudad')} />
                <Input label="Código postal" placeholder="110111" value={form.codigoPostal} onChange={set('codigoPostal')} />
                <div className="sm:col-span-2">
                  <Input label="Dirección completa" placeholder="Cra 15 # 93-47, Oficina 302" value={form.direccion} onChange={set('direccion')} />
                </div>
              </div>
            </div>

            {/* Card 3: Comercial */}
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">
                Configuración Comercial
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                <Input label="Lista de precios" placeholder="Lista 1" value={form.listaPrecios} onChange={set('listaPrecios')} />
                <Input label="Cupo de crédito (COP)" type="number" placeholder="0" value={form.cupoCredito} onChange={set('cupoCredito')} />
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
            </div>

            {/* Card 4: Tributario */}
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">
                Información Tributaria (DIAN)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Régimen fiscal *</label>
                  <select value={form.regimenTributario} onChange={set('regimenTributario')} className={selectCls}>
                    <option value="">Seleccionar...</option>
                    <option value="ORDINARIO">Régimen Ordinario</option>
                    <option value="SIMPLE">Régimen Simple</option>
                    <option value="ESPECIAL">Régimen Tributario Especial</option>
                    <option value="GRAN_CONTRIBUYENTE">Gran Contribuyente</option>
                    <option value="GRAN_CONTRIBUYENTE_AUTORRETENEDOR">Gran Contribuyente Auto Retenedor</option>
                  </select>
                </div>
                <Input label="Actividad económica (CIIU)" placeholder="Ej: 4711" value={form.actividadEconomica} onChange={set('actividadEconomica')} />
                
                <div className="sm:col-span-2 space-y-3 pt-2">
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Responsabilidades tributarias DIAN
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 border border-slate-200 dark:border-white/5 rounded-xl p-4 bg-slate-50 dark:bg-navy-800">
                    {[
                      { code: 'O-13', label: 'O-13 — Gran contribuyente' },
                      { code: 'O-15', label: 'O-15 — Autorretenedor' },
                      { code: 'O-23', label: 'O-23 — Agente de retención en la fuente' },
                      { code: 'O-47', label: 'O-47 — Régimen simple de tributación' },
                      { code: '05', label: '05 — Impuesto sobre la renta' },
                      { code: '07', label: '07 — Retención en la fuente' },
                      { code: '14', label: '14 — Informante de exógena' },
                      { code: '22', label: '22 — Obligado a cumplir deberes formales a nombre de terceros' },
                      { code: '42', label: '42 — Obligado a llevar contabilidad' },
                      { code: '48', label: '48 — Responsable de IVA' },
                      { code: '49', label: '49 — No responsable de IVA' },
                      { code: 'R-99-PN', label: 'R-99-PN — No aplica — Otros' }
                    ].map((r) => {
                      const isChecked = (form.responsabilidadFiscal ?? '')
                        .split(',')
                        .map(s => s.trim())
                        .includes(r.code);
                      return (
                        <label key={r.code} className="flex items-start gap-3 cursor-pointer select-none py-1 group">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              const currentArray = form.responsabilidadFiscal
                                ? form.responsabilidadFiscal.split(',').map(s => s.trim()).filter(Boolean)
                                : [];
                              let nextArray: string[];
                              if (currentArray.includes(r.code)) {
                                nextArray = currentArray.filter(c => c !== r.code);
                              } else {
                                nextArray = [...currentArray, r.code];
                              }
                              const nextString = nextArray.join(',');
                              setForm((f) => ({
                                ...f,
                                responsabilidadFiscal: nextString,
                                granContribuyente: nextArray.includes('O-13'),
                                autorretenedor: nextArray.includes('O-15'),
                                agenteRetencion: nextArray.includes('O-23')
                              }));
                            }}
                            className="w-4 h-4 rounded text-indigo-600 dark:text-indigo-400 accent-indigo-600 mt-0.5 border-slate-300 dark:border-white/10"
                          />
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                            {r.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-tight">
                    Seleccione las responsabilidades fiscales aplicables según el RUT del tercero.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 5: Financiero */}
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2">
                Información Bancaria
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input label="Banco" placeholder="Bancolombia" value={form.banco} onChange={set('banco')} />
                <div>
                  <label className={labelCls}>Tipo de cuenta</label>
                  <select value={form.tipoCuenta} onChange={set('tipoCuenta')} className={selectCls}>
                    <option value="">Seleccionar...</option>
                    <option value="AHORROS">Ahorros</option>
                    <option value="CORRIENTE">Corriente</option>
                  </select>
                </div>
                <Input label="Número de cuenta" placeholder="123-456789-00" value={form.numeroCuenta} onChange={set('numeroCuenta')} />
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: REPRESENTANTE LEGAL ─── */}
        {activeTab === 'representante' && form.tipoPersona === 'JURIDICA' && (
          <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-6 shadow-sm animate-fade-in">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <User size={16} className="text-indigo-500" />
                Datos del Representante Legal
              </h3>
              <p className="text-xs text-slate-500">
                Información del firmante autorizado de la empresa (requerido para contratos y auditorías).
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre completo del representante"
                placeholder="Ej: Diego Ortiz"
                value={repNombre}
                onChange={(e) => setRepNombre(e.target.value)}
              />
              <Input
                label="Cédula / Documento de identificación"
                placeholder="Ej: 1018222333"
                value={repCedula}
                onChange={(e) => setRepCedula(e.target.value)}
              />
              <Input
                label="Correo electrónico corporativo"
                type="email"
                placeholder="representante@empresa.com"
                value={repEmail}
                onChange={(e) => setRepEmail(e.target.value)}
              />
              <Input
                label="Teléfono de contacto representante"
                placeholder="Ej: +57 300 123 4567"
                value={repTelefono}
                onChange={(e) => setRepTelefono(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ─── TAB 3: DATOS DE CONTACTO ─── */}
        {activeTab === 'contactos' && (
          <div className="space-y-6 animate-fade-in">
            {/* Aviso para Persona Natural */}
            {form.tipoPersona === 'NATURAL' && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/10 rounded-2xl p-4 flex items-start gap-3">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-amber-800 dark:text-amber-455 uppercase">Información para Personas Naturales</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-500/80 mt-1">
                    Para personas naturales, los datos de contacto corporativos, tesorería, contabilidad y facturación electrónica corresponden por defecto a los mismos de la empresa. Puedes personalizarlos aquí si difieren.
                  </p>
                </div>
              </div>
            )}

            {/* Card 1: Contacto Principal */}
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5 pb-2 flex items-center gap-1.5">
                <Phone size={14} className="text-indigo-500" />
                Contacto Principal y Corporativo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Nombre del contacto principal" placeholder="Ej: John Doe" value={form.contacto} onChange={set('contacto')} />
                <Input label="Correo electrónico principal *" type="email" placeholder="contacto@empresa.com" value={form.email} onChange={set('email')} helperText="Obligatorio para facturación electrónica" />
                <Input label="Teléfono principal" placeholder="+57 601 000 0000" value={form.telefono} onChange={set('telefono')} />
                <Input label="Teléfono alternativo" placeholder="+57 300 000 0000" value={form.telefonoAlternativo} onChange={set('telefonoAlternativo')} />
                <div className="sm:col-span-2">
                  <Input label="Página web" placeholder="https://www.empresa.com" value={form.paginaWeb} onChange={set('paginaWeb')} />
                </div>
              </div>
            </div>

            {/* Contactos Auxiliares y Facturación */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Facturación Electrónica */}
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-3 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-1">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Facturación Electrónica
                  </h4>
                  {form.tipoPersona === 'JURIDICA' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!repNombre) {
                          toast.error('No hay datos del Representante Legal registrados');
                          return;
                        }
                        setFacturacionNombre(repNombre);
                        setFacturacionEmail(repEmail);
                        setFacturacionTelefono(repTelefono);
                        toast.success('Datos copiados del Representante Legal');
                      }}
                      className="text-[10px] font-bold text-indigo-650 hover:text-indigo-750 dark:text-indigo-400 hover:underline"
                    >
                      Copiar del Representante
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Nombre / Encargado</label>
                    <input
                      type="text"
                      placeholder="Nombre de facturación"
                      value={facturacionNombre}
                      onChange={(e) => setFacturacionNombre(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800 text-xs focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Email Receptor de Facturas</label>
                    <input
                      type="email"
                      placeholder="Email de facturación"
                      value={facturacionEmail}
                      onChange={(e) => setFacturacionEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800 text-xs focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Teléfono de Contacto</label>
                    <input
                      type="text"
                      placeholder="Teléfono de facturación"
                      value={facturacionTelefono}
                      onChange={(e) => setFacturacionTelefono(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800 text-xs focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Tesorería */}
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-1">
                  Contacto de Tesorería
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Nombre / Encargado</label>
                    <input
                      type="text"
                      placeholder="Nombre del tesorero"
                      value={tesoreriaNombre}
                      onChange={(e) => setTesoreriaNombre(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800 text-xs focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Email de contacto</label>
                    <input
                      type="email"
                      placeholder="Email de tesorería"
                      value={tesoreriaEmail}
                      onChange={(e) => setTesoreriaEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800 text-xs focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Teléfono de contacto</label>
                    <input
                      type="text"
                      placeholder="Teléfono de tesorería"
                      value={tesoreriaTelefono}
                      onChange={(e) => setTesoreriaTelefono(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800 text-xs focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Contabilidad */}
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-1">
                  Contacto de Contabilidad
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Nombre / Encargado</label>
                    <input
                      type="text"
                      placeholder="Nombre del contador"
                      value={contabilidadNombre}
                      onChange={(e) => setContabilidadNombre(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800 text-xs focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Email de contacto</label>
                    <input
                      type="email"
                      placeholder="Email de contabilidad"
                      value={contabilidadEmail}
                      onChange={(e) => setContabilidadEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800 text-xs focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Teléfono de contacto</label>
                    <input
                      type="text"
                      placeholder="Teléfono de contabilidad"
                      value={contabilidadTelefono}
                      onChange={(e) => setContabilidadTelefono(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800 text-xs focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>
              </div>

              {/* Recursos Humanos (RRHH) */}
              <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-5 space-y-3 shadow-sm">
                <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-1">
                  Contacto de Recursos Humanos (RRHH)
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Nombre / Encargado</label>
                    <input
                      type="text"
                      placeholder="Nombre del encargado RRHH"
                      value={rrhhNombre}
                      onChange={(e) => setRrhhNombre(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800 text-xs focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Email de contacto</label>
                    <input
                      type="email"
                      placeholder="Email de RRHH"
                      value={rrhhEmail}
                      onChange={(e) => setRrhhEmail(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800 text-xs focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Teléfono de contacto</label>
                    <input
                      type="text"
                      placeholder="Teléfono de RRHH"
                      value={rrhhTelefono}
                      onChange={(e) => setRrhhTelefono(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800 text-xs focus:outline-none focus:border-brand-blue"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 4: USUARIOS ERP ─── */}
        {activeTab === 'usuarios_erp' && (
          <div className="space-y-6 animate-fade-in">
            {/* Card de Configuración de Límite de Usuarios */}
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2 mb-4 flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-indigo-500" />
                Límite de Usuarios en el Portal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div>
                  <Input
                    label="Límite de usuarios autorizados *"
                    type="number"
                    min={1}
                    value={limiteUsuarios}
                    onChange={(e) => setLimiteUsuarios(Number(e.target.value) || 5)}
                    helperText="Número máximo de usuarios permitidos en el portal ERP para este cliente."
                  />
                </div>

                {/* Medidor de progreso HSL */}
                {isEdit && (
                  <div className="bg-slate-50 dark:bg-navy-800/40 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">
                      <span>Uso de Licencias</span>
                      <span className="text-slate-800 dark:text-white">
                        {cliente?.empresa?.usuarios?.length || 0} / {limiteUsuarios} Usuarios
                      </span>
                    </div>
                    {/* Barra de Progreso */}
                    {(() => {
                      const totalUsers = cliente?.empresa?.usuarios?.length || 0;
                      const pct = Math.min(100, Math.round((totalUsers / (limiteUsuarios || 1)) * 100));
                      const progressColor = pct >= 100 
                        ? 'bg-rose-500 shadow-rose-500/20' 
                        : pct >= 80 
                          ? 'bg-amber-500 shadow-amber-500/20' 
                          : 'bg-indigo-600 shadow-indigo-650/20';
                      return (
                        <div className="w-full bg-slate-200 dark:bg-navy-700 h-2.5 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      );
                    })()}
                    <p className="text-[10px] text-slate-400 mt-2">
                      * El cliente no podrá registrar más usuarios en su ERP si alcanza este límite.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Aprovisionamiento ERP */}
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-navy-850 dark:to-navy-850/80 rounded-2xl border border-indigo-100 dark:border-white/5 p-6 space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1">
                    Aprovisionamiento de Entorno ERP
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-xl">
                    Crea o actualiza las credenciales del inquilino ERP para este cliente. 
                    Al activarlo, se provisionará su base de datos con NIT <strong>{form.nit}</strong> asignándole este usuario administrador raíz.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <Input
                  label="Usuario Admin (Email)"
                  type="email"
                  placeholder="admin@empresa.com"
                  value={erpUsuario}
                  onChange={(e) => setErpUsuario(e.target.value)}
                />
                <Input
                  label="Nueva Contraseña"
                  type="text"
                  placeholder="Mínimo 6 caracteres"
                  value={erpPassword}
                  onChange={(e) => setErpPassword(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleProvisionar}
                  disabled={provisionarMutation.isPending || !form.nit || form.estado !== 'ACTIVO'}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed animate-fade-in"
                >
                  {provisionarMutation.isPending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Key size={14} />
                  )}
                  {provisionarMutation.isPending ? 'Aprovisionando...' : 'Aprovisionar / Actualizar Inquilino'}
                </button>
                {form.estado !== 'ACTIVO' && (
                  <p className="text-[10px] text-amber-600 mt-2 font-medium">
                    * El cliente debe estar en estado ACTIVO para poder aprovisionar su entorno.
                  </p>
                )}
              </div>

              {isEdit && cliente?.empresa?.usuarios && cliente.empresa.usuarios.length > 0 && (
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
                          type="button"
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
          </div>
        )}

        {/* ─── TAB 5: PLANES E HISTORIAL ─── */}
        {activeTab === 'planes_comercial' && (
          <div className="space-y-6 animate-fade-in">
            {/* Resumen Comercial */}
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2 mb-4 flex items-center gap-1.5">
                <Briefcase size={14} className="text-indigo-500" />
                Resumen de Plan y Antigüedad
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Antigüedad */}
                <div className="p-4 bg-slate-50 dark:bg-navy-800/40 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Antigüedad Comercial</p>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-0.5">
                      {isEdit && cliente?.createdAt ? (
                        (() => {
                          const created = new Date(cliente.createdAt);
                          const now = new Date();
                          const diffTime = Math.abs(now.getTime() - created.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                          if (diffDays < 30) return `${diffDays} días`;
                          const months = Math.floor(diffDays / 30);
                          const remDays = diffDays % 30;
                          return `${months} ${months === 1 ? 'mes' : 'meses'} y ${remDays} ${remDays === 1 ? 'día' : 'días'}`;
                        })()
                      ) : (
                        'Prospecto Nuevo'
                      )}
                    </p>
                  </div>
                </div>

                {/* Plan Base */}
                <div className="p-4 bg-slate-50 dark:bg-navy-800/40 rounded-xl border border-slate-100 dark:border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <Building2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wide">Plan Base Asignado</p>
                    <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-0.5">
                      {isEdit && cliente?.planBase ? cliente.planBase.nombre : 'Sin plan base'}
                    </p>
                  </div>
                </div>

                {/* Resumen Cobro Mensual */}
                <div className="p-4 bg-gradient-to-br from-indigo-50/50 to-indigo-100/10 dark:from-navy-800/60 dark:to-navy-800/40 rounded-xl border border-indigo-100/50 dark:border-white/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/20">
                    <Percent size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-bold tracking-wide">Facturación Mensual</p>
                    <div className="mt-0.5 flex flex-wrap items-baseline gap-1.5">
                      {(() => {
                        // Calcular suma mensual
                        let basePrice = 0;
                        if (isEdit && cliente?.planBase) {
                          basePrice = Number(cliente.planBase.precioBase) || 0;
                        }
                        const modulesPrice = isEdit && cliente?.modulosActivos?.reduce((acc: number, ma: any) => {
                          if (!ma.activo) return acc;
                          const price = ma.precioNegociado !== null ? Number(ma.precioNegociado) : Number(ma.modulo.precioAnual);
                          return acc + (price / 12);
                        }, 0) || 0;
                        const subtotal = basePrice + modulesPrice;

                        // Verificar si tiene descuento por encuesta mensual activa
                        const lastSurvey = encuestas[encuestas.length - 1];
                        const hasDiscount = lastSurvey && new Date().getMonth() === new Date(lastSurvey.fecha).getMonth();
                        const discount = hasDiscount ? subtotal * 0.1 : 0;
                        const total = subtotal - discount;

                        return (
                          <>
                            <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                              {formatCOP(Math.round(total))}
                            </span>
                            {hasDiscount && (
                              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-500/15">
                                -10% DTO
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Módulos de Software Habilitados */}
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
              <div>
                <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-1">
                  Módulos de Software Contratados
                </h3>
                <p className="text-xs text-slate-500">
                  Activa o desactiva módulos de software específicos para la base de datos ERP del cliente.
                </p>
              </div>

              {todosModulos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {todosModulos.map((m: any) => {
                    const planClienteActivo = isEdit && cliente?.modulosActivos?.find(
                      (ma: any) => ma.moduloId === m.id && ma.activo
                    );
                    const isActive = !!planClienteActivo;
                    const precioActual = planClienteActivo?.precioNegociado ?? m.precioAnual;

                    return (
                      <div
                        key={m.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border transition-all",
                          isActive
                            ? "bg-indigo-50/30 dark:bg-indigo-950/15 border-indigo-150 dark:border-indigo-500/20"
                            : "bg-white dark:bg-navy-900 border-slate-200 dark:border-white/5 opacity-70"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">📦</span>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">
                              {m.nombre}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatCOP(m.precioAnual)}/año
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isActive && (
                            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded">
                              Activo
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              if (!isEdit) {
                                toast.error('Guarda el cliente primero para poder gestionar sus módulos');
                                return;
                              }
                              if (isActive) {
                                if (window.confirm(`¿Seguro que deseas desactivar el módulo ${m.nombre}?`)) {
                                  desactivarModuloMutation.mutate(m.id);
                                }
                              } else {
                                asignarModuloMutation.mutate(m.id);
                              }
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                              isActive
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-navy-800 dark:hover:bg-navy-700 dark:text-slate-300"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                            )}
                          >
                            {isActive ? 'Desactivar' : 'Activar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No hay módulos de software disponibles en la plataforma.</p>
              )}
            </div>

            {/* Sección de Encuestas de Satisfacción */}
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-2">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-0.5">
                    Encuestas de Satisfacción Mensual
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mapeo e historial de encuestas. Si realiza la encuesta mensual, obtiene un <strong>10% de descuento</strong> en el cobro.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSurveyModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-brand text-white text-xs font-bold rounded-lg shadow-sm hover:opacity-90 transition-all"
                >
                  <Plus size={12} />
                  Simular Encuesta
                </button>
              </div>

              {encuestas.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-white/5">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-navy-800/80 text-slate-500 font-extrabold uppercase tracking-wider">
                        <th className="p-3">Fecha</th>
                        <th className="p-3">Calificación</th>
                        <th className="p-3">Comentario</th>
                        <th className="p-3 text-right">Descuento</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-slate-700 dark:text-slate-300">
                      {encuestas.map((e, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-navy-900/50">
                          <td className="p-3 font-semibold whitespace-nowrap">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Calendar size={12} />
                              {e.fecha}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={12}
                                  className={i < e.calificacion ? "fill-amber-400 text-amber-400" : "text-slate-300 dark:text-slate-650"}
                                />
                              ))}
                            </span>
                          </td>
                          <td className="p-3 max-w-xs truncate" title={e.comentario}>
                            {e.comentario || <span className="italic text-slate-400">Sin comentarios</span>}
                          </td>
                          <td className="p-3 text-right font-bold text-emerald-650 dark:text-emerald-450 whitespace-nowrap">
                            {e.descuentoAplicado || '10%'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-50/50 dark:bg-navy-800/10 rounded-xl border border-dashed border-slate-200 dark:border-white/5">
                  <p className="text-xs text-slate-450 italic">
                    No se registran encuestas de satisfacción para este cliente.
                  </p>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                    * El cliente obtendrá 10% de descuento inmediato en su facturación mensual al realizar su encuesta.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 6: DOCUMENTOS ─── */}
        {activeTab === 'documentos' && (
          <div className="space-y-6 animate-fade-in">
            {/* Visualización y Gestión de Documentos Adjuntos */}
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-white/5 pb-2 flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-500" />
                Documentación y Archivos Adjuntos
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  { key: 'rut', title: 'RUT', desc: 'Registro Único Tributario en PDF o imagen.' },
                  { key: 'camaraComercio', title: 'Cámara de Comercio', desc: 'Certificado de existencia legal actualizado (menor a 30 días).' },
                  { key: 'cedula', title: 'Cédula de Identidad', desc: 'Cédula de ciudadanía o extranjería (titular o rep. legal).' },
                  { key: 'certificacionBancaria', title: 'Certificación Bancaria', desc: 'Certificado oficial de la cuenta bancaria del tercero.' },
                  { key: 'contrato', title: 'Contrato', desc: 'Contrato de adhesión o prestación de servicios firmado.' },
                  { key: 'otros', title: 'Otros Documentos', desc: 'Soportes adicionales, cotizaciones externas u otros archivos.' }
                ].map((doc) => {
                  const isUploaded = archivos && archivos[doc.key];
                  const isUploading = uploadingFile[doc.key];
                  const progress = uploadProgress[doc.key] || 0;

                  return (
                    <div key={doc.key} className="p-4 bg-slate-50 dark:bg-navy-800/40 border border-slate-200 dark:border-white/5 rounded-2xl flex flex-col justify-between min-h-[170px] shadow-sm">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">{doc.title}</h4>
                          {isUploaded && <Check size={16} className="text-emerald-500 shrink-0" />}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal">{doc.desc}</p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-white/5">
                        {isUploading ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[9px] text-indigo-650 dark:text-indigo-400 font-bold">
                              <span>Subiendo...</span>
                              <span>{progress}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 dark:bg-navy-700 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        ) : isUploaded ? (
                          <div className="space-y-2">
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-navy-900/60 p-2 rounded-xl flex items-center justify-between gap-1.5 border border-slate-200/50 dark:border-white/5">
                              <span className="truncate max-w-[150px] font-semibold">{archivos[`${doc.key}Nombre`] || 'archivo_adjunto'}</span>
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={`${API_BASE_URL}/api/v1/manager/public-clientes/documento/${archivos[doc.key].split('/').pop()}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 text-center py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[11px] font-bold transition-all"
                              >
                                Descargar
                              </a>
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(doc.key)}
                                className="px-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-650 rounded-lg text-xs transition-colors flex items-center justify-center"
                                title="Eliminar archivo"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 text-xs text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-navy-800 cursor-pointer font-bold shadow-xs transition-colors border-dashed">
                            <Upload size={14} className="text-slate-400" />
                            <span>Adjuntar archivo</span>
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(doc.key, file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notas Internas */}
            <div className="bg-white dark:bg-navy-900 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-3 shadow-sm">
              <label className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider block mb-1">
                Observaciones y Notas Internas
              </label>
              <textarea
                value={notasInternas}
                onChange={(e) => setNotasInternas(e.target.value)}
                rows={4}
                placeholder="Añadir notas internas, acuerdos específicos, historial comercial..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none"
              />
            </div>
          </div>
        )}

      </div>

      {/* ─── MODAL DE SIMULACIÓN DE ENCUESTA DE SATISFACCIÓN ─── */}
      {showSurveyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-navy-800 rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-2.5">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wide flex items-center gap-1.5">
                <Sparkles size={16} className="text-indigo-500" />
                Registrar Encuesta de Satisfacción
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowSurveyModal(false);
                  setSurveyComment('');
                  setSurveyStars(5);
                }}
                className="text-slate-400 hover:text-slate-650 dark:text-slate-500 dark:hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Calificación de Servicio (Estrellas)</label>
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => {
                    const rating = i + 1;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSurveyStars(rating)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          size={24}
                          className={rating <= surveyStars ? "fill-amber-400 text-amber-400" : "text-slate-350 dark:text-slate-600"}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Comentario del Cliente</label>
                <textarea
                  value={surveyComment}
                  onChange={(e) => setSurveyComment(e.target.value)}
                  rows={3}
                  placeholder="Comentarios adicionales o sugerencias de mejora..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-800 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none"
                />
              </div>

              <div className="bg-slate-50 dark:bg-navy-900/50 p-3 rounded-xl border border-slate-100 dark:border-white/5 text-[11px] text-slate-500 flex items-start gap-2">
                <AlertCircle size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                <p>
                  Al guardar, se agregará un descuento del <strong>10%</strong> para el período mensual actual de forma simulada.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  setShowSurveyModal(false);
                  setSurveyComment('');
                  setSurveyStars(5);
                }}
                className="px-4 py-2 border border-slate-200 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-navy-900 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const newSurvey = {
                    fecha: new Date().toISOString().split('T')[0],
                    calificacion: surveyStars,
                    comentario: surveyComment.trim(),
                    descuentoAplicado: '10%'
                  };
                  setEncuestas(prev => [...prev, newSurvey]);
                  setShowSurveyModal(false);
                  setSurveyComment('');
                  setSurveyStars(5);
                  toast.success('Encuesta agregada. No olvides guardar el cliente para guardar permanentemente.');
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Agregar Encuesta
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

