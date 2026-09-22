# Edatia — Estado de Sesión
> Última actualización: 2026-04-11 (sesión 2)

---

## ¿Qué es Edatia?
SaaS ERP para empresas de retail y distribución. Tiene 4 portales:
- `edatia.com` → Landing estática
- `erp.edatia.com` → ERP React (frontend/)
- `api.edatia.com` → API NestJS (backend/) — Swagger en /api/docs
- `manager.edatia.com` → Manager interno Edatia (manager/) ← EN CONSTRUCCIÓN ACTIVA

---

## Estado actual del servidor

### Contenedores Docker (5 servicios)
```
db       → PostgreSQL 15
api      → NestJS backend
web      → ERP React (Caddy)
landing  → HTML estático (Caddy)
manager  → Manager React (Caddy)
```

### Credenciales
| Portal | Email | Contraseña |
|--------|-------|------------|
| Manager | admin@edatia.com | Manager123! |
| ERP | admin@edatia.com | Admin123! |

---

## Estado resuelto (sesión 2)

✅ Seed Manager corrido — admin creado correctamente
✅ Login en manager.edatia.com funcionando con `admin@edatia.com` / `Manager123!`
✅ 5 contenedores Docker corriendo en producción

---

## Últimos cambios commiteados (rama main)

| Commit | Descripción |
|--------|-------------|
| f122b1a | fix: proteger único admin activo de ser desactivado |
| anterior | feat: redesign completo Manager (light/dark, full pages, HR form) |
| anterior | feat: Manager portal completo (backend + frontend) |

---

## Qué se construyó en la última sesión (resumen técnico)

### Backend — nuevos campos en schema.prisma
- **PerfilCargo**: `responsabilidades`, `correoPrincipal`, `subcorreos String[]`, `documentoUrl`
- **Colaborador**: ~35 campos HR completos (datos personales, contacto, laboral, formación, experiencia, habilidades, seguridad social, financiero, emergencia, documentación)

### Backend — protección admin
En `colaboradores.service.ts → toggleActivo()`:
- Si el colaborador a desactivar es el único ADMIN activo → lanza `ConflictException`
- Nunca más se puede quedar sin admin activo

### Frontend Manager — cambios de diseño
- **Tema claro por defecto** (blanco), toggle Moon/Sun para modo oscuro
- `ThemeContext.tsx` con localStorage (`edatia-theme`)
- `tailwind.config.js` con `darkMode: 'class'`
- Todos los componentes tienen clases `dark:` duales

### Frontend Manager — flujo de Colaboradores
- Colaboradores NO tienen botón "Crear" propio
- Se crean DESDE el PerfilCargo (botón UserPlus en la lista de colaboradores del perfil)
- Ruta: `/perfiles-cargo/:perfilId/colaboradores/nuevo`

### Frontend Manager — páginas nuevas
1. **PerfilCargoForm** (`/perfiles-cargo/nuevo` y `/perfiles-cargo/:id`)
   - Layout 2 columnas: izquierda (info, correos, documentación) + derecha (permisos, colaboradores)
   - Sticky header con nombre inline editable
   - Tag-inputs para subcorreos y permisos

2. **ColaboradorForm** (`/perfiles-cargo/:perfilId/colaboradores/nuevo`)
   - 11 secciones HR con nav lateral sticky
   - Secciones: Acceso, Datos Personales, Contacto, Laboral, Formación, Experiencia, Habilidades, Seguridad Social, Financiero, Emergencia, Documentación
   - POST a `/manager/colaboradores`

---

## Comandos frecuentes en servidor

```bash
# Ver logs
docker compose logs api --tail=50
docker compose logs manager --tail=50

# Rebuild completo
git pull && docker compose build --no-cache api manager && docker compose up -d

# Solo reiniciar sin rebuild
docker compose restart api manager

# Seed Manager (crear admin + módulos + planes)
docker compose exec api npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/manager-seed.ts

# Seed ERP (crear admin ERP + empresa demo)
docker compose exec api npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# Migraciones
docker compose exec api npx prisma migrate deploy

# Ver tabla Colaborador
docker compose exec db psql -U admin -d edatia_erp -c "SELECT id, email, nombre, rol, activo FROM \"Colaborador\";"

# Reactivar admin manualmente
docker compose exec db psql -U admin -d edatia_erp -c "UPDATE \"Colaborador\" SET activo = true WHERE email = 'admin@edatia.com';"
```

