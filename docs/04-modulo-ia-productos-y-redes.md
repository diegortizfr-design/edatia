# Módulo de Creación Asistida por IA y Compartir en Redes — Documentación Técnica

> ⚠️ **Este archivo es un documento vivo.**
> Refleja la arquitectura, flujos y componentes implementados para la catalogación rápida con Inteligencia Artificial (Gemini) y publicación/difusión omnicanal en redes sociales (WhatsApp y Facebook Marketplace) para Edatia ERP y Distribuidora Baby World.

**Módulo:** Catálogo Digital / IA Productos & Redes  
**Submódulo:** `ia-productos`  
**Estado:** Completado, Desplegado y Verificado en Producción VPS (`edatia.com`) ✅  

---

## 1. Propósito y Flujo del Módulo

El objetivo es permitir a un comerciante o encargado de bodega catalogar un nuevo producto en menos de **30 segundos** simplemente tomando 1 a 3 fotos del empaque desde su celular o PC e ingresando el precio de venta en COP:

```mermaid
flowchart TD
    A["📸 Subir 1-3 fotos + Precio COP (ERP)"] --> B["🔄 Normalización y decodificación HEIC (iPhone)"]
    B --> C["⚡ Gemini Flash Lite: Extracción de packaging"]
    C --> D["🎨 Gemini Image / Imagen: Fondo de estudio blanco"]
    D --> E["📐 Estandarización 1200x1200 sin logos (Sharp)"]
    E --> F["☁️ Almacenamiento seguro en Cloudinary"]
    F --> G["💾 Creación de Borrador (stock=0, publicadoWeb=false)"]
    G --> H["📲 Botón Compartir en Redes"]
    H --> I["🟢 WhatsApp Status (Story 1080x1920 + Copy)"]
    H --> J["🔵 Facebook Marketplace (Textos + Descarga)"]
```

---

## 2. Arquitectura de Backend

### 2.1 Ubicación
* Módulo: `backend/src/digital/ia-productos/`
* Módulo padre: `backend/src/digital/digital.module.ts`

### 2.2 Servicios Implementados

| Servicio | Archivo | Responsabilidad |
| :--- | :--- | :--- |
| `IaProductosService` | `ia-productos.service.ts` | Orquestador del pipeline: valida archivos, consulta categorías existentes, invoca a Gemini, estandariza imágenes, sube a Cloudinary y guarda en Prisma. |
| `GeminiService` | `gemini.service.ts` | Conexión con la API de Google AI Studio. Modelo primario de texto: `gemini-flash-lite-latest` (con failover automático). Modelo de imagen: `gemini-2.5-flash-image` con prompt de encuadre en primer plano (88-92% de ocupación del lienzo, sombra de contacto sutil y remoción de etiquetas comerciales). |
| `ImagenEstandarService` | `imagen-estandar.service.ts` | Corrección EXIF, decodificación transparente de fotos Apple iPhone (`heic-convert`), auto-recorte inteligente de márgenes vacíos (`trim`) y encuadre centrado al **90% del lienzo** (1080 px en 1200×1200 px) para fotos de estudio/catálogo. Relleno automático con color de fondo detectado (o `#FFFFFF`), o versión desenfocada si la foto tiene fondo real de tienda. Sin superposición de logos ni distorsión. |

### 2.3 Endpoints REST

