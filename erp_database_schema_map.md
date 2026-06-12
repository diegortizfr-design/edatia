# Mapa de la Base de Datos del ERP (PostgreSQL & Prisma)

Este documento contiene la estructura y relaciones de las tablas en la base de datos de Edatia ERP, organizadas por módulo operativo para facilitar la configuración inicial de maestros y el entendimiento de los flujos de negocio.

---

## 1. Módulo Core / General (Maestros del Sistema)

Estas tablas definen la estructura multi-empresa (Tenant) y los parámetros globales del sistema.

### `Empresa`
* **Descripción:** Representa al cliente del software (Tenant principal). Todos los datos operativos pertenecen a una empresa específica.
* **Relaciones:**
  * `usuarios` (`User[]`): Un a muchos.
  * `sucursales` (`Sucursal[]`): Un a muchos.
  * `clienteManager` (`ClienteManager`): Relación uno a uno (opcional) con la entidad del panel SaaS.
* **Llaves Foráneas (FK):** Ninguna.

### `Sucursal`
* **Descripción:** Ubicaciones físicas o bodegas de facturación vinculadas a la empresa.
* **Relaciones:**
  * `empresa` (`Empresa`): Pertenece a una empresa.
* **Llaves Foráneas (FK):**
  * `empresaId` ➔ `Empresa.id`

### `User` & `Profile`
* **Descripción:** Usuarios administradores y colaboradores autorizados a ingresar al sistema ERP.
* **Relaciones:**
  * `empresa` (`Empresa`): Vinculado a una empresa.
  * `profile` (`Profile`): Relación uno a uno.
* **Llaves Foráneas (FK):**
  * `empresaId` ➔ `Empresa.id` (en `User`)
  * `userId` ➔ `User.id` (en `Profile`)

### `DocumentoConfig`, `ConfiguracionERP`, `FormatoImpresion`
* **Descripción:** Tablas para parametrizar prefijos de documentos (FV, FC, etc.), colores, logos y plantillas de PDF.
* **Restricciones de Unicidad:**
  * `DocumentoConfig` posee una restricción única por empresa y prefijo: `@@unique([empresaId, prefijo])` (la sigla se puede repetir).
* **Llaves Foráneas (FK):**
  * `empresaId` ➔ `Empresa.id`

---

## 2. Módulo de Terceros (Clientes, Proveedores y Vendedores)

Tablas consolidadas que albergan la información de contacto, facturación, tributos y sucursales comerciales.

### `Tercero`
* **Descripción:** Ficha unificada de personas naturales o jurídicas. Utiliza banderas booleanas (`esCliente`, `esProveedor`, `esColaborador`, `esVendedor`) para definir roles comerciales.
* **Relaciones:**
  * `sucursales` (`SucursalTercero[]`): Un a muchos.
  * `cotizaciones` (`Cotizacion[]`), `pedidosVenta` (`PedidoVenta[]`), `facturasVenta` (`FacturaVenta[]`), `notasCredito` (`NotaCredito[]`): Relación como cliente.
  * `ordenesCompra` (`OrdenCompra[]`), `facturasCompra` (`FacturaCompra[]`): Relación como proveedor.
  * `ventasPos` (`VentaPos[]`): Relación como cliente en el POS.
* **Llaves Foráneas (FK):**
  * `empresaId` ➔ `Empresa.id`
  * `vendedorAsignadoId` ➔ `Tercero.id` (Relación reflexiva opcional para asignar un vendedor comercial a un cliente).

### `SucursalTercero`
* **Descripción:** Direcciones de despacho, contactos principales o sucursales físicas creadas para un tercero. Incluye campos de dirección: departamento, ciudad y país (`pais`).
* **Llaves Foráneas (FK):**
  * `terceroId` ➔ `Tercero.id`
  * `empresaId` ➔ `Empresa.id`

---

## 3. Módulo de Catálogo y Productos

Maestros necesarios para definir qué se compra, se vende o se almacena en inventario.

### `Producto`
* **Descripción:** Ítem tangible o intangible de catálogo. Define códigos SKU, costos promedio (CPP), tarifas de IVA, y configuraciones especiales de inventario.
* **Relaciones:**
  * `categoria` (`Categoria`): Pertenece a una categoría.
  * `marca` (`Marca`): Pertenece a una marca.
  * `unidadMedida` (`UnidadMedida`): Usa una unidad de medida.
  * `stocks` (`Stock[]`): Almacenado en bodegas.
  * `variantes` (`VarianteProducto[]`): Un a muchos para atributos como talla/color.
