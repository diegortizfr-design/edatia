import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoginPage } from '@/pages/Login';
import { DashboardPage } from '@/pages/Dashboard';
import { ClientesPage } from '@/pages/Clientes';
import { ClienteForm } from '@/pages/ClienteForm';
import { OperacionSACPage } from '@/pages/OperacionSAC';
import { OperacionDesarrolloPage } from '@/pages/OperacionDesarrollo';
import { TicketDetalle } from '@/pages/TicketDetalle';
import { CoordinacionDashboardPage } from '@/pages/CoordinacionDashboard';
import { CoordinacionTicketsPage } from '@/pages/CoordinacionTickets';
import { ColaboradoresPage } from '@/pages/Colaboradores';
import { PerfilesCargoPage } from '@/pages/PerfilesCargo';
import { PerfilCargoForm } from '@/pages/PerfilCargoForm';
import { ColaboradorForm } from '@/pages/ColaboradorForm';
import { ModulosPage } from '@/pages/Modulos';
import { PlanesPage } from '@/pages/Planes';
import { AuditLogPage } from '@/pages/AuditLog';
import { ComercialDashboardPage } from '@/pages/ComercialDashboard';
import { OperacionDashboardPage } from '@/pages/OperacionDashboard';

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
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<LoginPage />} />

              <Route element={<AppLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                {/* ADMINISTRACIÓN */}
                <Route path="/dashboard"      element={<DashboardPage />} />
                <Route path="/colaboradores"  element={<ColaboradoresPage />} />
                <Route path="/perfiles-cargo" element={<PerfilesCargoPage />} />
                <Route path="/perfiles-cargo/nuevo" element={<PerfilCargoForm />} />
                <Route path="/perfiles-cargo/:id" element={<PerfilCargoForm />} />
                <Route path="/perfiles-cargo/:perfilId/colaboradores/nuevo" element={<ColaboradorForm />} />
                <Route path="/modulos"        element={<ModulosPage />} />
                <Route path="/planes"         element={<PlanesPage />} />
                <Route path="/auditlog"       element={<AuditLogPage />} />

                {/* COMERCIAL */}
                <Route path="/comercial/dashboard" element={<ComercialDashboardPage />} />
                <Route path="/clientes"           element={<ClientesPage />} />
                <Route path="/clientes/nuevo"    element={<ClienteForm />} />
                <Route path="/clientes/:id"      element={<ClienteForm />} />

                {/* COORDINACIÓN */}
                <Route path="/coordinacion/dashboard" element={<CoordinacionDashboardPage />} />
                <Route path="/coordinacion/sac/clientes" element={<ClientesPage />} />
                <Route path="/coordinacion/sac/tickets/nuevo" element={<CoordinacionTicketsPage />} />
                <Route path="/coordinacion/desarrollo/clientes" element={<ClientesPage />} />
                <Route path="/coordinacion/desarrollo/tickets" element={<CoordinacionTicketsPage />} />
                <Route path="/coordinacion/agentes" element={<ColaboradoresPage />} />

                {/* OPERACIÓN */}
                <Route path="/operacion/dashboard" element={<OperacionDashboardPage />} />
                <Route path="/operacion/sac/clientes" element={<ClientesPage />} />
                <Route path="/operacion/sac/tickets/nuevo" element={<OperacionSACPage />} />
                <Route path="/operacion/desarrollo/clientes" element={<ClientesPage />} />
                <Route path="/operacion/desarrollo/tickets" element={<OperacionDesarrolloPage />} />

                {/* COMUNES */}
                <Route path="/tickets/:id"           element={<TicketDetalle />} />
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
                background: 'var(--toast-bg, #ffffff)',
                color: 'var(--toast-color, #111827)',
                border: '1px solid var(--toast-border, #e5e7eb)',
                borderRadius: '10px',
                fontSize: '13px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              },
              success: {
                iconTheme: { primary: '#10b981', secondary: '#ffffff' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#ffffff' },
              },
            }}
          />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
