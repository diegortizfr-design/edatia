# Plan de Implementación: Gestión de Catálogo de E-commerce (Ampliación)

El objetivo es permitir que los usuarios gestionen la disponibilidad de sus productos en la tienda virtual basándose o no en el inventario real.

## Requerimientos del Usuario
- **Marcado de Productos**: En `productos.html`, un nuevo checkbox "Ecommerce" indica si un producto va a la tienda online.
- **Lógica de Inventario (Nueva)**: 
    - En la gestión de E-commerce, se añade un check **"Afecta Inventario"**.
    - Si ESTÁ MARCADO: La tienda virtual debe considerar el stock real. Si es 0, se muestra como agotado.
    - Si NO ESTÁ MARCADO: El producto siempre aparece disponible, independientemente del stock.
- **Gestión de Catálogo**: Edición de descripciones largas, imágenes y ahora la regla de inventario.
- **Exportación**: El JSON exportado incluirá este nuevo campo para que la tienda sepa si aplicar la validación de stock.

## Cambios Propuestos

### Backend

#### [MODIFY] [productosController.js](file:///c:/Users/DiegoOrtiz/Desktop/ERPod/backend/controllers/productosController.js)
- Actualizar `CREATE TABLE`, `listarProductos`, `crearProducto` y `actualizarProducto` para incluir:
    - `ecommerce_afecta_inventario` (BOOLEAN DEFAULT 0).

---

### Frontend

#### [MODIFY] [ecommerce.html](file:///c:/Users/DiegoOrtiz/Desktop/ERPod/frontend/modules/configuration/ecommerce.html)
- Agregar checkbox "Afectar Inventario (Si no se marca, siempre estará disponible)" al modal de detalles de e-commerce.

#### [MODIFY] [ecommerce.js](file:///c:/Users/DiegoOrtiz/Desktop/ERPod/frontend/assets/js/ecommerce.js)
- Leer y cargar el nuevo campo `ecommerce_afecta_inventario`.
- Actualizar la función `exportCatalog` para que el JSON contenga la información de disponibilidad basada en esta lógica.

### Integración Cloudinary (Nueva)

#### [MODIFY] [backend/app.js](file:///c:/Users/DiegoOrtiz/Desktop/ERPod/backend/app.js)
- Configurar el SDK de Cloudinary con las credenciales del usuario.
- Agregar una nueva ruta `POST /api/upload` que reciba un archivo y lo suba a Cloudinary.

#### [MODIFY] [frontend/modules/configuration/productos.html](file:///c:/Users/DiegoOrtiz/Desktop/ERPod/frontend/modules/configuration/productos.html)
- Agregar un input tipo file oculto y un botón de "Subir Imagen" junto al campo de URL.

#### [MODIFY] [ecommerce.js](file:///c:/Users/DiegoOrtiz/Desktop/ERPod/frontend/assets/js/ecommerce.js)
- Actualizar `renderTable` para incluir el botón de previsualización (ojo).
- Implementar `openPreview(product)` para cargar los datos en el nuevo modal.

---

### Puerta de Enlace Pública (API Real-Time)

#### [NEW] [publicEcomController.js](file:///c:/Users/DiegoOrtiz/Desktop/ERPod/backend/controllers/publicEcomController.js)
- Controlador que permite obtener el catálogo de una empresa usando solo su NIT.
- Devuelve solo productos con `mostrar_en_tienda = 1`.
- Calcula disponibilidad dinámica (inventario) en cada petición.

#### [NEW] [publicEcomRoutes.js](file:///c:/Users/DiegoOrtiz/Desktop/ERPod/backend/routes/publicEcomRoutes.js)
- Ruta pública accesible desde cualquier dominio (CORS habilitado).
- Formato: `/api/public/ecommerce/:nit`.

#### [MODIFY] [app.js](file:///c:/Users/DiegoOrtiz/Desktop/ERPod/backend/app.js)
- Registrar la nueva ruta pública.

## Plan de Verificación

### Verificación Manual
1. **Configuración**: En E-commerce, marcar un producto con "Afecta Inventario".
2. **Exportación (Stock 0)**: Poner stock 0 al producto y exportar. El JSON debe indicar que no hay disponibilidad (o que aplica validación).
3. **Exportación (Siempre disponible)**: Desmarcar "Afecta Inventario" y exportar. El JSON debe indicar que siempre hay stock disponible.
