# Guía de Integración: ERPod + Tienda Virtual

Esta guía explica cómo conectar ERPod con cualquier tienda online (como la de ATPAventura) para que el inventario y los productos se sincronicen automáticamente.

## 1. El Concepto: ERPod como "Cerebro"
ERPod actúa como el panel de control central. Lo que hagas en el módulo de E-commerce afecta directamente lo que ve el cliente final.

## 2. ¿Qué se necesita para integrar?
Para que la tienda hable con el ERP, necesitamos tres pilares técnicos:

1.  **API de Catálogo (El Canal)**: Un punto de acceso en el servidor de ERPod que entregue la lista de productos en tiempo real (reemplazando al botón de exportar manual).
2.  **Identificador de Tienda (NIT/ID)**: Para que el servidor sepa exactamente qué sub-base de datos consultar.
3.  **Frontend Adaptable**: La tienda virtual debe estar programada para "leer" esta API cada vez que un usuario entra a ver productos.

## 3. El Proceso de Integración Real-Time

### Paso A: Preparación en ERPod
*   Marcar productos con el check **"Venta Online"**.
*   Configurar si **"Afecta Inventario"** (lo que hicimos hoy).
*   Subir fotos a **Cloudinary** (lo que hicimos hoy).

### Paso B: Conexión Automática (API)
Tu nueva puerta de enlace es:
`GET https://api-erpod.onrender.com/api/public/ecommerce/tu-nit`

**Ejemplo de código para tu tienda virtual:**
```javascript
// Función para cargar productos desde ERPod
async function cargarCatalogoERPod() {
    const NIT = 'TU-NIT-AQUI'; // Reemplaza con tu NIT sin puntos ni guiones
    const API_URL = `https://api-erpod.onrender.com/api/public/ecommerce/${NIT}`;

    try {
        const response = await fetch(API_URL);
        const result = await response.json();
        
        if (result.success) {
            console.log('Catálogo recibido:', result.data);
            // Aquí pintarías los productos en tu sitio web
            mostrarProductosEnWeb(result.data);
        }
    } catch (error) {
        console.error('Error conectando con ERPod:', error);
    }
}
```

### Paso C: Sincronización de Stock
Cada vez que un cliente en la web va a comprar:
1.  La tienda pregunta al ERP (usando la API de arriba): "¿Hay stock de este Café?".
2.  El ERP responde con el campo `stock_real` y `disponible` (true/false).
3.  Si vendes algo fuera del sistema, ERPod descontará el stock y la tienda se actualizará sola en la siguiente carga.

## 4. ¿Qué buscamos con esta integración?
*   **Cero Doble Trabajo**: No tienes que crear el producto en dos sitios. Lo creas en el ERP y ya está en la web.
*   **Inventario Infalible**: No vendes cosas que no tienes físicamente en bodega.
*   **Control Total**: Si quitas un producto del catálogo en ERPod, desaparece de la web al instante.

## 5. Próximo Paso Técnico
Para que esto sea 100% automático, debemos crear una **Ruta Pública** en el backend que no pida login (pero sea segura) para que la tienda de ATPAventura pueda leer los productos libremente.