* **Llaves Foráneas (FK):**
  * `empresaId` ➔ `Empresa.id`
  * `categoriaId` ➔ `Categoria.id`
  * `marcaId` ➔ `Marca.id` (opcional)
  * `unidadMedidaId` ➔ `UnidadMedida.id`

### `Categoria`, `Marca`, `UnidadMedida`
* **Descripción:** Clasificaciones para productos y sus unidades estándar.
* **Llaves Foráneas (FK):**
  * `empresaId` ➔ `Empresa.id`

---

## 4. Módulo de Inventario y Kardex

Tablas operacionales para controlar existencias físicas y el flujo de los productos.

### `Bodega`
* **Descripción:** Espacios físicos de almacenamiento de la empresa.
* **Relaciones:**
  * `stocks` (`Stock[]`): Vinculación con cantidades de productos.
* **Llaves Foráneas (FK):**
  * `empresaId` ➔ `Empresa.id`

### `Stock`
* **Descripción:** Tabla intermedia que consolida la cantidad de un producto específico en una bodega específica.
* **Llaves Foráneas (FK):**
  * `productoId` ➔ `Producto.id`
  * `bodegaId` ➔ `Bodega.id`
  * `empresaId` ➔ `Empresa.id`

### `MovimientoInventario`
* **Descripción:** Tabla de historial (Kardex) que rastrea cada ENTRADA y SALIDA de mercancía con sus respectivos costos y saldos calculados.
* **Llaves Foráneas (FK):**
  * `productoId` ➔ `Producto.id`
  * `bodegaOrigenId` ➔ `Bodega.id` (opcional)
  * `bodegaDestinoId` ➔ `Bodega.id` (opcional)
  * `empresaId` ➔ `Empresa.id`

---

## 5. Módulo de Ventas y Facturación (Ingresos)

Registra el flujo comercial de cara al cliente final.

### `Cotizacion` & `CotizacionItem`
* **Descripción:** Ofertas comerciales preliminares.
* **Llaves Foráneas (FK):**
  * `clienteId` ➔ `Tercero.id` (en `Cotizacion`)
  * `cotizacionId` ➔ `Cotizacion.id` (en `CotizacionItem`)
  * `productoId` ➔ `Producto.id` (en `CotizacionItem`)

### `PedidoVenta` & `PedidoVentaItem`
* **Descripción:** Órdenes o pedidos de clientes aprobados para despacho.
* **Llaves Foráneas (FK):**
  * `clienteId` ➔ `Tercero.id` (en `PedidoVenta`)
  * `pedidoId` ➔ `PedidoVenta.id` (en `PedidoVentaItem`)
  * `productoId` ➔ `Producto.id` (en `PedidoVentaItem`)

### `FacturaVenta` & `FacturaVentaItem`
* **Descripción:** Facturas de venta oficiales (incluye soporte para envío electrónico a la DIAN).
* **Llaves Foráneas (FK):**
  * `clienteId` ➔ `Tercero.id` (en `FacturaVenta`)
  * `pedidoId` ➔ `PedidoVenta.id` (opcional, en `FacturaVenta`)
  * `facturaId` ➔ `FacturaVenta.id` (en `FacturaVentaItem`)
  * `productoId` ➔ `Producto.id` (en `FacturaVentaItem`)

### `NotaCredito` & `NotaCreditoItem`
* **Descripción:** Devoluciones o descuentos aplicados a facturas de venta.
* **Llaves Foráneas (FK):**
  * `facturaId` ➔ `FacturaVenta.id` (en `NotaCredito`)
  * `clienteId` ➔ `Tercero.id` (en `NotaCredito`)
  * `notaCreditoId` ➔ `NotaCredito.id` (en `NotaCreditoItem`)
  * `productoId` ➔ `Producto.id` (en `NotaCreditoItem`)

### `ReciboCaja` & `ReciboCajaFactura`
* **Descripción:** Gestión de recaudos y amortización de saldos a facturas de venta pendientes de pago (cartera).
* **Llaves Foráneas (FK):**
  * `clienteId` ➔ `Tercero.id` (en `ReciboCaja`)
  * `reciboId` ➔ `ReciboCaja.id` (en `ReciboCajaFactura`)
  * `facturaId` ➔ `FacturaVenta.id` (en `ReciboCajaFactura`)

