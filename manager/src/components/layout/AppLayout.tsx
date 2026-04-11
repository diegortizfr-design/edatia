import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Sidebar } from './Sidebar';
import { Loader2, Moon, Sun } from 'lucide-react';

export function AppLayout() {
  const { colaborador, isLoading } = useAuth();
  const { theme, toggle } = useTheme();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-navy-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-brand-blue" size={32} />
          <p className="text-sm text-gray-500 dark:text-slate-500">Cargando Manager...</p>
        </div>
      </div>
    );
  }

  if (!colaborador) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-navy-950">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 h-14 flex items-center px-6 bg-white/80 dark:bg-navy-950/80 backdrop-blur-sm border-b border-gray-200 dark:border-white/5">
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              onClick={toggle}
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
              className="p-2 rounded-lg text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all duration-150"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse-slow" />
              <span>Sistema operativo</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className="p-6 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
