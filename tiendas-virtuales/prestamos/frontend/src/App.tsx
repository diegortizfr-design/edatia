import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { ClientDetail } from './pages/ClientDetail';
import { Portfolio } from './pages/Portfolio';
import { Route } from './pages/Route';

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();
  
  // Hash-based simple router
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Synchronize hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['dashboard', 'clients', 'portfolio', 'route'].includes(hash)) {
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
    } else if (['dashboard', 'clients', 'portfolio', 'route'].includes(currentPage)) {
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
    <div className="min-h-screen bg-slate-950 flex">
      {/* Sidebar Navigation */}
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 min-h-screen relative overflow-y-auto print:ml-0 print:p-0 print:bg-white print:text-black">
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
      </main>
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
