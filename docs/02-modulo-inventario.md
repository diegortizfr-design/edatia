# Módulo de Inventario — Documentación Técnica

> ⚠️ **Este archivo es un documento vivo.**
> Debe actualizarse al finalizar cada sprint, cada vez que se agreguen endpoints, modelos, páginas o reglas de negocio nuevas. Refleja el estado actual del módulo — no el estado futuro.

**Módulo:** Inventario
**Slug ERP:** `inventario`
**Precio anual:** $1.200.000 COP
**Estado actual:** Sprint 2 completado ✅ | Sprint 3 pendiente 🔜

---

## 1. Propósito del Módulo

El módulo de Inventario es el **corazón operativo** del ERP. Permite:
- Controlar el stock en tiempo real por múltiples bodegas
- Valorar el inventario con Costo Promedio Ponderado (CPP)
- Gestionar compras con trazabilidad completa
- Mantener un kardex inmutable de todos los movimientos
- Alertar sobre productos bajo punto de reorden

---

## 2. Técnicas de Inventario Implementadas

### 2.1 Valoración — Costo Promedio Ponderado (CPP)
Estándar en Colombia (NIIF para Pymes, decreto 2420/2015).

```
Nuevo CPP = (Stock anterior × CPP anterior + Cantidad nueva × Costo nuevo)
            ─────────────────────────────────────────────────────────────
                        Stock anterior + Cantidad nueva
```

- Se recalcula en **cada entrada** de mercancía (manual o por recepción de OC)
- Las salidas siempre usan el CPP vigente en ese momento
- **Forward-only**: nunca se recalcula hacia atrás (integridad contable)
- El CPP está almacenado en `Producto.costoPromedio`

### 2.2 Punto de Reorden
- Campo `Producto.puntoReorden` configurable manualmente
- El sistema alerta cuando `stock.cantidad - stock.cantidadReservada <= puntoReorden`
- Endpoint de alertas: `GET /inventario/stock/alertas`

### 2.3 Clasificación ABC *(Sprint 3 — pendiente)*
- A: ~20% productos, ~80% del valor
- B: ~30% productos, ~15% del valor
- C: ~50% productos, ~5% del valor
- Se calculará periódicamente y se almacenará en `Producto.claseAbc`

### 2.4 FEFO / FIFO *(Sprint 4 — pendiente)*
- Requiere activar `Producto.manejaLotes = true`
- Actualmente el campo existe en el modelo pero el despacho por lotes no está implementado

---

## 3. Arquitectura Backend

### Ubicación
```
backend/src/inventario/
```

### Submódulos y responsabilidades

| Submódulo | Descripción | Archivo clave |
|-----------|-------------|---------------|
| `categorias/` | CRUD categorías jerárquicas | `categorias.service.ts` |
| `marcas/` | CRUD marcas | `marcas.service.ts` |
| `unidades-medida/` | CRUD unidades con factor conversión | `unidades-medida.service.ts` |
| `productos/` | CRUD productos + búsqueda por SKU/barcode | `productos.service.ts` |
| `bodegas/` | CRUD bodegas (solo 1 principal permitida) | `bodegas.service.ts` |
| `stock/` | Consulta de stock, alertas, valoración | `stock.service.ts` |
| `movimientos/` | **Kardex + CPP** — lógica central | `movimientos.service.ts` |
| `proveedores/` | CRUD proveedores con condiciones comerciales | `proveedores.service.ts` |
| `ordenes-compra/` | Flujo OC + recepción + actualización stock | `ordenes-compra.service.ts` |
| `dashboard/` | KPIs agregados | `inv-dashboard.service.ts` |

### Módulo registrado en
```
backend/src/inventario/inventario.module.ts
backend/src/app.module.ts  ←  InventarioModule importado aquí
```

---

## 4. Endpoints Disponibles

**Prefijo base:** `/api/v1/inventario`
**Autenticación:** `JwtAuthGuard` (Bearer token ERP) en todos los endpoints
**Multi-tenant:** `empresaId` siempre extraído del JWT, nunca del body

### Maestros

```
GET    /categorias               → todas las categorías de la empresa
POST   /categorias               → crear categoría
GET    /categorias/:id           → detalle con hijos y count de productos
PATCH  /categorias/:id           → actualizar

GET    /marcas                   → todas las marcas
POST   /marcas                   → crear marca
GET    /marcas/:id               → detalle
PATCH  /marcas/:id               → actualizar

GET    /unidades-medida          → todas las unidades
POST   /unidades-medida          → crear unidad
GET    /unidades-medida/:id      → detalle
PATCH  /unidades-medida/:id      → actualizar
```

