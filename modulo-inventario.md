# Módulo de Inventario — Edatia ERP
## Diseño Técnico y Plan de Implementación

---

## 1. VISIÓN DEL MÓDULO

El módulo de Inventario es el **corazón operativo** del ERP para retail y distribución.
Todo fluye a través de él: las compras generan entradas, las ventas generan salidas, los traslados
redistribuyen el stock. Su correcta arquitectura determina la precisión contable, la eficiencia
operativa y la capacidad analítica del negocio.

### Propuesta de valor para el cliente

| Pain Point del cliente | Solución del módulo |
|------------------------|---------------------|
| "No sé cuánto stock tengo en cada bodega" | Stock en tiempo real multi-bodega |
| "Mi inventario no coincide con la realidad" | Toma física + ajustes con trazabilidad |
| "No sé cuándo pedir más mercancía" | Puntos de reorden + alertas automáticas |
| "No sé cuánto vale mi inventario" | Valoración CPP en tiempo real |
| "Pierdo productos por vencimiento" | Gestión de lotes con FEFO |
| "No tengo historial de movimientos" | Kardex completo e inalterable |
| "Mis compras están desorganizadas" | Órdenes de compra con flujo de aprobación |

---

## 2. TÉCNICAS DE INVENTARIO APLICADAS

### 2.1 Valoración de Inventario — Costo Promedio Ponderado (CPP)
Estándar en Colombia (NIIF para Pymes, decreto 2420/2015).
En cada **entrada** de mercancía se recalcula el nuevo costo promedio:

```
Nuevo CPP = (Stock anterior × CPP anterior + Cantidad nueva × Costo nuevo)
            ─────────────────────────────────────────────────────────────
                        Stock anterior + Cantidad nueva
```

Las **salidas** siempre se valoran al CPP vigente en ese momento.
El sistema lo recalcula automáticamente en cada recepción de compra.

### 2.2 Clasificación ABC — Pareto del Inventario
Segmenta los productos por **valor de inventario acumulado**:

| Clase | % de productos | % del valor total | Estrategia |
|-------|---------------|-------------------|------------|
| A     | ~20%          | ~80%              | Control estricto, conteo frecuente, stock ajustado |
| B     | ~30%          | ~15%              | Control moderado, revisión mensual |
| C     | ~50%          | ~5%               | Control mínimo, pedidos por lote grande |

### 2.3 Punto de Reorden Dinámico
```
Punto de Reorden = Demanda Diaria Promedio × Lead Time (días) + Stock de Seguridad

Stock de Seguridad = Z × σ(demanda diaria) × √(Lead Time)
  donde Z = 1.65 para 95% de nivel de servicio
```

El sistema calcula esto automáticamente basándose en el historial de movimientos
y el plazo de entrega registrado del proveedor habitual.

### 2.4 Métodos de Despacho
- **FIFO** — para productos sin lote (default)
- **FEFO** (First Expired First Out) — para productos con fecha de vencimiento (lotes)

### 2.5 Conteo Cíclico (Toma Física Inteligente)
En lugar de contar todo el inventario de una sola vez (disruptivo),
el sistema genera **listas de conteo rotativos** priorizando por clase ABC:
- Clase A: contar cada 2 semanas
- Clase B: contar cada mes
- Clase C: contar cada trimestre

---

## 3. FUNCIONALIDADES POR FASE

### FASE 1 — Maestros + Stock + Kardex (MVP Core)
**Objetivo:** El cliente puede registrar su inventario y ver movimientos.

- [ ] Categorías de productos (jerarquía: categoría → subcategoría)
- [ ] Marcas
- [ ] Unidades de medida (con factor de conversión)
- [ ] Productos con SKU, código de barras, precio, IVA
- [ ] Bodegas (múltiples por empresa)
- [ ] Stock actual por producto/bodega
- [ ] Movimientos manuales: Entrada, Salida, Ajuste (+/-), Traslado
- [ ] Kardex por producto (historial ordenado con saldo acumulado)
- [ ] Alertas de stock bajo (producto bajo punto de reorden)
- [ ] Dashboard con KPIs básicos