---

## 6. Módulo de Compras e Importación (Gastos)

Registra el flujo de adquisición de mercancía de cara a los proveedores.

### `OrdenCompra` & `OrdenCompraItem`
* **Descripción:** Pedidos formales a proveedores.
* **Llaves Foráneas (FK):**
  * `proveedorId` ➔ `Tercero.id` (en `OrdenCompra`)
  * `bodegaId` ➔ `Bodega.id` (en `OrdenCompra`)
  * `ordenCompraId` ➔ `OrdenCompra.id` (en `OrdenCompraItem`)
  * `productoId` ➔ `Producto.id` (en `OrdenCompraItem`)

### `RecepcionMercancia` & `RecepcionItem`
* **Descripción:** Documentos de recibo físico en bodega de compras realizadas.
* **Llaves Foráneas (FK):**
  * `ordenCompraId` ➔ `OrdenCompra.id` (en `RecepcionMercancia`)
  * `recepcionId` ➔ `RecepcionMercancia.id` (en `RecepcionItem`)
  * `ordenCompraItemId` ➔ `OrdenCompraItem.id` (en `RecepcionItem`)

### `FacturaCompra` & `FacturaCompraItem`
* **Descripción:** Causación y registro contable de las facturas emitidas por los proveedores.
* **Llaves Foráneas (FK):**
  * `proveedorId` ➔ `Tercero.id` (en `FacturaCompra`)
  * `facturaId` ➔ `FacturaCompra.id` (en `FacturaCompraItem`)
  * `productoId` ➔ `Producto.id` (en `FacturaCompraItem`)

---

## 7. Módulo Punto de Venta (POS)

Operación en mostrador optimizada para facturas rápidas y cierres de turno de caja.

### `CajaPos`
* **Descripción:** Registradoras físicas. Define la bodega asociada para restar inventario y su cuenta de caja del PUC.
* **Llaves Foráneas (FK):**
  * `bodegaId` ➔ `Bodega.id`
  * `cuentaPUCId` ➔ `CuentaPUC.id` (opcional)

### `SesionCaja`
* **Descripción:** Apertura y cierre de turnos de los cajeros en una caja registradora.
* **Llaves Foráneas (FK):**
  * `cajaId` ➔ `CajaPos.id`

### `VentaPos` & `VentaPosItem`
* **Descripción:** Transacciones registradas en el POS.
* **Llaves Foráneas (FK):**
  * `sesionId` ➔ `SesionCaja.id` (en `VentaPos`)
  * `clienteId` ➔ `Tercero.id` (opcional, en `VentaPos`)
  * `ventaId` ➔ `VentaPos.id` (en `VentaPosItem`)
  * `productoId` ➔ `Producto.id` (en `VentaPosItem`)

---

## 8. Módulo Financiero y Contabilidad (Finanzas)

Tablas para la generación automática y manual de asientos y reportes financieros.

### `CuentaPUC`
* **Descripción:** Catálogo de cuentas del Plan Único de Cuentas (PUC) de Colombia.
* **Relaciones:**
  * `lineas` (`ComprobanteLinea[]`): Afectaciones contables.
* **Llaves Foráneas (FK):**
  * `empresaId` ➔ `Empresa.id`

### `Comprobante` & `ComprobanteLinea`
* **Descripción:** Asientos de diario contable (Débito vs. Crédito). Se crean automáticamente al facturar, comprar, pagar o recaudar, o manualmente como nota de contabilidad.
* **Llaves Foráneas (FK):**
  * `periodoId` ➔ `PeriodoContable.id` (en `Comprobante`)
  * `comprobanteId` ➔ `Comprobante.id` (en `ComprobanteLinea`, con eliminación en cascada)
  * `cuentaId` ➔ `CuentaPUC.id` (en `ComprobanteLinea`)

### `CajaBanco`
* **Descripción:** Cuentas corrientes, de ahorros y cajas generales que controlan el dinero disponible en bancos.
* **Llaves Foráneas (FK):**
  * `empresaId` ➔ `Empresa.id`
  * `sucursalId` ➔ `Sucursal.id` (opcional)

### `Impuesto`
* **Descripción:** Configuración de tasas de IVA, Retenciones en la Fuente, ReteIVA y ReteICA.
* **Llaves Foráneas (FK):**
  * `empresaId` ➔ `Empresa.id`
