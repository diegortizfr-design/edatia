# Edatia — Estado de Sesión
> Última actualización: 2026-10-23 (sesión 18)

---

## ¿Qué es Edatia?
SaaS ERP para empresas de retail y distribución. Tiene 4 portales principales y módulos especializados:
- `edatia.com` → Landing estática
- `erp.edatia.com` → ERP React (frontend/)
- `api.edatia.com` → API NestJS (backend/) — Swagger en /api/docs
- `manager.edatia.com` → Manager interno Edatia (manager/) ← EN CONSTRUCCIÓN ACTIVA
- `tiendas-virtuales/prestamos` → SaaS Multitenant de Control de Préstamos y Cobranza (puerto 3006)

---

## Estado actual del servidor

### Contenedores Docker
```
db                → PostgreSQL 15 (ERP)
api               → NestJS backend
web               → ERP React (Caddy)
landing           → HTML estático (Caddy)
manager           → Manager React (Caddy)
glowxir           → Tienda Virtual Baby World (Caddy)
herramientas      → Herramientas Edatia (Caddy)
prestamos         → Control de Préstamos y Cobranza SaaS (Express + React 19) [:3006]
```

### Credenciales
| Portal | Email | Contraseña |
|--------|-------|------------|
| Manager | admin@edatia.com | Manager123! |
| ERP | admin@edatia.com | Admin123! |
| Préstamos | creditorapidos26@gmail.com | Creditosrapidos2026 |

## Estado resuelto (sesión 18) — 2026-10-23

✅ **Integración, Geolocalización y Experiencia de Usuario de Tienda Física Distribuidora Baby World:**
  - **Ubicación Exacta y Accesos GPS One-Touch (`StoreLocationModal.tsx`):**
    - **Geolocalización y Dirección Oficial:** Se conectó la dirección exacta de la placa del local (**Calle 21 con Cra 35 Oeste, Mz 4 Casa 26, Poblado Campestre, Candelaria - Cali**) con el enlace oficial de Google Maps (`https://maps.app.goo.gl/yY63rsTFhMYcwv3k6`) y las coordenadas geográficas directas para Waze (`3.4116568, -76.4553798`) para el negocio *Distribuidora Baby World*.
    - **Modal Ultracompacto Sin Scroll:** Se eliminó el `iframe` pesado del mapa embebido, reduciendo la altura total a ~340px y eliminando por completo cualquier barra de desplazamiento vertical en celulares y pantallas de escritorio.
    - **Horarios Reales Desglosados:** Divididos en 3 columnas limpias: Lun-Vie (9:00 am - 1:00 pm / 4:00 pm - 8:30 pm), Sábados (9:00 am - 1:00 pm / 4:00 pm - 9:00 pm) y Domingos en jornada continua (9:00 am - 5:00 pm).
    - **Métodos de Pago Oficiales en Tienda:** Integrados con sus logotipos oficiales: Addi (`/logo-addi.png`), Sistecrédito (`/logo-sistecredito.png`), distintivo de Bre-B y Tarjetas Débito & Crédito.
  - **Componentes Vectoriales Oficiales de Navegación (`GoogleMapsIcon.tsx` y `WazeIcon.tsx`):**
    - **Google Maps Pin:** Componente SVG con los 5 tonos corporativos oficiales de Google Maps (azul, rojo, amarillo y verde).
    - **Waze:** Componente SVG con la carita sonriente en globo celeste (`#33CCFF`), ruedas oscuras y ojos característicos.
    - Integrados armoniosamente en la botonera GPS del modal y en el pie de página.
  - **Unificación Visual con el Pin Rojo de Ubicación Universal (`LocationPinIcon.tsx`):**
    - Se creó el icono del pin rojo clásico de geolocalización (`#EA4335`) con centro blanco y sombra sutil en la base, unificando todos los puntos de contacto de la tienda física:
      1. Botón del Navbar (`📍 Tienda Física` en desktop / `📍 Tienda` en móvil).
      2. Sello interactivo en los Trust Badges del Hero Banner (`🏬 Tienda física Poblado Campestre ↗`).
      3. Sello de confianza en la Ficha de Producto (`ProductDetailPage.tsx`).
      4. Tarjeta interactiva del Footer (`App.tsx`).
      5. Cabecera de dirección dentro del modal de ubicación.
  - **Optimización de Conversión y CRO:**
    - Se conservó y protegió el cintillo superior de ventas `🚀 Envío GRATIS en compras superiores a $150.000 COP` en todas las resoluciones (móvil y PC).
    - Se mantuvieron despejados los 2 CTAs principales del Hero (`Ver catálogo` y `Asesoría y Pedidos`), evitando la saturación cognitiva en móviles.
  - **Auditoría e Higiene de Código (File Hygiene & Clean Debugging):**
    - Limpieza de importaciones huérfanas en `StoreLocationModal.tsx`, `HeroBanner.tsx`, `ProductDetailPage.tsx` y `App.tsx`.
    - Cero sentencias `console.log` o código de prueba.
    - Validación estricta con `tsc && vite build` dentro de Docker (1.206 módulos transformados sin errores).
    - Despliegue en caliente y verificación HTTP 200 en contenedor `edatia-glowxir` (`localhost:3005`).

---

## Estado resuelto (sesión 17) — 2026-10-23

