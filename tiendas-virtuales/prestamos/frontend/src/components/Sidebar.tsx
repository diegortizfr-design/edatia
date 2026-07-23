import React from 'react';
import { useAuth } from '../context/AuthContext';
import { AdSenseBanner } from './AdSenseBanner';
import { LayoutDashboard, Users, FolderHeart, Route, LogOut, Wallet, Receipt, Sun, Moon } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, theme, setTheme }) => {
  const { tenant, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', name: 'Clientes', icon: Users },
    { id: 'portfolio', name: 'Cartera', icon: FolderHeart },
    { id: 'route', name: 'Ruta del Día', icon: Route },
    { id: 'transactions', name: 'Recibos / Facturas', icon: Receipt },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col h-screen fixed left-0 top-0 no-print overflow-y-auto">
      {/* Header / Logo */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center shadow-lg shadow-brand-500/10">
          <Wallet className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="font-bold text-white leading-none">Préstamos</h2>
          <span className="text-[10px] text-brand-400 font-semibold tracking-wider uppercase">
            Control de Cartera
          </span>
        </div>
      </div>

      {/* Tenant Info & Quick Logout */}
      {tenant && (
        <div className="px-5 py-3 border-b border-slate-850 bg-slate-950/50 flex items-center justify-between">
          <div className="overflow-hidden">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Empresa activa:</p>
            <p className="text-xs font-bold text-slate-200 truncate">{tenant.name}</p>
            <p className="text-[10px] text-slate-500 font-mono">NIT: {tenant.nit}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-red-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ml-2 border border-red-500/20 bg-red-500/10"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-[11px] font-bold">Salir</span>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id || (item.id === 'clients' && currentPage === 'client-detail');
          
          return (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-600 text-white shadow-lg shadow-brand-500/15'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </button>
          );
        })}

        {/* Botón de Salir en Navegación */}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-red-400 hover:bg-red-500/15 hover:text-red-300 transition-all mt-4 border border-red-500/20 bg-red-500/5"
        >
          <LogOut className="w-5 h-5 text-red-400" />
          Cerrar Sesión
        </button>
      </nav>

      {/* Theme Selector Toggle */}
      <div className="px-4 py-3 border-t border-slate-850">
        <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 px-2">
          Tema Visual
        </label>
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-lg border border-slate-850">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition ${
              theme === 'light'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" /> Claro
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-semibold transition ${
              theme === 'dark'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-400" /> Oscuro
          </button>
        </div>
      </div>

      {/* Ad Banner for Free Tier */}
      <div className="px-4 py-1 no-print">
        <AdSenseBanner slot="1234567890" style={{ height: '90px' }} />
      </div>
    </aside>
  );
};