### Productos

```
GET    /productos                → lista con filtros: ?q=&categoriaId=&marcaId=&activo=
GET    /productos/buscar?q=      → búsqueda rápida (nombre, SKU, barcode) — máx 20 resultados
GET    /productos/:id            → detalle con stock por bodega
POST   /productos                → crear producto
PATCH  /productos/:id            → actualizar producto
```

### Bodegas

```
GET    /bodegas                  → todas las bodegas
POST   /bodegas                  → crear bodega (auto-desactiva "principal" anterior)
GET    /bodegas/:id              → detalle
PATCH  /bodegas/:id              → actualizar
```

### Stock

```
GET    /stock                    → stock general ?bodegaId=&soloAlertas=true
GET    /stock/alertas            → productos en o bajo punto de reorden
GET    /stock/valoracion         → valor total del inventario (suma CPP × cantidad)
GET    /stock/producto/:id       → stock de un producto en todas sus bodegas
```

### Movimientos / Kardex

```
GET    /movimientos              → historial paginado ?productoId=&bodegaId=&tipo=&limit=&offset=
GET    /movimientos/kardex/:id   → kardex completo de un producto ?bodegaId=
POST   /movimientos/entrada      → entrada manual (recalcula CPP)
POST   /movimientos/salida       → salida manual (verifica stock)
POST   /movimientos/ajuste       → ajuste positivo o negativo
POST   /movimientos/traslado     → traslado entre bodegas (2 movimientos atómicos)
```

### Proveedores

```
GET    /proveedores              → lista ?q= (búsqueda por nombre/NIT)
GET    /proveedores/:id          → detalle con últimas 5 OC
POST   /proveedores              → crear proveedor
PATCH  /proveedores/:id         → actualizar
```

### Órdenes de Compra

```
GET    /ordenes-compra           → lista ?estado=&proveedorId=
GET    /ordenes-compra/:id       → detalle con ítems y recepciones
POST   /ordenes-compra           → crear OC en BORRADOR (calcula IVA/totales)
PATCH  /ordenes-compra/:id       → editar (solo BORRADOR)
POST   /ordenes-compra/:id/aprobar  → BORRADOR → APROBADA
POST   /ordenes-compra/:id/anular   → cualquier estado (excepto RECIBIDA/ANULADA)
POST   /ordenes-compra/:id/recibir  → APROBADA|RECIBIDA_PARCIAL → recepción
```

### Dashboard

```
GET    /dashboard                → KPIs: total productos, bodegas, valor inventario,
                                   alertas, movimientos 7 días, top 5 productos,
                                   alertas críticas (stock en 0)
```

---

## 5. Modelos de Base de Datos

### Diagrama de relaciones

```
Empresa
 ├── Categoria (auto-referencial para jerarquía)
 ├── Marca
 ├── UnidadMedida
 ├── Producto
 │    ├── Stock (por bodega)
 │    └── MovimientoInventario (kardex)
 ├── Bodega
 │    ├── Stock
 │    └── MovimientoInventario (origen/destino)
 ├── Proveedor
 │    └── OrdenCompra
 │         ├── OrdenCompraItem → Producto
 │         └── RecepcionMercancia
 │              └── RecepcionItem → OrdenCompraItem
 └── RecepcionMercancia
```

### Campos críticos

| Modelo | Campo | Descripción |
|--------|-------|-------------|
| `Producto` | `costoPromedio` | CPP vigente, recalculado en cada entrada |
| `Producto` | `puntoReorden` | Umbral de alerta de stock bajo |
| `Producto` | `claseAbc` | A/B/C — calculado periódicamente |
| `Producto` | `manejaBodega` | Si false, no se controla stock |
| `Stock` | `cantidad` | Stock actual en esa bodega |
| `Stock` | `cantidadReservada` | Reservado por pedidos pendientes |
| `MovimientoInventario` | `saldoCantidad` | Saldo después del movimiento (denormalizado) |
| `MovimientoInventario` | `saldoCpp` | CPP después del movimiento |
| `MovimientoInventario` | `numero` | `MOV-YYYY-NNNNN` — único e inmutable |
| `OrdenCompra` | `estado` | `BORRADOR→APROBADA→RECIBIDA_PARCIAL→RECIBIDA` |
| `OrdenCompraItem` | `cantidadRecibida` | Acumulado de recepciones parciales |
| `RecepcionMercancia` | `numero` | `REC-YYYY-NNNNN` |