✅ **Verificación Post-Pull, Sincronización de Inventario y Migración Segura en Producción:**
  - **Validación Post-Pull (PR #21):**
    - Se verificaron cambios incorporados desde la rama `Diego` referentes al módulo de Inventario (`ControlExistencias.tsx`, `Bodegas.tsx`, `Movimientos.tsx`, `stock.service.ts`, `movimientos.service.ts`) y configuración de documentos (`ConfigDocumentos.tsx`).
    - Verificación estricta de dependencias y compilación: `tsc --noEmit` en backend y Vite build en frontend completados sin errores ni librerías sueltas.
  - **Migración Formal en Prisma (`codeModificarKardex`):**
    - Se identificó la adición del atributo `codeModificarKardex` en `ConfiguracionERP` de `schema.prisma`.
    - Para asegurar trazabilidad y coherencia en entornos limpios, se creó la migración oficial `20261023020000_add_code_modificar_kardex` con sentencia segura idempotente (`ADD COLUMN IF NOT EXISTS`).
    - Se ejecutó `prisma migrate deploy`, registrando la migración en `_prisma_migrations` sin tiempo de inactividad ni impacto sobre los datos existentes.
  - **Optimización de Empaquetado Frontend:**
    - Se configuró la partición de bundles en `frontend/vite.config.ts`, aislando los iconos vectoriales (`lucide-react`) en un chunk independiente (`icons`), optimizando el tiempo de carga del bundle principal.
  - **Despliegue y Salud Operativa:**
    - Respaldo preventivo completo generado en `backups/backup_20261023_014910`.
    - Reconstrucción de imágenes y despliegue exitoso con `deploy.sh`. Todos los 8 contenedores (`edatia-backend`, `edatia-frontend`, `edatia-db`, `edatia-manager`, `edatia-landing`, `edatia-glowxir`, `edatia-herramientas`, `edatia-prestamos`) 100% operativos y saludables en producción.

---

## Estado resuelto (sesión 16)

✅ **Sincronización Automática de Precios entre Inventario ERP y Tienda Virtual Baby World:**
  - **Causa Raíz:** La tienda virtual (`distribuidorababyworld/src/App.tsx`) prioriza `p.precioWeb || p.precioBase`. En `ConfigProductos.tsx`, la lógica previa `precioWeb: Number(formData.precioWeb) || price1` preservaba el `precioWeb` cargado originalmente, ignorando el nuevo `price1` (`precioBase`).
  - **Corrección en Frontend (`ConfigProductos.tsx` y `ProductoForm.tsx`):** `precioWeb` ahora se asigna directamente a `price1` en el guardado (`handleSave`) y en el `onChange` del formulario, garantizando que cualquier actualización en el ERP actualice de inmediato la tienda virtual.
  - **Salvaguarda en Backend (`productos.service.ts`):** En `update()`, `create()` e `importarMasivo()` (carga por Excel/CSV), si se actualiza o crea con `precioBase` y no se especifica un `precioWeb` diferente, se sincroniza automáticamente `precioWeb = precioBase`.
  - **Saneamiento Inmediato de Base de Datos:** Se actualizó en PostgreSQL (`edatia_erp`) todos los productos donde `precioWeb != precioBase`, reflejándose de inmediato los precios actualizados en la tienda virtual en vivo.
  - **Recompilación y Despliegue:** Contenedores `edatia-backend` y `edatia-frontend` reconstruidos y reiniciados exitosamente.

---

## Estado resuelto (sesión 15)

✅ **Visibilidad y Control de Publicación de Productos en Tienda Virtual Baby World desde el Inventario ERP:**
  - **Identificación Visual y Control Rápido en Catálogo de Productos (`ConfigProductos.tsx` y `Productos.tsx`):**
    - **Tarjetas KPI Interactivas de Tienda Web:** Se crearon 4 métricas superiores: Total Productos, 🌐 Publicados en Tienda Web (`publicadoWeb = true`), ⚪ Solo Inventario (Ocultos / `publicadoWeb = false`) y ⚠️ Sin Costo Asignado. Al hacer clic en cualquiera de las tarjetas se filtra la tabla automáticamente.
    - **Columna "Tienda Web" con Toggle Rápido de 1 Clic:** Se agregó la columna a la tabla de productos con insignias `🌐 Publicado` (verde) y `⚪ No publicado` (gris). Al hacer clic en el botón, se actualiza el estado de publicación en la base de datos de inmediato vía API (`updateProducto`) con feedback visual tipo toast, permitiendo publicar o retirar productos de la tienda virtual sin entrar a editar la ficha completa.
    - **Filtro Avanzado de Tienda Virtual:** Desplegable que permite segmentar entre "Todos en Tienda", "Solo Publicados en Tienda" y "Solo No Publicados / Solo ERP".
    - **Exportación Excel / CSV Enriquecida:** Se agregó el campo `Publicado_Tienda_Virtual` (`SI` / `NO`) en los reportes descargables de productos.
    - **Ficha Técnica:** Checkbox `🌐 Tienda Virtual` en la sección de características especiales para crear o editar productos con estado web y precio web opcional.
  - **Apertura de la Vitrina Web / Catálogo Digital (`CatalogoDigital.tsx` y `backend/src/digital`):**
    - **Corrección en Endpoint API Backend (`digital.service.ts` y `digital.controller.ts`):** Se removió el filtro estático `where: { publicadoWeb: true }` del controlador autenticado del ERP, permitiendo que ahora devuelva el catálogo completo de la empresa o filtre por query `publicado`.
    - **Rediseño de la Vitrina Web:** Nuevas tarjetas de conteo rápido, botón directo de acceso a la tienda pública de Baby World, insignias de estado con iconos vectoriales y switches de publicación inmediata.
  - **Soporte de Filtros en API de Inventario (`productos.controller.ts` y `productos.service.ts`):**
    - Soporte del parámetro query `publicadoWeb` en `findAll` de productos.
    - Tipado robusto en el servicio frontend (`inventario.service.ts`).

## Estado resuelto (sesión 14)

✅ **Optimización UI/UX del Header, Financiación BNPL y Branding Oficial de WhatsApp en Tienda Virtual Baby World:**
  - **Rediseño y Compactación Móvil del Banner Superior BNPL (Addi & Sistecrédito):**
    - **Reducción de >55% de altura en pantallas móviles:** Se reemplazó el texto multilínea por una distribución horizontal estricta (`flex-nowrap`, `py-1` / ~26px) con los logos oficiales (`/logo-addi.png` y `/logo-sistecredito.png`) alojados sobre una micro-píldora blanca con borde suave (`bg-white/95 px-2 py-0.5 rounded-full`) para máximo contraste.
    - **Modal Explicativo Reutilizable (DRY):** Se creó el componente `BnplInfoModal.tsx`, integrándolo de forma interactiva tanto al hacer tap en el banner superior como en los simuladores de cuotas de cada producto (`BnplCreditSimulator.tsx`), eliminando ~90 líneas de código duplicado.
  - **Integración del Logo Oficial Vectorizado de WhatsApp (`WhatsAppIcon.tsx`):**
    - **Insignia Vectorial Oficial con Doble Contorno:** Se desarrolló un componente SVG nativo con el aro exterior verde fino, el anillo blanco de separación, el cuerpo de burbuja verde `#28971B` y el auricular blanco en diagonal, garantizando 100% de transparencia real (sin la cuadrícula de ajedrez de falsos PNGs).
    - **Botón en Barra Superior:** Se actualizó el enlace en la barra oscura del Navbar a una píldora translúcida con el logo oficial (`bg-[#25D366]/20 border border-[#25D366]/40`).
    - **Refactorización del Botón Flotante (`FloatingWhatsAppButton.tsx`):** Se eliminó el contenedor circular verde redundante, permitiendo que la insignia de WhatsApp actúe directamente como botón flotante con sombra adaptada (`drop-shadow`) y feedback táctil.
    - **Footer & Hero:** Se unificó el logo oficial en el botón del HeroBanner y en el bloque de contacto del pie de página (*Atención & Asesoría*).
  - **Auditoría de Código y Limpieza de Dependencias:**
    - Depuración de 12 importaciones huérfanas de `lucide-react` en `App.tsx` y `Navbar.tsx`.
    - Validación de compilación estricta de TypeScript (`tsc`) y empaquetado de producción de Vite en Docker con código de salida 0.
    - Despliegue en caliente y verificación HTTP 200 en contenedor `edatia-glowxir` (`localhost:3005`).

## Estado resuelto (sesión 13)

✅ **Pipeline Automatizado de Pañales y Leches con IA (Gemini Flash), Cloudinary y Base de Datos ERP:**
  - **Procesamiento Multimodal y Clasificación de 24 Productos Nuevos:**
    - Se procesaron las 37 imágenes de la carpeta `catalogo/pañales y leches/`, agrupando limpiamente **13 modelos de subcarpetas** con múltiples fotos/ángulos y **11 modelos individuales de la raíz** con 1 foto única.
    - Gemini Flash Lite identificó marcas líderes (*Winny, Babysec, Klim, Nan Optipro, Nestógeno, Nestum*), líneas, etapas de edad/talla (*Etapa 1 a 5, Talla M, G, XG, XXG, XXXG*), gramajes netos (*135g, 250g, 400g, 800g, 900g, 1000g, 1800g*), viñetas técnicas y precios realistas en COP.
  - **Alojamiento y Estructura en Cloudinary:**
    - Subida automática bajo `distribuidorababyworld/panales_y_leches/` con nombrado semántico (`PAN-014` a `PAN-026` y `LEC-001` a `LEC-011`).
  - **Integración en Base de Datos ERP (Inventario vs. Tienda Virtual):**
    - Los 24 productos fueron importados directamente en PostgreSQL (`edatia_erp`) asociados a Distribuidora Baby World (`empresaId = 2` resuelto dinámicamente desde `ConfiguracionTienda`).
    - **Alineación de Categorías:** Se corrigieron los IDs estáticos en el script SQL para vincular dinámicamente con las categorías reales de producción: *Pañales y Cuidado* (`id = 41`) y *Alimentación* (`id = 39`), evitando fallas de llave foránea.
    - **Configuración de Publicación:** Marcados con `activo = true` (disponibles en el inventario del ERP) y **`publicadoWeb = false`** (ocultos de la tienda virtual hasta que se definan precios de venta finales y se decida su lanzamiento público).
  - **Reconstrucción y Despliegue:**
    - Reconstrucción de la imagen Docker de `edatia-glowxir` y despliegue en caliente con Caddy.
  - **Artefactos y Scripts Exportados:**
    - `backend/scripts/productos_panales_y_leches.json` y copia en `tiendas-virtuales/distribuidorababyworld/src/data/productos_panales_y_leches.json`.
    - `backend/scripts/importar_panales_y_leches.sql` blindado e importado con éxito en producción (24 registros creados).

## Estado resuelto (sesión 12)

✅ **Integración, Blindaje Multi-Tenant de Terceros, Corrección de Compilación y Despliegue en Producción:**
  - **Diagnóstico y Corrección de Compilación TypeScript en Backend (`clientes.service.ts` y `cliente.dto.ts`):**
    - Se detectó y subsanó un error de TypeScript (`TS2339: Property 'vendedorAsignadoId' does not exist on type 'CreateClienteDto'`).
    - Se incorporaron `vendedorAsignadoId` y `descuentoCliente` en los DTOs de clientes (`CreateClienteDto` y `UpdateClienteDto`), manteniendo total retrocompatibilidad con `vendedorId` y `descuentoBase`.
    - Sanitización del payload antes de Prisma para prevenir excepciones en tiempo de ejecución por propiedades no mapeadas.
  - **Integridad y Sincronización de Base de Datos y Prisma:**
    - Alineación de `backend/prisma/schema.prisma` con la regla `onDelete: SetNull` en la relación autorreferencial de `vendedorAsignado`.
    - Verificación exitosa en PostgreSQL (`edatia_erp`) confirmando que la llave foránea ya contaba con `ON DELETE SET NULL`.
    - Regeneración completa del cliente de Prisma.
  - **Blindaje Multi-Tenant y Seguridad de Terceros:**
    - Verificación estricta en ventas y facturas para asegurar que el cliente y el vendedor pertenezcan a la empresa y se encuentren activos.
    - Desacoplamiento seguro de roles: si un tercero posee múltiples roles (ej. cliente y proveedor), retirar un rol desactiva únicamente la bandera (`esCliente = false`) sin destruir el tercero ni sus otros roles activos.
    - Protección contable transaccional: verificación de dependencias (órdenes de compra, facturas, recibos, POS, cotizaciones); si tiene historial, se aplica soft-delete (`activo: false`).
    - Soporte a Consumidor Final (`222222222222`) y registro de clientes web en `digital.service.ts`.
    - Corrección de código DIAN de Pasaporte ('41') y Tarjeta de Identidad ('12') en `ubl.service.ts`.
  - **Frontend Unificado y UI:**
    - `ClienteForm.tsx` y `ProveedorForm.tsx` refactorizados como wrappers delegados sobre `ConfigTerceroForm.tsx`.
    - Mejoras en `Clientes.tsx` y `Proveedores.tsx`: badges de régimen fiscal, acciones rápidas, confirmación de eliminación con toast notifications.
  - **Compilación y Despliegue Exitoso en Contenedores Docker:**
    - Reconstrucción de imágenes `edatia-api` y `edatia-web` con `docker compose build api web`.
    - Despliegue en caliente (`docker compose up -d api web`). Contenedores saludables (`healthy`), con `GET /api/v1/health` respondiendo en 0-1ms y Caddy sirviendo los nuevos bundles de Vite.

## Estado resuelto (sesión 11)

✅ **Auditoría Financiera, Navegación Interactiva y Optimización del Módulo de Préstamos:**
  - **Corrección de Inconsistencias Matemáticas y Amortizaciones:**
    - **Desglose exacto de cuotas (`paymentController.ts`):** Cada cuota ahora calcula y persiste de forma proporcional `principalPaid` e `interestPaid`, manteniendo la integridad entre el saldo de capital colocado y las utilidades devengadas.
    - **Ajuste de centavos en última cuota (`loanController.ts` y `NewLoanModal.tsx`):** La última cuota absorbe los residuos de división decimal para garantizar que la suma exacta de las cuotas sea idéntica al monto total del crédito. Se agregó tolerancia (< $1 COP) para marcar préstamos como `PAID` sin centavos huérfanos.
    - **Sincronización automática de morosidad (`reportsController.ts` y `routeController.ts`):** Se implementó `syncTenantOverdueStatus(tenantId)`, evaluando cuotas vencidas y actualizando atómicamente cuotas y créditos a `OVERDUE`.
    - **Fórmula de Caja y Capital Disponible:** Corrección de la caja real de tesorería e inclusión de intereses por mora recaudados en los reportes ejecutivos.
    - **Optimización de Consulta N+1 (`Portfolio.tsx`):** Se eliminó el bucle de peticiones secuenciales reemplazándolo por una consulta paralela única.
  - **Navegación Interactiva en Dashboard con Filtros Automáticos (`Dashboard.tsx` y `App.tsx`):**
    - Todas las tarjetas KPI ahora cuentan con efectos hover, cursores interactivos e indicadores visuales de enlace.
    - *Total en Cartera* y *Cartera en Mora* trasladan a la tabla de Cartera filtrando automáticamente créditos `Vigentes` o `En Mora`.
    - *Cobrado Hoy* y *Recaudo últimos 7 días* llevan a la tabla de Recibos con filtro de fecha `Hoy` o `Semana`.
    - Soporte completo para parámetros hash en la URL (`/#portfolio?status=OVERDUE`, `/#transactions?date=today`).
  - **Directorio de Clientes con Ordenamiento y Filtros Inteligentes (`Clients.tsx` y `clientController.ts`):**
    - **Ordenamiento multicolumna ascendente y descendente:** Nombre/Cédula (A-Z/Z-A), Teléfono, Dirección, Créditos Activos (numérico) y Saldo Pendiente (mayor a menor / menor a mayor) con indicadores visuales `↑`, `↓`, `↕`.
    - **Pestañas de estado de cartera con contadores en vivo:** `Todos`, `🔴 En Mora` (con badge rojo pulsante), `🟢 Al Día` y `⚪ Paz y Salvo`.
    - **Filtro de periodicidad:** Desplegable para filtrar por modalidad (`Diario`, `Semanal`, `Quincenal`, `Mensual`).
    - **Badges visuales y diseño responsivo:** Alerta de `MORA` en rojo en deudores vencidos, contador de coincidencias, botón de restablecer filtros y adaptación para smartphones.
  - **Edición y Anulación de Préstamos con Protección Contable (`PUT /loans/:id` y `DELETE /loans/:id`):**
    - **Backend:** Validación de seguridad para permitir editar o anular préstamos únicamente si no tienen abonos registrados (`payments.length === 0`), recalculando el cronograma de amortización y ajustando el capital disponible del tenant en una transacción atómica. Si ya registran abonos, bloquea la alteración del capital original y orienta a la renovación.
    - **Frontend:** Modal interactivo `EditLoanModal.tsx` con simulación y recálculo en vivo de cuotas e intereses, botón de "✏️ Editar Monto" en la ficha del cliente y en la tabla de amortización (`AmortizationTable.tsx`), y opción para anular créditos errados.
  - **Documentación del Módulo:**
    - Creación y actualización de `tiendas-virtuales/prestamos/README.md` y sincronización con `README.md` general y `SESION.md`.

---

## Estado resuelto (sesión 10)

✅ **Despliegue y Blindaje de Catálogo de Calzado en Producción:**
  - **Ejecución y Carga en Base de Datos PostgreSQL (`edatia_erp`):**
    - Se ejecutó el script `backend/scripts/importar_zapatos_produccion.sql`, asegurando la categoría *Calzado* e importando limpiamente los **39 productos de calzado** con sus 90 fotos alojadas en Cloudinary (`distribuidorababyworld/zapatos/`).
    - Todos los 39 productos se cargaron con `publicadoWeb = false` y `esDestacado = false`, integrándose de inmediato al inventario del ERP Edatia para control interno de bodega, sin exposición pública en la tienda virtual hasta definir precios reales.
    - Se garantizó transferencia binaria directa con `docker compose cp` y ejecución con `psql -f`, preservando al 100% la codificación UTF-8 en nombres, descripciones y `metadataWeb` (tallas, tipos de cierre y materiales).
    - Se corrigió la consulta fallback de empresa en `generar_sql_importacion.js` e `importar_zapatos_produccion.sql` (eliminando referencia a columna inexistente `activo` en la tabla `Empresa`).
  - **Blindaje y Dinamismo de la Tienda Virtual (`distribuidorababyworld`):**
    - **Protección contra filtración de precios provisionales:** Se vació el array de fallback estático `PRODUCTOS_BABY_WORLD = []` en `productos.ts` y se inicializó el estado `products` en `[]` en `App.tsx` para evitar que ningún zapato con precio preliminar de prueba ($55.000) se visualice en la web durante la carga o ante caídas de red.
    - **Categoría Calzado Dinámica:** En `Navbar.tsx` y `App.tsx`, se implementó la propiedad `categories` calculada dinámicamente (`availableCategories`). La pestaña **"Calzado 👟"** permanece oculta mientras la tienda no tenga productos publicados en dicha categoría, evitando mostrar una sección vacía a los clientes.
    - **Activación automática desde el ERP:** En cuanto el administrador actualice los precios reales en el ERP (`erp.edatia.com`) y active el switch `publicadoWeb = true`, el producto y la categoría **"Calzado 👟"** aparecerán automáticamente en la tienda virtual sin requerir nuevos despliegues de código.
  - **Compilación y Despliegue Docker:**
    - Reducción del bundle JS en ~56 KB tras retirar mocks embebidos (`vite build` exitoso).
    - Reconstrucción de `edatia-glowxir` con `docker compose build --no-cache glowxir` y despliegue en caliente (`docker compose up -d glowxir`).
    - Validación de respuestas `HTTP/2 200 OK` tanto en la tienda virtual (`https://distribuidorababyworld.com`) como en la API pública (`https://api.edatia.com`), verificando que solo 110 productos activos se entregan al público y 39 permanecen seguros en el inventario.

---

## Estado resuelto (sesión 9)

✅ **Pipeline Automatizado de Calzado con IA (Gemini Flash), Cloudinary y PostgreSQL:**
  - **Procesamiento Multimodal y Clasificación de 39 Productos:**
    - Se procesaron las 90 imágenes de la carpeta `catalogo/zapatos/`, separando limpiamente **27 modelos de subcarpetas** con múltiples ángulos y **12 modelos individuales de la raíz** con 1 foto única.
    - Gemini Flash Lite generó nombres comerciales, descripciones cortas y persuasivas, rangos de tallas sugeridas, tipos de cierre (*Velcro, Cordón, Elástico*), materiales y viñetas técnicas.
  - **Alojamiento y Estructura en Cloudinary:**
    - Subida automática bajo `distribuidorababyworld/zapatos/` con nombrado semántico (`SAN-xxx`, `ZDP-xxx`, `ZCS-xxx`, `BOT-xxx`).
  - **Integración en Base de Datos y Estrategia Prueba vs. Producción:**
    - En pruebas (`edatia-db`): 39 productos insertados en la categoría *Calzado* con `publicadoWeb = true` para visualización inmediata.
    - Para producción: se generó `backend/scripts/importar_zapatos_produccion.sql` con `publicadoWeb = false`, permitiendo cargar los 39 productos al inventario del ERP Edatia ocultos de la web hasta ajustar precios reales.
  - **Corrección de Codificación UTF-8:**
    - Se resolvió el problema de caracteres corruptos (`??`) en Windows PowerShell mediante transferencia binaria directa con `docker compose cp` y ejecución con `psql -f`.
  - **Despliegue y UX de la Tienda Virtual (`edatia-glowxir`):**
    - Mapeo dinámico en `App.tsx` para renderizar atributos reales de calzado (`metadataWeb`) y recompilación exitosa de la SPA con Vite y Caddy.

---

## Estado resuelto (sesión 8)

✅ **Optimización Integral de Carga de Imágenes en Tienda Virtual (`distribuidorababyworld`):**
  - **Diagnóstico de Rendimiento:** Se detectó que para visitantes nuevos o en modo incógnito (con caché vacía), la descarga inicial de imágenes resultaba sumamente lenta debido a que se servían archivos PNG originales sin comprimir de hasta 1.72 MB cada uno (~35 MB descargados en la primera visita).
  - **Transformaciones Dinámicas de CDN:** Se implementó el módulo centralizado `imageOptimizer.ts` que inyecta automáticamente transformaciones en vivo a Cloudinary (`f_auto,q_auto,w_${width},c_limit`), convirtiendo los PNGs a formatos modernos ultraligeros (WebP / AVIF) y reduciendo el peso de cada imagen en un 99% (de 1.72 MB a ~14.6 KB).
  - **Dimensionamiento Inteligente por Componente:**
    - Tarjetas de catálogo y carrusel (`ProductCard.tsx`): 500px (~14 KB).
    - Miniaturas de carrito lateral (`CartDrawer.tsx`): 160px (~4 KB).
    - Detalle y Modal de producto (`ProductDetailPage.tsx` y `ProductDetailModal.tsx`): 900px para la foto principal y 160px-180px para las miniaturas de galería.
  - **Carga Prioritaria (Above-The-Fold):**
    - En el carrusel de recomendados (`FeaturedCarousel.tsx`) y los primeros 4 ítems del grid en `App.tsx`, se habilitó `loading="eager"` y decodificación asíncrona (`decoding="async"`), eliminando la postergación innecesaria del render visual.
  - **Experiencia de Usuario con Skeleton Shimmer y Resiliencia:**
    - En `ProductCard.tsx`, se añadió un placeholder animado suave tipo esqueleto durante la descarga con transición de opacidad (`fade-in`).
    - Manejo defensivo `onError`: si alguna imagen remota falla, conmuta automáticamente a `FALLBACK_IMAGE` y desactiva el esqueleto para evitar spinners colgados.
  - **Pre-conexión de Red y Optimización de Assets Estáticos:**
    - En `index.html`, se agregaron directivas `preconnect` y `dns-prefetch` para `https://res.cloudinary.com` y `https://api.edatia.com`, ahorrando 150-250ms de latencia DNS/TLS previa.
    - Se generó un `favicon.png` ligero de 35 KB (sustituyendo al uso de `mascotas.png` de 1.74 MB como favicon).
    - Se optimizó la marca de agua decorativa del banner a `mascotas-banner.png` (700px con antialiasing bicúbico).
  - **Compilación y Despliegue Docker:**
    - Verificación exitosa de tipos con `tsc && vite build` y recreación del contenedor `edatia-glowxir` en producción respondiendo con HTTP/1.1 200 OK.

---

## Estado resuelto (sesión 7)

✅ **Transparencia en Precios y Costo de Envío en Checkout:**
  - Se implementó un desglose claro e inequívoco en el checkout: Subtotal de productos + Flete ($8.000 para pedidos < $150.000, o Gratis para compras ≥ $150.000) con mensajes explicativos para evitar que el usuario perciba aumentos sorpresa en el total final al seleccionar Contra Entrega o cualquier método.
  - Se corrigió el flujo para que nunca muestre mensajes de "Gracias por tu compra" antes de que el pedido y el método de pago hayan sido realmente confirmados.

✅ **Gestión y Modificación de Pedidos sin Pérdida de Consecutivo:**
  - **Reutilización de Orden:** Al hacer clic en "Modificar pedido", el frontend ahora preserva y actualiza el `orderId` existente mediante `PATCH /public/tiendas/:slug/pedidos/:id/metodo-pago` en `digital-public.controller.ts` y `digital.service.ts`, evitando generar pedidos duplicados o quemar consecutivos fantasma (`#PED-00000X`).
  - **Limpieza de Pruebas:** Se depuraron las órdenes de prueba anteriores en la base de datos `edatia_erp` para que el contador de ventas reales arranque limpiamente desde `#PED-000001`.

✅ **Integración de Pagos Interoperables Bre-B (Banco de la República):**
  - **Código QR:** Se integró el código QR oficial de alta definición en `/qr-bre-b.png` con botón de descarga rápida (`Descargar QR para pagar desde tu galería`), solucionando la fricción de usuarios móviles que compran desde el celular y no pueden escanear su propia pantalla.
  - **Llave Bre-B Oficial:** Se configuró la llave **`@eip656`** como identificador de pago interoperable para todas las entidades financieras de Colombia (Nequi, Daviplata, Bancolombia, Banco de Bogotá, etc.), con botón de copiado en un clic y soporte en la vista de QR y pestaña dedicada.
  - **Retiro de Cuentas Tradicionales:** Se eliminó cualquier referencia a números de cuenta de Nequi / celulares personales en el modal de pago según solicitud, dejando el flujo 100% interoperable bajo Bre-B y Mercado Pago.
  - **Mensajes Automáticos a WhatsApp:** Los mensajes generados al presionar "Finalizar Pedido" indican con precisión el método de pago seleccionado (`Bre-B (Llave: @eip656 / QR)` o Contra Entrega) y adjuntan los datos del pedido directamente al WhatsApp de atención de la tienda.

✅ **Integración Mercado Pago Online:**
  - Se configuró el servicio `mercadopago.service.ts` y su endpoint en el backend para generar preferencias de pago seguras y redirección oficial a la pasarela.

✅ **Cobertura Local (Cali y Alrededores) vs. Envíos Nacionales con Flete al Cobro:**
  - **Zonas Locales con Domiciliario Propio:** Se definieron y habilitaron los sectores de atención directa: **Cali, Candelaria, Ciudad del Campo, Poblado Campestre, Palmira, Jamundí y Yumbo** con tarifa de domicilio local de **$8.000** (o Gratis para compras ≥ $150.000).
  - **Protección del Pago Contra Entrega:** El método de "Contra Entrega en Efectivo" queda habilitado únicamente para la zona de cobertura local. Si el cliente selecciona una ciudad fuera del Valle del Cauca, la opción se deshabilita automáticamente y se solicita el pago anticipado por Bre-B o Mercado Pago.
  - **Envíos Nacionales (Transportadora - Flete al Cobro):** Para pedidos fuera de la zona local, el flete se marca como $0 en la tienda web y se informa claramente que se despacha por transportadora con flete al cobro al recibir en su puerta (aprox. $12.000 - $18.000).
  - **Sincronización en Backend:** Validación en `digital.service.ts` para rechazar contra-entregas fuera de la zona local y calcular el envío correspondiente en base a la ciudad del pedido.

✅ **Desplegable de Ciudades y Capitales de Colombia (Envíos Nacionales):**
  - **Selector Organizado:** Al seleccionar "Otra Ciudad (Envío Nacional)" en el checkout de la tienda virtual, en lugar de un campo de texto en blanco, ahora se despliega un selector `<select>` categorizado por regiones (Bogotá/Cundinamarca, Antioquia, Valle del Cauca, Eje Cafetero, Santanderes, Costa Caribe, Suroccidente, Tolima/Huila, Boyacá, Llanos/Amazonía) con más de 60 ciudades principales y capitales del país.
  - **Opción para Pueblos Apartados:** Se añadió la opción "Otro municipio o población (escribir)..." que activa el campo de texto libre únicamente cuando el cliente reside en un municipio o corregimiento no listado.
  - **Confirmación Dinámica:** La nota informativa de flete al cobro por transportadora personaliza el destino dinámicamente indicando la ciudad elegida.

✅ **Apertura Automática de WhatsApp en Contra Entrega y Pantalla de Respaldo:**
  - **Apertura Inmediata:** Al presionar "Confirmar y Enviar Pedido" con método Contra Entrega, el sistema crea la orden en la base de datos de Edatia con su consecutivo (`#PED-00000X`), vacía el carrito de compras e intenta abrir WhatsApp inmediatamente en una nueva pestaña/app con el mensaje prellenado del pedido.
  - **Pantalla de Respaldo Intuitiva:** El modal permanece abierto en la pantalla de éxito con todos los datos clave (valor en efectivo a alistar, dirección y número de orden) y un botón de contingencia: *"Abrir WhatsApp para Coordinar Entrega (Toca aquí si WhatsApp no se abrió automáticamente)"*, evitando la contradicción de textos previa y garantizando que el 100% de los clientes inicien el chat.

✅ **Corrección de Emojis Corruptos () en Enlaces de WhatsApp:**
  - **Causa Raíz Identificada:** El acortador oficial de Meta `https://wa.me/` efectúa una redirección HTTP 302 hacia `api.whatsapp.com` cuyo servidor interno corrompe los caracteres UTF-8 de 4 bytes (emojis como 🍼, 🎉, 💵) transformándolos en `%EF%BF%BD` (el carácter de reemplazo Unicode ).
  - **Remediación:** Se reemplazó el uso de `wa.me` por la API directa `https://api.whatsapp.com/send?phone=...&text=...` tanto en el checkout (`CheckoutModal.tsx`) como en el carrito lateral (`CartDrawer.tsx`), preservando la codificación UTF-8 intacta y mostrando los emojis legítimos en cualquier dispositivo o navegador.

✅ **Depuración de Pruebas y Reinicio de Consecutivos para Producción:**
  - **Limpieza de Pedidos de Prueba:** Se eliminaron las 8 órdenes de prueba generadas durante la sesión en `PedidoVenta` y sus líneas en `PedidoVentaItem`, así como el cliente web de pruebas en `Tercero`.
  - **Reinicio del Consecutivo:** Se reiniciaron las secuencias de base de datos a 1 (`PedidoVenta_id_seq` y `PedidoVentaItem_id_seq`). El próximo pedido real que ingrese a la tienda virtual se creará limpiamente con el consecutivo **`#PED-000001`**.

✅ **Despliegue y Validación Docker:**
  - Reconstrucción y despliegue exitoso de `edatia-glowxir` y `edatia-backend` en Docker, validando respuestas HTTP/2 200 en producción.

---

## Estado resuelto (sesión 6)

✅ **Soporte Multi-imagen en Tienda Virtual (`distribuidorababyworld`):**
  - **Exposición API:** Se modificó `digital.service.ts` (`getProductosWebPublic`) para incluir `metadataWeb: true` en la consulta Prisma, permitiendo que el endpoint público `/digital/tienda/:slug/productos` entregue todas las imágenes adicionales registradas del producto.
  - **Mapeo Frontend:** Se actualizó `App.tsx` para mapear dinámicamente `metadataWeb.imagenes` hacia `product.imagenes`, asegurando fallback limpio a `p.imagen` principal o imagen por defecto.
  - **Galería Interactiva:** Se implementó selector dinámico con carrusel de miniaturas tanto en la vista individual de producto (`ProductDetailPage.tsx`) como en el modal de detalle rápido (`ProductDetailModal.tsx`).
  - **Nuevas Categorías:** Se agregaron íconos y soporte para 'Ropa' y 'Alimentación' en la navegación (`Navbar.tsx`).

✅ **Reordenamiento Drag & Drop de Galería en ERP:**
  - En la pestaña Web de edición de producto (`ConfigProductoDetalle.tsx`), se implementó ordenamiento drag-and-drop nativo HTML5 para las miniaturas de imágenes.
  - **Imagen Principal Dinámica:** La primera imagen del arreglo se destaca con una etiqueta visual "Principal". Al arrastrar y soltar cualquier miniatura a la primera posición, el ERP actualiza automáticamente tanto `metadataWeb.imagenes` como el campo raíz `imagen` en la base de datos a través de la API.

✅ **Optimización de Importación de Catálogo (Bulk Insert):**
  - En `importar_catalogo.ts`, se refactorizó la inserción de productos generados por IA cambiando el bucle secuencial `create` por `prisma.producto.createMany({ skipDuplicates: true })`, resolviendo problemas de lentitud y timeout al procesar cientos de ítems.
  - Ajustes de clasificación de categorías y subcategorías para la empresa en scripts de backend.

✅ **Despliegue y Validación Docker:**
  - Se actualizó el contexto de construcción del servicio `glowxir` en `docker-compose.yml` apuntando al directorio `./tiendas-virtuales/distribuidorababyworld`.
  - Reconstrucción y despliegue exitoso de contenedores `edatia-glowxir`, `edatia-backend` y `edatia-frontend`.

✅ **Auditoría de Almacenamiento (Cloudinary vs VPS):**
  - Verificado el pipeline de subida: las imágenes se reciben de forma temporal en el VPS y se transfieren de inmediato a Cloudinary, eliminándose del disco local (`fs.unlinkSync`), manteniendo 0 ocupación de espacio persistente en el VPS.
  - Confirmada la política de borrado: al eliminar un producto en el backend, sus imágenes asociadas en Cloudinary se eliminan de forma automática (`cloudinary.uploader.destroy`).

✅ **Fix en Edición de Usuarios y Cambio de Contraseña (ERP):**
  - **Causa raíz del error 400:** La validación estricta del backend (`forbidNonWhitelisted: true`) rechazaba el payload de `Usuarios.tsx` en `PATCH /api/v1/users/:id` porque `UpdateUserDto` solo tenía definidos `nombre`, `bio` y `password`, bloqueando `usuario`, `email`, `activo` y `rol`.
  - **Resolución Backend:** Se expandió `UpdateUserDto` para aceptar `usuario`, `email`, `activo` y `rol` con sus debidos validadores, se ajustó la longitud mínima de contraseña a 6 caracteres con mensajes amigables, y se actualizó `UsersService.update` para aplicar estos campos en base de datos con chequeo de unicidad por empresa y protección del último administrador activo.
  - **Resolución Frontend:** Se integraron notificaciones toast (`react-hot-toast`), se aseguró la conservación del rol de administrador al abrir el formulario de edición y se añadió pre-validación de contraseña.

---

## Estado resuelto (sesión 5)

✅ **ERP Configuración de Productos (UI/UX):**
  - Se corrigió el bug de mapeo de datos que causaba que el `precioBase` apareciera como `$0` al editar un producto en `ConfigProductos.tsx`.
  - Se reubicó el campo de **Precio de Venta (Base)** a la Sección 1 (Información General) con diseño destacado (emerald).
  - Se simplificó la *Matriz Especial de 11 Precios* (Sección 6) a solo un precio adicional (Precio Mayorista) para limpiar la interfaz.
  - **Sincronización Tienda Virtual:** Se agregó `precioWeb` al payload de guardado en el ERP para que los precios se sincronicen automáticamente hacia la tienda de Distribuidora Baby World (`glowxir`) sin necesidad de doble digitación.
  - Reconstrucción del contenedor frontend (`edatia-web`) para aplicar los cambios en entorno local.
  - **Previsualización de Imágenes (ERP):** Se hizo cliqueable la miniatura del producto en la tabla del inventario (`ConfigProductos.tsx`), permitiendo abrir la imagen completa en una nueva pestaña (`target="_blank"`) para mejor usabilidad sin perder el contexto ni los filtros.

---

## Estado resuelto (sesión 4)

✅ **Tienda Virtual (Baby World):**
  - Refactorización de `App.tsx` y `HeroBanner.tsx` para categorizar los productos dinámicamente usando las relaciones de categoría padre (`p.categoria.parent`) e hija (`p.categoria`).
  - Añadidas secciones de "Ropa" y "Alimentación" a la navegación.
✅ **Migración y Fix de Imágenes (Cloudinary):**
  - Las imágenes en Cloudinary cambiaron de carpeta (de `glowxir` a `distribuidorababyworld`), rompiendo los enlaces en la BD.
  - Se construyó el script `fix_images.js` para buscar todas las imágenes en Cloudinary por prefijo de SKU y actualizar automáticamente 125 URLs en la base de datos de producción.
✅ **Recuperación de Accesos (ERP):**
  - Se extrajo el usuario `admin@diegortiz.site` y el NIT `1143875756-0` desde PostgreSQL (`edatia_erp`).
  - Se forzó el reseteo de contraseña a `123456` usando el script `fix_password.js` (bcrypt, 12 rounds) desbloqueando el usuario en el proceso (`loginFallidosConsecutivos = 0`).
✅ **CORS y Redirecciones locales:**
  - El contenedor frontend (`edatia-glowxir`) fue restaurado al puerto original `3005` para pasar la seguridad CORS estricta del backend en desarrollo local, y se instruyó usar ventana de Incógnito para evadir la caché de redirección 301 de navegadores.

---

## Estado resuelto (sesión 3)

✅ **Mejoras Importador Masivo (CSV):**
  - Soporte automático para codificaciones ANSI/Windows-1252 y UTF-8 (reparación de tildes y eñes).
  - Prevención de duplicación de inventario: `Stock_Inicial` ahora solo se suma si el producto es nuevo.
  - Soporte para la nueva columna `Imagenes` (separada por comas) mapeada automáticamente a `metadataWeb.imagenes` para uso futuro en la tienda virtual, asignando la primera como imagen principal.
✅ **Códigos de Barras Internos:**
  - Auto-generación de EAN-13 (prefijo `20` + padding de ID + Check Digit) desde el backend al crear o importar productos sin código de barras.
✅ **Agente de Impresión Local (`edatia-print-agent`):**
  - Modificación del servidor local Node/escpos para soportar impresión de códigos de barras.
  - Añadido botón "Imprimir Etiqueta" en el frontend `ConfigProductos.tsx` que envía nombre, precio formateado y código de barras directamente al agente USB.
✅ **Actualización Plantilla:** 
  - `plantilla_inventario_edatia.csv` enriquecida con BOM UTF-8 nativo y nueva columna `Imagenes`.

---

## Estado resuelto (sesión 2)

✅ Seed Manager corrido — admin creado correctamente
✅ Login en manager.edatia.com funcionando con `admin@edatia.com` / `Manager123!`
✅ 5 contenedores Docker corriendo en producción

---

## Últimos cambios commiteados (rama main)

| Commit | Descripción |
|--------|-------------|
| f122b1a | fix: proteger único admin activo de ser desactivado |
| anterior | feat: redesign completo Manager (light/dark, full pages, HR form) |
| anterior | feat: Manager portal completo (backend + frontend) |

---

## Qué se construyó en la última sesión (resumen técnico)

### Backend — nuevos campos en schema.prisma
- **PerfilCargo**: `responsabilidades`, `correoPrincipal`, `subcorreos String[]`, `documentoUrl`
- **Colaborador**: ~35 campos HR completos (datos personales, contacto, laboral, formación, experiencia, habilidades, seguridad social, financiero, emergencia, documentación)

### Backend — protección admin
En `colaboradores.service.ts → toggleActivo()`:
- Si el colaborador a desactivar es el único ADMIN activo → lanza `ConflictException`
- Nunca más se puede quedar sin admin activo

### Frontend Manager — cambios de diseño
- **Tema claro por defecto** (blanco), toggle Moon/Sun para modo oscuro
- `ThemeContext.tsx` con localStorage (`edatia-theme`)
- `tailwind.config.js` con `darkMode: 'class'`
- Todos los componentes tienen clases `dark:` duales

### Frontend Manager — flujo de Colaboradores
- Colaboradores NO tienen botón "Crear" propio
- Se crean DESDE el PerfilCargo (botón UserPlus en la lista de colaboradores del perfil)
- Ruta: `/perfiles-cargo/:perfilId/colaboradores/nuevo`

### Frontend Manager — páginas nuevas
1. **PerfilCargoForm** (`/perfiles-cargo/nuevo` y `/perfiles-cargo/:id`)
   - Layout 2 columnas: izquierda (info, correos, documentación) + derecha (permisos, colaboradores)
   - Sticky header con nombre inline editable
   - Tag-inputs para subcorreos y permisos

2. **ColaboradorForm** (`/perfiles-cargo/:perfilId/colaboradores/nuevo`)
   - 11 secciones HR con nav lateral sticky
   - Secciones: Acceso, Datos Personales, Contacto, Laboral, Formación, Experiencia, Habilidades, Seguridad Social, Financiero, Emergencia, Documentación
   - POST a `/manager/colaboradores`

---

## Comandos frecuentes en servidor

```bash
# Ver logs
docker compose logs api --tail=50
docker compose logs manager --tail=50

# Rebuild completo
git pull && docker compose build --no-cache api manager && docker compose up -d

# Solo reiniciar sin rebuild
docker compose restart api manager

# Seed Manager (crear admin + módulos + planes)
docker compose exec api npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/manager-seed.ts

# Seed ERP (crear admin ERP + empresa demo)
docker compose exec api npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# Migraciones
docker compose exec api npx prisma migrate deploy

# Ver tabla Colaborador
docker compose exec db psql -U admin -d edatia_erp -c "SELECT id, email, nombre, rol, activo FROM \"Colaborador\";"

# Reactivar admin manualmente
docker compose exec db psql -U admin -d edatia_erp -c "UPDATE \"Colaborador\" SET activo = true WHERE email = 'admin@edatia.com';"
```

---

## Pendiente / Próximos pasos

### 🔴 Prioritario — próxima sesión
1. **Módulo Clientes (ClienteManager) — rediseño completo**
   - Eliminar el modal actual de creación
   - Reemplazar por página completa (`/clientes/nuevo` y `/clientes/:id`)
   - El usuario va a pasar los campos exactos que necesita
   - Mismo patrón que ColaboradorForm: secciones con nav lateral sticky
   - Archivos a modificar:
     - `manager/src/pages/Clientes.tsx` → quitar modal, agregar botón que navega a página
     - `manager/src/pages/ClienteForm.tsx` → CREAR NUEVO (no existe aún)
     - `manager/src/App.tsx` → agregar rutas `/clientes/nuevo` y `/clientes/:id`
     - `backend/src/clientes-manager/` → revisar/expandir campos según lo que pida el usuario
     - `backend/prisma/schema.prisma` → agregar nuevos campos al modelo `ClienteManager`

2. **Migración de campos HR del Colaborador** (si no se corrió):
   ```bash
   docker compose exec api npx prisma migrate dev --name expand-colaborador-perfilcargo
   ```

### 🟡 Siguiente
3. **Probar flujo completo**: crear PerfilCargo → crear Colaborador desde ese perfil
4. **Módulo Coordinación** — definir vistas y funcionalidad
5. **Módulo Operación** — definir vistas y funcionalidad
6. **Documentos** — PlantillaDoc + DocumentoCliente (contratos/propuestas)
7. **Agente IA** — Claude Agent con herramientas SSH para control VPS desde Telegram

---

## Estructura de archivos clave

```
backend/
  src/
    colaboradores/
      colaboradores.service.ts      ← SELECT_PUBLIC/FULL, toggleActivo protegido
      colaboradores.controller.ts   ← CRUD + toggle + transferir
      dto/colaborador.dto.ts        ← 35+ campos HR
    perfiles-cargo/
      perfiles-cargo.service.ts
      perfiles-cargo.controller.ts
      dto/perfil-cargo.dto.ts       ← responsabilidades, correoPrincipal, subcorreos
    manager-auth/
      manager-jwt.strategy.ts       ← usa MANAGER_JWT_SECRET, strategy 'manager-jwt'
      manager-jwt-auth.guard.ts
      roles.guard.ts
      roles.decorator.ts
  prisma/
    schema.prisma                   ← modelos Manager: Colaborador, PerfilCargo, etc.
    manager-seed.ts                 ← crea admin + 5 módulos + 3 planes

manager/
  src/
    context/
      AuthContext.tsx               ← login con VITE_API_URL + /manager/auth/login
      ThemeContext.tsx              ← toggle light/dark, localStorage
    pages/
      Login.tsx
      Dashboard.tsx
      Colaboradores.tsx             ← solo lista, sin botón crear
      ColaboradorForm.tsx           ← 11 secciones HR
      PerfilesCargo.tsx             ← lista con cards
      PerfilCargoForm.tsx           ← form completo con colaboradores embebidos
      Modulos.tsx
      Planes.tsx
      Clientes.tsx
    components/
      layout/AppLayout.tsx          ← toggle Moon/Sun
      layout/Sidebar.tsx
      ui/Card.tsx
      ui/Button.tsx
      ui/Input.tsx
      ui/Badge.tsx
    lib/
      api.ts                        ← axios con baseURL VITE_API_URL + Bearer token
      utils.ts
    App.tsx                         ← rutas incluyendo las nuevas
  tailwind.config.js                ← darkMode: 'class'
```

---

## Variables de entorno importantes

```env
# backend/.env
MANAGER_JWT_SECRET=...   ← diferente al JWT_SECRET del ERP

# manager/.env (o .env.production)
VITE_API_URL=https://api.edatia.com
```

---

## Notas técnicas

- `(prisma as any).modelName` — patrón usado en Manager porque los modelos se añadieron por migración y TypeScript no los tipó hasta `prisma generate`
- Manager JWT usa strategy name `'manager-jwt'` — diferente al ERP que usa `'jwt'`
- `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` en schema.prisma (Alpine Docker)
- Red Docker: `n8n_default` (debe existir antes del deploy)
- CORS backend incluye `https://manager.edatia.com` y `http://localhost:5174`

## Sesión 2026-09-12 - Arreglo Entorno Local y Bug Refinanciación

**Configuración Local:**
- Se corrigió el archivo backend/prisma/seed.ts para que la búsqueda/creación de usuarios utilice la llave compuesta correcta (empresaId_usuario).
- Se configuró el docker-compose.override.yml local exponiendo puertos que concuerden con la lista de CORS autorizados (ej. 5173, 5174).
- Se inyectaron variables locales (.env) para Manager y Frontend apuntando a http://localhost:4000.

**Módulo Préstamos (Control de Cartera):**
- Bug Fix: Se arregló un bloqueo nativo de validación HTML5 en la refinanciación (RenewLoanModal.tsx) causado por step="10000". Se redujo a step="1" para permitir cifras exactas.

## [2026-09-19] Implementacin Control Manual de Mora
- **Feature (Mora Separada)**: Se agreg un campo especfico de 'Mora Cobrada' en el \PaymentModal.tsx\ y en el \Route.tsx\ para separar la penalidad de la cuota principal.
- **Frontend / UX**: 
  - Se modificaron \Route.tsx\ y \Portfolio.tsx\ para etiquetar con **EN MORA** a los clientes atrasados.
  - Se actualiz \PrintViews.tsx\ para desglosar la Mora Cobrada en el recibo impreso.
  - Se modific \clientDetailTypes.ts\ para aadir \lateInterestAmount\.
- **Backend / DB**: Se valid que el \paymentController\ est consumiendo correctamente el valor \lateInterestAmount\ guardndolo en la base de datos PostgreSQL independiente (\edatia-prestamos\).
- **Commits / Ramas**: Estos cambios se desarrollaron dentro de la rama \feature/mora-separada\.

## Sesión 2026-09-22 - Rediseño Tienda Virtual Baby-World (glowxir)

**Diseño y UI:**
- Se implementó un estilo "pastel" utilizando los tonos `blush-300` y `baby-300` definidos en `tailwind.config.js`.
- Se incorporó la tipografía "Chewy" para darle un toque infantil al título "Baby World".
- Se rediseñó por completo el `HeroBanner.tsx`:
  - Se agregaron botones de "Ver catálogo" y "Pedir por WhatsApp".
  - Se integraron *trust badges* (Envíos rápidos, Pago contra entrega, 100% Garantizado).
  - Se añadieron tarjetas descriptivas grandes y limpias para las 3 categorías principales (Pañales, Juguetería, Variedades).
- Se agregó la mascota corporativa (`mascotas.png`) como una marca de agua decorativa sutil con opacidad del 25% para evitar sobrecargar la interfaz.

**Mejoras UX/UI (feature/mejoras-ux-ui):**
- **Animaciones:** Se añadieron keyframes personalizados en Tailwind (`fade-in-up`, `float`, `fade-in`) para lograr entradas suaves de los elementos (Hero y ProductCards) y una decoración flotante sutil (estrellas y corazones) en el HeroBanner.
- **Carrusel Destacado:** Se creó el componente `FeaturedCarousel.tsx` insertado en `App.tsx` para mostrar exclusivamente los productos marcados como `esDestacado: true`.
- **Skeletons de Carga:** Se creó `ProductSkeleton.tsx` que se muestra condicionalmente en `App.tsx` mientras el catálogo carga (`isLoading`), evitando saltos visuales o pantallas en blanco.
- **Micro-interacciones:** Se actualizó la barra superior de envíos en `Navbar.tsx` para promocionar el envío gratis con la clase `animate-pulse`.

**Infraestructura (Docker):**
- Se actualizó el archivo `Caddyfile` del proyecto `glowxir` para enviar cabeceras estrictas de `Cache-Control: no-cache` en archivos HTML, asegurando que los cambios se reflejen inmediatamente en entornos locales sin quedarse atrapados en la caché del navegador.

## Sesión 2026-10-02 - Preparación a Producción Baby-World y Seguridad

**Limpieza y Refactorización de BD:**
- Se realizó una limpieza quirúrgica de transacciones de prueba en la base de datos `edatia_erp`, borrando las empresas 1, 3, y 4 (generadas por los scripts de seed de demostración).
- Se protegió y respetó completamente la base de datos `herramientas_edatia` (Módulo Préstamos), ya que está operando en producción real.
- Se renombró la Empresa 2 (demo) a "Distribuidora Baby World" para utilizarse como entorno limpio en producción. Se actualizó el usuario principal a `admin@babyworld.com`.
- Se generaron backups de todas las bases de datos en `/home/diego/edatia/backups`.

**Seguridad (Vulnerabilidad Crítica):**
- Se detectó y eliminó un endpoint público `POST /auth/register` en `auth.controller.ts` que permitía a cualquier atacante externo crear usuarios administradores libremente, evadiendo el pago y registro del SaaS.
- Se recompiló el contenedor `api` (`docker compose build api` y `docker compose restart api`) para inyectar este parche crítico de seguridad en producción.

**Sincronización Multi-Tenant:**
- Se sincronizó la tabla `ClienteManager` para reflejar correctamente "Distribuidora Baby World" en el panel interno del propietario del SaaS (`manager.edatia.com`).

## Sesión 2026-10-09 - Mejoras UX en Gestión de Productos y Limpieza Cloudinary

**Frontend (ERP):**
- Se implementó la funcionalidad Drag & Drop (Arrastrar y Soltar) en `ConfigProductoDetalle.tsx` para subir imágenes de los productos de manera más intuitiva.
- Se añadió feedback visual (`isDragging`) con diseño punteado y capa superpuesta para mejorar la UX.

**Backend & Integración Cloudinary:**
- Se creó el endpoint `DELETE /configuracion/archivo/cloudinary` en `configuracion-archivo.controller.ts` para el borrado físico de imágenes, evitando almacenamiento inútil.
- Se optimizó la carga de imágenes (`api.ts`) inyectando automáticamente parámetros de transformación de Cloudinary (`q_auto,f_auto,c_limit,w_1200`).
- Se actualizó `productos.service.ts` para que, al borrar un producto del inventario, se eliminen automáticamente sus respectivas fotos en Cloudinary.

## Sesión 2026-10-15 - Integración BNPL (Addi y Sistecrédito) para Baby World

**Frontend (Tienda Virtual Distribuidora Baby World):**
- **Componente `BnplCreditSimulator.tsx`:**
  - Simulador de cuotas dinámico para Addi (3 cuotas 0% interés para montos ≥ $50.000 COP) y Sistecrédito (quincenas cómodas).
  - Modal interactivo *"¿Cómo funciona?"* con guía paso a paso para aprobación rápida con cédula y WhatsApp.
  - Modo compacto integrado en las tarjetas de producto del catálogo (`ProductCard.tsx`).
- **Logos Oficiales:**
  - Se añadieron y optimizaron los logos oficiales de Addi (`/logo-addi.png`) y Sistecrédito (`/logo-sistecredito.png`) en `public/`.
  - Integrados en el simulador, tarjetas, aviso de carrito, opciones de checkout y footer.
- **Ficha de Producto (`ProductDetailPage.tsx` y `ProductDetailModal.tsx`):**
  - Simulador de cuotas insertado estratégicamente debajo del precio principal.
- **Top Announcement Bar & Hero Banner (`App.tsx`, `HeroBanner.tsx`):**
  - Cintillo superior promocionando el crédito sin tarjeta tanto en la tienda virtual como en el local de Candelaria.
  - Trust badge actualizado en el Hero con los logotipos oficiales.
- **Carrito de Compras (`CartDrawer.tsx`):**
  - Recordatorio antes del checkout con los logos oficiales para incentivar la finalización de compra.
- **Checkout Modal (`CheckoutModal.tsx`):**
  - Método de pago 4: *"Crédito Addi o Sistecrédito (Sin tarjeta)"*.
  - Selector de entidad (`Addi` vs `Sistecrédito`), campo opcional para número de cédula del titular, mensaje prearmado a WhatsApp y pantalla de confirmación contextual con desglose de cuotas.
- **Footer (`App.tsx`):**
  - Sección de sellos oficiales de medios de pago y financiación autorizados con logos oficiales.

**Backend (`digital.service.ts`):**
- Soporte para el código de pago `'credito'` en `crearPedidoWeb` y `cambiarMetodoPagoWeb`.
- Asignación de condición de pago `CREDITO_PENDIENTE` en `pedidoVenta`.

**Infraestructura (Docker):**
- Reconstrucción de imágenes `edatia-glowxir` y `edatia-backend`.
- Despliegue en caliente (`docker compose up -d glowxir api`) y validación HTTP 200 en puerto local 3005 y 4000.

## Sesión 2026-10-20 - Auditoría, Sistema de Backups y Restauración Integral del Sistema

**Diagnóstico y Corrección de Infraestructura:**
- **Detección de fallo silencioso en `deploy.sh`:** Se descubrió que el paso de backup preventivo ejecutaba `pg_dumpall -U postgres`, pero el usuario `postgres` no existe en la instancia de PostgreSQL de producción (el superusuario configurado es `admin`). Esto causaba que todos los backups generados en despliegues previos fueran archivos vacíos de 0 bytes (se eliminaron 35 archivos corruptos/vacíos).
- **Falta de backups en `prestamos_edatia`:** La base de datos de Préstamos nunca había tenido una copia de seguridad exitosa.

**Nuevos Scripts de Operación:**
- **`backup.sh`:**
  - Respaldo completo del cluster PostgreSQL (`pg_dumpall`).
  - Dumps individuales comprimidos con gzip para `edatia_erp`, `prestamos_edatia` y `herramientas_edatia`.
  - Respaldo empaquetado del volumen de archivos subidos por clientes (`edatia_uploads-data`).
  - Respaldo seguro de configuraciones y variables de entorno (`.env`) con permisos `chmod 600`.
  - Generación de `manifest.txt` con sumas criptográficas SHA-256, metadatos de Git (commit/branch) y conteo de registros clave (`User`, `Empresa`, `Producto`, `Tercero`, `Loan`, `Customer`).
  - Política de retención automática para purgar copias de más de 14 días.
- **`restore.sh`:**
  - Script interactivo de restauración con opciones `list`, `latest` o ruta específica.
  - Verificación previa del contenedor y confirmación explícita escribiendo `RESTAURAR` para evitar pérdidas accidentales.
- **`deploy.sh`:**
  - Actualizado para invocar automáticamente `backup.sh` antes de reconstruir imágenes o correr migraciones.

**Auditoría y Pruebas de Restauración:**
- Se ejecutó un backup completo e íntegro del sistema en `backups/backup_20261019_235349/`.
- Verificación exitosa de sumas de integridad SHA-256 y compresión gzip (`OK` en el 100% de los archivos).
- Simulacro de restauración en bases de datos temporales:
  - `prestamos_edatia`: Restauración 100% limpia sin errores (46 préstamos, 28 clientes, cronogramas y pagos).
  - `herramientas_edatia`: Restauración 100% limpia sin errores.
  - `edatia_erp`: Restauración operacional completa de la Empresa 2 (*Distribuidora Baby World* - 149 productos, usuarios, etc.). Se documentó la presencia de registros huérfanos residuales pertenecientes a las empresas demo 1 y 3 (eliminadas en sesiones previas).

## Sesión 2026-10-22 - Optimización, Unificación de Toasters y Robustecimiento de Terceros

**Backend (Gestión de Terceros y Relaciones Multi-Rol):**
- **Validación y sanitización en `CreateTerceroDto` y `UpdateTerceroDto`:**
  - Flexibilización de validación en `tipoDocumento` (`@IsString() @IsOptional()`).
  - Limpieza y verificación de `vendedorAsignadoId` garantizando que pertenezca a la empresa y esté activo.
- **Gestión inteligente de duplicados y reactivación:**
  - Si un tercero ya existe con el documento proporcionado dentro de la empresa, el backend evalúa si ya posee el rol activo solicitado (arrojando `ConflictException` específico por rol) o si posee otro rol.
  - En caso de rol complementario (ej. un proveedor que ahora se registra como cliente) o tercero previamente desactivado (`activo === false`), se actualiza la entidad activando el nuevo rol y sincronizando sus datos y sucursales sin duplicar registros contables ni violar la restricción única `[empresaId, tipoDocumento, numeroDocumento]`.
  - Soporte de roles extendido a `esColaborador` y `esVendedor`.
- **Protección de Sucursales en Actualizaciones Parciales:**
  - En `update`, la purga y reemplazo de sucursales relacionales ahora se ejecuta únicamente si se envía la propiedad `sucursales` (`if (sucursales !== undefined)`), evitando el borrado involuntario de sucursales en llamadas parciales desde el frontend.

**Frontend (Centralización de Notificaciones y Limpieza de Código):**
- **Toaster Global Unificado:**
  - Centralización del componente `<Toaster position="top-right" />` en la raíz de la aplicación (`App.tsx`).
  - Remoción de 10 instancias locales de `<Toaster />` en `ConfigTerceroForm`, `Clientes`, `Proveedores`, `ConfigFormatosImpresion`, `ConfigGeolocalizacion`, `ConfigDocumentos`, `ConfigTercerosExtra`, `ConfigArchivo`, `ConfigContable` y `ConfigSucursales`, previniendo duplicidad de toasts y solapamientos en UI.
- **Correcciones y Tipado en `ConfigTerceroForm.tsx`:**
  - Corrección de typo en la subida de adjuntos (`progreso: progress`).
  - Inclusión de la propiedad obligatoria `clasificacion: 'General'` en `DEFAULT_TERCERO` satisfaciendo la interfaz `Tercero`.
  - Tipado explícito de parámetros en callbacks de listas geográficas (`p`, `d`, `c`).
  - Sincronización e invalidación reactiva de cache en React Query para `terceros-erp`, `clientes`, `proveedores`, `vendedores` y `tercero-detail`.

**Infraestructura y Despliegue:**
- Compilación de TypeScript en backend (`tsc`) y frontend (`vite build`) con 0 errores.
- Reconstrucción de imágenes Docker y despliegue en caliente de los servicios `api` (`edatia-backend`) y `web` (`edatia-frontend`) mediante Docker Compose.
- Verificación de estado `healthy` y disponibilidad continua del servicio.