```http
POST   /api/v1/digital/ia/productos
       Content-Type: multipart/form-data
       Campos: fotos (1-3 archivos), precio (COP), notas (opcional)
       Respuesta: { borrador: Producto, advertenciaIa?: string }

POST   /api/v1/digital/ia/productos/:id/generar-info-publicacion
       Genera automáticamente los textos comerciales y SEO para e-commerce
       Respuesta: { nombreWeb, slug, etiquetaSeo, metaDescripcion, descripcionWeb }

POST   /api/v1/digital/ia/productos/:id/procesar-imagen-estudio
       Content-Type: multipart/form-data (archivo en 'file') o application/json ({ imageUrl })
       Genera fondo blanco estudio (#FFFFFF) 1:1 1200x1200 px con Gemini + Sharp sin logos
       Respuesta: { url: string, imagenes: string[], producto: Producto }

POST   /api/v1/digital/ia/productos/:id/estandarizar-imagen
       Content-Type: multipart/form-data (archivo en 'file') o application/json ({ imageUrl })
       Cuadra la foto 1:1 1200x1200 px SIN IA (solo Sharp), conservándola completa
       Respuesta: { url: string, imagenes: string[], producto: Producto }

POST   /api/v1/digital/ia/productos/:id/regenerar-imagen
       Body: { indice: number, modo: 'ia' | 'original', instruccion?: string }
       Respuesta: { producto: Producto, nuevaImagenUrl: string, indice: number }

PATCH  /api/v1/digital/ia/productos/:id
       Body: { nombre?, precioBase?, descripcion?, descripcionWeb?, categoriaId? }
       Respuesta: Producto actualizado

POST   /api/v1/digital/ia/productos/:id/compartido
       Body: { red: 'whatsapp' | 'instagram' | 'tiktok' | 'marketplace' }
       Respuesta: { success: true, red: string, fecha: string }

GET    /api/v1/public/tiendas/:slug/og/:productoSlug
       Endpoint público HTML para crawlers (WhatsApp, Facebook, Twitter, Telegram)
       Devuelve etiquetas Open Graph dinámicas (og:title, og:image, og:description)
```

### 2.4 Cuadrar imágenes existentes del catálogo

Script `backend/scripts/cuadrar_imagenes_catalogo.js`: recorre las imágenes de los productos de una empresa, deja intactas las que ya son cuadradas (tolerancia 2%) y cuadra el resto con `ImagenEstandarService`. Es reversible: guarda `metadataWeb.imagenesAntesCuadrar` (`{ urlNueva: urlAnterior }`) y no borra nada de Cloudinary.

```bash
docker cp backend/scripts/cuadrar_imagenes_catalogo.js edatia-backend:/app/cuadrar.js
docker exec -w /app edatia-backend node /app/cuadrar.js --empresa 2              # simulación
docker exec -w /app edatia-backend node /app/cuadrar.js --empresa 2 --muestras 8 # + vistas previas en /tmp/cuadrar-preview
docker exec -w /app edatia-backend node /app/cuadrar.js --empresa 2 --aplicar    # aplica
docker exec -w /app edatia-backend node /app/cuadrar.js --empresa 2 --revertir --aplicar
```

> En la tienda virtual (`ProductCard`), las imágenes se muestran con `object-contain` sobre fondo blanco, por lo que tampoco se recortan fotos no cuadradas.

---

## 3. Integración con Google Gemini & Facturación Prepay

1. **Modelos Utilizados:**
   - **Análisis y Extracción:** `gemini-flash-lite-latest` (Ultra rápido, ~1 segundo por producto).
   - **Fondo de Estudio:** `gemini-2.5-flash-image` (Genera renderización con iluminación de catálogo y sombra de contacto suave).
2. **Compatibilidad con Google Cloud Prepay:**
   - La API key utiliza facturación vinculada (*Pay-As-You-Go* con billetera prepago de AI Studio).
   - Consume automáticamente los créditos promocionales del Google Developer Program ($31.635 COP mensuales) y el crédito de bienvenida de Google Cloud ($949.041 COP).
3. **Resiliencia:**
   - Si la llamada de imagen falla por latencia o cuota, el sistema degrada limpiamente a la foto normalizada y centrada localmente por `sharp`, garantizando que el usuario nunca quede bloqueado.
4. **Optimización de Escala y Encuadre (90% Close-Up):**
   - El prompt instruye a Gemini generar tomas en primer plano (`88-92%`) con sombra directa en la base (evitando que el producto parezca flotar o verse alejado).
   - Sharp aplica `trim` de umbral para remover márgenes artificiales y remonta el producto ocupando el 90% del lienzo cuadrado de 1200×1200 px.

---

## 4. Arquitectura de Frontend

