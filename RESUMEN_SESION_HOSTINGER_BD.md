# 📋 Resumen de Sesión y Estado del Servidor - Edatia
**Fecha:** 30 de Julio, 2026

---

## 1. 🖥️ Servidor VPS & Hostinger Integration
* **VPS Hostname:** `server.edatia` (ID: `1550222`)
* **IP pública:** `187.127.10.22`
* **Plan:** KVM 2 (2 vCPUs dedicadas, 8 GB RAM, 100 GB NVMe SSD)
* **OS / Plantilla:** Ubuntu 24.04 con n8n y Docker Compose
* **Estado:** 🟢 `Running` (100% operativo)

---

## 2. ⚡ Optimización de Recursos y Docker Compose
* **Limpieza de Basura:** Se removieron los 6 contenedores huérfanos/detenidos (`edatia-api-run-*`) y capas de imágenes no utilizadas en el entorno de producción.
* **Eliminación de Límites Rígidos (`cpus` / `memory`):** 
  Se actualizó [docker-compose.yml](file:///c:/Users/diego/Desktop/edatia/docker-compose.yml) para quitar las restricciones artificiales de `0.25` y `0.5` vCPU.
  * Ahora todos los servicios (`api`, `web`/ERP, `manager`, `landing`, `prestamos`, `herramientas`, `glowxir`, `db`) escalan dinámicamente usando el 100% de la capacidad del VPS según la demanda de los clientes.
  * Se eliminaron las falsas alertas rojas de "Límite de reinicios de CPU" en el panel de Hostinger.

---

## 3. 🛡️ Arquitectura y Separación de Bases de Datos
Se organizaron y aislaron las bases de datos dentro de PostgreSQL (Puerto `5432`):

1. **`edatia_erp`**: Base de datos principal para el ERP (`erp.edatia.com`) y el Portal de Control Manager (`manager.edatia.com`).
2. **`prestamos_edatia`**: Base de datos dedicada para el módulo de Préstamos (`prestamos.edatia.com`).
3. **`herramientas_edatia`**: Base de datos aislada para datos/reportes de cartera creados por clientes desde el sitio público (`herramientas.edatia.com`).
   * *Configuración:* Se actualizó la variable `HERRAMIENTAS_DATABASE_URL` en [backend/.env](file:///c:/Users/diego/Desktop/edatia/backend/.env) para garantizar que los datos de prueba de Herramientas jamás toquen la base del ERP.

---

## 4. 🔑 Credenciales para TablePlus (PostgreSQL)

| Conexión | Host | Puerto | Usuario | Contraseña | Base de Datos |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Edatia ERP (PROD)** | `187.127.10.22` | `5432` | `admin` | `Edatia2026Prod` | `edatia_erp` |
| **Edatia Préstamos** | `187.127.10.22` | `5432` | `admin` | `Edatia2026Prod` | `prestamos_edatia` |
| **Herramientas Edatia** | `187.127.10.22` | `5432` | `admin` | `Edatia2026Prod` | `herramientas_edatia` |

---

## 5. 🤖 Proyectos Adicionales en el VPS
* **Bot de Trading (`app_binarias`):** En `/home/alex/app_binarias`. Base de datos interna `saas_db` protegida sin puerto público expuesto.
* **Motor n8n (`n8n`):** En `/docker/n8n`. Flujos de trabajo y automatización en `n8n.srv1550222.hstgr.cloud`.

---
*Documento generado para continuidad de trabajo en la siguiente sesión.*
