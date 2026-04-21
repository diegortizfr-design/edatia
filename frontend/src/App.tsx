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
import { Alertas } from './pages/inventario/Alertas'
import { Reportes } from './pages/inventario/Reportes'
import { Lotes } from './pages/inventario/Lotes'
import { Seriales } from './pages/inventario/Seriales'
import { Variantes } from './pages/inventario/Variantes'
import { Devoluciones } from './pages/inventario/Devoluciones'

// ── Ventas ──
import { VentasDashboard } from './pages/ventas/VentasDashboard'
import { Clientes } from './pages/ventas/Clientes'
import { Cotizaciones } from './pages/ventas/Cotizaciones'
import { CotizacionForm } from './pages/ventas/CotizacionForm'
import { Facturas } from './pages/ventas/Facturas'
import { FacturaForm } from './pages/ventas/FacturaForm'
import { FacturaDetalle } from './pages/ventas/FacturaDetalle'
import { NotasCredito } from './pages/ventas/NotasCredito'
import { ReciboCaja } from './pages/ventas/ReciboCaja'
import { ConfigDian } from './pages/ventas/ConfigDian'

// ── Contabilidad ──
import { PUC } from './pages/contabilidad/PUC'
import { Comprobantes } from './pages/contabilidad/Comprobantes'
import { ContReportes } from './pages/contabilidad/ContReportes'

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
        <Route path="/inventario/alertas"                  element={<P><Alertas /></P>} />
        <Route path="/inventario/reportes"                 element={<P><Reportes /></P>} />
        <Route path="/inventario/lotes"                    element={<P><Lotes /></P>} />
        <Route path="/inventario/seriales"                 element={<P><Seriales /></P>} />
        <Route path="/inventario/variantes"                element={<P><Variantes /></P>} />
        <Route path="/inventario/devoluciones"             element={<P><Devoluciones /></P>} />

        {/* ── Ventas ── */}
        <Route path="/ventas" element={<Navigate to="/ventas/dashboard" replace />} />
        <Route path="/ventas/dashboard"     element={<P><VentasDashboard /></P>} />
        <Route path="/ventas/clientes"           element={<P><Clientes /></P>} />
        <Route path="/ventas/cotizaciones"       element={<P><Cotizaciones /></P>} />
        <Route path="/ventas/cotizaciones/nueva" element={<P><CotizacionForm /></P>} />
        <Route path="/ventas/cotizaciones/:id"   element={<P><CotizacionForm /></P>} />
        <Route path="/ventas/facturas"        element={<P><Facturas /></P>} />
        <Route path="/ventas/facturas/nueva" element={<P><FacturaForm /></P>} />
        <Route path="/ventas/facturas/:id"   element={<P><FacturaDetalle /></P>} />
        <Route path="/ventas/notas-credito" element={<P><NotasCredito /></P>} />
        <Route path="/ventas/recibos"       element={<P><ReciboCaja /></P>} />
        <Route path="/ventas/config-dian"   element={<P><ConfigDian /></P>} />

        {/* ── Contabilidad ── */}
        <Route path="/contabilidad" element={<Navigate to="/contabilidad/puc" replace />} />
        <Route path="/contabilidad/puc"           element={<P><PUC /></P>} />
        <Route path="/contabilidad/comprobantes"  element={<P><Comprobantes /></P>} />
        <Route path="/contabilidad/reportes"      element={<P><ContReportes /></P>} />

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
