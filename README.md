# Edatia ERP SaaS - Arquitectura Moderna de Contenedores

Este proyecto es la versión SaaS moderna y escalable de Edatia ERP, estructurada como un monorepo administrado por **Docker** y **Traefik**.

## 🏗️ Estructura del Proyecto
- `/backend`: API REST construida con **NestJS**, **TypeScript** y **Prisma ORM**.
- `/frontend`: SPA construida con **React**, **Vite** y **shadcn/ui**, servida por **Caddy**.
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

## 🔍 Verificación Operativa
- **Frontend**: https://erp.edatia.com
- **API Health**: https://api.edatia.com/api/v1/health (Debe retornar `{ "status": "ok" }`)
- **Traefik Dashboard**: (Configurado pero no expuesto públicamente por defecto).

## 🛠️ Tecnologías Utilizadas
- **Backend**: NestJS, PostgreSQL, Prisma, JWT.
- **Frontend**: React 18, Tailwind CSS, shadcn/ui.
- **Infraestructura**: Docker, Traefik v2.10, Caddy, Let's Encrypt.

---
&copy; 2026 Edatia SaaS Premium. Todos los derechos reservados.
