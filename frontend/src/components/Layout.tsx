import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, User, BarChart3, Package, Warehouse, Activity, BookOpen, LayoutDashboard, ChevronDown, Truck, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const navLinkCls = ({ isActive }: { isActive: boolean }) =>
  `text-xs font-semibold uppercase tracking-wide transition-colors px-1 py-0.5 ${isActive ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-indigo-600'}`

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [invOpen, setInvOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-16 px-6 flex items-center justify-between bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            <h1 className="text-xl font-bold tracking-tight text-indigo-600">Edatia ERP</h1>
          </Link>
          <nav className="hidden md:flex items-center gap-1 ml-4">
            <NavLink to="/" end className={navLinkCls}>Dashboard</NavLink>

            {/* Inventario dropdown */}
            <div className="relative" onMouseEnter={() => setInvOpen(true)} onMouseLeave={() => setInvOpen(false)}>
              <button className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-indigo-600 transition-colors px-1 py-0.5">
                <Package size={13} />Inventario<ChevronDown size={11} className={`transition-transform ${invOpen ? 'rotate-180' : ''}`} />
              </button>
              {invOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50">
                  {/* Sección principal */}
                  <div className="px-3 pt-2 pb-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">General</p>
                  </div>
                  {[
                    { to: '/inventario/dashboard',  icon: <LayoutDashboard size={14} />, label: 'Dashboard' },
                    { to: '/inventario/productos',   icon: <Package size={14} />,         label: 'Productos' },
                    { to: '/inventario/bodegas',     icon: <Warehouse size={14} />,       label: 'Bodegas' },
                    { to: '/inventario/movimientos', icon: <Activity size={14} />,        label: 'Movimientos' },
                    { to: '/inventario/maestros',    icon: <BookOpen size={14} />,        label: 'Maestros' },
                  ].map(item => (
                    <NavLink key={item.to} to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`
                      }>
                      <span className="text-slate-400">{item.icon}</span>
                      {item.label}
                    </NavLink>
                  ))}
                  {/* Sección compras */}
                  <div className="px-3 pt-3 pb-1 border-t border-slate-100 mt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Compras</p>
                  </div>
                  {[
                    { to: '/inventario/proveedores',    icon: <Truck size={14} />,        label: 'Proveedores' },
                    { to: '/inventario/ordenes-compra', icon: <ShoppingCart size={14} />, label: 'Órdenes de Compra' },
                  ].map(item => (
                    <NavLink key={item.to} to={item.to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-4 py-2 text-sm transition-colors ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'}`
                      }>
                      <span className="text-slate-400">{item.icon}</span>
                      {item.label}
                    </NavLink>
                  ))}
                  <div className="pb-2" />
                </div>
              )}
            </div>

            <NavLink to="/empresas" className={navLinkCls}>Empresas</NavLink>
            <NavLink to="/usuarios" className={navLinkCls}>Usuarios</NavLink>
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