### FASE 2 — Compras (Flujo Operativo)
**Objetivo:** El cliente gestiona sus compras y recepciones con trazabilidad.

- [ ] Proveedores CRUD
- [ ] Órdenes de Compra (crear, aprobar, enviar a proveedor)
- [ ] Recepción de mercancía (total o parcial)
- [ ] Actualización automática de stock y CPP al recibir
- [ ] Historial de compras por proveedor y producto
- [ ] Devolución a proveedor

### FASE 3 — Inteligencia + Reportes
**Objetivo:** El cliente toma decisiones basadas en datos.

- [ ] Análisis ABC automático
- [ ] Sugerencias de reorden (productos bajo punto de reorden)
- [ ] Toma física con conteo cíclico
- [ ] Reporte de valoración de inventario (por fecha)
- [ ] Reporte de rotación de inventario
- [ ] Kardex exportable a Excel/PDF
- [ ] Inventario inmovilizado/muerto (sin movimiento en N días)

### FASE 4 — Lotes + Variantes + Integraciones
**Objetivo:** Capacidades avanzadas para retail especializado.

- [ ] Variantes de producto (talla, color → SKUs hijos)
- [ ] Gestión de lotes con fecha de vencimiento (FEFO)
- [ ] Números de serie para electrónica
- [ ] Múltiples listas de precios
- [ ] Integración con Módulo Ventas (reserva y descuento de stock)
- [ ] Integración con Módulo Contable (asientos de compra/costo)

---

## 4. ARQUITECTURA DE DATOS — PRISMA SCHEMA

### Modelos nuevos para `backend/prisma/schema.prisma`

