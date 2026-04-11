# Edatia ERP — Contexto del Proyecto

## ¿Qué es Edatia?
SaaS ERP para empresas de **retail especializado y distribución masiva de productos físicos**.
Nicho: tiendas físicas y/o online, inventario mediano a grande, ventas B2B y B2C.

**Misión:** Facilitar la gestión integral de los negocios mediante una plataforma simple, conectada y eficiente.

**Dueño del proyecto:** Diego (diegortizfr-design)

---

## Arquitectura General

```
edatia.com           → Landing page (landing/)
erp.edatia.com       → ERP React SPA (frontend/)
api.edatia.com       → API NestJS (backend/) — Swagger en /api/docs
manager.edatia.com   → Edatia Manager (manager/) ← CONSTRUIDO
```

### Stack
- **Backend:** NestJS 10, Prisma 5, PostgreSQL 15, JWT, bcrypt
- **Frontend ERP:** React 18, Vite 4, Tailwind CSS, React Query, React Router 6
- **Manager:** React 18, Vite 4, Tailwind CSS (dark premium), React Query, React Router 6, react-hot-toast
- **Infra:** Docker Compose, Traefik (TLS automático), Caddy (web server)
- **Servidor:** VPS Linux, red Docker: n8n_default
- **Repo:** https://github.com/diegortizfr-design/edatia

---

## Estructura de archivos

```
edatia/
├── backend/               # NestJS API
│   ├── src/
│   │   ├── auth/          # JWT auth ERP (register, login, /me)
│   │   ├── users/         # CRUD usuarios ERP
│   │   ├── empresas/      # CRUD empresas ERP
│   │   ├── manager-auth/  # Auth Manager (ManagerJwtStrategy, 'manager-jwt')
│   │   ├── colaboradores/ # CRUD colaboradores internos Edatia
│   │   ├── perfiles-cargo/# Perfiles de cargo permanentes
│   │   ├── modulos-software/ # 5 módulos del SaaS
│   │   ├── clientes-manager/ # Clientes del SaaS con estados
│   │   ├── planes-base/   # Planes de suscripción
│   │   ├── manager.module.ts # Agrega todos los módulos Manager
│   │   ├── prisma/        # PrismaService global
│   │   └── common/        # Filters, interceptors, decorators
│   └── prisma/
│       ├── schema.prisma  # Modelos: User, Profile, Empresa + Manager models
│       ├── migrations/    # Migraciones aplicadas en prod
│       ├── seed.ts        # Crea empresa demo ERP + admin ERP
│       └── manager-seed.ts # Crea admin Manager + 5 módulos + 3 planes
├── frontend/              # React SPA ERP (erp.edatia.com)
├── manager/               # React SPA Manager (manager.edatia.com)
│   ├── src/
│   │   ├── pages/         # Dashboard, Login, Clientes, Colaboradores, Módulos, PerfilesCargo, Planes
│   │   ├── components/    # AppLayout, Sidebar, EdatiaLogo, Card, Button, Input, Badge
│   │   ├── context/       # AuthContext (usa MANAGER_JWT_SECRET)
│   │   └── lib/           # api.ts, utils.ts
│   ├── Dockerfile
│   └── Caddyfile
├── landing/               # HTML estático (edatia.com)
├── docker-compose.yml     # 5 servicios: db, api, web, landing, manager
├── deploy.sh              # Script de despliegue con validaciones
└── CLAUDE.md              # Este archivo
```

---

## Credenciales de producción (servidor)

### ERP
- **Admin ERP:** usuario `admin` / contraseña `Admin123!`
- **Email admin:** admin@edatia.com
- **URL:** https://erp.edatia.com

### Manager
- **Admin Manager:** email `admin@edatia.com` / contraseña `Manager123!`
- **URL:** https://manager.edatia.com
- **JWT Secret:** MANAGER_JWT_SECRET en backend/.env

---

## Modelos Prisma — Manager

| Modelo | Descripción |
|--------|-------------|
| `Colaborador` | Equipo interno Edatia (rol: ADMIN/COMERCIAL/COORDINACION/OPERACION) |
| `PerfilCargo` | Perfiles de cargo permanentes, desvinculados de personas |
| `ModuloSoftware` | 5 módulos del SaaS (inventario, ventas, administrativo, contable, digital) |
| `PlanBase` | Planes de suscripción (Básico, Estándar, Premium) |
| `ClienteManager` | Clientes del SaaS con estado (PROSPECTO/ACTIVO/SUSPENDIDO/CANCELADO) |
| `PlanCliente` | Módulos activos por cliente con precio negociado opcional |

---

## Roles del Manager

| Rol | Descripción |
|-----|-------------|
| ADMIN | Acceso total al portal Manager |
| COMERCIAL | Gestión de clientes y propuestas |
| COORDINACION | SAC + Desarrollo |
| OPERACION | SAC + Soporte Técnico (puede ser humano o IA) |

---

## Módulos del ERP (productos que se venden)

| # | Módulo | Slug | Precio Anual |
|---|--------|------|--------------|
| 1 | Inventario | inventario | $1.200.000 |
| 2 | Ventas / Comercial | ventas | $1.500.000 |
| 3 | Administrativo | administrativo | $1.800.000 |
| 4 | Contable | contable | $2.000.000 |
| 5 | Digital | digital | $2.400.000 |

---

## Flujo de deploy

### Primer deploy con Manager:
```bash
# En servidor:
git pull
docker compose build --no-cache api manager
docker compose up -d

# Migrar BD (Manager models):
docker compose exec api npx prisma migrate deploy

# Seed inicial del Manager:
docker compose exec api npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/manager-seed.ts
```

### Deploy normal:
```bash
git pull && ./deploy.sh
```

### Si hay cambios en schema.prisma:
```bash
docker compose exec api npx prisma migrate deploy
```

---

## Comandos útiles en el servidor

```bash
# Estado de contenedores (ahora hay 5)
docker compose ps

# Logs del Manager
docker compose logs manager --tail=50

# Logs del API
docker compose logs api --tail=50

# Reiniciar Manager
docker compose restart manager

# Seed Manager
docker compose exec api npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/manager-seed.ts

# Seed ERP
docker compose exec api npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# Migraciones
docker compose exec api npx prisma migrate deploy

# Limpiar Docker
docker system prune -f
```

---

## Notas técnicas importantes

- `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` en schema.prisma (Alpine)
- OpenSSL instalado en Dockerfile de backend
- `rootDir: ./src` en tsconfig.json backend — genera `dist/main.js` (no `dist/src/main.js`)
- `prisma/` excluido del tsconfig para evitar conflicto con rootDir
- Variables de Docker Compose en `.env` de la RAÍZ del proyecto
- Red Docker externa: `n8n_default` (debe existir antes del deploy)
- CORS del backend incluye `https://manager.edatia.com` y `http://localhost:5174`
- Manager usa `(prisma as any).modelName` hasta que `prisma generate` corra (modelos no tipados antes de migración)
- Manager JWT usa strategy name `'manager-jwt'` (diferente al ERP que usa `'jwt'`)

---

## Pendiente / Próximos pasos

1. **Módulos del ERP** — construir módulo de Inventario (el más prioritario según la hoja de ruta)
2. **Coordinación y Operación** — definir y construir módulos en el Manager
3. **Documentos** — PlantillaDoc + DocumentoCliente (contratos/propuestas)
4. **Agente IA** — Claude Agent con herramientas SSH para control del VPS desde Telegram/web
5. **Multi-tenant** — schema por empresa en PostgreSQL al activar un cliente
