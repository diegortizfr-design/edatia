# Portal Manager — Documentación Técnica

> ⚠️ **Este archivo es un documento vivo.**
> Debe actualizarse cada vez que se agregue una funcionalidad, rol, módulo o se modifique la seguridad del Manager. Refleja el estado actual del portal — no el estado futuro.

**Portal:** Manager (interno Edatia)
**URL:** manager.edatia.com
**Propósito:** Gestión interna del negocio SaaS — clientes, colaboradores, soporte, métricas
**Estado actual:** Fases 1-4 de seguridad completadas ✅ | Módulos Coordinación/Operación pendientes 🔜

---

## 1. Propósito

El Manager es el portal **exclusivo del equipo interno de Edatia**. Desde aquí se gestiona:
- El equipo de trabajo (colaboradores)
- Los clientes del SaaS (prospectos, activos, suspendidos, cancelados)
- Los módulos y planes contratados por cada cliente
- Los tickets de soporte (SAC y Desarrollo)
- La seguridad y auditoría del propio portal

**No es accesible para los clientes** — ellos usan `erp.edatia.com`.

---

## 2. Roles del Sistema

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| `ADMIN` | Acceso total | Todo el portal, incluyendo colaboradores, seguridad y todas las secciones |
| `COMERCIAL` | Gestión de clientes | Solo ve sus propios clientes (no puede reasignar asesor) |
| `COORDINACION` | Supervisión SAC + Desarrollo | Dashboard coordinación + todos los tickets + creación |
| `OPERACION` | Atención de tickets | Solo sus tickets asignados (puede ser humano o IA) |

---

## 3. Arquitectura

### Backend
```
backend/src/
├── manager-auth/          # JWT separado para Manager
│   ├── manager-auth.controller.ts   # login, refresh, logout, /me
│   ├── manager-auth.service.ts      # lógica de auth + lockout + refresh tokens
│   ├── manager-jwt.strategy.ts      # strategy 'manager-jwt'
│   └── manager-jwt-auth.guard.ts    # guard para endpoints del Manager
│
├── colaboradores/         # CRUD colaboradores internos
├── perfiles-cargo/        # Perfiles de cargo permanentes
├── modulos-software/      # 5 módulos vendibles
├── planes-base/           # Planes de suscripción
├── clientes-manager/      # Clientes del SaaS con flujo comercial
├── audit-log/             # @Global — registro de eventos de seguridad
└── manager.module.ts      # Agrupa todos los módulos anteriores
```

### Frontend
```
manager/src/
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   ├── Clientes.tsx / ClienteForm.tsx
│   ├── Colaboradores.tsx / ColaboradorForm.tsx
│   ├── PerfilesCargo.tsx / PerfilCargoForm.tsx
│   ├── Modulos.tsx
│   ├── Planes.tsx
│   ├── AuditLog.tsx               # Monitor seguridad (solo ADMIN)
│   ├── OperacionSAC.tsx           # Mis tickets SAC
│   ├── OperacionDesarrollo.tsx    # Tickets de desarrollo
│   ├── CoordinacionDashboard.tsx  # Dashboard coordinación
│   ├── CoordinacionTickets.tsx    # Todos los tickets
│   └── TicketDetalle.tsx
│
├── components/
│   ├── layout/
│   │   ├── AppLayout.tsx          # Layout principal con Sidebar
│   │   ├── Sidebar.tsx            # Navegación lateral
│   │   └── EdatiaLogo.tsx
│   └── ui/                        # Button, Card, Input, Badge, etc.
│
├── context/
│   └── AuthContext.tsx            # Auth Manager (access token + refresh via cookie)
│
└── lib/
    ├── api.ts                     # Axios + interceptor refresh token
    └── utils.ts                   # cn(), formatters
```

---

## 4. Autenticación y Seguridad

### 4.1 Sistema de Tokens

| Token | Duración | Almacenamiento | Renovación |
|-------|----------|----------------|-----------|
| Access token (JWT) | 2 horas | `localStorage` | Automática con refresh |
| Refresh token | 7 días | **httpOnly cookie** (`manager_refresh`) | Rotación en cada uso |

**httpOnly cookie config:**
```typescript
{
  httpOnly: true,
  secure: true,         // en producción
  sameSite: 'strict',   // en producción (mismo dominio registrable edatia.com)
  path: '/api/v1/manager/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
}
```

### 4.2 Endpoints de Auth

```
POST /api/v1/manager/auth/login     → email + password → access_token + cookie refresh
POST /api/v1/manager/auth/refresh   → lee cookie → nuevo access_token + rota refresh
POST /api/v1/manager/auth/logout    → invalida refresh token en BD + limpia cookie
GET  /api/v1/manager/auth/me        → datos del colaborador autenticado
```

**Login solo acepta email** (no usuario). Validado con `@IsEmail()`.