---

## Pendiente / Próximos pasos

### 🔴 Prioritario — próxima sesión
1. **Módulo Clientes (ClienteManager) — rediseño completo**
   - Eliminar el modal actual de creación
   - Reemplazar por página completa (`/clientes/nuevo` y `/clientes/:id`)
   - El usuario va a pasar los campos exactos que necesita
   - Mismo patrón que ColaboradorForm: secciones con nav lateral sticky
   - Archivos a modificar:
     - `manager/src/pages/Clientes.tsx` → quitar modal, agregar botón que navega a página
     - `manager/src/pages/ClienteForm.tsx` → CREAR NUEVO (no existe aún)
     - `manager/src/App.tsx` → agregar rutas `/clientes/nuevo` y `/clientes/:id`
     - `backend/src/clientes-manager/` → revisar/expandir campos según lo que pida el usuario
     - `backend/prisma/schema.prisma` → agregar nuevos campos al modelo `ClienteManager`

2. **Migración de campos HR del Colaborador** (si no se corrió):
   ```bash
   docker compose exec api npx prisma migrate dev --name expand-colaborador-perfilcargo
   ```

### 🟡 Siguiente
3. **Probar flujo completo**: crear PerfilCargo → crear Colaborador desde ese perfil
4. **Módulo Coordinación** — definir vistas y funcionalidad
5. **Módulo Operación** — definir vistas y funcionalidad
6. **Documentos** — PlantillaDoc + DocumentoCliente (contratos/propuestas)
7. **Agente IA** — Claude Agent con herramientas SSH para control VPS desde Telegram

---

## Estructura de archivos clave

```
backend/
  src/
    colaboradores/
      colaboradores.service.ts      ← SELECT_PUBLIC/FULL, toggleActivo protegido
      colaboradores.controller.ts   ← CRUD + toggle + transferir
      dto/colaborador.dto.ts        ← 35+ campos HR
    perfiles-cargo/
      perfiles-cargo.service.ts
      perfiles-cargo.controller.ts
      dto/perfil-cargo.dto.ts       ← responsabilidades, correoPrincipal, subcorreos
    manager-auth/
      manager-jwt.strategy.ts       ← usa MANAGER_JWT_SECRET, strategy 'manager-jwt'
      manager-jwt-auth.guard.ts
      roles.guard.ts
      roles.decorator.ts
  prisma/
    schema.prisma                   ← modelos Manager: Colaborador, PerfilCargo, etc.
    manager-seed.ts                 ← crea admin + 5 módulos + 3 planes

manager/
  src/
    context/
      AuthContext.tsx               ← login con VITE_API_URL + /manager/auth/login
      ThemeContext.tsx              ← toggle light/dark, localStorage
    pages/
      Login.tsx
      Dashboard.tsx
      Colaboradores.tsx             ← solo lista, sin botón crear
      ColaboradorForm.tsx           ← 11 secciones HR
      PerfilesCargo.tsx             ← lista con cards
      PerfilCargoForm.tsx           ← form completo con colaboradores embebidos
      Modulos.tsx
      Planes.tsx
      Clientes.tsx
    components/
      layout/AppLayout.tsx          ← toggle Moon/Sun
      layout/Sidebar.tsx
      ui/Card.tsx
      ui/Button.tsx
      ui/Input.tsx
      ui/Badge.tsx
    lib/
      api.ts                        ← axios con baseURL VITE_API_URL + Bearer token
      utils.ts
    App.tsx                         ← rutas incluyendo las nuevas
  tailwind.config.js                ← darkMode: 'class'
```

---

## Variables de entorno importantes

```env
# backend/.env
MANAGER_JWT_SECRET=...   ← diferente al JWT_SECRET del ERP

# manager/.env (o .env.production)
VITE_API_URL=https://api.edatia.com
```

---

## Notas técnicas

