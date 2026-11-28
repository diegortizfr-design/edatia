# Distribuidora Baby World - Storefront E-commerce Headless

Storefront oficial de comercio electrónico para **Distribuidora Baby World (Pañalera y Juguetería)**, conectado en tiempo real al backend y base de datos de Edatia ERP.

---

## 🚀 Características Principales

### 1. Navegación de Catálogo Escalable (Híbrida)
- **Barra de Píldoras Inteligente ([Navbar.tsx](src/components/Navbar.tsx)):**
  - Botón maestro `[ ☰ Categorías ]` al inicio de la barra.
  - Flechas de navegación asistida `‹` y `›` visibles en desktop cuando la lista excede el ancho de pantalla.
  - Desvanecimiento adaptativo (*fade mask*) en los extremos que alerta visualmente al usuario sobre más contenido.
  - Centrado automático suave de la píldora seleccionada al hacer clic.
  - Botón complementario `[ + Más Secciones ]` al final del scroll horizontal.
- **Cajón Maestro de Secciones ([CategoriesDrawerModal.tsx](src/components/CategoriesDrawerModal.tsx)):**
  - Buscador rápido integrado para filtrar secciones y subcategorías en tiempo real.
  - Mapeo de iconos dinámicos y conteo de productos disponibles por categoría.
  - Acceso directo a subcategorías del ERP mediante chips interactivos.
  - Adaptabilidad responsive: Modal en desktop (2 columnas) y Bottom Sheet deslizable en dispositivos móviles.
- **Navegación Móvil Táctil ([MobileBottomNav.tsx](src/components/MobileBottomNav.tsx)):**
  - Acceso directo con el pulgar a `Inicio`, `Secciones` (abre el Drawer), `Ofertas/Destacados` y `Bolsa`.

### 2. Integración Comercial y Campañas Estacionales
- **Campaña Estacional Centralizada ([seasonalCampaign.ts](src/constants/seasonalCampaign.ts)):**
  - Módulo desacoplado de campañas estacionales con soporte de presets comerciales (`black-friday`, `black-days`, `navidad`, `regreso-a-clases`).
  - Barra superior promocional con marquee animado continuo, cuenta regresiva de urgencia (`BlackDaysTopBar.tsx`) y enlaces dinámicos de asesoría a WhatsApp sin emojis incompatibles.
  - Insignias reactivas de descuento en tarjetas de producto y ficha de detalle (`BLACK FRIDAY -{X}%`).
  - Piezas publicitarias 3D Ultra HD con caché versionada: Banner Hero panorámico (`banner-black-friday.jpg` a 2048×676) y Popup Modal emergente de bienvenida (`anuncio-black-friday.jpg` a 896×1200).
- **BNPL (Compra Ahora y Paga Después):** Información y simulación de crédito con Addi y Sistecrédito.
- **Geolocalización GPS:** Modal interactivo con dirección física en Poblado Campestre, enlaces directos a Google Maps, Waze y copia de dirección en un clic.
- **Pedidos Directos:** Carrito con cálculo de subtotal, IVA, recargos y canalización directa a checkout o WhatsApp oficial.

### 3. Demostración de Productos en Video (Cero Almacenamiento & Marca Blanca)
- **Reproducción Limpia y Nativa:** Soporte para videos demostrativos (TikTok, YouTube Shorts, Instagram Reels, MP4 directos) gestionados desde la pestaña *Web / Digital* del ERP.
- **Streaming sin Marcas de Agua (TikTok):** Doble canal de resolución dinámica en tiempo real (API directa en cliente + endpoint de respaldo en backend `/api/v1/public/tiendas/distribuidorababyworld/video-stream`), eliminando marcas de agua, logotipos y botones de terceros.
- **Visor Reel Integrado ([VideoReelModal.tsx](src/components/VideoReelModal.tsx)):** Modal centrado con fondo oscuro, cierre instantáneo por clic exterior (`backdrop-click`), tecla `Esc` y botón directo de compra siempre visible. Desmontaje limpio de estado en React sin alterar el historial ni recargar la ficha del producto.
- **Cero Consumo de Espacio:** El servidor no almacena videos ni consume cuota de disco; los flujos se consumen bajo demanda.

### 4. Programa de Aliados Comerciales (`/aliados`)
- **Portal de Aliados ([AliadosPortalPage.tsx](src/components/AliadosPortalPage.tsx)):** Ruta `/aliados` con acceso limpio desde el Footer y una tarjeta de invitación al final del Home (oculta automáticamente cuando el visitante llega con un `?ref=` activo, sin invadir los banners principales ni las fichas de producto), más tarjeta Open Graph exclusiva (`/og-aliados`) al compartir `/aliados` por WhatsApp o redes. Permite registrarse con WhatsApp + PIN, recuperar PIN por WhatsApp (`¿Olvidaste tu PIN?`), filtrar el catálogo por categoría o elegibilidad **Addi (≥ $50.000)**, ordenar por mayor ganancia/precio y ver la ganancia fija en pesos por cada juguete habilitado (incluyendo ganancia por variante).
- **Kit de Venta Paso a Paso con IA opcional (Gemini):** Flujo guiado con checks de completado (`✓`) para **WhatsApp / Estados**, **Facebook Marketplace** e **Instagram / Reels**. Carga una plantilla instantánea sin consumo de IA al abrir/cambiar de canal y ofrece **`¿Prefieres otra redacción? Probar variación con IA`** de forma discreta debajo del texto (priorizando **`Copiar`** en el encabezado y caché persistente v3 en BD compartida entre aliados). Garantiza la URL rastreable (`?ref=CODIGO`) en la línea 2 junto a los medios de pago reales (Addi 3 cuotas 0% / desde $50.000, Sistecrédito, Nequi/Bre-B, contra entrega local y envíos nacionales; sin sistema de separado), incluye acceso directo a **`Abrir FB Marketplace`** / **`Abrir Instagram`** en el Paso 1, copia rápida de título/precio, descarga de foto JPG (9:16 o 1:1) y *Web Share API* en móviles para compartir foto + texto en 1 clic.
- **Carga Multi-Producto y Tracking (`src/lib/referral.ts`):** Captura automática de `?ref=` por 15 días en `CheckoutModal.tsx` y mensajes de WhatsApp (`ProductDetailPage.tsx` / `ProductDetailModal.tsx`), formulario multi-juguete con variantes autoseleccionadas, notas de entrega, métodos **Contra entrega**, **Transferencia**, **Crédito Addi** y **Crédito Sistecrédito**, resumen de total + envío, notificación directa de despacho al WhatsApp oficial (`573136546975`) e historial detallado en **Mis Ganancias** con los ítems y origen de cada venta.

---

## 🛠️ Tecnologías y Herramientas

- **Framework:** React 18 + TypeScript + Vite.
- **Estilos:** Tailwind CSS con animaciones suaves y microinteracciones.
- **Iconografía:** Lucide React (`v0.244.0`).
- **Notificaciones:** React Hot Toast.
- **Servidor Web de Producción:** Caddy 2 (Alpine).

---

## 🐳 Despliegue con Docker

El servicio se encuentra registrado en el `docker-compose.yml` raíz bajo el nombre `glowxir`:

```bash
# Reconstruir la imagen de producción
docker-compose build glowxir

# Recrear el contenedor sin reiniciar los demás servicios
docker-compose up -d --no-deps glowxir

# Verificar el estado del contenedor
docker-compose ps glowxir
```

---
&copy; 2026 Distribuidora Baby World &bull; Potenciado por Edatia ERP