### 4.3 Bloqueo por Fuerza Bruta

| Evento | Comportamiento |
|--------|----------------|
| Intento fallido | `loginFallidosConsecutivos++` |
| 5 intentos fallidos | Cuenta bloqueada 15 minutos |
| Login exitoso | Contador y bloqueo se reinician |
| Login bloqueado | Respuesta con minutos restantes |

Implementado en `manager-auth.service.ts` con protección timing-safe (bcrypt siempre corre para no revelar si el email existe).

### 4.4 Refresh Token Rotation

- El refresh token es de un solo uso
- Al renovar: se invalida el anterior y se crea uno nuevo
- Hash SHA-256 almacenado en `Colaborador.refreshTokenHash`
- Expiración en `Colaborador.refreshTokenExpiry`

### 4.5 Interceptor de Token en Frontend

`manager/src/lib/api.ts` tiene un interceptor que:
1. En cada respuesta 401: intenta renovar el access token usando la cookie
2. Cola las solicitudes concurrentes fallidas para reintentarlas después de renovar
3. Si el refresh también falla: limpia la sesión y redirige a `/login`

### 4.6 Validación de Contraseñas

Requisitos mínimos (enforced por DTO + frontend `PasswordStrength`):
- Mínimo 12 caracteres
- Al menos una mayúscula
- Al menos una minúscula
- Al menos un número
- Al menos un carácter especial (`@$!%*?&.#_-`)

### 4.7 AuditLog (Monitor de Seguridad)

Modelo `AuditLog` global (`@Global()`) que registra eventos sin bloquear:

| Acción auditada | Descripción |
|----------------|-------------|
| `LOGIN_OK` | Login exitoso |
| `LOGIN_FAIL` | Intento fallido (con motivo) |
| `LOGOUT` | Cierre de sesión |
| `TOKEN_REFRESH` | Renovación de access token |
| `ACCESS_PII` | Admin consulta datos sensibles de colaborador |
| `COLABORADOR_CREATE` | Creación de colaborador |
| `COLABORADOR_UPDATE` | Actualización de colaborador |
| `COLABORADOR_TOGGLE` | Activar/desactivar colaborador |
| `CLIENTE_CREATE` | Creación de cliente |
| `CLIENTE_UPDATE` | Actualización de cliente |

**Endpoint de consulta** (solo ADMIN, sin throttle):
```
GET /api/v1/manager/audit-log?accion=&colaboradorEmail=&ip=&dateFrom=&dateTo=&page=&limit=
GET /api/v1/manager/audit-log/stats   → totalHoy, fallosUltimaHora, cuentasBloqueadas
```

**Página:** `/auditlog` — solo visible para rol `ADMIN` en el Sidebar

---

## 5. Módulos del Manager

### 5.1 Colaboradores
- CRUD completo con datos personales, laborales, académicos, financieros
- Solo ADMIN puede crear/editar
- Contraseña con validación fuerte (12+ chars, complejidad)
- `GET /colaboradores/:id` devuelve datos según rol:
  - ADMIN → datos completos (logea `ACCESS_PII`)
  - Otros → solo datos públicos (nombre, cargo, email corporativo)
- Transferencia de clientes al desactivar un colaborador

### 5.2 Perfiles de Cargo
- Perfiles permanentes desvinculados de personas
- Incluye: responsabilidades, correo principal, subcorreos, permisos, documentoUrl
- Un colaborador puede tener uno o ningún perfil de cargo

### 5.3 Clientes Manager
- Estados: `PROSPECTO` → `ACTIVO` → `SUSPENDIDO` → `CANCELADO`
- Datos completos para facturación DIAN (NIT, régimen tributario, responsabilidades fiscales, CIIU)
- Asesor asignado (`asesorId`)
- **COMERCIAL** solo ve sus propios clientes (forzado en el backend)
- Módulos activos por cliente en `PlanCliente` con precio negociado opcional

### 5.4 Módulos Software
- 5 módulos fijos del SaaS (seeded, no se crean desde la UI)
- Se asocian a clientes via `PlanCliente`
- Precio anual base + precio negociado por cliente

### 5.5 Planes Base
- 3 planes (Básico, Estándar, Premium) — seeded
- Se asignan a clientes como referencia comercial

### 5.6 Tickets de Soporte
- Modelo `Ticket` con estados: `NUEVO → SAC → DESARROLLO → DEVUELTO → RESUELTO → CALIFICADO`
- Orígenes: `CHAT` (desde el ERP) | `TICKET_DIRECTO`
- Asignación a asesor SAC y desarrollador
- `TicketMensaje` con autor: `CLIENTE | SAC | DESARROLLO | IA`
- Calificación automática si no se califica en N días (`calificacionAuto`)

---

## 6. Navegación del Sidebar

### Ítems sueltos (visibles según rol)