* **Componentes Clave:**
  - `CameraCaptureModal.tsx` (Captura de Foto en Vivo):
    - **Visor WebRTC Nativo:** Acceso directo a la cámara para smartphones (Android/iOS), tablets y computadores (webcam).
    - **Experiencia de Pantalla Completa Móvil (`100dvh`):** Diseñado como aplicación de cámara nativa en celulares (borde a borde) con capa de prioridad máxima `z-[99999]` para garantizar que nunca sea obstruido por barras laterales o menús de navegación del ERP.
    - **Guía de Encuadre 1:1 Cuadrado:** Viñeta con retícula y esquinas de enfoque para encuadrar productos en la proporción exacta del catálogo virtual.
    - **Recorte Automático 1:1 en Alta Resolución:** Al disparar, procesa el canvas extrayendo exactamente el recuadro cuadrado central (hasta 1400×1400 px), descartando fondos sobrantes laterales o verticales.
    - **Controles de Captura:** Alternancia fluida entre cámara trasera (`environment`) y delantera (`user`), soporte para linterna/flash (`torch`) en navegadores compatibles, y opción de previsualización ("Tomar otra" vs "Usar esta foto").
    - **Integración con Fondo de Estudio IA:** Al confirmar la captura, la imagen se envía directamente al pipeline de IA para remover el fondo y dejar el producto sobre blanco puro de estudio 1:1.
    - **Fallback de Emergencia:** Acceso directo para invocar la app de cámara nativa del sistema operativo (`capture="environment"`) en caso de restricciones de permisos en el navegador.
  - `ModalProductoIa.tsx`: Modal responsivo con arrastrar y soltar, botón dedicado *"O tomar foto con la cámara"*, subida de fotos, atajo de pegado desde portapapeles (`Ctrl + V`), barra de progreso en tiempo real, visor de miniaturas con fallback amigable para iPhone (HEIC), y editor rápido en línea de títulos y precios.
  - `CompartirRedesModal.tsx`:
    - **Transcodificación Forzada a JPEG Universal (`f_jpg`):** Utiliza la función helper `prepararUrlCloudinary` que inyecta `,f_jpg/` y reemplaza la extensión a `.jpg`, obligando a Cloudinary a servir siempre un estándar JPEG baseline (JFIF) con fondo blanco puro `#FFFFFF`, resolviendo problemas de incompatibilidad o archivos dañados en la aplicación Fotos de Windows y WhatsApp.
    - **Descarga Asíncrona Robusta:** Limpieza de nombres de archivo para asegurar una única extensión `.jpg` (evitando extensiones duplicadas como `.jpg.jpeg`) y retardo en la revocación del Blob (`setTimeout`) para permitir que el sistema operativo y el navegador completen la escritura en disco sin truncamiento.
    - **Flujo Adaptativo Móvil vs. PC:**
      - En smartphones reales (Android / iOS): Invoca la Web Share API nativa (`navigator.share`) para compartir directamente en *"WhatsApp > Mi Estado"*.
      - En computadores de escritorio (Windows / Mac / Linux): Descarga automáticamente la foto nítida (1080×1920 para Estado o 1200×1200 para Feed), copia el texto con el enlace al portapapeles y abre WhatsApp Web de forma fluida.
      - Incluye botón dedicado **"⬇️ Descargar JPG"** en la tarjeta de previsualización para bajar el archivo con 1 solo clic.
    - **Estructura de Copy Orientada a Conversión:** El enlace directo al producto en la tienda virtual se ubica estratégicamente en la **parte superior** del texto sugerido, garantizando que los clientes lo vean de inmediato sin necesidad de desplegar el mensaje completo.
    - **Pestañas Multicanal:**
      - **WhatsApp:** Opciones de formato vertical para estados (1080×1920) o cuadrado (1200×1200), envío directo por chat (`api.whatsapp.com/send`) y publicación en Estado.
      - **Instagram:** Selector de formato Feed (1:1) o Story (9:16), copy comercial con hashtags locales colombianos de maternidad y juguetes, descarga de imagen y enlace a Instagram.
      - **TikTok:** Guion publicitario estructurado con gancho (Hook 0-3s), desarrollo de beneficios, precio y llamada a la acción (CTA) con hashtags virales, descarga de imagen 9:16 y acceso directo a la plataforma.
      - **Facebook Marketplace:** Formato optimizado para copiar título limpio, precio en COP, descripción con enlace web y descarga de imagen cuadrada estandarizada de 1200×1200 px.
  - `ConfigProductoDetalle.tsx` (Pestaña "Web / Digital"):
    - **Encabezado Optimizado:** Se removieron los botones repetidos del encabezado general para mantener la interfaz despejada y profesional, centralizando los accesos en el banner destacado.
    - **Banner Difusión Omnicanal:** Bloque interactivo con accesos directos a WhatsApp, Instagram, TikTok y Marketplace.
    - **Autogeneración con IA Multimodal (OCR Visual):** Botón `✨ Autogenerar con IA` en la tarjeta "Información de Publicación" que genera y puebla automáticamente `nombreWeb`, `slug`, `etiquetaSeo`, `metaDescripcion` y `descripcionWeb`. Envía la URL de la imagen principal procesada (`imageUrl`) para que `gemini-flash-lite` lea directamente marcas, textos del empaque, edades sugeridas y advertencias mediante OCR visual multimodal, con fallback automático a texto.
    - **Botón «Tomar Foto»:** Permite accionar la cámara en vivo del dispositivo directamente desde la tarjeta de imágenes, integrando automáticamente el visor con encuadre 1:1 y el procesamiento con fondo de estudio IA.
    - **Fondo de Estudio IA en Imágenes:** Checkbox toggle activado por defecto para aplicar fondo blanco estudio puro (`#FFFFFF`) 1200×1200 px sin logos en cualquier foto nueva. Incluye botón de varita mágica `✨` en cada miniatura para convertir fotos existentes a demanda. Con el toggle apagado, las fotos (archivo o URL) pasan por `estandarizar-imagen` y quedan cuadradas 1:1, asegurando que la tienda virtual nunca las recorte.
    - **Visor Lightbox Interactivo de Imágenes:**
      - Miniaturas ampliadas (48×48 px) con esquinas redondeadas, sombra suave e indicador interactivo de ojo (`👁️`).
      - Modal Lightbox en pantalla completa con imagen en alta resolución sobre fondo de estudio blanco.
      - Navegación táctil y por teclado con flechas izquierda/derecha (`←` y `→`) y cierre con tecla `Escape` o clic fuera del modal.
      - Contador de imágenes (`X de N`), indicador de imagen principal y acciones integradas: *Hacer Principal* con 1 clic, *Fondo Blanco IA* directamente en el visor y *Abrir original en pestaña nueva*.
  - `CatalogoDigital.tsx`: Integración de accesos directos de difusión omnicanal y creación asistida por IA.

