import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, User, FileText, CheckCircle2, ChevronRight,
  ArrowLeft, Upload, Loader2, Sparkles, HelpCircle, Shield, Briefcase
} from 'lucide-react';
import { api, getApiError } from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EdatiaLogo } from '@/components/layout/EdatiaLogo';

// ─── Interfaces ───────────────────────────────────────────────────────────────
interface PlanBase {
  id: number;
  nombre: string;
  descripcion?: string;
  precioMensualFinal: number;
  modulos: Array<{
    modulo: {
      id: number;
      nombre: string;
      slug: string;
    }
  }>;
}

interface ModuloSoftware {
  id: number;
  nombre: string;
  slug: string;
  precioAnual: number;
}

export function RegistroClientePublico() {
  const navigate = useNavigate();

  // Estados del flujo del Wizard
  const [step, setStep] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  // Paso 1: Comercial
  const [codigoComercial, setCodigoComercial] = useState<string>('');
  const [passwordComercial, setPasswordComercial] = useState<string>('');
  const [comercialValido, setComercialValido] = useState<any>(null);

  // Paso 2: Régimen Legal
  const [tipoPersona, setTipoPersona] = useState<'NATURAL' | 'JURIDICA' | ''>('');

  // Paso 3: Datos de Identificación y Contacto (Básicos)
  const [nombre, setNombre] = useState<string>('');
  const [nit, setNit] = useState<string>('');
  const [digitoVerificacion, setDigitoVerificacion] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [direccion, setDireccion] = useState<string>('');
  const [ciudad, setCiudad] = useState<string>('');
  const [departamento, setDepartamento] = useState<string>('');

  // Representante Legal (Para jurídica)
  const [repNombre, setRepNombre] = useState<string>('');
  const [repCedula, setRepCedula] = useState<string>('');
  const [repEmail, setRepEmail] = useState<string>('');
  const [repTelefono, setRepTelefono] = useState<string>('');

  // Documentos subidos (almacenan el filepath devuelto por backend)
  const [fileRut, setFileRut] = useState<{ name: string; path: string } | null>(null);
  const [fileCedula, setFileCedula] = useState<{ name: string; path: string } | null>(null);
  const [fileCamara, setFileCamara] = useState<{ name: string; path: string } | null>(null);

  // Progreso de subida
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadingFile, setUploadingFile] = useState<Record<string, boolean>>({});

  // Paso 4: Planes y Módulos
  const [planes, setPlanes] = useState<PlanBase[]>([]);
  const [modulos, setModulos] = useState<ModuloSoftware[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [selectedModulosIds, setSelectedModulosIds] = useState<number[]>([]);
  const [requiereAsesoria, setRequiereAsesoria] = useState<boolean>(false);

  // Cargar planes y módulos de la base de datos
  useEffect(() => {
    if (step === 4) {
      setLoading(true);
      Promise.all([
        api.get('/manager/public-clientes/planes-base').then(r => r.data),
        api.get('/manager/public-clientes/modulos-software').then(r => r.data)
      ])
        .then(([planesData, modulosData]) => {
          setPlanes(planesData);
          setModulos(modulosData);
        })
        .catch(err => {
          toast.error('Error al cargar los planes y módulos.');
          console.error(err);
        })
        .finally(() => setLoading(false));
    }
  }, [step]);

  // Al seleccionar un plan, auto-seleccionar sus módulos incluidos
  const handleSelectPlan = (planId: number) => {
    setSelectedPlanId(planId);
    const plan = planes.find(p => p.id === planId);
    if (plan) {
      const planModIds = plan.modulos.map(m => m.modulo.id);
      setSelectedModulosIds(planModIds);
    }
  };

  // Toggle de módulos adicionales
  const handleToggleModulo = (modId: number) => {
    // Si el módulo está incluido en el plan activo, no dejar desmarcarlo
    if (selectedPlanId) {
      const plan = planes.find(p => p.id === selectedPlanId);
      if (plan && plan.modulos.some(m => m.modulo.id === modId)) {
        return;
      }
    }

    setSelectedModulosIds(prev =>
      prev.includes(modId)
        ? prev.filter(id => id !== modId)
        : [...prev, modId]
    );
  };

  // Función para manejar la subida de archivos real
  const handleFileUpload = async (key: string, file: File) => {
    setUploadingFile(prev => ({ ...prev, [key]: true }));
    setUploadProgress(prev => ({ ...prev, [key]: 0 }));

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/manager/public-clientes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 100));
          setUploadProgress(prev => ({ ...prev, [key]: percent }));
        },
      });

      const data = res.data;
      if (key === 'rut') setFileRut({ name: file.name, path: data.filepath });
      if (key === 'cedula') setFileCedula({ name: file.name, path: data.filepath });
      if (key === 'camara') setFileCamara({ name: file.name, path: data.filepath });

      toast.success(`Archivo "${file.name}" cargado correctamente.`);
    } catch (err) {
      toast.error('Error al subir el archivo.');
      console.error(err);
    } finally {
      setUploadingFile(prev => ({ ...prev, [key]: false }));
    }
  };

  // Acción Paso 1: Continuar
  const handleStep1Continue = async () => {
    if (codigoComercial.trim()) {
      if (!passwordComercial) {
        toast.error('Por favor ingresa tu contraseña de comercial.');
        return;
      }
      setLoading(true);
      try {
        const res = await api.post('/manager/public-clientes/validate-commercial', {
          code: codigoComercial,
          password: passwordComercial,
        });
        setComercialValido(res.data.advisor);
        toast.success(`Bienvenido/a, asesor ${res.data.advisor.nombre}`);
        setStep(2);
      } catch (err) {
        toast.error(getApiError(err, 'Código comercial o contraseña incorrectos.'));
      } finally {
        setLoading(false);
      }
    } else {
      setComercialValido(null);
      setStep(2);
    }
  };

  // Validación de Paso 3
  const isStep3Valid = () => {
    const commonFields = nombre && nit && email && telefono && direccion && ciudad && departamento;
    const filesValid = tipoPersona === 'NATURAL'
      ? fileRut && fileCedula
      : fileRut && fileCedula && fileCamara;

    const repValid = tipoPersona === 'JURIDICA'
      ? repNombre && repCedula && repEmail && repTelefono
      : true;

    return commonFields && filesValid && repValid;
  };

  // Enviar el formulario (Paso 4)
  const handleRegisterSubmit = async () => {
    setLoading(true);

    // Preparar observaciones estructuradas en JSON
    const observacionesObj = {
      representanteLegal: tipoPersona === 'JURIDICA' ? {
        nombre: repNombre,
        cedula: repCedula,
        email: repEmail,
        telefono: repTelefono,
      } : null,
      archivos: {
        rut: fileRut?.path || null,
        cedula: fileCedula?.path || null,
        camaraComercio: fileCamara?.path || null,
        rutNombre: fileRut?.name || null,
        cedulaNombre: fileCedula?.name || null,
        camaraComercioNombre: fileCamara?.name || null,
      },
      requiereAsesoriaPlanes: requiereAsesoria,
    };

    const payload = {
      tipoPersona,
      tipoDocumento: tipoPersona === 'NATURAL' ? 'CC' : 'NIT',
      nit,
      digitoVerificacion: tipoPersona === 'JURIDICA' ? digitoVerificacion : null,
      nombre,
      email,
      telefono,
      direccion,
      ciudad,
      departamento,
      contacto: tipoPersona === 'JURIDICA' ? repNombre : nombre,
      asesorId: comercialValido?.id || null,
      planBaseId: requiereAsesoria ? null : selectedPlanId,
      modulosIds: requiereAsesoria ? [] : selectedModulosIds,
      observaciones: JSON.stringify(observacionesObj),
    };

    try {
      await api.post('/manager/public-clientes/registro', payload);
      setStep(5);
    } catch (err) {
      toast.error(getApiError(err, 'Error al procesar el registro del cliente.'));
    } finally {
      setLoading(false);
    }
  };

  const labelCls = 'text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1';
  const inputContainerCls = 'space-y-1';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:bg-navy-950 flex flex-col p-4 relative overflow-x-hidden font-sans">
      {/* Background ambient glow (dark only) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none dark:block hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-blue/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      {/* Header Fijo */}
      <header className="w-full max-w-4xl mx-auto flex items-center justify-between py-4 border-b border-slate-200 dark:border-white/5 mb-6 z-10 shrink-0">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/login')}>
          <EdatiaLogo size="md" />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <Shield size={14} className="text-indigo-500" />
          <span>Portal de Auto-Registro Seguro</span>
        </div>
      </header>

      {/* Contenedor Central */}
      <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col justify-center py-2 z-10">
        {/* Barra de progreso superior si no es éxito final */}
        {step < 5 && (
          <div className="mb-6">
            <div className="flex justify-between text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              <span>Paso {step} de 4</span>
              <span>
                {step === 1 && 'Identificación de Rol'}
                {step === 2 && 'Régimen Legal'}
                {step === 3 && 'Información y Adjuntos'}
                {step === 4 && 'Plan & Módulos'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-navy-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-blue to-indigo-600 transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Card Contenedora */}
        <div className="bg-white dark:bg-navy-900/60 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-3xl shadow-xl dark:shadow-[0_24px_60px_rgba(0,0,0,0.4)] overflow-hidden transition-all duration-300">
          
          {/* ────────────────── STEP 1: BIENVENIDA Y COMERCIAL ────────────────── */}
          {step === 1 && (
            <div className="p-8 md:p-12 space-y-6">
              <div className="text-center max-w-lg mx-auto">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Sparkles size={24} />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                  Bienvenido a Edatia
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                  Llena el formulario para el registro a Edatia ERP. Este proceso toma aproximadamente 5 minutos.
                </p>
              </div>

              <div className="max-w-md mx-auto bg-slate-50 dark:bg-navy-800/40 border border-slate-200 dark:border-white/5 rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                    ¿Eres del equipo comercial?
                  </h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                    Si eres comercial de Edatia, ingresa tu número de cédula para registrar al cliente bajo tu código de asesor. De lo contrario, dale "Continuar" para auto-registrarte.
                  </p>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Código Comercial (Cédula)"
                    placeholder="Ej: 1018999888"
                    value={codigoComercial}
                    onChange={(e) => setCodigoComercial(e.target.value)}
                    type="text"
                  />

                  {codigoComercial.trim().length > 0 && (
                    <div className="animate-fade-in">
                      <Input
                        label="Contraseña del Comercial"
                        placeholder="Contraseña corporativa"
                        value={passwordComercial}
                        onChange={(e) => setPasswordComercial(e.target.value)}
                        type="password"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end max-w-md mx-auto pt-2">
                <Button
                  onClick={handleStep1Continue}
                  loading={loading}
                  size="lg"
                  className="w-full bg-gradient-to-r from-brand-blue to-indigo-600 hover:opacity-90 transition-all font-semibold rounded-xl flex items-center justify-center gap-2"
                >
                  Continuar
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* ────────────────── STEP 2: REGIMEN LEGAL ────────────────── */}
          {step === 2 && (
            <div className="p-8 md:p-12 space-y-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Tipo de Régimen Legal</h2>
                  <p className="text-xs text-slate-500">¿Eres persona natural o jurídica?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Persona Natural */}
                <button
                  type="button"
                  onClick={() => setTipoPersona('NATURAL')}
                  className={`flex flex-col text-left p-6 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                    tipoPersona === 'NATURAL'
                      ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10 shadow-lg'
                      : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800/20 hover:border-slate-300 dark:hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-blue/10 text-brand-blue flex items-center justify-center">
                      <User size={20} />
                    </div>
                    {tipoPersona === 'NATURAL' && (
                      <CheckCircle2 size={20} className="text-brand-blue" />
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Persona Natural</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    Actúas a nombre propio y realizas actividades comerciales de manera personal. Ideal para independientes, comerciantes pequeños o consultores.
                  </p>
                  <div className="mt-auto text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
                    Requisitos: RUT + Cédula
                  </div>
                </button>

                {/* Persona Jurídica */}
                <button
                  type="button"
                  onClick={() => setTipoPersona('JURIDICA')}
                  className={`flex flex-col text-left p-6 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                    tipoPersona === 'JURIDICA'
                      ? 'border-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 shadow-lg'
                      : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800/20 hover:border-slate-300 dark:hover:border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <Building2 size={20} />
                    </div>
                    {tipoPersona === 'JURIDICA' && (
                      <CheckCircle2 size={20} className="text-indigo-500" />
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Persona Jurídica</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                    Empresa constituida como sociedad (S.A.S., S.A., Ltda.). La responsabilidad se limita a los activos de la empresa. Requiere un Representante Legal.
                  </p>
                  <div className="mt-auto text-[10px] font-semibold text-indigo-400 uppercase tracking-widest">
                    Requisitos: RUT + Cámara de Comercio + Representación
                  </div>
                </button>
              </div>

              {/* Artículos explicativos colombianos */}
              <div className="bg-slate-50 dark:bg-navy-800/40 rounded-2xl p-6 border border-slate-200 dark:border-white/5 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  Diferencias clave en el contexto de Colombia
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <div className="space-y-1">
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Persona Natural (Reg. Común o Simplificado)</h5>
                    <p>La persona asume todas las responsabilidades con su patrimonio personal. No requiere capital mínimo de constitución y se registra con su cédula de ciudadanía o NIT personal derivado.</p>
                  </div>
                  <div className="space-y-1">
                    <h5 className="font-semibold text-slate-800 dark:text-slate-200">Persona Jurídica (S.A.S., Ltda., S.A.)</h5>
                    <p>La empresa es una persona ficticia capaz de ejercer derechos y contraer obligaciones. Protege los bienes personales de los socios, y se identifica con un NIT propio con dígito de verificación.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-white/5">
                <Button variant="ghost" onClick={() => setStep(1)} className="rounded-xl">
                  Atrás
                </Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={!tipoPersona}
                  className="rounded-xl bg-gradient-to-r from-brand-blue to-indigo-600 text-white shadow-md disabled:opacity-40"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}

          {/* ────────────────── STEP 3: FORMULARIO Y ARCHIVOS ────────────────── */}
          {step === 3 && (
            <div className="p-6 md:p-8 space-y-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Formulario de Datos Básicos</h2>
                  <p className="text-xs text-slate-500">
                    Llena los datos para el perfil de {tipoPersona === 'NATURAL' ? 'Persona Natural' : 'Persona Jurídica'}
                  </p>
                </div>
              </div>

              {comercialValido && (
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="text-xs">
                    <p className="font-semibold text-emerald-800 dark:text-emerald-300">Asesor Comercial Validado</p>
                    <p className="text-emerald-600 dark:text-emerald-400">Este registro quedará asignado al asesor <strong>{comercialValido.nombre}</strong> ({comercialValido.email}).</p>
                  </div>
                </div>
              )}

              {/* Formulario Principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Input
                    label={tipoPersona === 'NATURAL' ? 'Nombre Completo *' : 'Razón Social (Nombre de la Empresa) *'}
                    placeholder={tipoPersona === 'NATURAL' ? 'Ej: Diego Ortiz' : 'Ej: Distribuidora SAS'}
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      label={tipoPersona === 'NATURAL' ? 'Número de Cédula *' : 'NIT (Número de Identificación Tributaria) *'}
                      placeholder="Ej: 900123456"
                      value={nit}
                      onChange={(e) => setNit(e.target.value)}
                    />
                  </div>
                  {tipoPersona === 'JURIDICA' && (
                    <div className="w-16">
                      <Input
                        label="DV"
                        placeholder="0"
                        value={digitoVerificacion}
                        onChange={(e) => setDigitoVerificacion(e.target.value)}
                        maxLength={1}
                      />
                    </div>
                  )}
                </div>

                <Input
                  label="Correo Electrónico *"
                  type="email"
                  placeholder="contacto@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <Input
                  label="Teléfono de Contacto *"
                  placeholder="Ej: 300 123 4567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />

                <Input
                  label="Dirección Completa *"
                  placeholder="Ej: Calle 93 # 12-45 Of 401"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                />

                <Input
                  label="Ciudad / Municipio *"
                  placeholder="Ej: Bogotá"
                  value={ciudad}
                  onChange={(e) => setCiudad(e.target.value)}
                />

                <Input
                  label="Departamento *"
                  placeholder="Ej: Cundinamarca"
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                />
              </div>

              {/* Sub-formulario Representante Legal (Jurídica) */}
              {tipoPersona === 'JURIDICA' && (
                <div className="border-t border-slate-200 dark:border-white/5 pt-6 space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase size={16} className="text-indigo-500" />
                    <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                      Representante Legal
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="Nombre Completo del Representante *"
                      placeholder="Ej: Diego Ortiz"
                      value={repNombre}
                      onChange={(e) => setRepNombre(e.target.value)}
                    />
                    <Input
                      label="Cédula del Representante *"
                      placeholder="Ej: 1018222333"
                      value={repCedula}
                      onChange={(e) => setRepCedula(e.target.value)}
                    />
                    <Input
                      label="Correo Electrónico Representante *"
                      type="email"
                      placeholder="representante@empresa.com"
                      value={repEmail}
                      onChange={(e) => setRepEmail(e.target.value)}
                    />
                    <Input
                      label="Teléfono del Representante *"
                      placeholder="Ej: 301 444 5555"
                      value={repTelefono}
                      onChange={(e) => setRepTelefono(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Carga de Documentos */}
              <div className="border-t border-slate-200 dark:border-white/5 pt-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={16} className="text-brand-blue" />
                  <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                    Documentación Requerida (Adjuntos)
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Documento 1: RUT */}
                  <div className="p-4 bg-slate-50 dark:bg-navy-800/40 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex flex-col justify-between h-40">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-1">RUT *</h4>
                      <p className="text-[10px] text-slate-500">Formato PDF o Imagen de RUT actualizado</p>
                    </div>

                    <div className="mt-4">
                      {fileRut ? (
                        <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-xl">
                          <span className="truncate max-w-[120px]">{fileRut.name}</span>
                          <CheckCircle2 size={16} className="shrink-0" />
                        </div>
                      ) : uploadingFile['rut'] ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-indigo-500 font-semibold">
                            <span>Subiendo...</span>
                            <span>{uploadProgress['rut'] || 0}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-200 dark:bg-navy-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${uploadProgress['rut'] || 0}%` }} />
                          </div>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-600 cursor-pointer font-semibold shadow-sm">
                          <Upload size={14} />
                          Seleccionar
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload('rut', file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Documento 2: Cédula */}
                  <div className="p-4 bg-slate-50 dark:bg-navy-800/40 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex flex-col justify-between h-40">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-1">
                        {tipoPersona === 'NATURAL' ? 'Cédula del Titular *' : 'Cédula Representante *'}
                      </h4>
                      <p className="text-[10px] text-slate-500">PDF o foto de cédula ampliada al 150%</p>
                    </div>

                    <div className="mt-4">
                      {fileCedula ? (
                        <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-xl">
                          <span className="truncate max-w-[120px]">{fileCedula.name}</span>
                          <CheckCircle2 size={16} className="shrink-0" />
                        </div>
                      ) : uploadingFile['cedula'] ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] text-indigo-500 font-semibold">
                            <span>Subiendo...</span>
                            <span>{uploadProgress['cedula'] || 0}%</span>
                          </div>
                          <div className="h-1 w-full bg-slate-200 dark:bg-navy-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: `${uploadProgress['cedula'] || 0}%` }} />
                          </div>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-600 cursor-pointer font-semibold shadow-sm">
                          <Upload size={14} />
                          Seleccionar
                          <input
                            type="file"
                            accept=".pdf,image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload('cedula', file);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Documento 3: Cámara de Comercio (Jurídica solamente) */}
                  {tipoPersona === 'JURIDICA' ? (
                    <div className="p-4 bg-slate-50 dark:bg-navy-800/40 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl flex flex-col justify-between h-40">
                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-white mb-1">Cámara de Comercio *</h4>
                        <p className="text-[10px] text-slate-500">Expedido no mayor a 30 días en formato PDF</p>
                      </div>

                      <div className="mt-4">
                        {fileCamara ? (
                          <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-xl">
                            <span className="truncate max-w-[120px]">{fileCamara.name}</span>
                            <CheckCircle2 size={16} className="shrink-0" />
                          </div>
                        ) : uploadingFile['camara'] ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[10px] text-indigo-500 font-semibold">
                              <span>Subiendo...</span>
                              <span>{uploadProgress['camara'] || 0}%</span>
                            </div>
                            <div className="h-1 w-full bg-slate-200 dark:bg-navy-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: `${uploadProgress['camara'] || 0}%` }} />
                            </div>
                          </div>
                        ) : (
                          <label className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-navy-700 border border-slate-200 dark:border-white/5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-navy-600 cursor-pointer font-semibold shadow-sm">
                            <Upload size={14} />
                            Seleccionar
                            <input
                              type="file"
                              accept=".pdf,image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload('camara', file);
                              }}
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-100/50 dark:bg-navy-800/10 border border-slate-200/50 dark:border-white/5 rounded-2xl flex flex-col justify-center items-center h-40 text-slate-400 text-center">
                      <HelpCircle size={24} className="mb-2 opacity-50" />
                      <p className="text-[10px]">Cámara de Comercio no requerida para Persona Natural</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Botones de Navegación */}
              <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                <Button variant="ghost" onClick={() => setStep(2)} className="rounded-xl">
                  Atrás
                </Button>
                <Button
                  onClick={() => setStep(4)}
                  disabled={!isStep3Valid()}
                  className="rounded-xl bg-gradient-to-r from-brand-blue to-indigo-600 text-white shadow-md disabled:opacity-40"
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}

          {/* ────────────────── STEP 4: SELECCIÓN DE PLANES Y MÓDULOS ────────────────── */}
          {step === 4 && (
            <div className="p-8 space-y-8">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(3)}
                  className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Selecciona tu Plan y Módulos</h2>
                  <p className="text-xs text-slate-500">¿Qué herramientas necesitas en tu ERP?</p>
                </div>
              </div>

              {/* Checkbox de requiere más asesoría */}
              <label className="flex items-center gap-3 p-4 bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-white/5 rounded-2xl cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all select-none">
                <input
                  type="checkbox"
                  checked={requiereAsesoria}
                  onChange={(e) => {
                    setRequiereAsesoria(e.target.checked);
                    if (e.target.checked) {
                      setSelectedPlanId(null);
                      setSelectedModulosIds([]);
                    }
                  }}
                  className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-white/20 rounded focus:ring-indigo-500 focus:ring-offset-0 bg-white dark:bg-navy-700 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 block">Requiero más asesoría frente a planes</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Puedes enviar tu registro sin seleccionar un plan. Uno de nuestros asesores te contactará para guiarte en tu decisión.</span>
                </div>
              </label>

              {!requiereAsesoria && (
                <div className="space-y-6">
                  {/* Selector de Planes Base */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Planes Disponibles</h3>
                    {loading ? (
                      <div className="flex items-center justify-center p-8">
                        <Loader2 className="animate-spin text-brand-blue" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {planes.map((p) => {
                          const isSelected = selectedPlanId === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => handleSelectPlan(p.id)}
                              className={`p-5 rounded-2xl border text-left flex flex-col transition-all duration-300 relative group overflow-hidden ${
                                isSelected
                                  ? 'border-brand-blue bg-brand-blue/5 dark:bg-brand-blue/10 shadow-md scale-[1.01]'
                                  : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800/10 hover:border-slate-300'
                              }`}
                            >
                              <h4 className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-brand-blue transition-colors">
                                {p.nombre}
                              </h4>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-1.5 mb-4 flex-1">
                                {p.descripcion || 'Sin descripción disponible.'}
                              </p>
                              <div className="mt-auto pt-3 border-t border-slate-200 dark:border-white/5 flex items-baseline gap-1">
                                <span className="text-base font-extrabold text-slate-900 dark:text-white">
                                  ${Number(p.precioMensualFinal).toLocaleString('es-CO')}
                                </span>
                                <span className="text-[10px] text-slate-400">COP/mes</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selector de Módulos */}
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Módulos del Sistema</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {modulos.map((m) => {
                        const isChecked = selectedModulosIds.includes(m.id);
                        // Determinar si el módulo está incluido obligatoriamente por el plan seleccionado
                        const isMandatory = selectedPlanId
                          ? planes.find(p => p.id === selectedPlanId)?.modulos.some(pm => pm.modulo.id === m.id)
                          : false;

                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => handleToggleModulo(m.id)}
                            disabled={isMandatory}
                            className={`p-3.5 rounded-xl border text-left flex items-center justify-between transition-all select-none ${
                              isChecked
                                ? 'border-indigo-500/40 bg-indigo-500/5 dark:bg-indigo-500/10'
                                : 'border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-navy-800/10 hover:bg-slate-100/50'
                            } ${isMandatory ? 'opacity-80 cursor-not-allowed bg-slate-100/30' : ''}`}
                          >
                            <div>
                              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                {m.nombre}
                                {isMandatory && (
                                  <span className="text-[9px] bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-normal">
                                    Incluido en plan
                                  </span>
                                )}
                              </span>
                              <span className="text-[9px] text-slate-400">Código del módulo: {m.slug}</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              disabled={isMandatory}
                              onChange={() => {}} // Ya manejado por el click del botón
                              className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-white/20 rounded cursor-pointer disabled:opacity-50"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de Navegación */}
              <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-white/5">
                <Button variant="ghost" onClick={() => setStep(3)} className="rounded-xl">
                  Atrás
                </Button>
                <Button
                  onClick={handleRegisterSubmit}
                  disabled={loading || (!requiereAsesoria && !selectedPlanId)}
                  className="rounded-xl bg-gradient-to-r from-brand-blue to-indigo-600 text-white font-semibold shadow-md disabled:opacity-40"
                >
                  {loading ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registrando...
                    </span>
                  ) : (
                    'Enviar Registro'
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* ────────────────── STEP 5: EXITO PREMIUM ────────────────── */}
          {step === 5 && (
            <div className="p-8 md:p-12 text-center space-y-6">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
                <CheckCircle2 size={36} />
              </div>

              <div className="max-w-md mx-auto space-y-2">
                <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                  ¡Registro Completado con Éxito!
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tus datos y documentos han sido registrados en nuestro portal de administración. El equipo comercial de Edatia revisará tus documentos y se pondrá en contacto contigo muy pronto.
                </p>
              </div>

              <div className="max-w-md mx-auto bg-slate-50 dark:bg-navy-800/40 border border-slate-200 dark:border-white/5 rounded-2xl p-6 text-left space-y-3.5 text-xs">
                <div className="flex justify-between pb-2.5 border-b border-slate-200 dark:border-white/5 font-semibold">
                  <span className="text-slate-400 uppercase tracking-wider text-[10px]">Detalle del Registro</span>
                  <span className="text-indigo-500">Estado: PROSPECTO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente/Empresa:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Identificación:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {nit}
                    {tipoPersona === 'JURIDICA' && digitoVerificacion ? `-${digitoVerificacion}` : ''}
                  </span>
                </div>
                {comercialValido && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Asesor Comercial:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{comercialValido.nombre}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan Seleccionado:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {requiereAsesoria
                      ? 'Requiere asesoría de planes'
                      : planes.find(p => p.id === selectedPlanId)?.nombre || 'Ninguno'
                    }
                  </span>
                </div>
              </div>

              <div className="pt-4 max-w-xs mx-auto">
                <Button
                  onClick={() => navigate('/login')}
                  className="w-full rounded-xl bg-gradient-to-r from-brand-blue to-indigo-600 text-white font-semibold"
                >
                  Finalizar y Salir
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="w-full text-center text-[10px] text-slate-400 dark:text-slate-600 py-6 mt-auto">
        Edatia ERP · Todos los derechos reservados · © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
