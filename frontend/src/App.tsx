import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { NotFound } from './pages/NotFound'
import { InvDashboard } from './pages/inventario/InvDashboard'
import { Productos } from './pages/inventario/Productos'
import { ProductoForm } from './pages/inventario/ProductoForm'
import { Bodegas } from './pages/inventario/Bodegas'
import { Movimientos } from './pages/inventario/Movimientos'
import { NuevoMovimiento } from './pages/inventario/NuevoMovimiento'
import { Maestros } from './pages/inventario/Maestros'
import { Proveedores } from './pages/inventario/Proveedores'
import { ProveedorForm } from './pages/inventario/ProveedorForm'
import { OrdenesCompra } from './pages/inventario/OrdenesCompra'
import { OrdenCompraForm } from './pages/inventario/OrdenCompraForm'
import { OrdenCompraDetalle } from './pages/inventario/OrdenCompraDetalle'

function P({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<P><Dashboard /></P>} />
        <Route path="/empresas" element={<P><div className="text-slate-500 text-center py-20">Módulo de Empresas — próximamente</div></P>} />
        <Route path="/usuarios" element={<P><div className="text-slate-500 text-center py-20">Módulo de Usuarios — próximamente</div></P>} />

        {/* ── Inventario ── */}
        <Route path="/inventario" element={<Navigate to="/inventario/dashboard" replace />} />
        <Route path="/inventario/dashboard"            element={<P><InvDashboard /></P>} />
        <Route path="/inventario/productos"            element={<P><Productos /></P>} />
        <Route path="/inventario/productos/nuevo"      element={<P><ProductoForm /></P>} />
        <Route path="/inventario/productos/:id"        element={<P><ProductoForm /></P>} />
        <Route path="/inventario/bodegas"              element={<P><Bodegas /></P>} />
        <Route path="/inventario/movimientos"          element={<P><Movimientos /></P>} />
        <Route path="/inventario/movimientos/nuevo"    element={<P><NuevoMovimiento /></P>} />
        <Route path="/inventario/maestros"             element={<P><Maestros /></P>} />
        <Route path="/inventario/proveedores"              element={<P><Proveedores /></P>} />
        <Route path="/inventario/proveedores/nuevo"        element={<P><ProveedorForm /></P>} />
        <Route path="/inventario/proveedores/:id"          element={<P><ProveedorForm /></P>} />
        <Route path="/inventario/ordenes-compra"           element={<P><OrdenesCompra /></P>} />
        <Route path="/inventario/ordenes-compra/nueva"     element={<P><OrdenCompraForm /></P>} />
        <Route path="/inventario/ordenes-compra/:id"       element={<P><OrdenCompraDetalle /></P>} />

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
