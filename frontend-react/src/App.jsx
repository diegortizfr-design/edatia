import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Landing from './pages/Landing';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Cargando...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Layout>{children}</Layout>;
};

// Mock components for modules not yet migrated
const Dashboard = () => <div className="card"><h1>Dashboard Principal</h1><p>Bienvenido al sistema ERPod en React.</p></div>;
const Ecommerce = () => <div className="card"><h1>Módulo E-commerce</h1><p>Cargando catálogo...</p></div>;

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
            path="/ecommerce"
            element={
              <ProtectedRoute>
                <Ecommerce />
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