```prisma
// ─── MÓDULO INVENTARIO ERP ────────────────────────────────────────────────────

model Categoria {
  id          Int          @id @default(autoincrement())
  empresaId   Int
  empresa     Empresa      @relation(fields: [empresaId], references: [id])
  nombre      String
  slug        String
  descripcion String?
  // Jerarquía (auto-referencial)
  parentId    Int?
  parent      Categoria?   @relation("Subcategorias", fields: [parentId], references: [id])
  hijos       Categoria[]  @relation("Subcategorias")
  productos   Producto[]
  activo      Boolean      @default(true)
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt

  @@unique([empresaId, slug])
  @@index([empresaId])
}

model Marca {
  id        Int        @id @default(autoincrement())
  empresaId Int
  empresa   Empresa    @relation(fields: [empresaId], references: [id])
  nombre    String
  activo    Boolean    @default(true)
  productos Producto[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt

  @@unique([empresaId, nombre])
}

model UnidadMedida {
  id          Int        @id @default(autoincrement())
  empresaId   Int
  empresa     Empresa    @relation(fields: [empresaId], references: [id])
  nombre      String     // "Unidad", "Caja x12", "Kilogramo"
  abreviatura String     // "und", "cja", "kg"
  tipo        String     @default("UNIDAD") // UNIDAD | PESO | VOLUMEN | LONGITUD
  factorBase  Decimal    @default(1) @db.Decimal(12, 6) // conversión a unidad base
  activo      Boolean    @default(true)
  productos   Producto[]
  createdAt   DateTime   @default(now())

  @@unique([empresaId, abreviatura])
}

model Producto {
  id          Int      @id @default(autoincrement())
  empresaId   Int
  empresa     Empresa  @relation(fields: [empresaId], references: [id])

  // ── Identificación ─────────────────────────────────────
  sku             String   // código interno único por empresa
  codigoBarras    String?  // EAN13, UPC, Code128
  nombre          String
  descripcion     String?
  referencia      String?  // ref. del fabricante

  // ── Clasificación ──────────────────────────────────────
  categoriaId     Int?
  categoria       Categoria?    @relation(fields: [categoriaId], references: [id])
  marcaId         Int?
  marca           Marca?        @relation(fields: [marcaId], references: [id])
  unidadMedidaId  Int?
  unidadMedida    UnidadMedida? @relation(fields: [unidadMedidaId], references: [id])

  // ── Costos y precios ───────────────────────────────────
  costoPromedio   Decimal  @default(0) @db.Decimal(14, 4) // CPP, recalculado en cada entrada
  precioBase      Decimal  @default(0) @db.Decimal(14, 2) // precio de venta base

  // ── Tributario (Colombia - DIAN) ───────────────────────
  tipoIva         String   @default("GRAVADO_19")
  // EXENTO | EXCLUIDO | GRAVADO_5 | GRAVADO_19

  // ── Control de stock ───────────────────────────────────
  manejaBodega    Boolean  @default(true)   // controla stock físico
  manejaLotes     Boolean  @default(false)  // trazabilidad por lote/vencimiento
  manejaSerial    Boolean  @default(false)  // trazabilidad por serial
  stockMinimo     Decimal  @default(0)  @db.Decimal(12, 3) // alerta de reorden
  stockMaximo     Decimal? @db.Decimal(12, 3)
  puntoReorden    Decimal  @default(0)  @db.Decimal(12, 3)
  diasRotacion    Int?     // promedio calculado, actualizado periódicamente

  // ── Clasificación ABC ──────────────────────────────────
  claseAbc        String?  // A | B | C — calculado automáticamente
  claseAbcFecha   DateTime? // última vez que se recalculó

  // ── Estado ─────────────────────────────────────────────
  activo          Boolean  @default(true)
  imagen          String?

  // ── Relaciones ─────────────────────────────────────────
  stock           Stock[]
  movimientos     MovimientoInventario[]
  ordenesCompraItems OrdenCompraItem[]

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@unique([empresaId, sku])
  @@index([empresaId])
  @@index([empresaId, codigoBarras])
  @@index([empresaId, activo])
}

model Bodega {
  id          Int      @id @default(autoincrement())
  empresaId   Int
  empresa     Empresa  @relation(fields: [empresaId], references: [id])

  codigo      String
  nombre      String
  tipo        String   @default("ALMACEN")
  // ALMACEN | PUNTO_VENTA | TRANSITO | DEVOLUCION | VIRTUAL
  direccion   String?
  esPrincipal Boolean  @default(false) // bodega por defecto para movimientos
  activo      Boolean  @default(true)

  stock                Stock[]
  movimientosOrigen    MovimientoInventario[] @relation("MovOrigen")
  movimientosDestino   MovimientoInventario[] @relation("MovDestino")
  ordenesCompra        OrdenCompra[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@unique([empresaId, codigo])
  @@index([empresaId])
}

// Stock consolidado por producto+bodega — actualización atómica en cada movimiento
model Stock {
  id                Int      @id @default(autoincrement())
  empresaId         Int
  empresa           Empresa  @relation(fields: [empresaId], references: [id])
  productoId        Int
  producto          Producto @relation(fields: [productoId], references: [id])
  bodegaId          Int
  bodega            Bodega   @relation(fields: [bodegaId], references: [id])

  cantidad          Decimal  @default(0) @db.Decimal(12, 3)
  cantidadReservada Decimal  @default(0) @db.Decimal(12, 3) // reservada por pedidos pendientes
  // cantidad disponible = cantidad - cantidadReservada (calculada en query)

  updatedAt         DateTime @updatedAt

  @@unique([productoId, bodegaId])
  @@index([empresaId])
  @@index([empresaId, productoId])
}

// Kardex — registro inmutable de cada movimiento de inventario
model MovimientoInventario {
  id          Int      @id @default(autoincrement())
  empresaId   Int
  empresa     Empresa  @relation(fields: [empresaId], references: [id])

  numero      String   @unique // MOV-2026-00001

  // ── Clasificación ──────────────────────────────────────
  tipo        String
  // ENTRADA | SALIDA | TRASLADO_SALIDA | TRASLADO_ENTRADA
  // AJUSTE_POSITIVO | AJUSTE_NEGATIVO | DEVOLUCION_PROVEEDOR | DEVOLUCION_CLIENTE

  concepto    String
  // COMPRA | VENTA | AJUSTE_FISICO | TRASLADO | DEVOLUCION_PROVEEDOR
  // DEVOLUCION_CLIENTE | PRODUCCION | MERMA | APERTURA | OTRO

  // ── Producto y bodegas ─────────────────────────────────
  productoId       Int
  producto         Producto @relation(fields: [productoId], references: [id])
  bodegaOrigenId   Int?
  bodegaOrigen     Bodega?  @relation("MovOrigen",  fields: [bodegaOrigenId],  references: [id])
  bodegaDestinoId  Int?
  bodegaDestino    Bodega?  @relation("MovDestino", fields: [bodegaDestinoId], references: [id])

  // ── Cantidades y costos ────────────────────────────────
  cantidad         Decimal  @db.Decimal(12, 3)
  costoUnitario    Decimal  @default(0) @db.Decimal(14, 4) // CPP al momento del movimiento
  costoTotal       Decimal  @default(0) @db.Decimal(14, 2) // cantidad × costoUnitario

  // Saldo DESPUÉS de este movimiento (denormalizado para kardex rápido sin recalcular)
  saldoCantidad    Decimal  @db.Decimal(12, 3)
  saldoCostoTotal  Decimal  @db.Decimal(14, 2)  // valor total inventario en bodega
  saldoCpp         Decimal  @db.Decimal(14, 4)  // CPP después del movimiento

  // ── Trazabilidad ───────────────────────────────────────
  usuarioId        Int?                // User ERP que generó el movimiento
  referenciaId     String?             // ID del documento origen (OC, venta, etc.)
  referenciaTipo   String?             // OrdenCompra | Venta | TomaFisica | Manual
  movimientoParId  Int?                // para traslados: ID del movimiento complementario
  notas            String?

  fechaMovimiento  DateTime @default(now())
  createdAt        DateTime @default(now())

  @@index([empresaId, productoId])
  @@index([empresaId, productoId, fechaMovimiento])
  @@index([empresaId, tipo])
  @@index([empresaId, fechaMovimiento])
  @@index([referenciaId, referenciaTipo])
}

model Proveedor {
  id              Int           @id @default(autoincrement())
  empresaId       Int
  empresa         Empresa       @relation(fields: [empresaId], references: [id])

  // Identificación
  tipoDocumento   String?       // NIT | CC | CE | Pasaporte
  numeroDocumento String?
  nombre          String        // razón social o nombre
  nombreComercial String?

  // Contacto
  email           String?
  telefono        String?
  contactoNombre  String?       // nombre del contacto comercial
  direccion       String?
  ciudad          String?
  pais            String        @default("Colombia")

  // Condiciones comerciales
  plazoEntregaDias Int?         // lead time promedio en días
  condicionesPago  String?      // CONTADO | 30D | 60D | 90D
  descuentoBase    Decimal?     @db.Decimal(5, 2)  // % descuento habitual
  moneda           String       @default("COP")

  activo          Boolean       @default(true)
  notas           String?
  ordenesCompra   OrdenCompra[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([empresaId])
}

model OrdenCompra {
  id          Int      @id @default(autoincrement())
  empresaId   Int
  empresa     Empresa  @relation(fields: [empresaId], references: [id])

  numero      String   @unique  // OC-2026-00001
  proveedorId Int
  proveedor   Proveedor @relation(fields: [proveedorId], references: [id])
  bodegaId    Int                // bodega destino de la recepción
  bodega      Bodega   @relation(fields: [bodegaId], references: [id])

  estado      String   @default("BORRADOR")
  // BORRADOR | APROBADA | ENVIADA | RECIBIDA_PARCIAL | RECIBIDA | ANULADA

  // Fechas
  fechaEmision    DateTime  @default(now())
  fechaEsperada   DateTime? // fecha esperada de entrega
  fechaRecepcion  DateTime? // fecha de recepción completa

  // Totales calculados
  subtotal    Decimal  @default(0) @db.Decimal(14, 2)
  descuento   Decimal  @default(0) @db.Decimal(14, 2)
  iva         Decimal  @default(0) @db.Decimal(14, 2)
  total       Decimal  @default(0) @db.Decimal(14, 2)

  usuarioId   Int?
  notas       String?

  items       OrdenCompraItem[]
  recepciones RecepcionMercancia[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([empresaId, estado])
  @@index([empresaId, proveedorId])
}

model OrdenCompraItem {
  id            Int         @id @default(autoincrement())
  ordenCompraId Int
  ordenCompra   OrdenCompra @relation(fields: [ordenCompraId], references: [id])
  productoId    Int
  producto      Producto    @relation(fields: [productoId], references: [id])

  cantidad          Decimal  @db.Decimal(12, 3)
  cantidadRecibida  Decimal  @default(0) @db.Decimal(12, 3) // acumulado de recepciones
  costoUnitario     Decimal  @db.Decimal(14, 4)
  descuentoPct      Decimal  @default(0) @db.Decimal(5, 2)  // % descuento en este ítem
  subtotal          Decimal  @db.Decimal(14, 2)
  ivaValor          Decimal  @default(0) @db.Decimal(14, 2)
  total             Decimal  @db.Decimal(14, 2)

  recepcionItems    RecepcionItem[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model RecepcionMercancia {
  id            Int         @id @default(autoincrement())
  empresaId     Int
  empresa       Empresa     @relation(fields: [empresaId], references: [id])
  ordenCompraId Int
  ordenCompra   OrdenCompra @relation(fields: [ordenCompraId], references: [id])

  numero        String      @unique  // REC-2026-00001
  fecha         DateTime    @default(now())
  usuarioId     Int?
  notas         String?

  items         RecepcionItem[]

  createdAt     DateTime    @default(now())
}

model RecepcionItem {
  id                  Int                 @id @default(autoincrement())
  recepcionId         Int
  recepcion           RecepcionMercancia  @relation(fields: [recepcionId], references: [id])
  ordenCompraItemId   Int
  ordenCompraItem     OrdenCompraItem     @relation(fields: [ordenCompraItemId], references: [id])

  cantidadRecibida    Decimal  @db.Decimal(12, 3)
  costoUnitario       Decimal  @db.Decimal(14, 4)  // puede diferir de la OC (ajuste)

  createdAt           DateTime @default(now())
}
```

