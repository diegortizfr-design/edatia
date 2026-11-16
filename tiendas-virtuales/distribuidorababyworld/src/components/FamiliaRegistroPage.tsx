import React, { useState, useEffect } from 'react'
import {
  ArrowLeft, Sparkles, Heart, Calendar, Percent, Truck,
  User, CreditCard, Mail, Smartphone, MapPin, Home,
  ChevronRight, CheckCircle2, ShieldCheck, Loader2, AlertCircle, X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { DEPARTAMENTOS_COLOMBIA, MESES_CUMPLEANOS } from '../data/colombiaGeo'
import { WhatsAppIcon } from './WhatsAppIcon'

interface FamiliaRegistroPageProps {
  onBack: () => void
  API_BASE: string
  storeSlug: string
}

interface FormState {
  identificacion: string
  nombreCompleto: string
  email: string
  celular: string
  departamento: string
  ciudad: string
  otraCiudad: string
  barrio: string
  direccion: string
  cumpleanosDia: string
  cumpleanosMes: string
  aceptaTerminos: boolean
}

type FormErrors = Partial<Record<keyof FormState | 'submit', string>>

const INITIAL_FORM: FormState = {
  identificacion: '',
  nombreCompleto: '',
  email: '',
  celular: '',
  departamento: 'Valle del Cauca',
  ciudad: 'Candelaria',
  otraCiudad: '',
  barrio: '',
  direccion: '',
  cumpleanosDia: '',
  cumpleanosMes: '',
  aceptaTerminos: true,
}

export function FamiliaRegistroPage({
  onBack,
  API_BASE,
  storeSlug,
}: FamiliaRegistroPageProps) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTermsModal, setShowTermsModal] = useState(false)
  const [successData, setSuccessData] = useState<{
    esNuevo: boolean
    nombre: string
    identificacion: string
    cumpleanosDia: number
    cumpleanosMes: number
    ciudad: string
    barrio: string
  } | null>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [successData])

  const selectedDeptObj = DEPARTAMENTOS_COLOMBIA.find((d) => d.nombre === form.departamento)
  const availableCities = selectedDeptObj?.ciudades ?? []

  const selectedMonthObj = MESES_CUMPLEANOS.find((m) => String(m.value) === form.cumpleanosMes)
  const maxDaysInMonth = selectedMonthObj?.maxDays ?? 31

  const handleDepartamentoChange = (deptName: string) => {
    const dept = DEPARTAMENTOS_COLOMBIA.find((d) => d.nombre === deptName)
    const defaultCity = dept?.ciudades?.[0] ?? ''
    setForm((prev) => ({
      ...prev,
      departamento: deptName,
      ciudad: defaultCity,
      otraCiudad: '',
    }))
    setErrors((prev) => ({ ...prev, departamento: undefined, ciudad: undefined, otraCiudad: undefined }))
  }

  const handleMesChange = (mesVal: string) => {
    const monthInfo = MESES_CUMPLEANOS.find((m) => String(m.value) === mesVal)
    const maxD = monthInfo?.maxDays ?? 31
    setForm((prev) => {
      const currentDia = Number(prev.cumpleanosDia)
      const adjustedDia = currentDia > maxD ? String(maxD) : prev.cumpleanosDia
      return {
        ...prev,
        cumpleanosMes: mesVal,
        cumpleanosDia: adjustedDia,
      }
    })
    setErrors((prev) => ({ ...prev, cumpleanosMes: undefined, cumpleanosDia: undefined }))
  }

  const handleIdentificacionChange = (val: string) => {
    const onlyDigits = val.replace(/\D/g, '').slice(0, 15)
    setForm((prev) => ({ ...prev, identificacion: onlyDigits }))
    if (errors.identificacion) setErrors((prev) => ({ ...prev, identificacion: undefined }))
  }

  const handleNombreChange = (val: string) => {
    // Permite únicamente letras (incluyendo tildes, ñ, ü) y espacios
    const onlyLetters = val.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g, '').slice(0, 120)
    setForm((prev) => ({ ...prev, nombreCompleto: onlyLetters }))
    if (errors.nombreCompleto) setErrors((prev) => ({ ...prev, nombreCompleto: undefined }))
  }

  const handleCelularChange = (val: string) => {
    const onlyDigits = val.replace(/\D/g, '').slice(0, 10)
    setForm((prev) => ({ ...prev, celular: onlyDigits }))
    if (errors.celular) setErrors((prev) => ({ ...prev, celular: undefined }))
  }

  const validate = (): boolean => {
    const nextErrors: FormErrors = {}

    if (!/^\d{5,15}$/.test(form.identificacion) || form.identificacion === '222222222222') {
      nextErrors.identificacion = 'Ingresa tu identificación válida (solo números, entre 5 y 15 dígitos).'
    }

    const cleanNombre = form.nombreCompleto.replace(/\s+/g, ' ').trim()
    if (cleanNombre.length < 3 || !/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]+$/.test(cleanNombre)) {
      nextErrors.nombreCompleto = 'Ingresa tu nombre completo (solo letras, sin números ni símbolos).'
    }

    const cleanEmail = form.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(cleanEmail)) {
      nextErrors.email = 'Ingresa un correo electrónico válido (ej: nombre@correo.com).'
    }

    if (!/^\d{10}$/.test(form.celular)) {
      nextErrors.celular = 'Ingresa tu número de celular de 10 dígitos (solo números).'
    }

    if (!form.departamento) {
      nextErrors.departamento = 'Selecciona tu departamento.'
    }

    if (!form.ciudad) {
      nextErrors.ciudad = 'Selecciona tu ciudad o municipio.'
    } else if (form.ciudad === 'OTRA' && form.otraCiudad.trim().length < 2) {
      nextErrors.otraCiudad = 'Escribe el nombre de tu municipio.'
    }

    if (form.barrio.trim().length < 2) {
      nextErrors.barrio = 'Ingresa el nombre de tu barrio.'
    }

    if (form.direccion.trim().length < 4) {
      nextErrors.direccion = 'Ingresa tu dirección completa.'
    }

    if (!form.cumpleanosDia) {
      nextErrors.cumpleanosDia = 'Elige el día.'
    }

    if (!form.cumpleanosMes) {
      nextErrors.cumpleanosMes = 'Elige el mes.'
    }

    if (!form.aceptaTerminos) {
      nextErrors.aceptaTerminos = 'Debes aceptar los términos y condiciones para registrarte.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      const firstKey = Object.keys(nextErrors)[0]
      const el = document.getElementById(`campo-${firstKey}`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const finalCiudad = form.ciudad === 'OTRA' ? form.otraCiudad.trim() : form.ciudad
    const cleanNombre = form.nombreCompleto.replace(/\s+/g, ' ').trim()

    setIsSubmitting(true)
    setErrors((prev) => ({ ...prev, submit: undefined }))

    try {
      const res = await fetch(`${API_BASE}/public/tiendas/${encodeURIComponent(storeSlug)}/familia-registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identificacion: form.identificacion,
          nombreCompleto: cleanNombre,
          email: form.email.trim().toLowerCase(),
          celular: form.celular,
          departamento: form.departamento,
          ciudad: finalCiudad,
          barrio: form.barrio.trim(),
          direccion: form.direccion.trim(),
          cumpleanosDia: Number(form.cumpleanosDia),
          cumpleanosMes: Number(form.cumpleanosMes),
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        const msg =
          typeof data?.message === 'string'
            ? data.message
            : Array.isArray(data?.message)
              ? data.message[0]
              : 'No pudimos completar tu registro. Por favor verifica tus datos e intenta nuevamente.'
        setErrors((prev) => ({ ...prev, submit: msg }))
        toast.error(msg)
        return
      }

      toast.success('¡Bienvenido a la Familia Baby World!', {
        icon: '🎉',
        duration: 5000,
        style: { borderRadius: '1rem', background: '#047857', color: '#fff' },
      })

      setSuccessData({
        esNuevo: Boolean(data?.esNuevo),
        nombre: data?.nombre || cleanNombre,
        identificacion: data?.identificacion || form.identificacion,
        cumpleanosDia: Number(data?.cumpleanosDia || form.cumpleanosDia),
        cumpleanosMes: Number(data?.cumpleanosMes || form.cumpleanosMes),
        ciudad: finalCiudad,
        barrio: form.barrio.trim(),
      })
    } catch {
      const errMsg = 'Error de conexión. Verifica tu internet e intenta nuevamente.'
      setErrors((prev) => ({ ...prev, submit: errMsg }))
      toast.error(errMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const inputBaseClass = (hasError?: boolean) =>
    `w-full px-3.5 py-3 bg-slate-50/80 border rounded-2xl text-base sm:text-sm text-slate-800 placeholder-slate-400 outline-none transition-all ${
      hasError
        ? 'border-rose-400 bg-rose-50/40 focus:ring-2 focus:ring-rose-200 focus:border-rose-500'
        : 'border-slate-200 hover:border-sky-300 focus:bg-white focus:ring-2 focus:ring-baby-200 focus:border-baby-500'
    }`

  const monthLabel =
    MESES_CUMPLEANOS.find((m) => m.value === successData?.cumpleanosMes)?.label || ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-baby-50/60 via-[#F8FAFC] to-blush-50/30 pb-24 sm:pb-16 animate-fade-in">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-slate-100 shadow-2xs">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 py-2.5 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-baby-600 bg-slate-100 hover:bg-baby-50 px-3 py-1.5 rounded-full transition-all active:scale-95 cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Volver a la Tienda</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Inicio</span>
            <ChevronRight size={13} />
            <span className="text-blush-600 font-bold">Familia Baby World</span>
          </div>

          <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-extrabold text-blush-600 bg-blush-50 border border-blush-100 px-2.5 py-1 rounded-full">
            <Heart size={12} className="fill-blush-400 text-blush-500" />
            <span>Club de Beneficios</span>
          </span>
        </div>
      </div>

      {/* Contenido Principal */}
      <div className="max-w-3xl mx-auto px-3.5 sm:px-6 pt-5 sm:pt-8">
        {successData ? (
          /* ════════════════════════════════════════════════════════════════ */
          /* PANTALLA DE CONFIRMACIÓN EXITOSA                                */
          /* ════════════════════════════════════════════════════════════════ */
          <div className="bg-white rounded-3xl border border-slate-100 shadow-soft-baby p-6 sm:p-10 text-center space-y-6 animate-fade-in-up">
            <div className="relative mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-mint-100 via-baby-100 to-blush-100 flex items-center justify-center shadow-inner border-4 border-white">
              <CheckCircle2 size={42} className="text-emerald-600" />
              <span className="absolute -top-1 -right-1 text-xl animate-bounce">🎉</span>
            </div>

            <div className="space-y-2 max-w-lg mx-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold uppercase tracking-wider">
                <Sparkles size={12} />
                {successData.esNuevo ? 'Registro Completado' : 'Datos Actualizados'}
              </span>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight pt-1">
                ¡Bienvenido/a a la{' '}
                <span className="font-baby font-normal tracking-wide text-blush-500">Familia Baby World</span>,{' '}
                <span className="text-baby-600">{successData.nombre.split(' ')[0]}</span>!
              </h1>

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Tus datos ya quedaron guardados en nuestro sistema. Desde ahora haces parte de nuestra comunidad para disfrutar promociones exclusivas, sorpresas en tu cumpleaños y compras mucho más rápidas.
              </p>
            </div>

            {/* Resumen compacto */}
            <div className="bg-slate-50/80 border border-slate-200/70 rounded-2xl p-4 sm:p-5 text-left max-w-md mx-auto space-y-2.5 text-xs">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Titular registrado</span>
                <span className="font-extrabold text-slate-800 text-right">{successData.nombre}</span>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Identificación</span>
                <span className="font-mono font-bold text-slate-800">{successData.identificacion}</span>
              </div>
              <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                <span className="text-slate-500 font-medium">Ubicación</span>
                <span className="font-bold text-slate-800 text-right">
                  {successData.ciudad} • {successData.barrio}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 font-medium">Cumpleaños</span>
                <span className="inline-flex items-center gap-1 font-extrabold text-blush-600 bg-blush-50 px-2.5 py-0.5 rounded-full border border-blush-100">
                  🎂 {successData.cumpleanosDia} de {monthLabel}
                </span>
              </div>
            </div>

            {/* Acciones Post-Registro */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-md mx-auto">
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:flex-1 py-3.5 px-5 bg-slate-900 hover:bg-baby-600 text-white rounded-2xl font-extrabold text-xs sm:text-sm shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                🛍️ Ir a ver el Catálogo
              </button>
              <a
                href={`https://wa.me/573023863380?text=${encodeURIComponent(
                  `Hola Baby-World 👋 Acabo de registrarme en la Familia Baby World con mi nombre ${successData.nombre} (ID: ${successData.identificacion}). ¡Quiero conocer los beneficios!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-3.5 px-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <WhatsAppIcon size={17} />
                <span>Saludar por WhatsApp</span>
              </a>
            </div>
          </div>
        ) : (
          /* ════════════════════════════════════════════════════════════════ */
          /* FORMULARIO DE REGISTRO FAMILIA BABY WORLD                       */
          /* ════════════════════════════════════════════════════════════════ */
          <div className="space-y-5 animate-fade-in-up">
            {/* Tarjeta Encabezado */}
            <div className="relative overflow-hidden bg-gradient-to-br from-baby-50 via-white to-blush-50 rounded-3xl border border-white shadow-soft-baby p-5 sm:p-7">
              <div className="text-center max-w-xl mx-auto space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-blush-500 border border-blush-100 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shadow-2xs">
                  <Sparkles size={13} className="text-butter-500" />
                  <span>Club Familia Baby World</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
                  ¡Sé parte de la{' '}
                  <span className="font-baby font-normal tracking-wide text-blush-500">Familia</span>{' '}
                  <span className="font-baby font-normal tracking-wide text-baby-500">Baby World</span>!
                </h1>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Registra tus datos una sola vez y accede a beneficios pensados para consentirte a ti y a tu bebé.
                </p>

                {/* Beneficios compactos */}
                <div className="grid grid-cols-3 gap-2 pt-2">
                  <div className="bg-white/90 border border-blush-100 rounded-2xl p-2 sm:p-3 flex flex-col items-center gap-1 shadow-2xs">
                    <Calendar size={16} className="text-blush-500" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 leading-tight">
                      Sorpresas de Cumpleaños
                    </span>
                  </div>
                  <div className="bg-white/90 border border-baby-100 rounded-2xl p-2 sm:p-3 flex flex-col items-center gap-1 shadow-2xs">
                    <Percent size={16} className="text-baby-500" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 leading-tight">
                      Ofertas y Promos VIP
                    </span>
                  </div>
                  <div className="bg-white/90 border border-mint-200 rounded-2xl p-2 sm:p-3 flex flex-col items-center gap-1 shadow-2xs">
                    <Truck size={16} className="text-emerald-600" />
                    <span className="text-[10px] sm:text-xs font-bold text-slate-700 leading-tight">
                      Envíos más Ágiles
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tarjeta Formulario */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="bg-white rounded-3xl border border-slate-100 shadow-soft-baby p-4 sm:p-8 space-y-6"
            >
              {errors.submit && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-semibold flex items-start gap-2.5">
                  <AlertCircle size={18} className="shrink-0 mt-0.5 text-rose-500" />
                  <span>{errors.submit}</span>
                </div>
              )}

              {/* BLOQUE 1: Datos Personales */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <div className="w-7 h-7 rounded-xl bg-baby-50 text-baby-600 flex items-center justify-center">
                    <User size={15} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-800">Tus Datos Personales</h2>
                    <p className="text-[11px] text-slate-400">Todos los campos marcados con * son obligatorios</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Identificación (solo números) */}
                  <div id="campo-identificacion">
                    <label
                      htmlFor="input-identificacion"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Identificación <span className="text-slate-400 font-medium">(solo números)</span>{' '}
                      <span className="text-blush-500">*</span>
                    </label>
                    <div className="relative">
                      <CreditCard
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        id="input-identificacion"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="off"
                        value={form.identificacion}
                        onChange={(e) => handleIdentificacionChange(e.target.value)}
                        placeholder="Ej: 1144098765"
                        maxLength={15}
                        className={`${inputBaseClass(!!errors.identificacion)} pl-10 font-mono font-semibold`}
                      />
                    </div>
                    {errors.identificacion && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.identificacion}
                      </p>
                    )}
                  </div>

                  {/* Nombre Completo (solo letras) */}
                  <div id="campo-nombreCompleto">
                    <label
                      htmlFor="input-nombreCompleto"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Nombre Completo <span className="text-slate-400 font-medium">(solo letras)</span>{' '}
                      <span className="text-blush-500">*</span>
                    </label>
                    <div className="relative">
                      <User
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        id="input-nombreCompleto"
                        type="text"
                        autoComplete="name"
                        value={form.nombreCompleto}
                        onChange={(e) => handleNombreChange(e.target.value)}
                        placeholder="Ej: Laura Camila Gómez"
                        maxLength={120}
                        className={`${inputBaseClass(!!errors.nombreCompleto)} pl-10`}
                      />
                    </div>
                    {errors.nombreCompleto && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.nombreCompleto}
                      </p>
                    )}
                  </div>

                  {/* Correo electrónico */}
                  <div id="campo-email">
                    <label
                      htmlFor="input-email"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Correo electrónico <span className="text-blush-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        id="input-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, email: e.target.value }))
                          if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }))
                        }}
                        placeholder="Ej: laura@correo.com"
                        maxLength={120}
                        className={`${inputBaseClass(!!errors.email)} pl-10`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Celular (solo números) */}
                  <div id="campo-celular">
                    <label
                      htmlFor="input-celular"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Celular <span className="text-slate-400 font-medium">(solo números)</span>{' '}
                      <span className="text-blush-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-1 text-xs font-extrabold text-slate-500 bg-slate-200/70 px-2 py-1 rounded-lg pointer-events-none">
                        <Smartphone size={13} className="text-baby-600" />
                        <span>+57</span>
                      </div>
                      <input
                        id="input-celular"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        autoComplete="tel-national"
                        value={form.celular}
                        onChange={(e) => handleCelularChange(e.target.value)}
                        placeholder="3001234567"
                        maxLength={10}
                        className={`${inputBaseClass(!!errors.celular)} pl-[76px] font-mono font-semibold`}
                      />
                    </div>
                    {errors.celular && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.celular}
                      </p>
                    )}
                  </div>
                </div>

                {/* Día y Mes de Cumpleaños */}
                <div
                  id="campo-cumpleanosMes"
                  className="bg-gradient-to-r from-blush-50/70 via-butter-50/40 to-baby-50/60 border border-blush-100 rounded-2xl p-3.5 sm:p-4 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <label className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800">
                      <Calendar size={16} className="text-blush-500" />
                      <span>
                        Día y Mes de Cumpleaños <span className="text-blush-500">*</span>
                      </span>
                    </label>
                    <span className="text-[10px] font-semibold text-blush-600 bg-white/80 px-2.5 py-0.5 rounded-full border border-blush-100">
                      🎁 Para obsequios y descuentos especiales
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3" id="campo-cumpleanosDia">
                    <div>
                      <label htmlFor="select-cumple-mes" className="block text-[11px] font-bold text-slate-600 mb-1">
                        Mes
                      </label>
                      <select
                        id="select-cumple-mes"
                        value={form.cumpleanosMes}
                        onChange={(e) => handleMesChange(e.target.value)}
                        className={`${inputBaseClass(!!errors.cumpleanosMes)} bg-white cursor-pointer`}
                      >
                        <option value="">Selecciona mes...</option>
                        {MESES_CUMPLEANOS.map((m) => (
                          <option key={m.value} value={String(m.value)}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                      {errors.cumpleanosMes && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.cumpleanosMes}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="select-cumple-dia" className="block text-[11px] font-bold text-slate-600 mb-1">
                        Día
                      </label>
                      <select
                        id="select-cumple-dia"
                        value={form.cumpleanosDia}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, cumpleanosDia: e.target.value }))
                          if (errors.cumpleanosDia) setErrors((prev) => ({ ...prev, cumpleanosDia: undefined }))
                        }}
                        className={`${inputBaseClass(!!errors.cumpleanosDia)} bg-white cursor-pointer`}
                      >
                        <option value="">Día...</option>
                        {Array.from({ length: maxDaysInMonth }, (_, i) => i + 1).map((d) => (
                          <option key={d} value={String(d)}>
                            {String(d).padStart(2, '0')}
                          </option>
                        ))}
                      </select>
                      {errors.cumpleanosDia && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.cumpleanosDia}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* BLOQUE 2: Ubicación */}
              <div className="space-y-4 pt-1">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <div className="w-7 h-7 rounded-xl bg-blush-50 text-blush-600 flex items-center justify-center">
                    <MapPin size={15} />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-800">Ubicación y Dirección</h2>
                    <p className="text-[11px] text-slate-400">Para agilizar tus domicilios y envíos</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Departamento */}
                  <div id="campo-departamento">
                    <label
                      htmlFor="select-departamento"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Departamento <span className="text-blush-500">*</span>
                    </label>
                    <select
                      id="select-departamento"
                      value={form.departamento}
                      onChange={(e) => handleDepartamentoChange(e.target.value)}
                      className={`${inputBaseClass(!!errors.departamento)} cursor-pointer`}
                    >
                      <option value="">Selecciona departamento...</option>
                      {DEPARTAMENTOS_COLOMBIA.map((d) => (
                        <option key={d.nombre} value={d.nombre}>
                          {d.nombre}
                        </option>
                      ))}
                    </select>
                    {errors.departamento && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.departamento}</p>
                    )}
                  </div>

                  {/* Ciudad */}
                  <div id="campo-ciudad">
                    <label
                      htmlFor="select-ciudad"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Ciudad / Municipio <span className="text-blush-500">*</span>
                    </label>
                    <select
                      id="select-ciudad"
                      value={form.ciudad}
                      disabled={!form.departamento}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, ciudad: e.target.value, otraCiudad: '' }))
                        if (errors.ciudad) setErrors((prev) => ({ ...prev, ciudad: undefined }))
                      }}
                      className={`${inputBaseClass(!!errors.ciudad)} cursor-pointer disabled:opacity-50`}
                    >
                      <option value="">Selecciona ciudad...</option>
                      {availableCities.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="OTRA">Otro municipio...</option>
                    </select>
                    {errors.ciudad && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.ciudad}</p>
                    )}
                  </div>

                  {/* Input libre si elige "Otro municipio..." */}
                  {form.ciudad === 'OTRA' && (
                    <div id="campo-otraCiudad" className="sm:col-span-2">
                      <label
                        htmlFor="input-otraCiudad"
                        className="block text-xs font-bold text-slate-700 mb-1.5"
                      >
                        Escribe tu municipio o población <span className="text-blush-500">*</span>
                      </label>
                      <input
                        id="input-otraCiudad"
                        type="text"
                        value={form.otraCiudad}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, otraCiudad: e.target.value }))
                          if (errors.otraCiudad) setErrors((prev) => ({ ...prev, otraCiudad: undefined }))
                        }}
                        placeholder="Ej: Ginebra, Guacarí, Villa de Leyva..."
                        maxLength={80}
                        className={inputBaseClass(!!errors.otraCiudad)}
                      />
                      {errors.otraCiudad && (
                        <p className="text-[11px] text-rose-600 font-semibold mt-1">{errors.otraCiudad}</p>
                      )}
                    </div>
                  )}

                  {/* Barrio */}
                  <div id="campo-barrio">
                    <label
                      htmlFor="input-barrio"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Barrio <span className="text-blush-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        id="input-barrio"
                        type="text"
                        value={form.barrio}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, barrio: e.target.value }))
                          if (errors.barrio) setErrors((prev) => ({ ...prev, barrio: undefined }))
                        }}
                        placeholder="Ej: Poblado Campestre"
                        maxLength={80}
                        className={`${inputBaseClass(!!errors.barrio)} pl-10`}
                      />
                    </div>
                    {errors.barrio && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.barrio}
                      </p>
                    )}
                  </div>

                  {/* Dirección */}
                  <div id="campo-direccion">
                    <label
                      htmlFor="input-direccion"
                      className="block text-xs font-bold text-slate-700 mb-1.5"
                    >
                      Dirección <span className="text-blush-500">*</span>
                    </label>
                    <div className="relative">
                      <Home
                        size={16}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                      />
                      <input
                        id="input-direccion"
                        type="text"
                        autoComplete="street-address"
                        value={form.direccion}
                        onChange={(e) => {
                          setForm((prev) => ({ ...prev, direccion: e.target.value }))
                          if (errors.direccion) setErrors((prev) => ({ ...prev, direccion: undefined }))
                        }}
                        placeholder="Ej: Calle 21 # 35-26 Mz 4 Casa 26"
                        maxLength={250}
                        className={`${inputBaseClass(!!errors.direccion)} pl-10`}
                      />
                    </div>
                    {errors.direccion && (
                      <p className="text-[11px] text-rose-600 font-semibold mt-1 flex items-center gap-1">
                        <AlertCircle size={12} /> {errors.direccion}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Términos y Condiciones */}
              <div id="campo-aceptaTerminos" className="pt-1 space-y-2">
                <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.aceptaTerminos}
                    onChange={(e) => {
                      setForm((prev) => ({ ...prev, aceptaTerminos: e.target.checked }))
                      if (errors.aceptaTerminos) setErrors((prev) => ({ ...prev, aceptaTerminos: undefined }))
                    }}
                    className="mt-0.5 w-4 h-4 rounded text-blush-500 accent-blush-500 cursor-pointer shrink-0"
                  />
                  <span className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
                    Autorizo el tratamiento de mis datos personales y acepto los{' '}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        setShowTermsModal(true)
                      }}
                      className="font-bold text-baby-600 hover:text-baby-700 underline cursor-pointer"
                    >
                      términos y condiciones
                    </button>{' '}
                    del Club Familia Baby World.
                  </span>
                </label>
                {errors.aceptaTerminos && (
                  <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} /> {errors.aceptaTerminos}
                  </p>
                )}
              </div>

              {/* Botón de Envío */}
              <div className="pt-1 space-y-2.5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 bg-gradient-to-r from-blush-500 via-blush-400 to-baby-500 hover:brightness-105 disabled:opacity-60 text-white rounded-2xl font-extrabold text-sm sm:text-base shadow-lg shadow-blush-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Guardando tu registro...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>Registrarme en Familia Baby World</span>
                    </>
                  )}
                </button>

                <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={13} className="text-emerald-500" />
                  <span>Tus datos están protegidos y solo se usan para beneficios y atención Baby World.</span>
                </p>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal Términos y Condiciones */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div
            onClick={() => setShowTermsModal(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs"
          />
          <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 p-5 sm:p-6 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <ShieldCheck size={18} className="text-baby-500" />
                <span>Términos y Tratamiento de Datos</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>
            <div className="text-xs text-slate-600 space-y-2.5 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                Al registrarte en el club <b>Familia Baby World</b> autorizas a <b>Distribuidora Baby World</b>, en cumplimiento de la Ley 1581 de 2012 de Protección de Datos Personales en Colombia, para recolectar y almacenar tus datos de contacto y ubicación.
              </p>
              <p>
                Tus datos serán utilizados exclusivamente para gestionar beneficios del club, promociones, obsequios o descuentos por tu cumpleaños, facturación electrónica cuando realices compras y agilizar el despacho de tus pedidos.
              </p>
              <p>
                Los beneficios y promociones de cumpleaños están sujetos a vigencia, disponibilidad y verificación de documento de identidad en tienda física o virtual. Puedes solicitar la actualización o eliminación de tus datos en cualquier momento escribiéndonos al WhatsApp +57 302 386 3380.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowTermsModal(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-baby-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
