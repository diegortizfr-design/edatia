import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Package,
  Building2,
  CreditCard,
  LogOut,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { EdatiaLogo } from './EdatiaLogo';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[];
  badge?: string;
}

const navItems: NavItem[] = [
  { to: '/dashboard',      icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/clientes',       icon: <Building2 size={18} />,       label: 'Clientes' },
  { to: '/colaboradores',  icon: <Users size={18} />,           label: 'Colaboradores', roles: ['ADMIN'] },
  { to: '/perfiles-cargo', icon: <Briefcase size={18} />,       label: 'Perfiles de Cargo', roles: ['ADMIN'] },
  { to: '/modulos',        icon: <Package size={18} />,         label: 'Módulos Software' },
  { to: '/planes',         icon: <CreditCard size={18} />,      label: 'Planes Base', roles: ['ADMIN'] },
];

export function Sidebar() {
  const { colaborador, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(colaborador?.rol ?? ''),
  );

  const roleBadge: Record<string, string> = {
    ADMIN:        'bg-brand-purple/20 text-brand-purple border-brand-purple/30',
    COMERCIAL:    'bg-brand-blue/20 text-brand-blue border-brand-blue/30',
    COORDINACION: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    OPERACION:    'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  return (
    <aside className="flex flex-col w-60 shrink-0 min-h-screen bg-navy-800 border-r border-white/5">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/5">
        <EdatiaLogo size="md" />
        <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-medium">
          Manager · Internal
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
                isActive
                  ? 'bg-gradient-brand text-white shadow-glow-blue'
                  : 'text-slate-400 hover:text-white hover:bg-white/5',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn('shrink-0', isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300')}>
                  {item.icon}
                </span>
                <span className="flex-1">{item.label}</span>
                {!isActive && (
                  <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 pb-4 border-t border-white/5 pt-3 space-y-2">
        {/* Colaborador card */}
        <div className="rounded-lg bg-navy-700 border border-white/5 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
              {colaborador?.nombre?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{colaborador?.nombre}</p>
              <p className="text-xs text-slate-500 truncate">{colaborador?.email}</p>
            </div>
            {colaborador?.rol === 'ADMIN' && (
              <Shield size={14} className="text-brand-purple shrink-0" />
            )}
          </div>
          {colaborador?.rol && (
            <span
              className={cn(
                'mt-2 inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase tracking-wide',
                roleBadge[colaborador.rol] ?? roleBadge.OPERACION,
              )}
            >
              {colaborador.rol}
            </span>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
