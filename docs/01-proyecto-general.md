# Edatia ERP — Documentación General del Proyecto

> ⚠️ **Este archivo es un documento vivo.**
> Debe actualizarse cada vez que se agregue un módulo, se modifique la arquitectura, se cambie alguna dependencia o se tome una decisión técnica relevante. No dejar este archivo desactualizado.

---

## 1. ¿Qué es Edatia?

SaaS ERP para empresas de **retail especializado y distribución masiva de productos físicos**.

**Nicho objetivo:** Tiendas físicas y/o online, inventario mediano a grande, ventas B2B y B2C.

**Misión:** Facilitar la gestión integral de los negocios mediante una plataforma simple, conectada y eficiente.

**Dueño del proyecto:** Diego (diegortizfr-design)

---

## 2. Arquitectura General

```
edatia.com              → Landing page (landing/)
erp.edatia.com          → ERP React SPA (frontend/)
api.edatia.com          → API NestJS (backend/) — Swagger en /api/docs
manager.edatia.com      → Edatia Manager (manager/)
```

### Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Backend API** | NestJS 10, Prisma 5, PostgreSQL 15, JWT, bcrypt |
| **Frontend ERP** | React 18, Vite 4, Tailwind CSS, React Query v4, React Router 6 |
| **Manager** | React 18, Vite 4, Tailwind CSS (dark premium), React Query v4, React Router 6, react-hot-toast |
| **Infra** | Docker Compose, Traefik (TLS automático), Caddy |
| **Servidor** | VPS Linux, red Docker: `n8n_default` |
| **Repo** | https://github.com/diegortizfr-design/edatia |

---

## 3. Estructura del Repositorio

```
edatia/
├── backend/                   # NestJS API — api.edatia.com
│   ├── src/
│   │   ├── auth/              # JWT auth ERP (register, login, /me)
│   │   ├── users/             # CRUD usuarios ERP
│   │   ├── empresas/          # CRUD empresas ERP
│   │   ├── manager-auth/      # Auth Manager (ManagerJwtStrategy)
│   │   ├── colaboradores/     # CRUD colaboradores internos Edatia
│   │   ├── perfiles-cargo/    # Perfiles de cargo
│   │   ├── modulos-software/  # 5 módulos del SaaS
│   │   ├── clientes-manager/  # Clientes con estados y flujo comercial
│   │   ├── planes-base/       # Planes de suscripción
│   │   ├── audit-log/         # @Global — registro de eventos de seguridad
│   │   ├── inventario/        # ← MÓDULO ACTIVO (ver doc específica)
│   │   ├── manager.module.ts  # Agrupa todos los módulos del Manager
│   │   ├── prisma/            # PrismaService global
│   │   └── common/            # Filters, interceptors, decorators
│   └── prisma/
│       ├── schema.prisma      # 24 modelos: ERP + Manager + Inventario
│       ├── migrations/        # Migraciones aplicadas en prod
│       ├── seed.ts            # Empresa demo ERP + admin ERP
│       └── manager-seed.ts    # Admin Manager + módulos + planes
│
├── frontend/                  # React SPA ERP — erp.edatia.com
│   └── src/
│       ├── pages/             # Dashboard, Login, módulos del ERP
│       │   └── inventario/    # ← MÓDULO ACTIVO (12 páginas)
│       ├── components/        # Layout, ProtectedRoute
│       ├── services/          # api.ts, auth.service.ts, inventario.service.ts
│       ├── context/           # AuthContext
│       └── types/             # index.ts — interfaces TypeScript
│
├── manager/                   # React SPA Manager — manager.edatia.com
│   └── src/
│       ├── pages/             # Dashboard, Clientes, Colaboradores, etc.
│       ├── components/        # AppLayout, Sidebar, EdatiaLogo, etc.
│       ├── context/           # AuthContext (manager JWT)
│       └── lib/               # api.ts, utils.ts
│
├── landing/                   # HTML estático — edatia.com
├── docs/                      # ← Documentación del proyecto (aquí estás)
│   ├── 01-proyecto-general.md
│   ├── 02-modulo-inventario.md
│   └── 03-portal-manager.md
├── docker-compose.yml         # 5 servicios: db, api, web, landing, manager
├── deploy.sh                  # Script de despliegue
└── CLAUDE.md                  # Instrucciones para el asistente IA
```

