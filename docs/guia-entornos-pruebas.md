# 🚀 Guía de Entornos de Pruebas: Edatia & Tiendas Virtuales

Este documento describe la arquitectura profesional de dos niveles adoptada para el desarrollo y validación de cambios en Edatia y sus tiendas virtuales (Distribuidora BabyWorld, ERP Frontend y Manager).

---

## 📐 Arquitectura de Dos Niveles

```
┌────────────────────────────────────────────────────────┐
│ NIVEL 1: Entorno Local (Desarrollo Ágil)              │
│ • Vite con Hot-Reload instantáneo (<100ms)             │
│ • Ejecución nativa sin sobrecarga de Docker en Windows │
│ • Conexión híbrida a la API en la nube vía .env.local  │
└────────────────────────────────────────────────────────┘
                           │
                           │ Validación local aprobada
                           ▼
┌────────────────────────────────────────────────────────┐
│ NIVEL 2: Staging en Docker (Validación Pre-Prod)       │
│ • Contenedores Caddy + Traefik en VPS Hostinger        │
│ • URLs públicas seguras con SSL automático             │
│ • Totalmente aislado de los contenedores de producción │
└────────────────────────────────────────────────────────┘
```

---

## 💻 1. Nivel 1: Desarrollo Local (Día a Día)

Para modificar componentes (`HeroBanner.tsx`, `Navbar.tsx`, `ControlExistencias.tsx`, etc.) y ver los cambios al instante en tu navegador:

### Métodos de inicio rápido:

1. **Vía Menú Interactivo (Recomendado):**
   - Ejecuta [menu-pruebas.bat](file:///c:/Users/diego/Desktop/edatia/menu-pruebas.bat).
   - Elige `1` para BabyWorld, `2` para el ERP o `4` para iniciar ambos a la vez.

2. **Vía Scripts Directos:**
   - [iniciar-tienda-babyworld.bat](file:///c:/Users/diego/Desktop/edatia/iniciar-tienda-babyworld.bat): Abre la tienda en `http://localhost:5176`.
   - [iniciar-erp.bat](file:///c:/Users/diego/Desktop/edatia/iniciar-erp.bat): Abre el ERP en `http://localhost:5173`.
   - [iniciar-manager.bat](file:///c:/Users/diego/Desktop/edatia/iniciar-manager.bat): Abre el Manager en `http://localhost:5174`.

3. **Vía VS Code / Antigravity:**
   - Presiona `Ctrl + Shift + P` -> Escribe `Tasks: Run Task` (o presiona `Ctrl + Shift + B`).
   - Selecciona la tarea deseada.

### Pruebas en dispositivos móviles (Misma red Wi-Fi):
Gracias al flag `--host` configurado en los scripts, Vite expone el servidor a tu red local. Abre en el navegador de tu celular la dirección IP asignada (ejemplo: `http://192.168.1.X:5176`).

### 🔒 Aislamiento de Frontends en Docker Local (`docker-compose.override.yml`):
Si en lugar de ejecutar Vite en la máquina anfitriona levantas los frontends mediante Docker (`docker compose up -d web manager glowxir`), asegúrate de contar con el archivo local `docker-compose.override.yml` (basado en `docker-compose.override.example.yml`).
Este archivo inyecta `VITE_API_URL: http://localhost:4000` durante el `docker build` de Vite, garantizando que los contenedores locales **nunca** dirijan solicitudes hacia la API de producción (`api.edatia.com`).

---

## 🐳 2. Nivel 2: Staging en Docker (VPS de Hostinger)

El entorno de staging replica **al 100%** las condiciones de producción (Caddy, Traefik, certificados SSL Let's Encrypt y red interna Docker).

### Archivos de Staging creados:
* [docker-compose.staging.yml](file:///c:/Users/diego/Desktop/edatia/edatia/docker-compose.staging.yml): Define los 3 servicios de prueba de forma completamente independiente de producción.
* [deploy-staging.sh](file:///c:/Users/diego/Desktop/edatia/edatia/deploy-staging.sh): Script de despliegue automatizado.

### URLs asignadas en Staging:
* **Tienda BabyWorld:** `https://staging.distribuidorababyworld.com` (o `https://staging-babyworld.edatia.com`)
* **ERP Frontend:** `https://staging-erp.edatia.com`
* **Edatia Manager:** `https://staging-manager.edatia.com`

### Configuración DNS necesaria en Hostinger:
En la zona DNS de tus dominios en el panel de Hostinger, añade los siguientes registros tipo **A**:

| Tipo | Nombre (Host) | Valor (IP del VPS) | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `staging` (en dominio `distribuidorababyworld.com`) | `187.127.10.22` | Automático / 14400 |
| **A** | `staging-babyworld` (en dominio `edatia.com`) | `187.127.10.22` | Automático / 14400 |
| **A** | `staging-erp` (en dominio `edatia.com`) | `187.127.10.22` | Automático / 14400 |
| **A** | `staging-manager` (en dominio `edatia.com`) | `187.127.10.22` | Automático / 14400 |

### Cómo desplegar Staging en el VPS:
1. Conéctate a tu VPS por SSH o terminal:
   ```bash
   ssh root@187.127.10.22
   ```
2. Ve al directorio del proyecto:
   ```bash
   cd /home/alex/edatia   # (o la ruta donde esté clonado en tu servidor)
   git pull origin main   # (o git checkout staging && git pull)
   ```
3. Ejecuta el script de staging:
   ```bash
   chmod +x deploy-staging.sh
   ./deploy-staging.sh
   ```
Traefik detectará automáticamente los nuevos contenedores y gestionará sus certificados SSL sin requerir reinicio del servidor de producción.