---

## 5. Experiencia de Usuario en Tienda Virtual (`distribuidorababyworld`)

Para maximizar la conversión en la tienda online y aprovechar las fotos de estudio de alta definición:

1. **Lupa Dinámica Interactiva (Hover Zoom 2.2x):**
   - Implementada en `ProductDetailPage.tsx` y `ProductDetailModal.tsx`.
   - Cursor en cruz (`cursor-crosshair`) con seguimiento dinámico del puntero (`transformOrigin: x% y%`) y ampliación fluida del **220%** sin pixelación.
   - Permite al comprador inspeccionar detalles clave del producto (texturas, advertencias de empaque, certificados de seguridad, piezas incluidas).
   - Incluye badge flotante interactivo: `🔍 Lupa zoom` / `Pasa el cursor`.
2. **Visor Lightbox Pantalla Completa:**
   - Accesible haciendo clic directo en el escenario de la imagen o mediante el botón flotante `⛶`.
   - Fondo oscuro translúcido con efecto de desenfoque (`backdrop-blur-md`).
   - Navegación táctil, selector inferior de miniaturas y atajos de teclado (`Esc`, `←`, `→`).
3. **Escenario Blanco de Integración (`bg-white`):**
   - Contenedor con fondo blanco puro y borde sutil que se funde con los fondos de estudio generados por IA.
4. **Mapeo Comercial y Resiliencia en Rutas:**
   - `App.tsx` prioriza `p.metadataWeb?.nombreWeb || p.nombreWeb || p.nombre` para mostrar siempre el título comercial persuasivo optimizado para e-commerce.
   - Búsqueda tolerante en deep links de productos (`/producto/:slug` o `?p=:slug`) resolviendo contra `slug`, nombre con slugify, SKU o ID.
   - Cabeceras HTTP `no-cache, no-store, must-revalidate` en API pública y `{ cache: 'no-store' }` en `fetch` para garantizar sincronización instantánea sin que el caché del navegador retenga datos antiguos.
5. **Paridad de Descuentos en Modal y Página:**
   - La modal de vista rápida (`ProductDetailModal.tsx`) cuenta con la misma visualización de descuentos promocionales que la página de detalle: badges `-X% OFF`, precio tachado y ahorro calculado en COP (`¡Ahorras $X!`).
