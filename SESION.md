# Edatia — Estado de Sesión
> Última actualización: 2026-10-15 (sesión 8)

---

## ¿Qué es Edatia?
SaaS ERP para empresas de retail y distribución. Tiene 4 portales:
- `edatia.com` → Landing estática
- `erp.edatia.com` → ERP React (frontend/)
- `api.edatia.com` → API NestJS (backend/) — Swagger en /api/docs
- `manager.edatia.com` → Manager interno Edatia (manager/) ← EN CONSTRUCCIÓN ACTIVA

---

## Estado actual del servidor

### Contenedores Docker (6 servicios)
```
db       → PostgreSQL 15
api      → NestJS backend
web      → ERP React (Caddy)
landing  → HTML estático (Caddy)
manager  → Manager React (Caddy)
glowxir  → Tienda Virtual Baby World (Caddy)
```

### Credenciales
| Portal | Email | Contraseña |
|--------|-------|------------|
| Manager | admin@edatia.com | Manager123! |
| ERP | admin@edatia.com | Admin123! |

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