- `(prisma as any).modelName` — patrón usado en Manager porque los modelos se añadieron por migración y TypeScript no los tipó hasta `prisma generate`
- Manager JWT usa strategy name `'manager-jwt'` — diferente al ERP que usa `'jwt'`
- `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` en schema.prisma (Alpine Docker)
- Red Docker: `n8n_default` (debe existir antes del deploy)
- CORS backend incluye `https://manager.edatia.com` y `http://localhost:5174`

## Sesión 2026-09-12 - Arreglo Entorno Local y Bug Refinanciación

**Configuración Local:**
- Se corrigió el archivo backend/prisma/seed.ts para que la búsqueda/creación de usuarios utilice la llave compuesta correcta (empresaId_usuario).
- Se configuró el docker-compose.override.yml local exponiendo puertos que concuerden con la lista de CORS autorizados (ej. 5173, 5174).
- Se inyectaron variables locales (.env) para Manager y Frontend apuntando a http://localhost:4000.

**Módulo Préstamos (Control de Cartera):**
- Bug Fix: Se arregló un bloqueo nativo de validación HTML5 en la refinanciación (RenewLoanModal.tsx) causado por step="10000". Se redujo a step="1" para permitir cifras exactas.

## [2026-09-19] Implementacin Control Manual de Mora
- **Feature (Mora Separada)**: Se agreg un campo especfico de 'Mora Cobrada' en el \PaymentModal.tsx\ y en el \Route.tsx\ para separar la penalidad de la cuota principal.
- **Frontend / UX**: 
  - Se modificaron \Route.tsx\ y \Portfolio.tsx\ para etiquetar con **EN MORA** a los clientes atrasados.
  - Se actualiz \PrintViews.tsx\ para desglosar la Mora Cobrada en el recibo impreso.
  - Se modific \clientDetailTypes.ts\ para aadir \lateInterestAmount\.
- **Backend / DB**: Se valid que el \paymentController\ est consumiendo correctamente el valor \lateInterestAmount\ guardndolo en la base de datos PostgreSQL independiente (\edatia-prestamos\).
- **Commits / Ramas**: Estos cambios se desarrollaron dentro de la rama \feature/mora-separada\.

## Sesión 2026-09-22 - Rediseño Tienda Virtual Baby-World (glowxir)

**Diseño y UI:**
- Se implementó un estilo "pastel" utilizando los tonos `blush-300` y `baby-300` definidos en `tailwind.config.js`.
- Se incorporó la tipografía "Chewy" para darle un toque infantil al título "Baby World".
- Se rediseñó por completo el `HeroBanner.tsx`:
  - Se agregaron botones de "Ver catálogo" y "Pedir por WhatsApp".
  - Se integraron *trust badges* (Envíos rápidos, Pago contra entrega, 100% Garantizado).
  - Se añadieron tarjetas descriptivas grandes y limpias para las 3 categorías principales (Pañales, Juguetería, Variedades).
- Se agregó la mascota corporativa (`mascotas.png`) como una marca de agua decorativa sutil con opacidad del 25% para evitar sobrecargar la interfaz.

**Mejoras UX/UI (feature/mejoras-ux-ui):**
- **Animaciones:** Se añadieron keyframes personalizados en Tailwind (`fade-in-up`, `float`, `fade-in`) para lograr entradas suaves de los elementos (Hero y ProductCards) y una decoración flotante sutil (estrellas y corazones) en el HeroBanner.
- **Carrusel Destacado:** Se creó el componente `FeaturedCarousel.tsx` insertado en `App.tsx` para mostrar exclusivamente los productos marcados como `esDestacado: true`.
- **Skeletons de Carga:** Se creó `ProductSkeleton.tsx` que se muestra condicionalmente en `App.tsx` mientras el catálogo carga (`isLoading`), evitando saltos visuales o pantallas en blanco.
- **Micro-interacciones:** Se actualizó la barra superior de envíos en `Navbar.tsx` para promocionar el envío gratis con la clase `animate-pulse`.

**Infraestructura (Docker):**
- Se actualizó el archivo `Caddyfile` del proyecto `glowxir` para enviar cabeceras estrictas de `Cache-Control: no-cache` en archivos HTML, asegurando que los cambios se reflejen inmediatamente en entornos locales sin quedarse atrapados en la caché del navegador.