| Ítem | Ruta | Roles |
|------|------|-------|
| Dashboard | `/dashboard` | Todos |
| Clientes | `/clientes` | Todos |
| Colaboradores | `/colaboradores` | ADMIN |
| Perfiles de Cargo | `/perfiles-cargo` | ADMIN |
| Módulos Software | `/modulos` | Todos |
| Planes Base | `/planes` | ADMIN |
| Monitor Seguridad | `/auditlog` | ADMIN |

### Grupos colapsables

| Grupo | Ítems | Roles |
|-------|-------|-------|
| **Operación** | SAC — Mis Tickets, Desarrollo | ADMIN, OPERACION, COORDINACION |
| **Coordinación** | Dashboard, Todos los Tickets | ADMIN, COORDINACION |

---

## 7. Rutas del Manager (App.tsx)

```
/login                               → LoginPage
/dashboard                           → DashboardPage
/clientes                            → ClientesPage
/clientes/nuevo                      → ClienteForm
/clientes/:id                        → ClienteForm
/colaboradores                       → ColaboradoresPage
/perfiles-cargo                      → PerfilesCargoPage
/perfiles-cargo/nuevo                → PerfilCargoForm
/perfiles-cargo/:id                  → PerfilCargoForm
/perfiles-cargo/:perfilId/colaboradores/nuevo  → ColaboradorForm
/modulos                             → ModulosPage
/planes                              → PlanesPage
/operacion/sac                       → OperacionSACPage
/operacion/desarrollo                → OperacionDesarrolloPage
/tickets/:id                         → TicketDetalle
/coordinacion/dashboard              → CoordinacionDashboardPage
/coordinacion/tickets                → CoordinacionTicketsPage
/auditlog                            → AuditLogPage
```

---

## 8. Variables de Entorno Manager

### Backend
```env
MANAGER_JWT_SECRET=...     # Secret exclusivo del Manager JWT
```

### Frontend Manager
```env
VITE_API_URL=https://api.edatia.com/api/v1
```

---

## 9. Dependencias Especiales Backend (Manager)

| Paquete | Versión | Uso |
|---------|---------|-----|
| `cookie-parser` | ^1.4.6 | Leer httpOnly cookies de refresh token |
| `@types/cookie-parser` | ^1.4.7 | Tipos TypeScript |

Habilitado en `main.ts`:
```typescript
import * as cookieParser from 'cookie-parser';
app.use(cookieParser());
```

---

## 10. Estado Actual y Pendientes

### Completado ✅
- Autenticación completa (login por email, JWT 2h + refresh 7d rotado)
- Bloqueo por fuerza bruta (5 intentos, 15 min)
- Validación de contraseñas fuertes (12+ chars, complejidad)
- httpOnly cookies para refresh token
- Interceptor frontend con cola de reintentos en 401
- AuditLog global con página de monitoreo
- CRUD colaboradores con control de acceso a PII
- CRUD clientes con autorización por asesor (COMERCIAL)
- Perfiles de cargo, módulos, planes (CRUD completo)
- Tickets SAC + Desarrollo con flujo de estados
- Chat en tiempo real (base implementada con TicketMensaje)

### Pendiente 🔜

| Funcionalidad | Descripción | Prioridad |
|---------------|-------------|-----------|
| **Módulo Coordinación — Dashboard** | Métricas de tickets, tiempos de respuesta, SLA | Alta |
| **Módulo Coordinación — Gestión** | Reasignación de tickets, escalamiento | Alta |
| **Módulo Operación — SAC** | Interfaz de atención con respuestas rápidas, plantillas | Alta |
| **Chat en tiempo real** | WebSockets (Socket.io) para chat ERP↔Manager | Media |
| **Notificaciones** | Push notifications cuando llega ticket nuevo | Media |
| **Reporte de gestión** | PDF/Excel de KPIs del equipo | Baja |
| **Agente IA (OPERACION)** | Colaborador IA que atiende tickets automáticamente | Media |
| **Documentos de cliente** | Contratos/propuestas en PDF con firma | Baja |

---

## 11. Seed Inicial (Primera Vez en Producción)

```bash
docker compose exec api npx ts-node \
  --compiler-options '{"module":"CommonJS"}' \
  prisma/manager-seed.ts
```

Crea:
- Admin Manager: `admin@edatia.com` / `Manager123!`
- 5 módulos del SaaS (inventario, ventas, administrativo, contable, digital)
- 3 planes base (Básico, Estándar, Premium)

---

## 12. Credenciales de Acceso (Producción)

| Portal | Email | Contraseña | URL |
|--------|-------|-----------|-----|
| Manager | `admin@edatia.com` | `Manager123!` | https://manager.edatia.com |
| ERP | `admin@edatia.com` | `Admin123!` | https://erp.edatia.com |

> 🔐 Cambiar estas contraseñas en producción real.
