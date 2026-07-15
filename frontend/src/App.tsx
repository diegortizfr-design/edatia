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
import { Compras } from './pages/inventario/Compras'
import { NuevaFcForm } from './pages/inventario/NuevaFcForm'
import { ControlExistencias } from './pages/inventario/ControlExistencias'
import { NuevoAjusteForm } from './pages/inventario/NuevoAjusteForm'
import { NuevoTrasladoForm } from './pages/inventario/NuevoTrasladoForm'
import { Traslados } from './pages/inventario/Traslados'
// ── Digital ──
import { DigitalDashboard } from './pages/digital/DigitalDashboard'
import { CatalogoDigital } from './pages/digital/CatalogoDigital'
import { ConfigTienda } from './pages/digital/ConfigTienda'

// ── Ventas ──
import { VentasDashboard } from './pages/ventas/VentasDashboard'
import { Clientes } from './pages/ventas/Clientes'
import { ClienteForm } from './pages/ventas/ClienteForm'
import { Cotizaciones } from './pages/ventas/Cotizaciones'
import { CotizacionForm } from './pages/ventas/CotizacionForm'
import { Pedidos } from './pages/ventas/Pedidos'
import { PedidoForm } from './pages/ventas/PedidoForm'
import { Facturas } from './pages/ventas/Facturas'
import { FacturaForm } from './pages/ventas/FacturaForm'
import { FacturaDetalle } from './pages/ventas/FacturaDetalle'
import { FacturasPendientesEmitir } from './pages/ventas/FacturasPendientesEmitir'
import { NotasCredito } from './pages/ventas/NotasCredito'
import { NotaCreditoDetalle } from './pages/ventas/NotaCreditoDetalle'
import { ReciboCaja } from './pages/ventas/ReciboCaja'
import { ConfigDian } from './pages/ventas/ConfigDian'
import { CarteraCxC } from './pages/ventas/CarteraCxC'
import { CarteraPorEdades } from './pages/ventas/CarteraPorEdades'

// ── Configuración ──
import { ConfigEmpresa } from './pages/configuracion/ConfigEmpresa'
import { ConfigDocumentos } from './pages/configuracion/ConfigDocumentos'
import { ConfigImpuestos } from './pages/configuracion/ConfigImpuestos'
import { ConfigGeolocalizacion } from './pages/configuracion/ConfigGeolocalizacion'
import { ConfigMonedas } from './pages/configuracion/ConfigMonedas'
import { ConfigSucursales } from './pages/configuracion/ConfigSucursales'
import { ConfigCajasBancos } from './pages/configuracion/ConfigCajasBancos'
import { ConfigContable } from './pages/configuracion/ConfigContable'
import { ConfigFormatosImpresion } from './pages/configuracion/ConfigFormatosImpresion'
import { ConfigProductos } from './pages/configuracion/ConfigProductos'
import { ConfigProductosMaestros } from './pages/configuracion/ConfigProductosMaestros'
import { ConfigProductoDetalle } from './pages/configuracion/ConfigProductoDetalle'
import { ConfigTerceros } from './pages/configuracion/ConfigTerceros'
import { ConfigTerceroForm } from './pages/configuracion/ConfigTerceroForm'
import { ConfigTercerosExtra } from './pages/configuracion/ConfigTercerosExtra'
import { ConfigArchivo } from './pages/configuracion/ConfigArchivo'
import ConfigFormasMediosPago from './pages/configuracion/ConfigFormasMediosPago'



// ── Seguridad ──
import { Usuarios } from './pages/seguridad/Usuarios'
import { Roles } from './pages/seguridad/Roles'
import { Notificaciones } from './pages/seguridad/Notificaciones'
import { CierrePeriodo } from './pages/seguridad/CierrePeriodo'
import { Auditoria } from './pages/seguridad/Auditoria'

// ── POS ──
import { PosDashboard } from './pages/pos/PosDashboard'
import { PosScreen } from './pages/pos/PosScreen'
import { PosConfig } from './pages/pos/PosConfig'
import { PosCierre } from './pages/pos/PosCierre'
import { VentasPosList } from './pages/pos/VentasPosList'