---

## 5. ARQUITECTURA BACKEND — NestJS

```
backend/src/
└── inventario/
    ├── categorias/
    │   ├── categorias.controller.ts
    │   ├── categorias.service.ts
    │   └── dto/categoria.dto.ts
    ├── marcas/
    │   ├── marcas.controller.ts
    │   ├── marcas.service.ts
    │   └── dto/marca.dto.ts
    ├── unidades-medida/
    │   ├── unidades-medida.controller.ts
    │   ├── unidades-medida.service.ts
    │   └── dto/unidad-medida.dto.ts
    ├── productos/
    │   ├── productos.controller.ts
    │   ├── productos.service.ts
    │   └── dto/producto.dto.ts
    ├── bodegas/
    │   ├── bodegas.controller.ts
    │   ├── bodegas.service.ts
    │   └── dto/bodega.dto.ts
    ├── stock/
    │   ├── stock.controller.ts
    │   └── stock.service.ts
    ├── movimientos/
    │   ├── movimientos.controller.ts
    │   ├── movimientos.service.ts   ← lógica del kardex + CPP
    │   └── dto/movimiento.dto.ts
    ├── proveedores/
    │   ├── proveedores.controller.ts
    │   ├── proveedores.service.ts
    │   └── dto/proveedor.dto.ts
    ├── ordenes-compra/
    │   ├── ordenes-compra.controller.ts
    │   ├── ordenes-compra.service.ts   ← flujo OC + recepción + CPP
    │   └── dto/orden-compra.dto.ts
    ├── dashboard/
    │   ├── inv-dashboard.controller.ts
    │   └── inv-dashboard.service.ts
    └── inventario.module.ts
```

