# Planeación: Integración de Códigos de Barras y Pistola POS

Esta guía detalla cómo transformar el sistema actual para soportar lectura rápida de productos usando pistolas de códigos de barras.

## 1. ¿Cómo funciona la "Magia"?
Lo más importante a entender es: **Una pistola de códigos de barras no necesita drivers especiales.**
Para el computador, la pistola es simplemente un **Teclado**.
1.  Escaneas un producto (ej: EAN-13 `770123456789`).
2.  La pistola "escribe" esos números instantáneamente donde esté el cursor.
3.  Al final, la pistola envía un "Enter" automático.

## 2. Estructura de Base de Datos
¡Buenas noticias! Tu estructura actual ya está lista.

En la tabla `productos` que diseñamos:
```sql
codigo VARCHAR(50) UNIQUE, -- Código de barras o interno
```
*   **Campo `codigo`**: Aquí guardaremos el número que trae el código de barras (ej. el código UPC/EAN del fabricante).
*   **Índice Único**: Garantiza que no existan dos productos con el mismo código, evitando errores al vender.

## 3. Flujo en el POS (Punto de Venta)

### Paso A: El Buscador Inteligente
En la pantalla de facturación (`facturacion.html`), tendremos un campo principal "Buscar Producto" que siempre estará enfocado (foco automático).

### Paso B: Lógica de Programación (Frontend)
El código Javascript debe escuchar el evento cuando la pistola presione "Enter".

```javascript
// Ejemplo conceptual
const inputBusqueda = document.getElementById('input-busqueda');

inputBusqueda.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const codigoLeido = inputBusqueda.value;
        agregarProductoAlCarrito(codigoLeido);
        inputBusqueda.value = ''; // Limpiar para el siguiente
    }
});
```

### Paso C: Generación de Códigos Propios
¿Qué pasa si vendes productos artesanales o a granel sin código?
1.  El sistema puede generar códigos internos (ej: `INT-0001`).
2.  Podemos crear una función para **Imprimir Etiquetas**: El sistema genera el dibujo del código de barras (usando librerías como `JsBarcode`) en una etiqueta adhesiva que le pegas al producto.

## 4. Hoja de Ruta de Implementación

1.  **Fase 1 (Base de Datos):** Ya cumplida. El campo `codigo` existe.
2.  **Fase 2 (Ingreso de Datos):** Al crear un producto, simplemente haces clic en el campo "Código" y disparas la pistola sobre el producto real. El código se guardará automáticamente.
3.  **Fase 3 (Venta Rápida):** En el módulo POS, programar la búsqueda para que si encuentra una coincidencia exacta de código, agregue el producto inmediatamente sin preguntar ("Scan & Go").

## Glosario Técnico
*   **EAN-13:** Estándar de 13 dígitos usado en casi todos los productos retail.
*   **Focus:** Mantener el cursor parpadeando en la casilla de búsqueda para que el escáner "escriba" allí y no en el aire.
