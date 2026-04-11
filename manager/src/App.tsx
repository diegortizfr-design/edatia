import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { ClientesPage } from '@/pages/Clientes';
import { ColaboradoresPage } from '@/pages/Colaboradores';
import { PerfilesCargoPage } from '@/pages/PerfilesCargo';
import { ModulosPage } from '@/pages/Modulos';
import { PlanesPage } from '@/pages/Planes';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard"      element={<DashboardPage />} />
              <Route path="/clientes"       element={<ClientesPage />} />
              <Route path="/colaboradores"  element={<ColaboradoresPage />} />
              <Route path="/perfiles-cargo" element={<PerfilesCargoPage />} />
              <Route path="/modulos"        element={<ModulosPage />} />
              <Route path="/planes"         element={<PlanesPage />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>

        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#111C2E',
              color: '#e2e8f0',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '13px',
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#0B1120' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#0B1120' },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
