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

### 2. Integración Comercial y Fidelización
- **Campaña Dinámica:** Barra superior con marquee continuo y cuenta regresiva de urgencia.
- **BNPL (Compra Ahora y Paga Después):** Información y simulación de crédito con Addi y Sistecrédito.
- **Geolocalización GPS:** Modal interactivo con dirección física en Poblado Campestre, enlaces directos a Google Maps, Waze y copia de dirección en un clic.
- **Pedidos Directos:** Carrito con cálculo de subtotal, IVA, recargos y canalización directa a checkout o WhatsApp oficial.

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