6. **Protección Integral contra Imágenes Rotas (`onError` Fallback):**
   - En `ProductCard.tsx`, `ProductDetailModal.tsx` y `ProductDetailPage.tsx` (incluyendo miniaturas de la galería y modal Lightbox), todos los elementos `<img>` cuentan con manejadores `onError` vinculados a `FALLBACK_IMAGE`. Si una URL externa o de Cloudinary no responde (HTTP 404), la interfaz degrada limpiamente sin dejar recuadros en blanco ni íconos rotos del navegador.

---

## 6. Detección de Bots Sociales y Open Graph

En `tiendas-virtuales/distribuidorababyworld/Caddyfile`, se implementó el enrutamiento condicional mediante bloques `handle` mutuamente excluyentes:
```caddy
@crawlers {
    header_regexp User-Agent "(?i)(facebookexternalhit|WhatsApp|TelegramBot|Twitterbot|LinkedInBot|Discordbot)"
    path_regexp prod ^/producto/([^/?#]+)
}
handle @crawlers {
    reverse_proxy http://api:4000 {
        rewrite /api/v1/public/tiendas/distribuidorababyworld/og/{re.prod.1}
    }
}

handle {
    @html {
        path *.html
        path /
    }
    header @html Cache-Control "no-cache, no-store, must-revalidate"
    header @html Pragma "no-cache"
    header @html Expires "0"

    try_files {path} /index.html
    file_server
}
```
Esto garantiza que la directiva `try_files` no intercepte prematuramente las solicitudes de los bots, asegurando que cuando un enlace del producto se comparta por chat o publicación, WhatsApp, Facebook, Telegram, Twitter y Discord reciban de inmediato la tarjeta con imagen grande en alta resolución, nombre y precio en COP. Los navegadores de usuarios finales son atendidos por el bloque `handle` secundario cargando la SPA normalmente.

---

## 7. Programa Piloto de Aliados Comerciales (Social Selling con IA)

Módulo de ventas por referidos y social selling integrado al ERP, Gemini y la tienda virtual (`distribuidorababyworld`), diseñado inicialmente como piloto cerrado en la ruta `/aliados` (sin banners invasivos en el Home).

### 7.1 Modelos Prisma y Migración

Definidos en `backend/prisma/schema.prisma` y migración idempotente `backend/prisma/migrations/20261125161500_add_programa_aliados/migration.sql`:
* `ConfiguracionTienda.configAliados` (`Json?`): porcentaje de utilidad (`30%`), mínimo de retiro (`$30.000 COP`), código de invitación opcional del piloto, bloqueo de autocompras, stock mínimo y categorías habilitadas (por defecto *Juguetería / Didácticos*).
* `AliadoComercial`: perfil del vendedor, WhatsApp, documento, medio/cuenta de pago (`NEQUI`, `DAVIPLATA`, `BANCOLOMBIA`), `codigoReferido` único (`BW-NOMBRE##`), `pinHash` (`bcrypt`) y estado (`ACTIVO`, `PENDIENTE`, `SUSPENDIDO`).
* `ComisionAliado`: registra cada venta atribuida congelando `montoVenta`, `costoTotal`, `utilidadNeta`, `porcentajeAplicado`, `valorComision`, origen (`LINK_WEB` o `PEDIDO_ALIADO`) y estado (`PENDIENTE → APROBADA → PAGADA / ANULADA`).

> **Despliegue en VPS:** Si `npx prisma migrate deploy` encuentra historial previo desincronizado (`P3009`), aplicar la migración SQL idempotente directamente sin alterar migraciones anteriores:
> ```bash
> docker compose exec -T api npx prisma db execute --file prisma/migrations/20261125161500_add_programa_aliados/migration.sql --schema prisma/schema.prisma
> ```

### 7.2 Endpoints REST (Públicos / Portal y Admin ERP)