### Endpoints clave (prefijo: `/api/v1/inventario`)

```
── Maestros ────────────────────────────────────────────────────
GET/POST    /categorias
GET/PATCH   /categorias/:id
GET/POST    /marcas
GET/POST    /unidades-medida
GET/POST/PATCH/DELETE  /productos
GET         /productos/buscar?q=         ← por nombre, SKU o código de barras

── Bodegas ─────────────────────────────────────────────────────
GET/POST    /bodegas
PATCH       /bodegas/:id

── Stock ────────────────────────────────────────────────────────
GET         /stock                        ← stock general con filtros
GET         /stock/producto/:id           ← stock de un producto en todas las bodegas
GET         /stock/alertas                ← productos bajo punto de reorden
GET         /stock/valoracion             ← valor total del inventario

── Movimientos / Kardex ─────────────────────────────────────────
GET         /movimientos                  ← historial general con filtros
GET         /movimientos/kardex/:productoId  ← kardex de un producto
POST        /movimientos/entrada          ← entrada manual
POST        /movimientos/salida           ← salida manual
POST        /movimientos/ajuste           ← ajuste + o -
POST        /movimientos/traslado         ← traslado entre bodegas

── Proveedores ──────────────────────────────────────────────────
GET/POST    /proveedores
GET/PATCH   /proveedores/:id

── Órdenes de Compra ────────────────────────────────────────────
GET/POST    /ordenes-compra
GET         /ordenes-compra/:id
PATCH       /ordenes-compra/:id          ← editar borrador
POST        /ordenes-compra/:id/aprobar
POST        /ordenes-compra/:id/recibir  ← crea recepción, actualiza stock + CPP
POST        /ordenes-compra/:id/anular

── Dashboard ────────────────────────────────────────────────────
GET         /dashboard                   ← KPIs, alertas, top productos
```