---

## 4. Modelos de Base de Datos (Prisma)

### Modelos ERP base

| Modelo | Descripción |
|--------|-------------|
| `User` | Usuarios del ERP (empleados de los clientes) |
| `Profile` | Perfil extendido del usuario |
| `Empresa` | Empresa del cliente (tenant ERP) |

### Modelos Manager (portal interno Edatia)

| Modelo | Descripción |
|--------|-------------|
| `Colaborador` | Equipo interno Edatia |
| `PerfilCargo` | Cargos permanentes |
| `ModuloSoftware` | 5 módulos vendibles del SaaS |
| `PlanBase` | Planes de suscripción |
| `ClienteManager` | Clientes del SaaS |
| `PlanCliente` | Módulos activos por cliente |
| `Ticket` | Tickets de soporte SAC/Desarrollo |
| `TicketMensaje` | Mensajes de cada ticket |
| `AuditLog` | Registro de eventos de seguridad |

### Modelos Inventario ERP

| Modelo | Descripción |
|--------|-------------|
| `Categoria` | Jerarquía de categorías de productos |
| `Marca` | Marcas de productos |
| `UnidadMedida` | Unidades con factor de conversión |
| `Producto` | Catálogo con CPP, IVA, control stock |
| `Bodega` | Almacenes/puntos de venta |
| `Stock` | Stock actual por producto+bodega |
| `MovimientoInventario` | Kardex inmutable |
| `Proveedor` | Proveedores de mercancía |
| `OrdenCompra` | Órdenes de compra con flujo |
| `OrdenCompraItem` | Ítems de cada OC |
| `RecepcionMercancia` | Recepción (parcial o total) |
| `RecepcionItem` | Ítems de cada recepción |

> **Total modelos en schema.prisma:** 24 (a la fecha)

---

## 5. Autenticación — Dos Sistemas Separados

### ERP (erp.edatia.com)
- Strategy: `'jwt'` (passport-jwt)
- Guard: `JwtAuthGuard` en `src/auth/jwt-auth.guard.ts`
- Secret: `JWT_SECRET` en `.env`
- Payload: `{ sub, email, usuario, rol, empresaId }`
- Storage: `localStorage` → `edatia_token`
- TTL: configurable (actualmente por defecto de NestJS JWT)

### Manager (manager.edatia.com)
- Strategy: `'manager-jwt'` (passport-jwt separado)
- Guard: `ManagerJwtAuthGuard` en manager-auth
- Secret: `MANAGER_JWT_SECRET` en `.env`
- Payload: `{ sub, email, rol }`
- Storage: `localStorage` (access token) + httpOnly cookie (refresh token)
- Access token TTL: 2 horas
- Refresh token TTL: 7 días (rotación en cada uso, hash SHA-256 en BD)

---

## 6. Multi-tenancy

- Cada empresa cliente tiene un registro en `Empresa`
- Todos los usuarios ERP tienen `empresaId` en su JWT
- **REGLA CRÍTICA:** todos los endpoints del ERP filtran por `empresaId` extraído del JWT — nunca aceptado del request body
- Los módulos del ERP (inventario, ventas, etc.) siempre tienen índices con `empresaId`
- El Manager es mononivel — gestiona a todas las empresas desde un solo portal

---

## 7. Módulos del ERP (productos vendibles)

| # | Módulo | Slug | Precio Anual | Estado |
|---|--------|------|--------------|--------|
| 1 | **Inventario** | `inventario` | $1.200.000 COP | ✅ En construcción (Sprint 2/4) |
| 2 | Ventas / Comercial | `ventas` | $1.500.000 COP | 🔜 Pendiente |
| 3 | Administrativo | `administrativo` | $1.800.000 COP | 🔜 Pendiente |
| 4 | Contable | `contable` | $2.000.000 COP | 🔜 Pendiente |
| 5 | Digital | `digital` | $2.400.000 COP | 🔜 Pendiente |

