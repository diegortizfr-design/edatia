import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Users, FolderHeart, Route, LogOut, Wallet, Receipt } from 'lucide-react';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const { tenant, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', name: 'Clientes', icon: Users },
    { id: 'portfolio', name: 'Cartera', icon: FolderHeart },
    { id: 'route', name: 'Ruta del Día', icon: Route },
    { id: 'transactions', name: 'Recibos / Facturas', icon: Receipt },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-slate-900 border-r border-slate-800 flex-col h-screen fixed left-0 top-0 no-print">
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

      {/* Tenant Info */}
      {tenant && (
        <div className="px-6 py-4 border-b border-slate-850 bg-slate-950/40">
          <p className="text-xs text-slate-400 font-medium">Empresa activa:</p>
          <p className="text-sm font-bold text-slate-200 truncate">{tenant.name}</p>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">NIT: {tenant.nit}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
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
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-850">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/5 hover:text-red-300 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};