### Reglas de negocio críticas (MovimientosService)

```typescript
// 1. ENTRADA: actualiza stock + recalcula CPP
async procesarEntrada(productoId, bodegaId, cantidad, costoUnitario, empresaId) {
  const stock = await getStock(productoId, bodegaId);
  const nuevoCPP = (stock.cantidad * producto.costoPromedio + cantidad * costoUnitario)
                   / (stock.cantidad + cantidad);

  await Promise.all([
    actualizarStock(productoId, bodegaId, +cantidad),
    actualizarCPP(productoId, nuevoCPP),        // actualiza Producto.costoPromedio
    crearMovimiento({ tipo: 'ENTRADA', saldoCpp: nuevoCPP, ... }),
  ]);
}

// 2. SALIDA: usa CPP vigente para valorar la salida
async procesarSalida(productoId, bodegaId, cantidad, empresaId) {
  const producto = await getProducto(productoId);
  const costoTotal = cantidad * producto.costoPromedio;

  // Validar que hay stock suficiente (configurable por empresa)
  if (stock.cantidad < cantidad && !empresa.permiteStockNegativo) {
    throw new BadRequestException('Stock insuficiente');
  }

  await Promise.all([
    actualizarStock(productoId, bodegaId, -cantidad),
    crearMovimiento({ tipo: 'SALIDA', costoUnitario: producto.costoPromedio, costoTotal }),
  ]);
}

// 3. TRASLADO: genera 2 movimientos atómicos
async procesarTraslado(productoId, origenId, destinoId, cantidad) {
  await prisma.$transaction(async (tx) => {
    const mov1 = await crearMovimiento({ tipo: 'TRASLADO_SALIDA', bodegaOrigenId: origenId });
    const mov2 = await crearMovimiento({ tipo: 'TRASLADO_ENTRADA', bodegaDestinoId: destinoId,
                                         movimientoParId: mov1.id });
    await actualizarStock(productoId, origenId, -cantidad, tx);
    await actualizarStock(productoId, destinoId, +cantidad, tx);
  });
}
```

