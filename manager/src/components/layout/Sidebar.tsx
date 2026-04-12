import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Briefcase, Package, Building2,
  CreditCard, LogOut, Shield, ChevronRight, ChevronDown,
  Headphones, Code2, BarChart3, Ticket,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { EdatiaLogo } from './EdatiaLogo';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  roles?: string[];
}

interface NavGroup {
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  items: NavItem[];
}

const navItems: NavItem[] = [
  { to: '/dashboard',      icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/clientes',       icon: <Building2 size={18} />,       label: 'Clientes' },
  { to: '/colaboradores',  icon: <Users size={18} />,           label: 'Colaboradores',    roles: ['ADMIN'] },
  { to: '/perfiles-cargo', icon: <Briefcase size={18} />,       label: 'Perfiles de Cargo', roles: ['ADMIN'] },
  { to: '/modulos',        icon: <Package size={18} />,         label: 'Módulos Software' },
  { to: '/planes',         icon: <CreditCard size={18} />,      label: 'Planes Base',      roles: ['ADMIN'] },
];

const navGroups: NavGroup[] = [
  {
    label: 'Operación',
    icon: <Headphones size={16} />,
    roles: ['ADMIN', 'OPERACION', 'COORDINACION'],
    items: [
      { to: '/operacion/sac',         icon: <Ticket size={16} />,  label: 'SAC — Mis Tickets' },
      { to: '/operacion/desarrollo',  icon: <Code2 size={16} />,   label: 'Desarrollo' },
    ],
  },
  {
    label: 'Coordinación',
    icon: <BarChart3 size={16} />,
    roles: ['ADMIN', 'COORDINACION'],
    items: [
      { to: '/coordinacion/dashboard', icon: <BarChart3 size={16} />,      label: 'Dashboard' },
      { to: '/coordinacion/tickets',   icon: <Ticket size={16} />,         label: 'Todos los Tickets' },
    ],
  },
];

export function Sidebar() {
  const { colaborador, logout } = useAuth();
  const navigate = useNavigate();
  const rol = colaborador?.rol ?? '';

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'Operación': true,
    'Coordinación': true,
  });

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const visibleItems = navItems.filter(
    (item) => !item.roles || item.roles.includes(rol),
  );

  const visibleGroups = navGroups.filter(
    (g) => !g.roles || g.roles.includes(rol),
  );

  const roleBadge: Record<string, string> = {
    ADMIN:        'bg-brand-purple/20 text-brand-purple border-brand-purple/30',
    COMERCIAL:    'bg-brand-blue/20 text-brand-blue border-brand-blue/30',
    COORDINACION: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    OPERACION:    'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  function NavLinkItem({ item }: { item: NavItem }) {
    return (
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
            isActive
              ? 'bg-gradient-brand text-white shadow-glow-blue'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5',
          )
        }
      >
        {({ isActive }) => (
          <>
            <span className={cn('shrink-0', isActive ? 'text-white' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300')}>
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {!isActive && <ChevronRight size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />}
          </>
        )}
      </NavLink>
    );
  }

  return (
    <aside className="flex flex-col w-60 shrink-0 min-h-screen bg-white dark:bg-navy-800 border-r border-gray-200 dark:border-white/5">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-200 dark:border-white/5">
        <EdatiaLogo size="md" />
        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1 uppercase tracking-widest font-medium">
          Manager · Internal
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {/* Items sueltos */}
        {visibleItems.map((item) => <NavLinkItem key={item.to} item={item} />)}

        {/* Grupos colapsables */}
        {visibleGroups.map((group) => (
          <div key={group.label} className="mt-3">
            <button
              onClick={() => setOpenGroups((p) => ({ ...p, [group.label]: !p[group.label] }))}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-widest hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
            >
              <span className="shrink-0">{group.icon}</span>
              <span className="flex-1 text-left">{group.label}</span>
              <ChevronDown size={12} className={cn('transition-transform', openGroups[group.label] ? 'rotate-0' : '-rotate-90')} />
            </button>
            {openGroups[group.label] && (
              <div className="mt-0.5 space-y-0.5 pl-2">
                {group.items.map((item) => <NavLinkItem key={item.to} item={item} />)}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* User info + logout */}
      <div className="px-3 pb-4 border-t border-gray-200 dark:border-white/5 pt-3 space-y-2">
        {/* Colaborador card */}
        <div className="rounded-lg bg-gray-50 dark:bg-navy-700 border border-gray-200 dark:border-white/5 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
              {colaborador?.nombre?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{colaborador?.nombre}</p>
              <p className="text-xs text-gray-500 dark:text-slate-500 truncate">{colaborador?.email}</p>
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
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-150"
        >
          <LogOut size={16} />
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
