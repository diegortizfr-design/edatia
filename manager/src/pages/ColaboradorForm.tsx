import { useState, useEffect, KeyboardEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Check,
  Plus,
  X,
  Loader2,
  Lock,
  User,
  Phone,
  Briefcase,
  GraduationCap,
  Building2,
  Wrench,
  Shield,
  CreditCard,
  AlertTriangle,
  FileText,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface PerfilCargo {
  id: number;
  nombre: string;
}

interface IdiomaRow {
  idioma: string;
  nivel: string;
}

interface FormState {
  // Acceso al sistema
  email: string;
  password: string;
  rol: string;
  // Datos personales
  nombre: string;
  tipoDocumento: string;
  numeroDocumento: string;
  fechaNacimiento: string;
  sexo: string;
  nacionalidad: string;
  estadoCivil: string;
  // Contacto
  telefonoPersonal: string;
  emailPersonal: string;
  direccion: string;
  ciudad: string;
  pais: string;
  // Laboral
  cargo: string;
  area: string;
  tipoContrato: string;
  fechaIngreso: string;
  salario: string;
  jornadaLaboral: string;
  jefeDirecto: string;
  telefonoCorporativo: string;
  // Formación académica
  nivelEducativo: string;
  titulo: string;
  institucion: string;
  anoGraduacion: string;
  // Experiencia laboral
  empresaAnterior: string;
  cargoDesempenado: string;
  tiempoTrabajado: string;
  funcionesPrincipales: string;
  // Habilidades
  habilidadesTecnicas: string[];
  habilidadesTecnicasInput: string;
  habilidadesBlandas: string[];
  habilidadesBlandasInput: string;
  idiomas: IdiomaRow[];
  // Seguridad social
  eps: string;
  fondoPension: string;
  arl: string;
  cajaCompensacion: string;
  // Financiero
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  // Emergencia
  contactoEmergenciaNombre: string;
  contactoEmergenciaRelacion: string;
  contactoEmergenciaTelefono: string;
  // Documentación legal
  cedula: string;
  hojaDeVida: string;
}

const ROLES = ['ADMIN', 'COMERCIAL', 'COORDINACION', 'OPERACION'];
const TIPOS_DOCUMENTO = ['Cédula de ciudadanía', 'Cédula de extranjería', 'Pasaporte', 'NIT'];
const SEXOS = ['Masculino', 'Femenino', 'Otro', 'Prefiero no indicar'];
const ESTADOS_CIVILES = ['Soltero/a', 'Casado/a', 'Unión libre', 'Divorciado/a', 'Viudo/a'];
const TIPOS_CONTRATO = ['Término fijo', 'Término indefinido', 'Prestación de servicios', 'Aprendizaje', 'Obra o labor'];
const JORNADAS = ['Completa', 'Medio tiempo', 'Por horas', 'Flexible'];
const NIVELES_EDUCATIVOS = ['Bachiller', 'Técnico', 'Tecnólogo', 'Profesional', 'Especialización', 'Maestría', 'Doctorado'];
const NIVELES_IDIOMA = ['Básico', 'Intermedio', 'Avanzado', 'Nativo'];
const TIPOS_CUENTA = ['Ahorros', 'Corriente'];

const SECTIONS = [
  { id: 'acceso', label: 'Acceso al Sistema', icon: Lock },
  { id: 'personal', label: 'Datos Personales', icon: User },
  { id: 'contacto', label: 'Contacto', icon: Phone },
  { id: 'laboral', label: 'Info Laboral', icon: Briefcase },
  { id: 'formacion', label: 'Formación', icon: GraduationCap },
  { id: 'experiencia', label: 'Experiencia', icon: Building2 },
  { id: 'habilidades', label: 'Habilidades', icon: Wrench },
  { id: 'seguridad', label: 'Seguridad Social', icon: Shield },
  { id: 'financiero', label: 'Info Financiera', icon: CreditCard },
  { id: 'emergencia', label: 'Emergencia', icon: AlertTriangle },
  { id: 'documentos', label: 'Documentación', icon: FileText },
];

function calcularEdad(fechaNacimiento: string): string {
  if (!fechaNacimiento) return '';
  const birth = new Date(fechaNacimiento);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? String(age) : '';
}

const defaultForm: FormState = {
  email: '',
  password: '',
  rol: 'COMERCIAL',
  nombre: '',
  tipoDocumento: 'Cédula de ciudadanía',
  numeroDocumento: '',
  fechaNacimiento: '',
  sexo: '',
  nacionalidad: '',
  estadoCivil: '',
  telefonoPersonal: '',
  emailPersonal: '',
  direccion: '',
  ciudad: '',
  pais: 'Colombia',
  cargo: '',
  area: '',
  tipoContrato: 'Término indefinido',
  fechaIngreso: '',
  salario: '',
  jornadaLaboral: 'Completa',
  jefeDirecto: '',
  telefonoCorporativo: '',
  nivelEducativo: 'Profesional',
  titulo: '',
  institucion: '',
  anoGraduacion: '',
  empresaAnterior: '',
  cargoDesempenado: '',
  tiempoTrabajado: '',
  funcionesPrincipales: '',
  habilidadesTecnicas: [],
  habilidadesTecnicasInput: '',
  habilidadesBlandas: [],
  habilidadesBlandasInput: '',
  idiomas: [],
  eps: '',
  fondoPension: '',
  arl: '',
  cajaCompensacion: '',
  banco: '',
  tipoCuenta: 'Ahorros',
  numeroCuenta: '',
  contactoEmergenciaNombre: '',
  contactoEmergenciaRelacion: '',
  contactoEmergenciaTelefono: '',
  cedula: '',
  hojaDeVida: '',
};

export function ColaboradorForm() {
  const { perfilId } = useParams<{ perfilId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [activeSection, setActiveSection] = useState('acceso');

  // Fetch perfil for pre-fill and title
  const { data: perfil } = useQuery<PerfilCargo>({
    queryKey: ['manager', 'perfiles-cargo', perfilId],
    queryFn: () => api.get(`/manager/perfiles-cargo/${perfilId}`).then((r) => r.data),
    enabled: !!perfilId,
  });

  // Pre-fill cargo with perfil nombre
  useEffect(() => {
    if (perfil?.nombre) {
      setForm((f) => ({ ...f, cargo: f.cargo || perfil.nombre }));
    }
  }, [perfil]);

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/manager/colaboradores', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['manager', 'colaboradores'] });
      toast.success('Colaborador creado exitosamente');
      navigate(`/perfiles-cargo/${perfilId}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Error';
      toast.error(Array.isArray(msg) ? msg[0] : String(msg));
    },
  });

  function handleSave() {
    if (!form.nombre.trim()) { toast.error('El nombre completo es requerido'); return; }
    if (!form.email.trim()) { toast.error('El correo corporativo es requerido'); return; }
    if (!form.password.trim()) { toast.error('La contraseña temporal es requerida'); return; }

    createMutation.mutate({
      nombre: form.nombre,
      email: form.email,
      password: form.password,
      rol: form.rol,
      perfilCargoId: perfilId ? Number(perfilId) : undefined,
      // All extra fields sent as metadata or direct fields based on backend
      tipoDocumento: form.tipoDocumento || undefined,
      numeroDocumento: form.numeroDocumento || undefined,
      fechaNacimiento: form.fechaNacimiento || undefined,
      sexo: form.sexo || undefined,
      nacionalidad: form.nacionalidad || undefined,
      estadoCivil: form.estadoCivil || undefined,
      telefonoPersonal: form.telefonoPersonal || undefined,
      emailPersonal: form.emailPersonal || undefined,
      direccion: form.direccion || undefined,
      ciudad: form.ciudad || undefined,
      pais: form.pais || undefined,
      cargo: form.cargo || undefined,
      area: form.area || undefined,
      tipoContrato: form.tipoContrato || undefined,
      fechaIngreso: form.fechaIngreso || undefined,
      salario: form.salario ? Number(form.salario) : undefined,
      jornadaLaboral: form.jornadaLaboral || undefined,
      jefeDirecto: form.jefeDirecto || undefined,
      telefonoCorporativo: form.telefonoCorporativo || undefined,
      nivelEducativo: form.nivelEducativo || undefined,
      titulo: form.titulo || undefined,
      institucion: form.institucion || undefined,
      anoGraduacion: form.anoGraduacion ? Number(form.anoGraduacion) : undefined,
      empresaAnterior: form.empresaAnterior || undefined,
      cargoAnterior: form.cargoDesempenado || undefined,
      tiempoTrabajado: form.tiempoTrabajado || undefined,
      funcionesAnteriores: form.funcionesPrincipales || undefined,
      habilidadesTecnicas: form.habilidadesTecnicas.length ? form.habilidadesTecnicas : undefined,
      habilidadesBlandas: form.habilidadesBlandas.length ? form.habilidadesBlandas : undefined,
      idiomas: form.idiomas.length ? form.idiomas : undefined,
      eps: form.eps || undefined,
      fondoPension: form.fondoPension || undefined,
      arl: form.arl || undefined,
      cajaCompensacion: form.cajaCompensacion || undefined,
      banco: form.banco || undefined,
      tipoCuenta: form.tipoCuenta || undefined,
      numeroCuenta: form.numeroCuenta || undefined,
      emergenciaNombre: form.contactoEmergenciaNombre || undefined,
      emergenciaRelacion: form.contactoEmergenciaRelacion || undefined,
      emergenciaTelefono: form.contactoEmergenciaTelefono || undefined,
      cedulaArchivo: form.cedula || undefined,
      hojaVidaArchivo: form.hojaDeVida || undefined,
    });
  }

  function addTag(field: 'habilidadesTecnicas' | 'habilidadesBlandas', inputField: 'habilidadesTecnicasInput' | 'habilidadesBlandasInput') {
    const val = form[inputField].trim();
    if (val && !form[field].includes(val)) {
      setForm((f) => ({ ...f, [field]: [...f[field], val], [inputField]: '' }));
    }
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>, addFn: () => void) {
    if (e.key === 'Enter') { e.preventDefault(); addFn(); }
  }

  function addIdioma() {
    setForm((f) => ({ ...f, idiomas: [...f.idiomas, { idioma: '', nivel: 'Básico' }] }));
  }

  function updateIdioma(i: number, field: keyof IdiomaRow, value: string) {
    setForm((f) => {
      const updated = [...f.idiomas];
      updated[i] = { ...updated[i], [field]: value };
      return { ...f, idiomas: updated };
    });
  }

  function removeIdioma(i: number) {
    setForm((f) => ({ ...f, idiomas: f.idiomas.filter((_, idx) => idx !== i) }));
  }

  // Scroll to section
  function scrollTo(sectionId: string) {
    setActiveSection(sectionId);
    const el = document.getElementById(`section-${sectionId}`);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const selectClass = "w-full px-3 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-900 text-sm text-gray-900 dark:text-slate-300 focus:outline-none focus:border-brand-blue/60";
  const textareaClass = "w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60 resize-none";
  const labelClass = "text-sm font-medium text-gray-700 dark:text-slate-300 block mb-1.5";
  const sectionClass = "rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-navy-800 p-5 shadow-sm dark:shadow-card scroll-mt-20";

  return (
    <div className="max-w-6xl mx-auto">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-gray-50/95 dark:bg-navy-950/95 backdrop-blur-sm border-b border-gray-200 dark:border-white/5 -mx-6 px-6 py-3 mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(`/perfiles-cargo/${perfilId}`)}
          title="Volver al perfil"
          className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">
            Nuevo Colaborador
            {perfil?.nombre && (
              <span className="text-gray-400 dark:text-slate-500 font-normal"> — {perfil.nombre}</span>
            )}
          </h1>
        </div>

        <button
          onClick={handleSave}
          disabled={createMutation.isPending}
          title="Guardar colaborador"
          className="p-2 rounded-lg bg-gradient-brand text-white shadow-glow-brand hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {createMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Left nav (desktop only) */}
        <nav className="hidden lg:block w-48 shrink-0">
          <div className="sticky top-24 space-y-0.5">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-left transition-all',
                  activeSection === id
                    ? 'bg-brand-blue/10 text-brand-blue dark:bg-brand-blue/10 dark:text-brand-blue'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5',
                )}
              >
                <Icon size={14} className="shrink-0" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        {/* Form sections */}
        <div className="flex-1 space-y-5 min-w-0">

          {/* ── 1. Acceso al Sistema ── */}
          <section id="section-acceso" className={sectionClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lock size={15} className="text-brand-blue" /> Acceso al Sistema
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Correo corporativo *"
                type="email"
                placeholder="colaborador@edatia.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
              <Input
                label="Contraseña temporal *"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <div>
                <label className={labelClass}>Rol *</label>
                <select
                  value={form.rol}
                  onChange={(e) => setForm((f) => ({ ...f, rol: e.target.value }))}
                  className={selectClass}
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* ── 2. Datos Personales ── */}
          <section id="section-personal" className={sectionClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={15} className="text-brand-blue" /> Datos Personales
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Nombre completo *"
                  placeholder="Juan Carlos Pérez Gómez"
                  value={form.nombre}
                  onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                />
              </div>
              <div>
                <label className={labelClass}>Tipo de documento</label>
                <select
                  value={form.tipoDocumento}
                  onChange={(e) => setForm((f) => ({ ...f, tipoDocumento: e.target.value }))}
                  className={selectClass}
                >
                  {TIPOS_DOCUMENTO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <Input
                label="Número de documento"
                placeholder="1234567890"
                value={form.numeroDocumento}
                onChange={(e) => setForm((f) => ({ ...f, numeroDocumento: e.target.value }))}
              />
              <div>
                <label className={labelClass}>Fecha de nacimiento</label>
                <input
                  type="date"
                  value={form.fechaNacimiento}
                  onChange={(e) => setForm((f) => ({ ...f, fechaNacimiento: e.target.value }))}
                  className={cn(selectClass)}
                />
              </div>
              <div>
                <label className={labelClass}>Edad</label>
                <input
                  type="text"
                  value={calcularEdad(form.fechaNacimiento)}
                  readOnly
                  className={cn(selectClass, 'bg-gray-50 dark:bg-navy-800 cursor-not-allowed text-gray-400 dark:text-slate-500')}
                  placeholder="Auto-calculada"
                />
              </div>
              <div>
                <label className={labelClass}>Sexo</label>
                <select
                  value={form.sexo}
                  onChange={(e) => setForm((f) => ({ ...f, sexo: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">Prefiero no indicar</option>
                  {SEXOS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <Input
                label="Nacionalidad"
                placeholder="Colombiana"
                value={form.nacionalidad}
                onChange={(e) => setForm((f) => ({ ...f, nacionalidad: e.target.value }))}
              />
              <div>
                <label className={labelClass}>Estado civil</label>
                <select
                  value={form.estadoCivil}
                  onChange={(e) => setForm((f) => ({ ...f, estadoCivil: e.target.value }))}
                  className={selectClass}
                >
                  <option value="">Sin especificar</option>
                  {ESTADOS_CIVILES.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* ── 3. Información de Contacto ── */}
          <section id="section-contacto" className={sectionClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Phone size={15} className="text-brand-blue" /> Información de Contacto
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Teléfono personal"
                placeholder="+57 300 000 0000"
                value={form.telefonoPersonal}
                onChange={(e) => setForm((f) => ({ ...f, telefonoPersonal: e.target.value }))}
              />
              <Input
                label="Correo electrónico personal"
                type="email"
                placeholder="personal@gmail.com"
                value={form.emailPersonal}
                onChange={(e) => setForm((f) => ({ ...f, emailPersonal: e.target.value }))}
              />
              <div className="sm:col-span-2">
                <Input
                  label="Dirección de residencia"
                  placeholder="Cra 15 #34-56, Apto 301"
                  value={form.direccion}
                  onChange={(e) => setForm((f) => ({ ...f, direccion: e.target.value }))}
                />
              </div>
              <Input
                label="Ciudad"
                placeholder="Bogotá"
                value={form.ciudad}
                onChange={(e) => setForm((f) => ({ ...f, ciudad: e.target.value }))}
              />
              <Input
                label="País"
                placeholder="Colombia"
                value={form.pais}
                onChange={(e) => setForm((f) => ({ ...f, pais: e.target.value }))}
              />
            </div>
          </section>

          {/* ── 4. Información Laboral ── */}
          <section id="section-laboral" className={sectionClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Briefcase size={15} className="text-brand-blue" /> Información Laboral
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Cargo"
                placeholder="Asesor Comercial"
                value={form.cargo}
                onChange={(e) => setForm((f) => ({ ...f, cargo: e.target.value }))}
              />
              <Input
                label="Área / Departamento"
                placeholder="Comercial"
                value={form.area}
                onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              />
              <div>
                <label className={labelClass}>Tipo de contrato</label>
                <select
                  value={form.tipoContrato}
                  onChange={(e) => setForm((f) => ({ ...f, tipoContrato: e.target.value }))}
                  className={selectClass}
                >
                  {TIPOS_CONTRATO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Fecha de ingreso</label>
                <input
                  type="date"
                  value={form.fechaIngreso}
                  onChange={(e) => setForm((f) => ({ ...f, fechaIngreso: e.target.value }))}
                  className={selectClass}
                />
              </div>
              <Input
                label="Salario (COP)"
                type="number"
                placeholder="2500000"
                value={form.salario}
                onChange={(e) => setForm((f) => ({ ...f, salario: e.target.value }))}
              />
              <div>
                <label className={labelClass}>Jornada laboral</label>
                <select
                  value={form.jornadaLaboral}
                  onChange={(e) => setForm((f) => ({ ...f, jornadaLaboral: e.target.value }))}
                  className={selectClass}
                >
                  {JORNADAS.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
              </div>
              <Input
                label="Jefe directo"
                placeholder="Nombre del jefe"
                value={form.jefeDirecto}
                onChange={(e) => setForm((f) => ({ ...f, jefeDirecto: e.target.value }))}
              />
              <Input
                label="Teléfono corporativo"
                placeholder="+57 601 000 0000 ext. 100"
                value={form.telefonoCorporativo}
                onChange={(e) => setForm((f) => ({ ...f, telefonoCorporativo: e.target.value }))}
              />
            </div>
          </section>

          {/* ── 5. Formación Académica ── */}
          <section id="section-formacion" className={sectionClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <GraduationCap size={15} className="text-brand-blue" /> Formación Académica
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nivel educativo</label>
                <select
                  value={form.nivelEducativo}
                  onChange={(e) => setForm((f) => ({ ...f, nivelEducativo: e.target.value }))}
                  className={selectClass}
                >
                  {NIVELES_EDUCATIVOS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <Input
                label="Título(s)"
                placeholder="Administración de Empresas"
                value={form.titulo}
                onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
              />
              <Input
                label="Institución"
                placeholder="Universidad Nacional de Colombia"
                value={form.institucion}
                onChange={(e) => setForm((f) => ({ ...f, institucion: e.target.value }))}
              />
              <Input
                label="Año de graduación"
                type="number"
                placeholder="2020"
                value={form.anoGraduacion}
                onChange={(e) => setForm((f) => ({ ...f, anoGraduacion: e.target.value }))}
              />
            </div>
          </section>

          {/* ── 6. Experiencia Laboral ── */}
          <section id="section-experiencia" className={sectionClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Building2 size={15} className="text-brand-blue" /> Experiencia Laboral
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Empresa anterior"
                placeholder="Distribuidora XYZ S.A.S"
                value={form.empresaAnterior}
                onChange={(e) => setForm((f) => ({ ...f, empresaAnterior: e.target.value }))}
              />
              <Input
                label="Cargo desempeñado"
                placeholder="Coordinador de Ventas"
                value={form.cargoDesempenado}
                onChange={(e) => setForm((f) => ({ ...f, cargoDesempenado: e.target.value }))}
              />
              <Input
                label="Tiempo trabajado"
                placeholder="2 años 3 meses"
                value={form.tiempoTrabajado}
                onChange={(e) => setForm((f) => ({ ...f, tiempoTrabajado: e.target.value }))}
              />
              <div className="sm:col-span-2">
                <label className={labelClass}>Funciones principales</label>
                <textarea
                  value={form.funcionesPrincipales}
                  onChange={(e) => setForm((f) => ({ ...f, funcionesPrincipales: e.target.value }))}
                  rows={3}
                  placeholder="Describe las principales funciones en el cargo anterior..."
                  className={textareaClass}
                />
              </div>
            </div>
          </section>

          {/* ── 7. Habilidades y Competencias ── */}
          <section id="section-habilidades" className={sectionClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Wrench size={15} className="text-brand-blue" /> Habilidades y Competencias
            </h2>
            <div className="space-y-5">
              {/* Técnicas */}
              <div>
                <label className={labelClass}>Habilidades técnicas</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.habilidadesTecnicasInput}
                    onChange={(e) => setForm((f) => ({ ...f, habilidadesTecnicasInput: e.target.value }))}
                    onKeyDown={(e) => handleTagKeyDown(e, () => addTag('habilidadesTecnicas', 'habilidadesTecnicasInput'))}
                    placeholder="ej. Excel avanzado — Enter para agregar"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60"
                  />
                  <button
                    onClick={() => addTag('habilidadesTecnicas', 'habilidadesTecnicasInput')}
                    title="Agregar"
                    className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-navy-600 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-navy-500 transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                {form.habilidadesTecnicas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.habilidadesTecnicas.map((h) => (
                      <span key={h} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-50 dark:bg-brand-blue/10 border border-blue-200 dark:border-brand-blue/20 text-blue-700 dark:text-brand-blue">
                        {h}
                        <button onClick={() => setForm((f) => ({ ...f, habilidadesTecnicas: f.habilidadesTecnicas.filter((x) => x !== h) }))} title="Quitar" className="text-blue-400 hover:text-red-500 transition-colors"><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Blandas */}
              <div>
                <label className={labelClass}>Habilidades blandas</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.habilidadesBlandasInput}
                    onChange={(e) => setForm((f) => ({ ...f, habilidadesBlandasInput: e.target.value }))}
                    onKeyDown={(e) => handleTagKeyDown(e, () => addTag('habilidadesBlandas', 'habilidadesBlandasInput'))}
                    placeholder="ej. Trabajo en equipo — Enter para agregar"
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60"
                  />
                  <button
                    onClick={() => addTag('habilidadesBlandas', 'habilidadesBlandasInput')}
                    title="Agregar"
                    className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-navy-600 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-navy-500 transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                </div>
                {form.habilidadesBlandas.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {form.habilidadesBlandas.map((h) => (
                      <span key={h} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-violet-50 dark:bg-brand-purple/10 border border-violet-200 dark:border-brand-purple/20 text-violet-700 dark:text-brand-purple">
                        {h}
                        <button onClick={() => setForm((f) => ({ ...f, habilidadesBlandas: f.habilidadesBlandas.filter((x) => x !== h) }))} title="Quitar" className="text-violet-400 hover:text-red-500 transition-colors"><X size={10} /></button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Idiomas */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={cn(labelClass, 'mb-0')}>Idiomas</label>
                  <button
                    onClick={addIdioma}
                    title="Agregar idioma"
                    className="flex items-center gap-1 text-xs text-brand-blue hover:text-brand-indigo transition-colors"
                  >
                    <Plus size={13} /> Agregar
                  </button>
                </div>
                {form.idiomas.length === 0 && (
                  <p className="text-xs text-gray-300 dark:text-slate-600">Sin idiomas añadidos</p>
                )}
                <div className="space-y-2">
                  {form.idiomas.map((item, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={item.idioma}
                        onChange={(e) => updateIdioma(i, 'idioma', e.target.value)}
                        placeholder="Idioma (ej. Inglés)"
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-900 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:border-brand-blue/60"
                      />
                      <select
                        value={item.nivel}
                        onChange={(e) => updateIdioma(i, 'nivel', e.target.value)}
                        className="w-36 px-3 py-2 rounded-lg border border-gray-300 dark:border-white/10 bg-white dark:bg-navy-900 text-sm text-gray-900 dark:text-slate-300 focus:outline-none focus:border-brand-blue/60"
                      >
                        {NIVELES_IDIOMA.map((n) => <option key={n} value={n}>{n}</option>)}
                      </select>
                      <button
                        onClick={() => removeIdioma(i)}
                        title="Quitar idioma"
                        className="p-2 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── 8. Seguridad Social ── */}
          <section id="section-seguridad" className={sectionClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield size={15} className="text-brand-blue" /> Seguridad Social
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="EPS" placeholder="Sura EPS" value={form.eps} onChange={(e) => setForm((f) => ({ ...f, eps: e.target.value }))} />
              <Input label="Fondo de pensión" placeholder="Porvenir" value={form.fondoPension} onChange={(e) => setForm((f) => ({ ...f, fondoPension: e.target.value }))} />
              <Input label="ARL" placeholder="Sura ARL" value={form.arl} onChange={(e) => setForm((f) => ({ ...f, arl: e.target.value }))} />
              <Input label="Caja de compensación" placeholder="Compensar" value={form.cajaCompensacion} onChange={(e) => setForm((f) => ({ ...f, cajaCompensacion: e.target.value }))} />
            </div>
          </section>

          {/* ── 9. Información Financiera ── */}
          <section id="section-financiero" className={sectionClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CreditCard size={15} className="text-brand-blue" /> Información Financiera
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Banco" placeholder="Bancolombia" value={form.banco} onChange={(e) => setForm((f) => ({ ...f, banco: e.target.value }))} />
              <div>
                <label className={labelClass}>Tipo de cuenta</label>
                <select value={form.tipoCuenta} onChange={(e) => setForm((f) => ({ ...f, tipoCuenta: e.target.value }))} className={selectClass}>
                  {TIPOS_CUENTA.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <Input label="Número de cuenta" placeholder="123-456789-00" value={form.numeroCuenta} onChange={(e) => setForm((f) => ({ ...f, numeroCuenta: e.target.value }))} />
              </div>
            </div>
          </section>

          {/* ── 10. Contacto de Emergencia ── */}
          <section id="section-emergencia" className={sectionClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <AlertTriangle size={15} className="text-brand-blue" /> Contacto de Emergencia
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Nombre" placeholder="María Gómez" value={form.contactoEmergenciaNombre} onChange={(e) => setForm((f) => ({ ...f, contactoEmergenciaNombre: e.target.value }))} />
              <Input label="Relación" placeholder="Esposa, Madre, etc." value={form.contactoEmergenciaRelacion} onChange={(e) => setForm((f) => ({ ...f, contactoEmergenciaRelacion: e.target.value }))} />
              <div className="sm:col-span-2">
                <Input label="Teléfono" placeholder="+57 310 000 0000" value={form.contactoEmergenciaTelefono} onChange={(e) => setForm((f) => ({ ...f, contactoEmergenciaTelefono: e.target.value }))} />
              </div>
            </div>
          </section>

          {/* ── 11. Documentación Legal ── */}
          <section id="section-documentos" className={sectionClass}>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <FileText size={15} className="text-brand-blue" /> Documentación Legal
            </h2>
            <p className="text-xs text-gray-400 dark:text-slate-500 mb-4">
              Funcionalidad de carga de archivos próximamente. Por ahora ingresa la ruta o nombre del archivo.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Cédula (ruta o nombre del archivo)"
                placeholder="cedula_juan_perez.pdf"
                value={form.cedula}
                onChange={(e) => setForm((f) => ({ ...f, cedula: e.target.value }))}
              />
              <Input
                label="Hoja de vida PDF (ruta)"
                placeholder="hv_juan_perez_2024.pdf"
                value={form.hojaDeVida}
                onChange={(e) => setForm((f) => ({ ...f, hojaDeVida: e.target.value }))}
              />
            </div>
          </section>

          {/* Bottom save */}
          <div className="flex justify-end gap-3 pb-6">
            <Button variant="ghost" onClick={() => navigate(`/perfiles-cargo/${perfilId}`)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              loading={createMutation.isPending}
              disabled={!form.nombre || !form.email || !form.password}
              size="lg"
            >
              <Check size={16} />
              Crear Colaborador
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
