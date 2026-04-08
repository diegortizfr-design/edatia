import { Link, useNavigate } from 'react-router-dom'
import { LogOut, User, BarChart3 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight text-indigo-600">Edatia ERP</h1>
          </Link>
          <nav className="hidden md:flex gap-4 ml-6 uppercase text-xs font-semibold text-slate-500">
            <Link to="/" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
            <Link to="/empresas" className="hover:text-indigo-600 transition-colors">Empresas</Link>
            <Link to="/usuarios" className="hover:text-indigo-600 transition-colors">Usuarios</Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="h-4 w-4" />
            <span className="font-medium">{user?.nombre ?? user?.usuario}</span>
            {user?.rol === 'admin' && (
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-semibold">
                Admin
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 md:p-8">
        {children}
      </main>

      <footer className="py-4 px-6 text-center text-slate-400 text-xs border-t border-slate-200">
        &copy; {new Date().getFullYear()} Edatia SaaS. Todos los derechos reservados.
      </footer>
    </div>
  )
}
