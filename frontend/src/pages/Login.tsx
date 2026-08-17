import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BarChart3, Eye, EyeOff, Loader2, Phone, MessageSquare, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import loginBg from '../assets/login-bg.png'

export function Login() {
  const [nit, setNit] = useState('')
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { login, isLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nit.trim()) {
      setError('Ingresa el NIT de tu empresa.')
      return
    }
    if (!identifier.trim() || !password) {
      setError('Ingresa tu usuario y contraseña.')
      return
    }

    try {
      await login({ nit: nit.trim(), identifier, password })
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: { error?: string } | string } } })
          ?.response?.data?.message
      if (typeof msg === 'object' && msg?.error) {
        setError(msg.error)
      } else if (typeof msg === 'string') {
        setError(msg)
      } else {
        setError('Error al iniciar sesión. Verifica tus credenciales.')
      }
    }
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 font-sans">
      {/* PANEL IZQUIERDO (DISEÑO PREMIUM CON ILUSTRACIÓN VECTORIAL) */}
      <div className="hidden md:flex md:w-[45%] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex-col justify-between p-16 relative overflow-hidden shrink-0">
        {/* Orbes de luz decorativos de fondo */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
        
        {/* Rejilla de fondo digital */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        {/* Logo superior */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
              <defs>
                <linearGradient id="logoGradientLogin" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#818CF8" />
                  <stop offset="100%" stopColor="#4F46E5" />
                </linearGradient>
              </defs>
              <rect x="5" y="5" width="90" height="90" rx="20" fill="url(#logoGradientLogin)" />
              <rect x="25" y="60" width="8" height="15" rx="2" fill="white" />
              <rect x="40" y="45" width="8" height="30" rx="2" fill="white" />
              <rect x="55" y="52" width="8" height="23" rx="2" fill="white" />
              <rect x="70" y="35" width="8" height="40" rx="2" fill="white" />
              <path d="M29 60 L44 45 L59 52 L74 35" stroke="#60A5FA" strokeWidth="3" fill="none" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-wider">EDATIA</span>
            <span className="text-[10px] font-bold text-indigo-300 tracking-[0.2em] ml-0.5">SISTEMA ERP</span>
          </div>
        </div>

        {/* Ilustración de fondo en el centro */}
        <div className="my-auto relative z-10 flex justify-center">
          <img
            src={loginBg}
            alt="Edatia ERP"
            className="w-full max-w-md rounded-2xl shadow-2xl border border-slate-800/40 object-cover transform hover:scale-[1.02] transition-transform duration-300"
          />
        </div>

        {/* Mensaje al pie */}
        <div className="relative z-10">
          <p className="text-xl font-medium leading-relaxed text-indigo-100">
            Automatiza los procesos operativos para la entrega de información detallada que requieras.
          </p>
          <div className="mt-6 flex items-center gap-2 text-xs text-indigo-300">
            <ShieldCheck size={16} />
            <span>Conexión cifrada de alta seguridad SSL</span>
          </div>
        </div>
      </div>

      {/* PANEL DERECHO (FORMULARIO Y CONTACTO) */}
      <div className="flex-1 bg-white flex flex-col justify-between p-8 md:p-16 min-h-screen overflow-y-auto">
        {/* Cabecera (solo en móvil) */}
        <div className="flex justify-between items-center md:hidden mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-slate-800">EDATIA ERP</span>
          </div>
        </div>

        <div className="my-auto max-w-md w-full mx-auto">
          {/* Encabezado del Formulario */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">¡Bienvenido!</h2>
            <p className="text-slate-500 mt-2">Ingresa tus datos de autenticación para acceder al sistema</p>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="nit" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                NIT de la empresa
              </label>
              <input
                id="nit"
                type="text"
                autoComplete="organization"
                placeholder="Ingresa el NIT"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-800 disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="identifier" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                Usuario
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="Ingresa tu usuario"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-800 disabled:opacity-50"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Contraseña
                </label>
                <a href="#olvide-contrasena" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                  ¿Olvidó su contraseña?
                </a>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-3 pr-12 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all text-slate-800 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
        </div>

        {/* Pie del Formulario / Canales de Soporte */}
        <div className="mt-12 max-w-md w-full mx-auto border-t border-slate-100 pt-6">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            Canales de atención
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
            <a href="https://wa.me/573205704262" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg transition-colors group">
              <MessageSquare size={16} className="text-indigo-600 group-hover:scale-110 transition-transform" />
              <div>
                <p className="font-bold text-slate-800">Soporte WhatsApp</p>
                <p className="text-[10px] text-slate-500">(+57) 320 570 4262</p>
              </div>
            </a>
            <div className="flex items-center gap-2 p-2">
              <Phone size={16} className="text-indigo-600" />
              <div>
                <p className="font-bold text-slate-800">Mesa de Ayuda</p>
                <p className="text-[10px] text-slate-500">Lunes a Viernes 8am - 6pm</p>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 mt-6 text-center sm:text-left">
            &copy; {new Date().getFullYear()} Edatia SaaS. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