### Campos de control multi-tenant (en todos los modelos)
```prisma
empresaId   Int
empresa     Empresa @relation(...)
@@index([empresaId])
```

---

## 6. Reglas de Negocio

### R1 — Kardex inmutable
Los `MovimientoInventario` **nunca** se editan ni eliminan. Para corregir errores se crea un movimiento de ajuste compensatorio con referencia al original.

### R2 — Transaccionalidad
Toda operación que modifica stock Y crea un movimiento usa `prisma.$transaction()`. Si falla cualquier paso, todo se revierte.

### R3 — Stock negativo
Por defecto: **NO permitido**. Configurable con `Empresa.permiteStockNegativo = true`. Al intentar sacar más de lo disponible se lanza `BadRequestException`.

### R4 — CPP forward-only
El CPP se recalcula hacia adelante solamente. Una entrada retroactiva no cambia movimientos pasados, solo actualiza `Producto.costoPromedio` para movimientos futuros.

### R5 — Números de documento
Generados en el backend, nunca en el frontend. Formato secuencial por empresa y año. Reset anual automático (basado en conteo del año actual).

### R6 — Bodega principal
Solo puede existir una bodega con `esPrincipal = true` por empresa. Al crear/actualizar una bodega como principal, el servicio desactiva automáticamente las demás.

### R7 — Recepción de OC
Solo se puede recibir una OC en estado `APROBADA` o `RECIBIDA_PARCIAL`. La recepción:
1. Valida que las cantidades no superen el pendiente por recibir
2. Crea `RecepcionMercancia` + sus `RecepcionItem`s
3. Actualiza `Stock` (upsert si no existe)
4. Recalcula CPP del producto
5. Escribe en el kardex con `concepto: 'COMPRA'` y `referenciaTipo: 'OrdenCompra'`
6. Actualiza `cantidadRecibida` en cada `OrdenCompraItem`
7. Cambia estado OC: `RECIBIDA` si todo recibido, `RECIBIDA_PARCIAL` si no

### R8 — Traslado entre bodegas
Se crean **dos movimientos atómicos**: `TRASLADO_SALIDA` y `TRASLADO_ENTRADA`, vinculados por `movimientoParId`. El número del segundo es `{numero-salida}-E`.

---

## 7. Arquitectura Frontend

### Páginas implementadas

| Ruta | Componente | Sprint |
|------|-----------|--------|
| `/inventario` | → redirect a `/inventario/dashboard` | 1 |
| `/inventario/dashboard` | `InvDashboard.tsx` | 1 |
| `/inventario/productos` | `Productos.tsx` | 1 |
| `/inventario/productos/nuevo` | `ProductoForm.tsx` | 1 |
| `/inventario/productos/:id` | `ProductoForm.tsx` | 1 |
| `/inventario/bodegas` | `Bodegas.tsx` | 1 |
| `/inventario/movimientos` | `Movimientos.tsx` | 1 |
| `/inventario/movimientos/nuevo` | `NuevoMovimiento.tsx` | 1 |
| `/inventario/maestros` | `Maestros.tsx` | 1 |
| `/inventario/proveedores` | `Proveedores.tsx` | 2 |
| `/inventario/proveedores/nuevo` | `ProveedorForm.tsx` | 2 |
| `/inventario/proveedores/:id` | `ProveedorForm.tsx` | 2 |
| `/inventario/ordenes-compra` | `OrdenesCompra.tsx` | 2 |
| `/inventario/ordenes-compra/nueva` | `OrdenCompraForm.tsx` | 2 |
| `/inventario/ordenes-compra/:id` | `OrdenCompraDetalle.tsx` | 2 |

### Servicio de API
`frontend/src/services/inventario.service.ts`
- Centraliza todos los tipos TypeScript y llamadas axios del módulo
- Se actualiza con cada sprint

### Navegación
El módulo tiene un **dropdown de navegación** en el header del Layout (`Layout.tsx`), organizado en dos secciones:
- **General:** Dashboard, Productos, Bodegas, Movimientos, Maestros
- **Compras:** Proveedores, Órdenes de Compra

---

## 8. Estado por Sprint

