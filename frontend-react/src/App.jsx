import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Landing from './pages/Landing';
import Ecommerce from './pages/Ecommerce';
import Productos from './pages/Productos';
import Terceros from './pages/Terceros';
import Facturacion from './pages/Facturacion';
import Inventario from './pages/Inventario';
import Compras from './pages/Compras';
import Configuracion from './pages/Configuracion';
import Dashboard from './pages/Dashboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Route: Landing Page is the ROOT */}
          <Route path="/" element={<Landing />} />

          {/* Auth Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/facturacion"
            element={
              <ProtectedRoute>
                <Facturacion />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ecommerce"
            element={
              <ProtectedRoute>
                <Ecommerce />
              </ProtectedRoute>
            }
          />
          <Route
            path="/productos"
            element={
              <ProtectedRoute>
                <Productos />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventario"
            element={
              <ProtectedRoute>
                <Inventario />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compras"
            element={
              <ProtectedRoute>
                <Compras />
              </ProtectedRoute>
            }
          />
          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <Terceros initialMode="cliente" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/proveedores"
            element={
              <ProtectedRoute>
                <Terceros initialMode="proveedor" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/configuracion"
            element={
              <ProtectedRoute>
                <Configuracion />
              </ProtectedRoute>
            }
          />

          {/* Fallback to Landing */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
