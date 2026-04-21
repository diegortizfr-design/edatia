import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { BarChart3, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

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
      setError('Ingresa tu usuario/email y contraseña.')
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200">
            <BarChart3 className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Edatia ERP</h1>
          <p className="text-slate-500 text-sm mt-1">Ingresa a tu cuenta para continuar</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="nit" className="block text-sm font-medium text-slate-700 mb-1.5">
                NIT de la empresa
              </label>
              <input
                id="nit"
                type="text"
                autoComplete="organization"
                placeholder="900123456-7"
                value={nit}
                onChange={(e) => setNit(e.target.value)}
                disabled={isLoading}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="identifier" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email o usuario
              </label>
              <input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="tu@empresa.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isLoading}
                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all disabled:opacity-50"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="w-full p-3.5 pr-12 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all disabled:opacity-50"
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
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-indigo-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Entrar al Sistema'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          &copy; {new Date().getFullYear()} Edatia SaaS. Todos los derechos reservados.
        </p>
      </div>
    </div>
  )
}