// ── Contabilidad ──
import { PUC } from './pages/contabilidad/PUC'
import { Comprobantes } from './pages/contabilidad/Comprobantes'
import { ContReportes } from './pages/contabilidad/ContReportes'
import { CajasBancosList } from './pages/contabilidad/CajasBancosList'

function P({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  )
}

// POS pantalla completa (sin Layout normal)
function PosWrap({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute>{children}</ProtectedRoute>
}

import { useParams } from 'react-router-dom'

function RedirectToProductDetail() {
  const { id } = useParams()
  return <Navigate to={`/configuracion/productos/${id}/detalle`} replace />
}

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<P><Dashboard /></P>} />

        {/* ── Inventario ── */}
        <Route path="/inventario" element={<Navigate to="/inventario/control-existencias" replace />} />
        <Route path="/inventario/dashboard"            element={<P><InvDashboard /></P>} />
        <Route path="/inventario/productos"            element={<Navigate to="/configuracion/productos" replace />} />
        <Route path="/inventario/productos/nuevo"      element={<Navigate to="/configuracion/productos" replace />} />
        <Route path="/inventario/productos/:id"        element={<RedirectToProductDetail />} />
        <Route path="/inventario/compras"              element={<P><Compras /></P>} />
        <Route path="/inventario/compras/nueva-fc"     element={<P><NuevaFcForm /></P>} />
        <Route path="/inventario/control-existencias"  element={<P><ControlExistencias /></P>} />
        <Route path="/inventario/control-existencias/nuevo-ajuste" element={<P><NuevoAjusteForm /></P>} />
        <Route path="/inventario/control-existencias/nuevo-traslado" element={<P><NuevoTrasladoForm /></P>} />
        <Route path="/inventario/bodegas"              element={<P><Bodegas /></P>} />
        <Route path="/inventario/movimientos"          element={<P><Movimientos /></P>} />
        <Route path="/inventario/traslados"            element={<P><Traslados /></P>} />
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
        <Route path="/ventas/clientes/nuevo"     element={<P><ClienteForm /></P>} />
        <Route path="/ventas/clientes/:id"       element={<P><ClienteForm /></P>} />
        <Route path="/ventas/cotizaciones"       element={<P><Cotizaciones /></P>} />
        <Route path="/ventas/cotizaciones/nueva" element={<P><CotizacionForm /></P>} />
        <Route path="/ventas/cotizaciones/:id"   element={<P><CotizacionForm /></P>} />
        <Route path="/ventas/pedidos"            element={<P><Pedidos /></P>} />
        <Route path="/ventas/pedidos/nuevo"      element={<P><PedidoForm /></P>} />
        <Route path="/ventas/pedidos/:id"        element={<P><PedidoForm /></P>} />
        <Route path="/ventas/facturas"        element={<P><Facturas /></P>} />
        <Route path="/ventas/facturas/nueva" element={<P><FacturaForm /></P>} />
        <Route path="/ventas/facturas/pendientes-emitir" element={<P><FacturasPendientesEmitir /></P>} />
        <Route path="/ventas/facturas/:id"   element={<P><FacturaDetalle /></P>} />
        <Route path="/ventas/notas-credito" element={<P><NotasCredito /></P>} />
        <Route path="/ventas/notas-credito/:id" element={<P><NotaCreditoDetalle /></P>} />
        <Route path="/ventas/recibos"       element={<P><ReciboCaja /></P>} />
        <Route path="/ventas/config-dian"   element={<P><ConfigDian /></P>} />
        <Route path="/ventas/cartera/cxc"   element={<P><CarteraCxC /></P>} />
        <Route path="/ventas/cartera/por-edades" element={<P><CarteraPorEdades /></P>} />

        {/* ── Configuración ── */}
        <Route path="/configuracion/empresa" element={<P><ConfigEmpresa /></P>} />
        <Route path="/configuracion/archivo" element={<P><ConfigArchivo /></P>} />
        <Route path="/configuracion/contable" element={<P><ConfigContable /></P>} />
        <Route path="/configuracion/formatos-impresion" element={<P><ConfigFormatosImpresion /></P>} />
        <Route path="/configuracion/documentos" element={<P><ConfigDocumentos /></P>} />
        <Route path="/configuracion/impuestos" element={<P><ConfigImpuestos /></P>} />
        <Route path="/configuracion/geolocalizacion" element={<P><ConfigGeolocalizacion /></P>} />
        <Route path="/configuracion/monedas" element={<P><ConfigMonedas /></P>} />
        <Route path="/configuracion/formas-medios-pago" element={<P><ConfigFormasMediosPago /></P>} />
        <Route path="/configuracion/sucursales" element={<P><ConfigSucursales /></P>} />
        <Route path="/configuracion/cajas-bancos" element={<P><ConfigCajasBancos /></P>} />
        <Route path="/configuracion/productos" element={<P><ConfigProductos /></P>} />
        <Route path="/configuracion/productos/maestros" element={<P><ConfigProductosMaestros /></P>} />
        <Route path="/configuracion/productos/:id/detalle" element={<P><ConfigProductoDetalle /></P>} />
        <Route path="/configuracion/terceros" element={<P><ConfigTerceros /></P>} />
        <Route path="/configuracion/terceros/nuevo" element={<P><ConfigTerceroForm /></P>} />
        <Route path="/configuracion/terceros/vendedores" element={<P><ConfigTercerosExtra section="vendedores" /></P>} />
        <Route path="/configuracion/terceros/unificar" element={<P><ConfigTercerosExtra section="unificar" /></P>} />
        <Route path="/configuracion/terceros/ciiu" element={<P><ConfigTercerosExtra section="ciiu" /></P>} />
        <Route path="/configuracion/terceros/clasificaciones" element={<P><ConfigTercerosExtra section="clasificaciones" /></P>} />
        <Route path="/configuracion/terceros/tipos-identificacion" element={<P><ConfigTercerosExtra section="tipos-identificacion" /></P>} />
        <Route path="/configuracion/terceros/tipos-regimen" element={<P><ConfigTercerosExtra section="tipos-regimen" /></P>} />
        <Route path="/configuracion/terceros/regimen-tributario" element={<P><ConfigTercerosExtra section="regimen-tributario" /></P>} />
        <Route path="/configuracion/terceros/reportes" element={<P><ConfigTercerosExtra section="reportes" /></P>} />
        <Route path="/configuracion/terceros/reportes-pagos" element={<P><ConfigTercerosExtra section="reportes-pagos" /></P>} />
        <Route path="/configuracion/terceros/tags" element={<P><ConfigTercerosExtra section="tags" /></P>} />
        <Route path="/configuracion/terceros/:id" element={<P><ConfigTerceroForm /></P>} />



        {/* ── Seguridad ── */}
        <Route path="/seguridad/usuarios" element={<P><Usuarios /></P>} />
        <Route path="/seguridad/roles" element={<P><Roles /></P>} />
        <Route path="/seguridad/notificaciones" element={<P><Notificaciones /></P>} />
        <Route path="/seguridad/cierre-periodo" element={<P><CierrePeriodo /></P>} />
        <Route path="/seguridad/auditoria" element={<P><Auditoria /></P>} />

        {/* ── Digital ── */}
        <Route path="/digital" element={<Navigate to="/digital/dashboard" replace />} />
        <Route path="/digital/dashboard" element={<P><DigitalDashboard /></P>} />
        <Route path="/digital/catalogo"  element={<P><CatalogoDigital /></P>} />
        <Route path="/digital/config"    element={<P><ConfigTienda /></P>} />

        {/* ── POS ── */}
        <Route path="/pos" element={<P><PosDashboard /></P>} />
        <Route path="/pos/config" element={<P><PosConfig /></P>} />
        <Route path="/pos/cierre/:sesionId" element={<P><PosCierre /></P>} />
        <Route path="/pos/screen/:sesionId" element={<PosWrap><PosScreen /></PosWrap>} />
        <Route path="/pos/ventas" element={<P><VentasPosList /></P>} />

        {/* ── Contabilidad ── */}
        <Route path="/contabilidad" element={<Navigate to="/contabilidad/puc" replace />} />
        <Route path="/contabilidad/puc"           element={<P><PUC /></P>} />
        <Route path="/contabilidad/comprobantes"  element={<P><Comprobantes /></P>} />
        <Route path="/contabilidad/reportes"      element={<P><ContReportes /></P>} />
        <Route path="/contabilidad/tesoreria/pagos"  element={<P><ReciboCaja /></P>} />
        <Route path="/contabilidad/tesoreria/saldos" element={<P><CajasBancosList /></P>} />

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
