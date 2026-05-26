# Edatia ERP — Contexto y Visión de Desarrollo (AI Alignment)

Este documento centraliza las pautas de diseño UX/UI, la lógica operativa contable y fiscal (Colombia) y el estado de desarrollo del frontend del ERP de **Edatia**. Está pensado para alinear a cualquier agente de IA en futuras sesiones sin necesidad de repetir contexto.

---

## 🎯 Visión General de Edatia ERP
Edatia es un sistema ERP SaaS premium enfocado en **retail especializado y distribución de productos físicos** en Colombia. La misión principal del ERP es la **automatización operativa-contable transaccional**. Cada acción operativa (facturar, ingresar mercancía, cerrar caja) tiene amarrado un impacto contable y fiscal en tiempo real, de modo que el usuario final no requiere conocimientos contables avanzados.

---

## 📐 Reglas Estrictas de Diseño y UX/UI

### 1. Sin Modales de Configuración (Strictly No-Modals)
*   **Regla:** Queda prohibido el uso de ventanas emergentes (modales) para la creación, edición o parametrización de tablas maestras o configuraciones generales.
*   **Alternativa:** Toda acción se resuelve inline en la misma pantalla usando estados de control de vista (`viewMode: 'list' | 'form'`), maximizando el uso del espacio de trabajo y mejorando la ergonomía visual en laptops de 14" y tablets.

### 2. Estética Premium e Interfases Responsivas
*   Uso de tipografías modernas (Inter, Outfit) y paletas armoniosas basadas en HSL.
*   Los campos booleanos (checkboxes) de opciones múltiples se encapsulan en tarjetas premium independientes con sombreado ligero (`shadow-sm`) y bordes que cambian a color índigo cuando están activos, agregando una experiencia premium interactiva.
*   **CSS Grid robusto:** Para evitar colapsos visuales debido al purgado de clases o fallas en el JIT de Tailwind, los contenedores principales y los campos que deben ocupar el 100% de la fila (como direcciones completas u observaciones) usan la propiedad inline `style={{ gridColumn: '1 / -1' }}`.

---

## 🛠️ Módulos y Pantallas de Configuración Implementados

### 1. Geolocalización (`ConfigGeolocalizacion.tsx`)
*   **Estructura:** Organizada en un sub-layout de 5 pestañas horizontales jerárquicas: **Países ➔ Departamentos ➔ Ciudades ➔ Comunas ➔ Barrios**.
*   **Seguridad:** Cuenta con protección de borrado en cascada (no se puede borrar un departamento que contenga ciudades activas, etc.).
*   **Persistencia:** Almacena los datos jerárquicos en `localStorage` bajo la clave `edatia_config_geolocalizacion`.

### 2. Sucursales (`ConfigSucursales.tsx`)
*   **Campos:** Código (ej. B1), Nombre, Correo Electrónico de contacto, País, Departamento, Ciudad, Barrio, Dirección Física y Estado (Activo/Inactivo).
*   **Cascada Dinámica:** Los dropdowns geográficos leen en tiempo real los datos del módulo de Geolocalización. Modificar un elemento superior (ej. País) limpia y regenera las listas dependientes en cascada para evitar inconsistencias en base de datos.
*   **Persistencia:** Almacena los registros bajo la clave `edatia_config_sucursales`.

### 3. Tipos de Documentos (`ConfigDocumentos.tsx`)
*   **Áreas de Operación:** Ventas, Compras, Inventario, Tesorería, Nómina, Contabilidad, etc.
*   **Catálogo Base:** Inicializado con un catálogo corporativo de 48 plantillas de documentos estándar (Factura de Venta `FV`, Nota Crédito `NC`, Documento POS `POS`, Documento Soporte `DS`, etc.).
*   **Campos DIAN Dinámicos:** Cuando se activa el flag de documento electrónico o DIAN, se exponen condicionalmente campos fiscales sensibles: Resolución DIAN, Fecha de Emisión, Rango (Desde/Hasta) y Vigencia en meses.
*   **Anclaje a Sucursales:** Cada tipo de documento debe ser anclado a una sucursal física. Esto permite que múltiples sucursales emitan el mismo tipo de documento (ej. Factura POS) con prefijos y consecutivos independientes por establecimiento.
*   **Persistencia:** Almacena los registros bajo la clave `edatia_config_documentos`.

### 4. Impuestos y Retenciones (`ConfigImpuestos.tsx`)
*   **Campos:** Código, Descripción, Código Fiscal Oficial de Facturación DIAN (ej. `01` para IVA, `06` para ReteFuente, `03` para ICA), Tipo de cálculo (Porcentaje/Valor), Tarifa, y checkboxes para Activo y Retención en Compra.
*   **Mapeo Contable PUC (Plan Único de Cuentas):** Cada tarifa impositiva debe ser mapeada a sus cuentas correspondientes en el PUC en 4 bloques de colores diferenciados para evitar confusiones de contabilidad de doble entrada:
    *   **Ventas** (Verde - `#10B981`): Cuenta PUC del IVA Generado en ventas.
    *   **Devoluciones en Venta** (Turquesa - `#06B6D4`): Cuenta para reversar el IVA generado.
    *   **Compras** (Azul Oscuro - `#1E3A8A`): Cuenta del IVA Descontable.
    *   **Devoluciones en Compra** (Morada - `#7C3AED`): Cuenta para reversar el IVA descontable.
*   **Persistencia:** Almacena los registros bajo la clave `edatia_config_impuestos`.

### 5. Cajas y Bancos (`ConfigCajasBancos.tsx`)
*   **Campos:** Código (ej. CM1), Descripción (ej. CAJA MAYOR), Sucursal anclada, Cuenta Contable PUC (ej. `11050501` para Caja General, `11100501` para Bancos), Control Orden (prioridad de despliegue) y Tipo (`CAJA` o `BANCO`).
*   **Checkboxes de Control:**
    *   *Activo*: Permite operar la cuenta.
    *   *Aplica Recibos / Aplica Pagos*: Define si la cuenta puede recibir ingresos de cartera (recibos) o emitir pagos (egresos).
    *   *Aplica Control*: Activa reglas estrictas de arqueo y corte de caja diario.
    *   *Restringida*: Permite bloquear la visibilidad de la caja solo para el cajero asignado.
*   **Persistencia:** Almacena los registros bajo la clave `edatia_config_cajas_bancos`.

---

## 🗃️ Claves de Almacenamiento en LocalStorage (Estado Temporal Frontend)
*   `edatia_config_geolocalizacion`: Maestros de geografía en 5 niveles.
*   `edatia_config_sucursales`: Lista de sucursales físicas y comerciales.
*   `edatia_config_documentos`: Tipos de documentos y consecutivos por sucursal.
*   `edatia_config_impuestos`: Tarifas fiscales y mapeo PUC para ventas/compras.
*   `edatia_config_cajas_bancos`: Cuentas de banco y cajas con orden y permisos.

---

## 🧩 Próximos Pasos Técnicos Sugeridos
1.  **Sincronización con el Backend**: Mapear estos esquemas de datos a modelos en Prisma ORM (`schema.prisma` en backend) para que dejen de guardarse en `localStorage` y se persistan en PostgreSQL.
2.  **Módulo de Inventario**: Diseñar y construir el flujo de bodegas y stocks atados a las sucursales.
3.  **POS Screen**: Integrar los consecutivos dinámicos de documentos tipo `POS` y los medios de pago de `Cajas / Bancos` en la interfaz del punto de venta.
