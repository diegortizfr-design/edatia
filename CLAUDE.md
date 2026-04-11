# Edatia ERP — Contexto del Proyecto

## ¿Qué es Edatia?
SaaS ERP para empresas de **retail especializado y distribución masiva de productos físicos**.
Nicho: tiendas físicas y/o online, inventario mediano a grande, ventas B2B y B2C.

**Misión:** Facilitar la gestión integral de los negocios mediante una plataforma simple, conectada y eficiente.

**Dueño del proyecto:** Diego (diegortizfr-design)

---

## Arquitectura General

```
edatia.com          → Landing page (landing/)
erp.edatia.com      → ERP React SPA (frontend/)
api.edatia.com      → API NestJS (backend/)
api.edatia.com/api/docs → Swagger UI
manager.edatia.com  → Edatia Manager (super admin) ← EN CONSTRUCCIÓN
```

### Stack
- **Backend:** NestJS 10, Prisma 5, PostgreSQL 15, JWT, bcrypt
- **Frontend:** React 18, Vite 4, Tailwind CSS, React Query, React Router 6
- **Infra:** Docker Compose, Traefik (TLS automático), Caddy (web server)
- **Servidor:** VPS Linux, red Docker: n8n_default
- **Repo:** https://github.com/diegortizfr-design/edatia

### Multi-tenant
- Arquitectura: **schema por empresa** en PostgreSQL
- Cada cliente tiene su propio schema con todos sus módulos
- Schema `super_admin` para Edatia Manager

---

## Estructura de archivos

```
edatia/
├── backend/               # NestJS API
│   ├── src/
│   │   ├── auth/          # JWT auth (register, login, /me)
│   │   ├── users/         # CRUD usuarios con roles
│   │   ├── empresas/      # CRUD empresas
│   │   ├── prisma/        # PrismaService global
│   │   └── common/        # Filters, interceptors, decorators
│   └── prisma/
│       ├── schema.prisma  # Modelos: User, Profile, Empresa
│       ├── migrations/    # Migración inicial aplicada en prod
│       └── seed.ts        # Crea empresa demo + admin
├── frontend/              # React SPA (erp.edatia.com)
│   └── src/
│       ├── pages/         # Dashboard, Login, NotFound
│       ├── components/    # Layout, MetricCard, ProtectedRoute
│       ├── context/       # AuthContext
│       └── services/      # api.ts, auth.service.ts
├── landing/               # HTML estático (edatia.com)
│   ├── index.html
│   ├── Dockerfile
│   └── Caddyfile
├── docker-compose.yml     # 4 servicios: db, api, web, landing
├── deploy.sh              # Script de despliegue con validaciones
└── CLAUDE.md              # Este archivo
```

---

## Credenciales de producción (servidor)
- **Admin ERP:** usuario `admin` / contraseña `Admin123!`
- **Email admin:** admin@edatia.com
- **BD:** edatia_erp (PostgreSQL en contenedor edatia-db)
- **JWT Secret:** en backend/.env (no commiteado)

---

## Módulos del ERP (5 módulos planeados)

| # | Módulo | Estado |
|---|--------|--------|
| 1 | **Contable** (contabilidad, impuestos, estados financieros) | Pendiente |
| 2 | **Administrativo** (empleados, nómina, roles) | Pendiente |
| 3 | **Operativo/Inventario** (inventario, compras, bodegas) | **SIGUIENTE** |
| 4 | **Comercial** (ventas, clientes, CRM) | Pendiente |
| 5 | **Digital** (tienda virtual, marketplaces, integraciones) | Pendiente |

---

## Edatia Manager (Super Admin) ← PRÓXIMO A CONSTRUIR

**Dominio:** manager.edatia.com
**Propósito:** Panel exclusivo para el equipo de Edatia para gestionar clientes del SaaS.

### Secciones planeadas:
1. **Empresas clientes** — ver, activar/desactivar, asignar plan
2. **Planes** — Básico, Profesional, Completo (módulos por plan)
3. **Tickets de soporte** — recibir, responder, cerrar tickets de clientes
4. **Métricas globales** — clientes activos, ingresos, tickets pendientes

### Preguntas pendientes por definir:
- ¿Solo Diego accede o hay equipo interno con roles?
- Datos que se piden al registrar empresa cliente
- ¿Período de prueba antes de pagar?
- ¿Límite de usuarios por plan?
- ¿Cómo el cliente abre un ticket? ¿Desde el ERP o por fuera?
- ¿Notificaciones de tickets nuevos?

---

## Agente IA (planeado)
- Agente Claude con herramientas SSH para controlar el VPS
- Interfaz: Telegram bot o web
- Puede hacer: deploys, revisar logs, limpiar servidor, consultar BD
- Construido con Claude Agent SDK + Anthropic API

---

## Flujo de deploy

### Desde PC local:
```bash
git push origin main
```

### En el servidor:
```bash
git pull && ./deploy.sh
```

### Si hay cambios en el backend:
```bash
git pull && docker compose build --no-cache api && docker compose up -d
```

### Después de cambios en schema.prisma:
```bash
docker compose exec api npx prisma migrate deploy
```

---

## Comandos útiles en el servidor

```bash
# Estado de contenedores
docker compose ps

# Logs del API
docker compose logs api --tail=50

# Logs en tiempo real
docker compose logs -f

# Reiniciar un servicio
docker compose restart api

# Limpiar Docker (libera espacio)
docker system prune -f

# Espacio en disco
df -h

# Correr seed
docker compose exec api npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# Migraciones
docker compose exec api npx prisma migrate deploy
```

---

## Notas técnicas importantes
- `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` en schema.prisma (requerido para Alpine)
- OpenSSL instalado en Dockerfile de backend (requerido para Prisma)
- `rootDir: ./src` en tsconfig.json backend
- `prisma/` excluido del tsconfig para evitar conflicto con rootDir
- Variables `DB_USER`, `DB_PASSWORD`, `DB_NAME` deben estar en `.env` de la RAÍZ del proyecto (no solo en backend/.env)
- Red Docker externa: `n8n_default` (debe existir antes del deploy)
