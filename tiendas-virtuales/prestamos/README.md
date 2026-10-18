# Módulo de Control de Préstamos y Cobranza — Edatia

Plataforma SaaS multitenant para originación de créditos, control de cobranza de campo (rutas diarias/periódicas), amortizaciones automatizadas, contabilidad y supervisión de cartera en tiempo real.

---

## 🏗️ Arquitectura y Tecnologías

El sistema opera como una aplicación fullstack moderna contenerizada en Docker:

- **Backend:** Node.js, Express, TypeScript, Prisma ORM 5.22.
- **Base de Datos:** PostgreSQL 15 multitenant (`prestamos_edatia`).
- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS v4, Lucide Icons.
- **Servidor Web y Contenedores:** Dockerfile multietapa (`frontend-builder` + runtime Alpine con `dist/` estático servido por Express en el puerto `3006`).
- **Gestor Visual de Base de Datos:** Prisma Studio disponible en puerto `5555`.

---

## 🧮 Lógica Financiera y Amortizaciones

El módulo implementa reglas financieras rigurosas para garantizar la consistencia contable:

1. **Desglose Proporcional Cuota a Cuota:**
   - En cada cuota del plan de amortización se calculan y persisten de forma exacta los campos `principalAmount` (abono a capital) e `interestAmount` (ganancia por interés).
   - Al registrar pagos parciales o totales, el backend amortiza de manera proporcional `principalPaid` e `interestPaid`, manteniendo el balance exacto entre el saldo en calle y los rendimientos cobrados.

2. **Ajuste de Redondeo de Centavos en Última Cuota:**
   - Para evitar descuadres provocados por divisiones no exactas de cuotas, el cálculo de originación y renovación absorbe cualquier residuo o fracción de centavo en la cuota final, asegurando que:
     $$\sum_{i=1}^{n} \text{Cuota}_i = \text{Monto Total}$$

3. **Cierre de Préstamos con Tolerancia de Centavos:**
   - Si el saldo pendiente de un crédito cae por debajo de $1 COP tras la aplicación de pagos, el crédito se marca automáticamente como `PAID` (Pagado / Cancelado) sin dejar saldos residuales infinitesimales.

4. **Sincronización Automática de Morosidad:**
   - La función `syncTenantOverdueStatus(tenantId)` evalúa las cuotas cuya fecha límite (`dueDate`) ha vencido respecto a la fecha actual y actualiza atómicamente a `OVERDUE` tanto las cuotas en mora como el estado del préstamo. Se ejecuta al consultar reportes, cartera y al liquidar rutas diarias.

5. **Fórmula de Caja y Capital Disponible:**
   - La caja real en efectivo en el balance de tesorería se calcula como:
     $$\text{Caja Disponible} = \text{Capital Base Inicial} + \text{Intereses Cobrados} + \text{Mora Cobrada} + \text{Otros Ingresos} - \text{Egresos} - \text{Capital Pendiente en Calle}$$

---

## 🚀 Características Clave de la Interfaz (UX)

### 1. Dashboard Interactivo con Navegación Filtrada
Todas las tarjetas KPI y métricas principales son clickeables y redirigen con filtros preseleccionados:
- **Total en Cartera** $\rightarrow$ Cartera con filtro `Activos`.
- **Cobrado Hoy** $\rightarrow$ Recibos con filtro de fecha `Hoy`.
- **Cartera en Mora** $\rightarrow$ Cartera con filtro `En Mora`.
- **Clientes Activos** $\rightarrow$ Directorio de Clientes.
- **Capital Base Inicial** $\rightarrow$ Módulo de Contabilidad.
- **Eficiencia de Recaudo** $\rightarrow$ Reportes Financieros.
- **Recaudo últimos 7 días** $\rightarrow$ Recibos con filtro `Semana`.
- Soporte para parámetros hash en la URL (ej: `/#portfolio?status=OVERDUE`).

### 2. Directorio de Clientes / Deudores
- **Ordenamiento Multicolumna Ascendente y Descendente:**
  - Ordenar por Nombre/Cédula (A-Z, Z-A), Teléfono, Dirección, Créditos Activos (numérico) y Saldo Pendiente (de mayor a menor deudor).
  - Indicadores visuales en encabezados (`↑`, `↓`, `↕`).
- **Pestañas de Estado de Cartera:**
  - `Todos`: Conteo global de clientes.
  - `🔴 En Mora`: Clientes con cuotas vencidas y alertas visuales directas.
  - `🟢 Al Día`: Clientes con créditos vigentes sin atrasos.
  - `⚪ Paz y Salvo`: Clientes sin saldos activos.
- **Filtro de Periodicidad:**
  - Filtrado ágil por frecuencia de cobro: `Diario`, `Semanal`, `Quincenal`, `Mensual`.
- **Diseño Adaptativo Móvil:**
  - Tarjetas de cliente optimizadas para smartphones con indicadores de mora y saldo.

### 3. Edición y Anulación de Préstamos (Seguridad y Protección Contable)
- **Corrección de Montos y Parámetros (`PUT /loans/:id`):**
  - Si el usuario se equivocó al ingresar el monto prestado, la tasa de interés, el número de cuotas o la fecha de inicio, puede corregirlos desde el botón **"✏️ Editar Monto"** en la ficha del cliente o en la tabla de amortización.
  - El modal `EditLoanModal` recalcula y simula en tiempo real la nueva cuota, el nuevo interés y la fecha estimada de vencimiento.
  - Al confirmar, se regenera limpiamente el plan de amortización con las nuevas fechas y montos exactos.
- **Anulación Segura (`DELETE /loans/:id`):**
  - Permite anular por completo un crédito generado por error, eliminando sus cuotas y restituyendo el capital disponible en caja.
- **Blindaje Contable contra Alteraciones:**
  - Si el préstamo **ya cuenta con abonos registrados**, la edición directa del capital queda bloqueada automáticamente para preservar la validez legal de los recibos de caja emitidos, guiando al usuario hacia el flujo de **Renovación de Crédito** para refinanciar el saldo.

---

## 🔑 Credenciales y Accesos Rápidos

| Servicio | URL Local | Credenciales |
| :--- | :--- | :--- |
| **Aplicación Web** | [http://localhost:3006](http://localhost:3006) | `creditorapidos26@gmail.com` / `Creditosrapidos2026` |
| **Prisma Studio (BD)** | [http://localhost:5555](http://localhost:5555) | Acceso directo a tablas PostgreSQL |

---

## 🛠️ Comandos de Desarrollo y Despliegue

```bash
# Construir la imagen Docker (compila frontend Vite y backend TypeScript)
docker compose build prestamos

# Iniciar o reiniciar el contenedor en segundo plano
docker compose up -d --no-deps prestamos

# Iniciar Prisma Studio para inspección visual de base de datos
docker compose up -d prestamos-studio
```