* **Portal Público / Aliados (`/api/v1/public/tiendas/:slug/aliados`):**
  * `GET  /config-publica`: estado del piloto y mínimo de retiro (sin exponer porcentajes internos de utilidad).
  * `POST /registro` y `POST /login`: autenticación stateless con token HMAC-SHA256.
  * `GET  /perfil`: resumen de saldos (*Pendiente*, *Disponible*, *Pagado*) e historial sin exponer costos internos.
  * `GET  /catalogo`: solo productos activos con stock real y costo cargado (`costoPromedio > 0` o `comisionValor > 0`), mostrando exclusivamente precio público y `gananciaAliado` fija en pesos (incluyendo ganancia calculada por cada variante activa) y priorizando `descripcionWeb || descripcion`.
  * `POST /productos/:productoId/copy-ia` (`@Throttle` 10 req/min): invoca `GeminiService.generarCopyRedesAliado` bajo demanda en estilos `whatsapp`, `marketplace` o `instagram` con `?ref=CODIGO`, protegido con doble caché compartida entre aliados: caché en memoria (6 h) y caché persistente en PostgreSQL (`Producto.metadataWeb.copiesAliados`, v3 indexada por precio `precioRef`). Incluye `posicionarUrlArriba()` para garantizar `{{URL}}` en la línea 2 (justo debajo del gancho + precio) y facilidades de pago visibles siempre (Addi 3 cuotas 0% desde `$50.000` o `desde $50.000` en productos de menor valor, Sistecrédito, Nequi/transferencia, contra entrega local y envíos nacionales; sin sistema de separado).
  * `POST /pedidos`: permite al aliado registrar pedidos multi-producto de sus clientes de redes directamente para despacho contra entrega, transferencia o financiación (`credito`: Addi / Sistecrédito).
* **Administración ERP (`/api/v1/digital/aliados`, protegido con `JwtAuthGuard`):**
  * `GET / PATCH /config`, `GET / PATCH /:id`, `POST /:id/liquidar`, `GET /comisiones`, `PATCH /comisiones/:comisionId`.

### 7.3 Blindaje Financiero, Atribución y Frontend

* **Protección de margen:** Si `costoPromedio <= 0` y no existe comisión fija manual, el producto se excluye del catálogo de aliados y no liquida comisión automática. El domicilio se cobra aparte y no entra en el cálculo de utilidad.
* **Anti-autocompra:** En `DigitalService.crearPedidoWeb` se comparan los últimos 10 dígitos del teléfono y el documento del comprador contra los del aliado; si coinciden, el pedido se procesa sin generar comisión.
* **Tracking `?ref=` de 15 días (`tiendas-virtuales/distribuidorababyworld/src/lib/referral.ts`):** Captura `?ref=CODIGO` en `localStorage`, lo envía en `CheckoutModal.tsx` y añade `[Ref: CODIGO]` al mensaje prellenado de WhatsApp en `ProductDetailPage.tsx` y `ProductDetailModal.tsx`.
* **Pantallas y ahorro de IA:** `AliadosDigital.tsx` en `/digital/aliados` (ERP) y `AliadosPortalPage.tsx` en `/aliados` (tienda virtual). El modal *Kit de Venta Paso a Paso* carga una plantilla instantánea (`$0` tokens IA) al abrir o cambiar de red, deja el botón **`Copiar`** en la cabecera del paso y un enlace discreto opcional para variación IA debajo del texto, guía paso a paso con checks verdes (`✓`), ubica **`Abrir FB Marketplace`** / **`Abrir Instagram`** en el Paso 1 junto a la descarga de foto JPG, incluye copia rápida del título y precio numérico exacto, muestra siempre las opciones reales de pago (incluyendo Addi y Sistecrédito), e integra *Web Share API Level 2* en móviles (foto JPG + texto en 1 clic) más barra rápida multired. El portal también incluye filtros por categoría / elegibilidad Addi (`≥ $50.000`) y ordenamiento por mayor ganancia, carga de pedidos multi-producto con resumen de total, notas de entrega y notificación directa a WhatsApp (`573136546975`), recuperación de PIN por WhatsApp (`¿Olvidaste tu PIN?`) con restablecimiento desde `AliadosDigital.tsx` (`nuevoPin`), tarjeta Open Graph propia en `/og-aliados` (interceptada en `Caddyfile` para bots sociales), además de detalle por ítem y origen en **Mis Ganancias**.

---

## 8. Verificación y Calidad

- **Sin logs residuales:** Sin llamadas de depuración (`console.log`, `var_dump`) en el código de producción.
- **Seguridad:** `.env` verificado en `.gitignore`; clave de API protegida exclusivamente en el backend.
- **Higiene:** Scripts de diagnóstico y binarios temporales eliminados del repositorio.
- **Compatibilidad móvil:** Probado con fotos HEIC nativas de iOS y encuadres responsivos.

