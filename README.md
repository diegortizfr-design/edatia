# Edatia ERP SaaS - Arquitectura Moderna de Contenedores

Este proyecto es la versión SaaS moderna y escalable de Edatia ERP, estructurada como un monorepo administrado por **Docker** y **Traefik**.

## 🏗️ Estructura del Proyecto
- `/backend`: API REST construida con **NestJS**, **TypeScript** y **Prisma ORM**.
- `/frontend`: SPA construida con **React**, **Vite** y **shadcn/ui**, servida por **Caddy**.
- `/tiendas-virtuales/distribuidorababyworld`: Storefront de e-commerce (Headless Commerce) conectado en tiempo real al ERP (servicio docker `glowxir`).
- `/tiendas-virtuales/prestamos`: Plataforma SaaS multitenant para control de préstamos, cobranza de cartera, amortizaciones y rutas diarias (servicio docker `edatia-prestamos`).
- `/traefik`: Configuración del proxy inverso y almacenamiento de certificados SSL.
- `docker-compose.yml`: Orquestador de todos los servicios.

## 🚀 Despliegue en Producción (VPS)

### 1. Requisitos Previos
- Docker y Docker Compose instalados.
- Los subdominios `api.edatia.com` y `erp.edatia.com` deben apuntar a la IP de este servidor.

### 2. Configuración Inicial
```bash
# Otorgar permisos al script de despliegue
chmod +x deploy.sh

# Configurar variables de entorno si es necesario
nano backend/.env
```

### 3. Ejecutar el Sistema
```bash
./deploy.sh
```
> **Nota:** `./deploy.sh` genera automáticamente un respaldo preventivo de todas las bases de datos antes de construir los contenedores.

## 💾 Copias de Seguridad y Restauración

El sistema cuenta con herramientas integrales de respaldo (`backup.sh`) y recuperación (`restore.sh`):

### Crear un Respaldo Completo
```bash
./backup.sh
```
Genera una copia en `backups/backup_YYYYMMDD_HHMMSS/` que incluye:
- Cluster completo de PostgreSQL (`cluster_all_*.sql.gz`)
- Dumps individuales comprimidos (`edatia_erp`, `prestamos_edatia`, `herramientas_edatia`)
- Archivos subidos por clientes (`uploads_*.tar.gz`)
- Variables de entorno sensibles (`configs_*.tar.gz`, permisos 600)
- Manifiesto con sumas criptográficas SHA-256 y conteo de registros clave (`manifest.txt`)
- Purga automática de copias de más de 14 días

### Restaurar un Respaldo
```bash
# Listar respaldos disponibles
./restore.sh list

# Restaurar la copia más reciente
./restore.sh latest

# Restaurar una copia específica
./restore.sh backups/backup_20261019_235349
```
*(Requiere confirmación explícita escribiendo `RESTAURAR` para evitar accidentes).*

## 🔍 Verificación Operativa
- **Frontend**: https://erp.edatia.com
- **API Health**: https://api.edatia.com/api/v1/health (Debe retornar `{ "status": "ok" }`)
- **Traefik Dashboard**: (Configurado pero no expuesto públicamente por defecto).

## 🛠️ Tecnologías Utilizadas
- **Backend**: NestJS, PostgreSQL, Prisma, JWT, Cloudinary (Almacenamiento de imágenes).
- **Frontend / ERP**: React 18, Tailwind CSS, shadcn/ui.
- **Tiendas Virtuales**: React 18, Tailwind CSS, Headless API.
- **Infraestructura**: Docker, Traefik v2.10, Caddy, Let's Encrypt.

---
&copy; 2026 Edatia SaaS Premium. Todos los derechos reservados.
