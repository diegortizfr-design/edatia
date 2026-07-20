import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { ClientDetail } from './pages/ClientDetail';
import { Portfolio } from './pages/Portfolio';
import { Route } from './pages/Route';
import { Transactions } from './pages/Transactions';

import { LayoutDashboard, Users, FolderHeart, Route as RouteIcon, LogOut, Wallet, Receipt, Sun, Moon } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading, tenant, logout } = useAuth();

  // Theme state with localStorage persistence
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  // Dynamic Google AdSense Loader based on Premium Subscription
  useEffect(() => {
    // If authenticated and tenant is premium: do not load ads, remove script and frames if exists
    if (isAuthenticated && tenant?.isPremium) {
      const existingScript = document.getElementById('adsense-script');
      if (existingScript) {
        existingScript.remove();
      }
      const googlePlacements = document.querySelectorAll('.google-auto-placed, ins.adsbygoogle');
      googlePlacements.forEach(el => el.remove());
      return;
    }

    // If not logged in (landing/login page) or if logged in as FREE (non-premium) tenant:
    // Load the script tag dynamically
    if (!document.getElementById('adsense-script')) {
      const script = document.createElement('script');
      script.id = 'adsense-script';
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9138086731888541';
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  }, [isAuthenticated, tenant]);
  
  // Hash-based simple router
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'clients', name: 'Clientes', icon: Users },
    { id: 'portfolio', name: 'Cartera', icon: FolderHeart },
    { id: 'route', name: 'Ruta', icon: RouteIcon },
    { id: 'transactions', name: 'Recibos', icon: Receipt },
  ];

  // Synchronize hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'clients', 'portfolio', 'route', 'transactions'].includes(hash)) {
        setCurrentPage(hash);
      } else if (hash.startsWith('clients/') && hash.split('/')[1]) {
        setSelectedClientId(hash.split('/')[1]);
        setCurrentPage('client-detail');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initial load hash check
    handleHashChange();

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Update hash when page changes programmatically
  useEffect(() => {
    if (currentPage === 'client-detail' && selectedClientId) {
      window.location.hash = `clients/${selectedClientId}`;
    } else if (['dashboard', 'clients', 'portfolio', 'route', 'transactions'].includes(currentPage)) {
      window.location.hash = currentPage;
    }
  }, [currentPage, selectedClientId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800 fixed top-0 left-0 right-0 z-40 no-print">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center shadow-md">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-white leading-none">Préstamos</h1>
            {tenant && <span className="text-[10px] text-slate-400 font-semibold block mt-0.5 max-w-[150px] truncate">{tenant.name}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 text-slate-400 hover:bg-slate-800 rounded-lg transition"
            title={theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-400" />}
          </button>
          <button 
            onClick={logout} 
            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Sidebar Navigation (Desktop only) */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} theme={theme} setTheme={setTheme} />

      {/* Main Content Area */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 min-h-screen relative overflow-y-auto print:ml-0 print:p-0 print:bg-white print:text-black pt-16 md:pt-8 pb-20 md:pb-8">
        {currentPage === 'dashboard' && <Dashboard setCurrentPage={setCurrentPage} />}
        {currentPage === 'clients' && (
          <Clients 
            setCurrentPage={setCurrentPage} 
            setSelectedClientId={setSelectedClientId} 
          />
        )}
        {currentPage === 'client-detail' && selectedClientId && (
          <ClientDetail 
            clientId={selectedClientId} 
            onBack={() => setCurrentPage('clients')} 
          />
        )}
        {currentPage === 'portfolio' && (
          <Portfolio 
            setCurrentPage={setCurrentPage} 
            setSelectedClientId={setSelectedClientId} 
          />
        )}
        {currentPage === 'route' && (
          <Route 
            setCurrentPage={setCurrentPage} 
            setSelectedClientId={setSelectedClientId} 
          />
        )}
        {currentPage === 'transactions' && <Transactions />}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden flex items-center justify-around bg-slate-900/95 backdrop-blur border-t border-slate-800 fixed bottom-0 left-0 right-0 h-16 z-40 px-2 no-print pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id || (item.id === 'clients' && currentPage === 'client-detail');
          
          return (
            <button
              key={item.id}
              onClick={() => {
                setSelectedClientId(null);
                setCurrentPage(item.id);
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all text-xs font-semibold ${
                isActive 
                  ? 'text-brand-400' 
                  : 'text-slate-400'
              }`}
            >
              <div className={`p-1 rounded-lg transition-all ${isActive ? 'bg-brand-600/15 text-brand-400' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[9px] mt-0.5">{item.name}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
