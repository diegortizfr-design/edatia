import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { 
  LogOut, User, Users, BarChart3, Package, Warehouse, Activity, BookOpen, 
  LayoutDashboard, ChevronDown, Truck, ShoppingCart, AlertTriangle, 
  BarChart2, Hash, Layers, RotateCcw, Archive, FileText, Receipt, 
  Settings, Calculator, ClipboardList, TrendingUp, ClipboardCheck, 
  Monitor, Building2, Globe, ChevronLeft, ChevronRight, Menu, Percent, Coins, Store, Wallet,
  Shield, Lock, Bell, ShieldAlert, Tag, Palette, SlidersHorizontal, LayoutTemplate, ArrowLeftRight
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
    return saved !== null ? saved === 'true' : true
  })

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    inventario: location.pathname.startsWith('/inventario'),
    ventas: location.pathname.startsWith('/ventas') && !location.pathname.startsWith('/ventas/cartera'),
    cartera: location.pathname.startsWith('/ventas/cartera'),
    contabilidad: location.pathname.startsWith('/contabilidad'),
    digital: location.pathname.startsWith('/digital'),
    config: location.pathname.startsWith('/configuracion') && !location.pathname.startsWith('/configuracion/productos') && !location.pathname.startsWith('/configuracion/terceros'),
    configProductos: location.pathname.startsWith('/configuracion/productos'),
    seguridad: location.pathname.startsWith('/seguridad'),
    terceros: location.pathname.startsWith('/configuracion/terceros'),
  })


  // Auto-colapsar menú al cambiar de ruta para priorizar el área de visualización
  useEffect(() => {
    setIsCollapsed(true)
  }, [location.pathname])

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
            {!isCollapsed && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Configuración</p>}
            <NavGroup label="General" icon={<Settings size={18} />} isCollapsed={isCollapsed} isOpen={openGroups.config} onClick={() => toggleGroup('config')}>
              <NavItem to="/configuracion/empresa" icon={<Building2 size={14}/>} label="Empresa" isCollapsed={isCollapsed} />
              <NavItem to="/configuracion/contable" icon={<Calculator size={14}/>} label="Contable" isCollapsed={isCollapsed} />
              <NavItem to="/configuracion/formatos-impresion" icon={<LayoutTemplate size={14}/>} label="Formatos de Impresión" isCollapsed={isCollapsed} />
              <NavItem to="/configuracion/documentos" icon={<FileText size={14}/>} label="Documentos" isCollapsed={isCollapsed} />
              <NavItem to="/configuracion/archivo" icon={<Archive size={14}/>} label="Archivo" isCollapsed={isCollapsed} />
              <NavItem to="/configuracion/impuestos" icon={<Percent size={14}/>} label="Impuestos" isCollapsed={isCollapsed} />
              <NavItem to="/configuracion/geolocalizacion" icon={<Globe size={14}/>} label="Geolocalización" isCollapsed={isCollapsed} />
              <NavItem to="/configuracion/monedas" icon={<Coins size={14}/>} label="Monedas" isCollapsed={isCollapsed} />
              <NavItem to="/configuracion/formas-medios-pago" icon={<Coins size={14}/>} label="Formas / Medios de Pago" isCollapsed={isCollapsed} />
              <NavItem to="/configuracion/sucursales" icon={<Store size={14}/>} label="Sucursales" isCollapsed={isCollapsed} />
              <NavItem to="/configuracion/cajas-bancos" icon={<Wallet size={14}/>} label="Cajas / Bancos" isCollapsed={isCollapsed} />
              <NavItem to="/ventas/config-dian" icon={<FileText size={14}/>} label="Facturación DIAN" isCollapsed={isCollapsed} />
            </NavGroup>

            <NavGroup label="Gestión de Terceros" icon={<Users size={18} />} isCollapsed={isCollapsed} isOpen={openGroups.terceros} onClick={() => toggleGroup('terceros')}>
              <NavItem to="/configuracion/terceros" icon={<Users size={14}/>} label="Terceros" isCollapsed={isCollapsed} end />
              <NavItem to="/configuracion/terceros/vendedores" icon={<User size={14}/>} label="Vendedores" isCollapsed={isCollapsed} />
              <NavItem to="/configuracion/terceros/unificar" icon={<RotateCcw size={14}/>} label="Unificar Terceros" isCollapsed={isCollapsed} />
              <NavItem to="/configuracion/terceros/regimen-tributario" icon={<Lock size={14}/>} label="Regimen Tributario" isCollapsed={isCollapsed} />
              <NavItem to="/configuracion/terceros/reportes" icon={<BarChart3 size={14}/>} label="Reportes" isCollapsed={isCollapsed} />
              <NavItem to="/configuracion/terceros/tags" icon={<Tag size={14}/>} label="Tags" isCollapsed={isCollapsed} />
            </NavGroup>


            <NavGroup label="Productos" icon={<Package size={18} />} isCollapsed={isCollapsed} isOpen={openGroups.configProductos} onClick={() => toggleGroup('configProductos')}>
              <NavItem to="/configuracion/productos" icon={<Package size={14}/>} label="Productos" isCollapsed={isCollapsed} end={true} />
              <NavItem to="/configuracion/productos/maestros" icon={<SlidersHorizontal size={14}/>} label="Maestros" isCollapsed={isCollapsed} />
            </NavGroup>

            <NavGroup label="Seguridad" icon={<ShieldAlert size={18} />} isCollapsed={isCollapsed} isOpen={openGroups.seguridad} onClick={() => toggleGroup('seguridad')}>
              <NavItem to="/seguridad/usuarios" icon={<Users size={14}/>} label="Usuarios" isCollapsed={isCollapsed} />
              <NavItem to="/seguridad/roles" icon={<Shield size={14}/>} label="Roles" isCollapsed={isCollapsed} />
              <NavItem to="/seguridad/notificaciones" icon={<Bell size={14}/>} label="Notificaciones" isCollapsed={isCollapsed} />
              <NavItem to="/seguridad/cierre-periodo" icon={<Lock size={14}/>} label="Cierre Periodo" isCollapsed={isCollapsed} />
              <NavItem to="/seguridad/auditoria" icon={<ClipboardList size={14}/>} label="Auditoría" isCollapsed={isCollapsed} />
            </NavGroup>
          </div>

          <div className="py-2">
            {!isCollapsed && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">Operaciones</p>}
            
            {hasModule('inventario') && (
              <NavGroup label="Inventario" icon={<Package size={18} />} isCollapsed={isCollapsed} isOpen={openGroups.inventario} onClick={() => toggleGroup('inventario')}>
                <NavItem to="/inventario/proveedores" icon={<Truck size={14}/>} label="Proveedores" isCollapsed={isCollapsed} />
                <NavItem to="/inventario/compras" icon={<ShoppingCart size={14}/>} label="Compras" isCollapsed={isCollapsed} />
                <NavItem to="/inventario/control-existencias" icon={<Package size={14}/>} label="Control de Existencia" isCollapsed={isCollapsed} />
                <NavItem to="/inventario/traslados" icon={<ArrowLeftRight size={14}/>} label="Traslados de Inventario" isCollapsed={isCollapsed} />
                <NavItem to="/inventario/movimientos" icon={<RotateCcw size={14}/>} label="Movimientos" isCollapsed={isCollapsed} />
                <NavItem to="/inventario/bodegas" icon={<Warehouse size={14}/>} label="Gestión de Bodegas" isCollapsed={isCollapsed} />
                <NavItem to="/inventario/radian" icon={<ClipboardCheck size={14}/>} label="RADIAN" isCollapsed={isCollapsed} />
              </NavGroup>
            )}

            {hasModule('ventas') && (
              <>
                <NavGroup label="Facturación" icon={<ShoppingCart size={18} />} isCollapsed={isCollapsed} isOpen={openGroups.ventas} onClick={() => toggleGroup('ventas')}>
                  <NavItem to="/ventas/clientes" icon={<Users size={14}/>} label="Clientes" isCollapsed={isCollapsed} />
                  <NavItem to="/ventas/pedidos" icon={<ClipboardList size={14}/>} label="Pedidos" isCollapsed={isCollapsed} />
                  <NavItem to="/ventas/facturas" icon={<FileText size={14}/>} label="Facturas" isCollapsed={isCollapsed} />
                  <NavItem to="/pos" icon={<Monitor size={14}/>} label="Punto de Venta" isCollapsed={isCollapsed} end />
                  <NavItem to="/pos/ventas" icon={<Receipt size={14}/>} label="Ventas POS" isCollapsed={isCollapsed} />
                  <NavItem to="/ventas/notas-credito" icon={<RotateCcw size={14}/>} label="Notas Crédito" isCollapsed={isCollapsed} />
                  <NavItem to="/ventas/dashboard" icon={<TrendingUp size={14}/>} label="Reportes" isCollapsed={isCollapsed} />
                </NavGroup>
                
                <NavGroup label="Cartera" icon={<Coins size={18} />} isCollapsed={isCollapsed} isOpen={openGroups.cartera} onClick={() => toggleGroup('cartera')}>
                  <NavItem to="/ventas/cartera/cxc" icon={<Receipt size={14}/>} label="Cuentas por Cobrar" isCollapsed={isCollapsed} />
                  <NavItem to="/ventas/cartera/por-edades" icon={<BarChart3 size={14}/>} label="Cartera por edades" isCollapsed={isCollapsed} />
                </NavGroup>
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
                <div className="h-px bg-slate-100 my-1 mx-2" />
                <NavItem to="/contabilidad/tesoreria/pagos" icon={<ClipboardList size={14}/>} label="Gestionar Pagos" isCollapsed={isCollapsed} />
                <NavItem to="/contabilidad/tesoreria/saldos" icon={<Wallet size={14}/>} label="Saldos Cajas/Bancos" isCollapsed={isCollapsed} />
              </NavGroup>
            </div>
          )}
        </nav>

        {/* Sidebar Footer (Profile + Logout + Collapse Trigger) */}
        <div className="p-4 border-t border-slate-100 space-y-3 shrink-0">
          {/* User Profile & Logout Box */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 font-bold text-sm">
                  {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 leading-tight">
                  <p className="text-xs font-bold text-slate-700 truncate">{user?.nombre ?? user?.usuario}</p>
                  <p className="text-[9px] font-semibold text-indigo-500 uppercase tracking-wider">{user?.rol ?? 'Usuario'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm cursor-pointer group relative">
                {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
                <div className="absolute left-12 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] whitespace-nowrap">
                  {user?.nombre ?? user?.usuario} ({user?.rol ?? 'Usuario'})
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group relative"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
                <div className="absolute left-12 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-[60] whitespace-nowrap">
                  Cerrar sesión
                </div>
              </button>
            </div>
          )}

          {/* Collapse Button */}
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
        {/* CONTENT */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6 lg:p-10 custom-scrollbar relative">
          {/* Marca de agua translúcida de EDATIA */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none z-0 opacity-[0.03] p-10">
            <svg viewBox="0 0 100 100" className="w-80 h-80 max-w-full">
              <defs>
                <linearGradient id="watermarkGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1E293B" />
                  <stop offset="100%" stopColor="#4F46E5" />
                </linearGradient>
              </defs>
              <rect x="5" y="5" width="90" height="90" rx="20" fill="url(#watermarkGradient)" />
              <rect x="25" y="60" width="8" height="15" rx="2" fill="white" />
              <rect x="40" y="45" width="8" height="30" rx="2" fill="white" />
              <rect x="55" y="52" width="8" height="23" rx="2" fill="white" />
              <rect x="70" y="35" width="8" height="40" rx="2" fill="white" />
              <path d="M29 60 L44 45 L59 52 L74 35" stroke="#60A5FA" strokeWidth="3" fill="none" strokeLinecap="round" />
              <circle cx="29" cy="60" r="3" fill="#60A5FA" />
              <circle cx="44" cy="45" r="3" fill="#60A5FA" />
              <circle cx="59" cy="52" r="3" fill="#60A5FA" />
              <circle cx="74" cy="35" r="3" fill="#60A5FA" />
            </svg>
            <span className="text-6xl font-black tracking-[0.25em] text-slate-800 mt-6 select-none">EDATIA</span>
          </div>

          <div className="w-full relative z-10">
            {children}
          </div>
        </main>
      </div>

      <SupportButton />
    </div>
  )
}
