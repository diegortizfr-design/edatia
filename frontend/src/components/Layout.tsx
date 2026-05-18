import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { 
  LogOut, User, Users, BarChart3, Package, Warehouse, Activity, BookOpen, 
  LayoutDashboard, ChevronDown, Truck, ShoppingCart, AlertTriangle, 
  BarChart2, Hash, Layers, RotateCcw, Archive, FileText, Receipt, 
  Settings, Calculator, ClipboardList, TrendingUp, ClipboardCheck, 
  Monitor, Building2, Globe, ChevronLeft, ChevronRight, Menu 
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { SupportButton } from './SupportButton'

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  end?: boolean;
}

const NavItem = ({ to, icon, label, isCollapsed, end }: NavItemProps) => (
  <NavLink 
    to={to} 
    end={end}
    className={({ isActive }) => `
      flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group
      ${isActive 
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
        : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'}
    `}
  >
    <span className="shrink-0">{icon}</span>
    {!isCollapsed && <span className="text-sm font-medium whitespace-nowrap">{label}</span>}
    {isCollapsed && (
       <div className="absolute left-16 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] whitespace-nowrap">
         {label}
       </div>
    )}
  </NavLink>
)

interface NavGroupProps {
  label: string;
  icon: React.ReactNode;
  isCollapsed: boolean;
  isOpen: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const NavGroup = ({ label, icon, isCollapsed, isOpen, onClick, children }: NavGroupProps) => (
  <div className="space-y-1">
    <button
      onClick={onClick}
      className={`
        w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group
        ${isOpen ? 'bg-slate-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-100'}
      `}
    >
      <div className="flex items-center gap-3">
        <span className="shrink-0">{icon}</span>
        {!isCollapsed && <span className="text-sm font-medium">{label}</span>}
      </div>
      {!isCollapsed && (
        <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      )}
      {isCollapsed && (
         <div className="absolute left-16 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] whitespace-nowrap">
           {label}
         </div>
      )}
    </button>
    {isOpen && !isCollapsed && (
      <div className="ml-9 space-y-1 border-l border-slate-200 pl-2">
        {children}
      </div>
    )}
  </div>
)

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    return saved === 'true'
  })

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    inventario: location.pathname.startsWith('/inventario'),
    ventas: location.pathname.startsWith('/ventas'),
    contabilidad: location.pathname.startsWith('/contabilidad'),
    digital: location.pathname.startsWith('/digital'),
    config: location.pathname.startsWith('/configuracion'),
  })

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isCollapsed))
  }, [isCollapsed])

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }))
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const hasModule = (slug: string) => {
    // Si no hay modulos permitidos (no debería pasar), mostramos todo por defecto o nada
    if (!user?.modulosPermitidos) return true;
    return user.modulosPermitidos.includes(slug);
  }

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden font-sans">
      {/* SIDEBAR */}
      <aside 
        className={`
          flex flex-col bg-white border-r border-slate-200 shadow-xl z-50 transition-all duration-300 ease-in-out relative
          ${isCollapsed ? 'w-20' : 'w-64'}
        `}
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0 overflow-hidden">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            {/* Logo Oficial Edatia (SVG) */}
            <div className="w-9 h-9 shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1E293B" />
                    <stop offset="100%" stopColor="#4F46E5" />
                  </linearGradient>
                  <linearGradient id="barGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#60A5FA" />
                  </linearGradient>
                </defs>
                <rect x="5" y="5" width="90" height="90" rx="20" fill="url(#logoGradient)" />
                {/* Barras del gráfico */}
                <rect x="25" y="60" width="8" height="15" rx="2" fill="white" />
                <rect x="40" y="45" width="8" height="30" rx="2" fill="white" />
                <rect x="55" y="52" width="8" height="23" rx="2" fill="white" />
                <rect x="70" y="35" width="8" height="40" rx="2" fill="white" />
                {/* Línea de tendencia */}
                <path d="M29 60 L44 45 L59 52 L74 35" stroke="#60A5FA" strokeWidth="3" fill="none" strokeLinecap="round" />
                <circle cx="29" cy="60" r="3" fill="#60A5FA" />
                <circle cx="44" cy="45" r="3" fill="#60A5FA" />
                <circle cx="59" cy="52" r="3" fill="#60A5FA" />
                <circle cx="74" cy="35" r="3" fill="#60A5FA" />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="flex flex-col leading-none">
                <span className="text-lg font-extrabold tracking-tight text-slate-800">EDATIA</span>
                <span className="text-[10px] font-bold text-indigo-600 tracking-[0.2em] ml-0.5">SOFTWARE ERP</span>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-1 custom-scrollbar">
          <div className="pb-2">
            {!isCollapsed && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">General</p>}
            <NavItem to="/" icon={<LayoutDashboard size={18} />} label="Dashboard" isCollapsed={isCollapsed} end />
          </div>

          <div className="py-2">
            {!isCollapsed && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Operaciones</p>}
            
            {hasModule('inventario') && (
              <NavGroup label="Inventario" icon={<Package size={18} />} isCollapsed={isCollapsed} isOpen={openGroups.inventario} onClick={() => toggleGroup('inventario')}>
                <NavItem to="/inventario/dashboard" icon={<Activity size={14}/>} label="Análisis" isCollapsed={isCollapsed} />
                <NavItem to="/inventario/productos" icon={<Package size={14}/>} label="Productos" isCollapsed={isCollapsed} />
                <NavItem to="/inventario/bodegas" icon={<Warehouse size={14}/>} label="Bodegas" isCollapsed={isCollapsed} />
                <NavItem to="/inventario/movimientos" icon={<RotateCcw size={14}/>} label="Movimientos" isCollapsed={isCollapsed} />
              </NavGroup>
            )}

            {hasModule('ventas') && (
              <>
                <NavGroup label="Ventas" icon={<ShoppingCart size={18} />} isCollapsed={isCollapsed} isOpen={openGroups.ventas} onClick={() => toggleGroup('ventas')}>
                  <NavItem to="/ventas/dashboard" icon={<TrendingUp size={14}/>} label="Dashboard" isCollapsed={isCollapsed} />
                  <NavItem to="/ventas/clientes" icon={<Users size={14}/>} label="Clientes" isCollapsed={isCollapsed} />
                  <NavItem to="/ventas/facturas" icon={<FileText size={14}/>} label="Facturas" isCollapsed={isCollapsed} />
                </NavGroup>
                
                <NavItem to="/pos" icon={<Monitor size={18} />} label="Punto de Venta" isCollapsed={isCollapsed} />
              </>
            )}
            
            {hasModule('digital') && (
              <NavGroup label="Digital" icon={<Globe size={18} />} isCollapsed={isCollapsed} isOpen={openGroups.digital} onClick={() => toggleGroup('digital')}>
                <NavItem to="/digital/dashboard" icon={<Activity size={14}/>} label="E-commerce" isCollapsed={isCollapsed} />
                <NavItem to="/digital/catalogo" icon={<Package size={14}/>} label="Vitrina Web" isCollapsed={isCollapsed} />
                <NavItem to="/digital/config" icon={<Settings size={14}/>} label="Ajustes Tienda" isCollapsed={isCollapsed} />
              </NavGroup>
            )}
          </div>

          {hasModule('contable') && (
            <div className="py-2">
              {!isCollapsed && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Finanzas</p>}
              <NavGroup label="Contabilidad" icon={<Calculator size={18} />} isCollapsed={isCollapsed} isOpen={openGroups.contabilidad} onClick={() => toggleGroup('contabilidad')}>
                <NavItem to="/contabilidad/puc" icon={<BookOpen size={14}/>} label="PUC" isCollapsed={isCollapsed} />
                <NavItem to="/contabilidad/comprobantes" icon={<ClipboardList size={14}/>} label="Comprobantes" isCollapsed={isCollapsed} />
              </NavGroup>
            </div>
          )}

          <div className="py-2">
            {!isCollapsed && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Soporte</p>}
            <NavGroup label="Configuración" icon={<Settings size={18} />} isCollapsed={isCollapsed} isOpen={openGroups.config} onClick={() => toggleGroup('config')}>
              <NavItem to="/configuracion/empresa" icon={<Building2 size={14}/>} label="Mi Empresa" isCollapsed={isCollapsed} />
              <NavItem to="/ventas/config-dian" icon={<FileText size={14}/>} label="Facturación DIAN" isCollapsed={isCollapsed} />
            </NavGroup>
          </div>
        </nav>

        {/* Sidebar Footer / Collapse Trigger */}
        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <div className="flex items-center gap-2"><ChevronLeft size={18} /><span className="text-xs font-semibold">Colapsar</span></div>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 z-40 shadow-sm">
          <div className="flex items-center gap-4">
             <h2 className="text-sm font-medium text-slate-500 capitalize">
               {location.pathname.split('/').filter(Boolean).join(' / ') || 'Dashboard'}
             </h2>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <User size={18} />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-slate-800 leading-tight">{user?.nombre ?? user?.usuario}</p>
                <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider">{user?.rol ?? 'Usuario'}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      <SupportButton />
    </div>
  )
}