### ✅ Sprint 1 — Maestros + Stock + Kardex
- [x] Schema Prisma completo (todos los modelos de inventario)
- [x] Categorías CRUD (jerarquía padre-hijo, slug auto-generado en frontend)
- [x] Marcas CRUD
- [x] Unidades de Medida CRUD
- [x] Productos CRUD (con búsqueda por SKU, nombre, barcode)
- [x] Bodegas CRUD (con control de "principal")
- [x] Movimientos manuales: Entrada, Salida, Ajuste, Traslado
- [x] Recálculo automático de CPP en entradas
- [x] Kardex por producto (ordenado cronológico con saldo denormalizado)
- [x] Stock actual por producto/bodega
- [x] Alertas de stock bajo (bajo punto de reorden)
- [x] Dashboard con KPIs básicos
- [x] Todas las páginas frontend correspondientes

### ✅ Sprint 2 — Compras
- [x] Proveedores CRUD (con condiciones comerciales, lead time)
- [x] Órdenes de Compra (crear, editar borrador)
- [x] Flujo de estados OC: BORRADOR → APROBADA → RECIBIDA_PARCIAL → RECIBIDA
- [x] Cálculo automático de IVA/totales por tipo de IVA del producto
- [x] Recepción de mercancía (parcial y total)
- [x] Actualización automática de stock + CPP al recibir
- [x] Historial de recepciones en detalle de OC
- [x] Anulación de OC
- [x] Páginas frontend: Proveedores, ProveedorForm, OrdenesCompra, OrdenCompraForm, OrdenCompraDetalle

### 🔜 Sprint 3 — Inteligencia + Reportes
- [ ] Dashboard KPIs completo con gráficas
- [ ] Clasificación ABC automática (recálculo bajo demanda)
- [ ] Reporte de valoración de inventario (por fecha)
- [ ] Reporte de rotación de inventario
- [ ] Kardex exportable a CSV/Excel
- [ ] Inventario inmovilizado (sin movimiento en N días)
- [ ] Sugerencias de reorden (productos bajo punto de reorden con cálculo automático)

### 🔜 Sprint 4 — Avanzado
- [ ] Variantes de producto (talla, color → SKUs hijos)
- [ ] Gestión de lotes con fecha de vencimiento (FEFO)
- [ ] Números de serie para electrónica
- [ ] Múltiples listas de precios
- [ ] Integración con Módulo Ventas (reserva y descuento de stock)
- [ ] Integración con Módulo Contable (asientos de compra/costo)
- [ ] Devolución a proveedor (movimiento `DEVOLUCION_PROVEEDOR`)

---

## 9. Pendientes / Deuda Técnica

| Item | Descripción | Prioridad |
|------|-------------|-----------|
| `prisma generate` | Cuando se haga deploy, correr generate para tipado completo y eliminar `(prisma as any)` | Alta |
| Paginación en `/productos` | Actualmente trae todos — agregar `take/skip` cuando haya muchos productos | Media |
| Validación stock negativo frontend | Mostrar alerta antes de enviar si se detecta posible stock negativo | Media |
| Tests unitarios `MovimientosService` | Probar CPP con múltiples entradas y salidas | Alta |
| Rate limiting en movimientos | Evitar doble-clic que cree movimientos duplicados (idempotency key) | Media |

---

## 10. Tipos de Movimiento

| Tipo | Afecta stock | Concepto típico |
|------|-------------|-----------------|
| `ENTRADA` | `+` en bodega destino | `COMPRA`, `APERTURA`, `OTRO` |
| `SALIDA` | `−` en bodega origen | `VENTA`, `MERMA`, `OTRO` |
| `AJUSTE_POSITIVO` | `+` en bodega | `AJUSTE_FISICO` |
| `AJUSTE_NEGATIVO` | `−` en bodega | `AJUSTE_FISICO` |
| `TRASLADO_SALIDA` | `−` en bodega origen | `TRASLADO` |
| `TRASLADO_ENTRADA` | `+` en bodega destino | `TRASLADO` |
| `DEVOLUCION_PROVEEDOR` | `−` en bodega | `DEVOLUCION_PROVEEDOR` *(Sprint 4)* |
| `DEVOLUCION_CLIENTE` | `+` en bodega | `DEVOLUCION_CLIENTE` *(Sprint 4)* |

---

## 11. Estados de la Orden de Compra

```
BORRADOR
  ↓ (aprobar)
APROBADA
  ↓ (recibir — parcial)
RECIBIDA_PARCIAL
  ↓ (recibir — completo)
RECIBIDA

Desde cualquier estado (excepto RECIBIDA y ANULADA):
  → ANULADA
```