---

## 6. ARQUITECTURA FRONTEND — React

```
frontend/src/
├── pages/inventario/
│   ├── InvDashboard.tsx        ← KPIs, alertas, ABC visual, top productos
│   ├── productos/
│   │   ├── Productos.tsx       ← lista con búsqueda, filtros, stock badge
│   │   └── ProductoForm.tsx    ← crear/editar producto (5 secciones)
│   ├── bodegas/
│   │   └── Bodegas.tsx
│   ├── movimientos/
│   │   ├── Movimientos.tsx     ← historial general
│   │   ├── Kardex.tsx          ← kardex por producto
│   │   └── NuevoMovimiento.tsx ← entrada / salida / ajuste / traslado
│   ├── proveedores/
│   │   ├── Proveedores.tsx
│   │   └── ProveedorForm.tsx
│   └── ordenes-compra/
│       ├── OrdenesCompra.tsx
│       ├── OrdenCompraForm.tsx
│       └── OrdenCompraDetalle.tsx  ← vista + recepción de mercancía
│
└── components/inventario/
    ├── StockBadge.tsx          ← badge verde/amarillo/rojo según nivel
    ├── AlertasStock.tsx        ← panel lateral de alertas
    ├── KardexTable.tsx         ← tabla reutilizable del kardex
    ├── ProductoBuscador.tsx    ← autocomplete por SKU, nombre, barcode
    └── MovimientoIcon.tsx      ← icono + color por tipo de movimiento
```

### Rutas del módulo

```
/inventario                    → redirect a /inventario/dashboard
/inventario/dashboard          → InvDashboard
/inventario/productos          → Productos (lista)
/inventario/productos/nuevo    → ProductoForm (crear)
/inventario/productos/:id      → ProductoForm (editar)
/inventario/bodegas            → Bodegas
/inventario/movimientos        → Movimientos (historial)
/inventario/movimientos/nuevo  → NuevoMovimiento
/inventario/kardex             → Kardex (buscar producto)
/inventario/proveedores        → Proveedores
/inventario/proveedores/nuevo  → ProveedorForm
/inventario/proveedores/:id    → ProveedorForm
/inventario/ordenes-compra         → OrdenesCompra
/inventario/ordenes-compra/nueva   → OrdenCompraForm
/inventario/ordenes-compra/:id     → OrdenCompraDetalle
```

### Dashboard KPIs

| KPI | Cálculo |
|-----|---------|
| Valor total inventario | SUM(stock.cantidad × producto.costoPromedio) |
| Productos activos | COUNT(productos WHERE activo = true) |
| Productos bajo reorden | COUNT(stock.cantidad < producto.puntoReorden) |
| Órdenes de compra abiertas | COUNT(OC WHERE estado IN BORRADOR/APROBADA/ENVIADA) |
| Movimientos últimos 7 días | COUNT(movimientos WHERE fecha > now-7d) |
| Top 5 productos con más stock | Por valor (cantidad × CPP) |
| Top 5 alertas críticas | Stock en 0 o negativo |

---

## 7. REGLAS DE NEGOCIO IMPORTANTES

### 7.1 Stock Negativo
- Por defecto: **NO permitido** (lanza error al intentar sacar más de lo disponible)
- Configurable por empresa: `Empresa.permiteStockNegativo = false`
- Útil en entornos de distribución donde las ventas a crédito pueden adelantarse