---

## 8. Convenciones de Código

### Backend (NestJS)
- Prefijo global de API: `/api/v1`
- Prefijo ERP Inventario: `/api/v1/inventario/...`
- Prefijo Manager: `/api/v1/manager/...`
- DTOs con `class-validator` en todos los endpoints
- `(this.prisma as any).modelName` mientras no se corra `prisma generate` (modelos nuevos)
- Transacciones con `prisma.$transaction(async (tx) => {...})` cuando se tocan múltiples tablas
- Números de documentos: `PREFIX-YYYY-NNNNN` (ej: `MOV-2026-00001`, `OC-2026-00001`)

### Frontend (React)
- Axios instance con interceptor de token en `src/services/api.ts`
- React Query para todo el estado del servidor (no Redux)
- `useQuery` para lecturas, `useMutation` para escrituras
- Tailwind CSS — paleta: `slate` para neutros, `indigo` para acciones primarias
- Componentes de página exportados como named exports (no default)

---

## 9. Variables de Entorno Requeridas

### Backend (`backend/.env`)
```env
DATABASE_URL=postgresql://user:pass@db:5432/edatia
JWT_SECRET=...
MANAGER_JWT_SECRET=...
PORT=3000
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=https://api.edatia.com/api/v1
```

### Manager (`manager/.env`)
```env
VITE_API_URL=https://api.edatia.com/api/v1
```

### Raíz del proyecto (`.env` — usado por docker-compose)
```env
POSTGRES_USER=...
POSTGRES_PASSWORD=...
POSTGRES_DB=edatia
JWT_SECRET=...
MANAGER_JWT_SECRET=...
```

---

## 10. Comandos de Despliegue

### Deploy normal
```bash
git pull && ./deploy.sh
```

### Con cambios en schema.prisma
```bash
git pull
docker compose build --no-cache api
docker compose up -d
docker compose exec api npx prisma db push   # o migrate deploy
```

### Con nuevos módulos frontend
```bash
git pull
docker compose build --no-cache frontend manager
docker compose up -d
```

### Seed inicial (primera vez)
```bash
# Seed ERP
docker compose exec api npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# Seed Manager
docker compose exec api npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/manager-seed.ts
```

---

## 11. Notas Técnicas Importantes

- `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` en schema.prisma (Alpine Docker)
- `rootDir: ./src` en tsconfig.json backend — genera `dist/main.js`
- `prisma/` excluido del tsconfig para evitar conflictos
- Red Docker externa: `n8n_default` (debe existir antes del deploy)
- CORS incluye: `https://erp.edatia.com`, `https://manager.edatia.com`, `http://localhost:5173`, `http://localhost:5174`
- `cookie-parser` instalado en backend para httpOnly cookies del Manager

---

## 12. Hoja de Ruta (Roadmap)

### En progreso
- [x] Portal Manager completo (fases 1-4 seguridad)
- [x] Módulo Inventario — Sprint 1 (Maestros, Stock, Movimientos, Kardex)
- [x] Módulo Inventario — Sprint 2 (Proveedores, Órdenes de Compra, Recepción)
- [ ] Módulo Inventario — Sprint 3 (Dashboard KPIs, ABC, Alertas, Exportación)
- [ ] Módulo Inventario — Sprint 4 (Lotes, Variantes, Integraciones)

### Pendiente
- [ ] Módulo Ventas / Comercial
- [ ] Módulo Administrativo
- [ ] Módulo Contable
- [ ] Módulo Digital
- [ ] Coordinación y Operación en Manager (SAC en tiempo real)
- [ ] Agente IA (Claude) para control VPS desde Telegram/web
- [ ] Multi-tenant avanzado (schema por empresa en PostgreSQL)