### 7.2 Kardex Inmutable
- Los movimientos de inventario son **NUNCA editados ni eliminados**
- Para corregir un error: se genera un movimiento de ajuste compensatorio con referencia al movimiento errado
- Esto garantiza la trazabilidad contable y fiscal

### 7.3 Transaccionalidad
- Toda operación que modifique stock Y cree un movimiento debe hacerse en una **transacción Prisma**
- `prisma.$transaction([...])` garantiza que si falla un paso, todo se revierte

### 7.4 CPP Siempre Vigente
- `Producto.costoPromedio` se recalcula **en tiempo real** en cada entrada
- Las salidas siempre usan el CPP del momento exacto
- Nunca se recalcula hacia atrás (forward-only para integridad)

### 7.5 Número de Documentos
- Formato: `MOV-2026-00001`, `OC-2026-00001`, `REC-2026-00001`
- Secuencial por empresa y año (reset al inicio de cada año)
- Generado en el backend, nunca en el frontend

### 7.6 Multi-tenant
- Todos los endpoints filtran por `user.empresaId` extraído del JWT
- Nunca se acepta `empresaId` del body del request (previene acceso cruzado)
- Índices de BD incluyen `empresaId` en todas las queries principales

---

## 8. PLAN DE IMPLEMENTACIÓN — Sprints

### Sprint 1 — Maestros + Schema (2-3 sesiones)
1. ✅ Schema Prisma (todos los modelos de una vez)
2. Categorías CRUD (backend + frontend)
3. Marcas + Unidades de Medida (backend + frontend)
4. Productos CRUD básico (sin variantes)
5. Bodegas CRUD

### Sprint 2 — Stock + Movimientos + Kardex (2-3 sesiones)
1. Movimientos: Entrada, Salida, Ajuste
2. Traslado entre bodegas (2 movimientos atómicos)
3. Kardex por producto (con saldo acumulado)
4. Stock actual por producto/bodega
5. Alertas de stock bajo

### Sprint 3 — Compras (2 sesiones)
1. Proveedores CRUD
2. Órdenes de Compra (crear, editar borrador)
3. Flujo de aprobación de OC
4. Recepción de mercancía (parcial y total)
5. Update automático de stock + CPP al recibir

### Sprint 4 — Dashboard + Polish (1-2 sesiones)
1. Dashboard con todos los KPIs
2. Búsqueda de producto por SKU, nombre, barcode
3. Exportación de kardex (CSV básico)
4. Clasificación ABC automática

---

## 9. STACK TÉCNICO ADICIONAL NECESARIO

| Necesidad | Paquete | Uso |
|-----------|---------|-----|
| Generación de códigos de barras (imagen) | `bwip-js` | renderizar barcode en la UI |
| Exportación Excel | `exceljs` | kardex y reportes |
| Exportación PDF | `pdfmake` o `jspdf` | órdenes de compra |
| QR codes | `qrcode` | etiquetas de productos |

---

## 10. DECISIONES ARQUITECTÓNICAS CLAVE

| Decisión | Opción elegida | Motivo |
|----------|----------------|--------|
| Valoración de inventario | CPP (Costo Promedio Ponderado) | Estándar Colombia NIIF Pymes, simple de implementar |
| Kardex | Denormalizado con saldo en cada fila | Performance en lecturas sin recalcular |
| Stock actual | Tabla `Stock` separada | Lectura O(1), actualización atómica por transacción |
| Variantes | Fase 4 (no en MVP) | Reduce complejidad inicial; 70% de clientes no las necesitan |
| Lotes/seriales | Fase 4 (no en MVP) | Idem |
| Multi-almacén | Desde el día 1 | Diferenciador clave vs competidores básicos |
| Stock negativo | No por defecto | Configurable — la mayoría del retail no lo permite |
