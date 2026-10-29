# Rama `julian` — guía de revisión

18 commits, 66 archivos, +4293 / −538. Tres bloques independientes entre sí:

1. **Ambiente de pruebas** en Coolify (`edatia.matriz.cloud`)
2. **Baseline de migraciones** de Prisma — el cambio con impacto en producción
3. **Responsive** del ERP y del Manager

Si tenés poco tiempo, leé el bloque 2: es el único que toca algo fuera de
staging y el único que encontró un problema real del repositorio.

---

## Cómo revisar

```bash
git log --oneline main..julian          # los 18 commits
git diff --stat main..julian            # alcance
git diff main..julian -- docker-compose.staging.yml
git diff main..julian -- frontend/src/components/Layout.tsx
```

Los mensajes de commit explican el *porqué* de cada cambio, no solo el qué.
Varios documentan un error que se cometió y se corrigió en el commit siguiente;
están a propósito para que se vea el razonamiento.

Documentos relacionados:

| Archivo | Qué contiene |
|---|---|
| `STAGING.md` | Cómo está armado el ambiente, pasos en Coolify, credenciales |
| `PRODUCCION-BASELINE.md` | Procedimiento para aplicar la baseline en producción |
| `backend/prisma/migrations-legacy/README.md` | Por qué se archivaron 14 migraciones |

---

## Bloque 1 — Ambiente de pruebas

**Archivos:** `docker-compose.staging.yml`, `frontend/Caddyfile.staging`,
`manager/Caddyfile.staging`, `.env.staging.example`, `STAGING.md`, y un `ARG`
nuevo en `frontend/Dockerfile` y `manager/Dockerfile`.

Stack aislado: `db`, `db-init`, `api-migrate`, `api-seed`, `api`, `web`,
`manager`. Volúmenes `*-staging` propios, la BD no publica el 5432 al host, y
**ningún bind mount**.

### Decisiones que no son obvias

**Un solo hostname.** Caddy sirve el SPA en `/` y reenvía `/api/*` y
`/uploads/*` al contenedor `api`. Mismo origen ⇒ sin CORS ni cookies
cross-site, que es lo que más se rompe al clonar un ambiente.

**Cero bind mounts, a propósito.** Coolify no deja el repo clonado en el host:
solo baja el archivo de compose. Un `- ./archivo:/ruta` hace que Docker cree un
*directorio vacío* en el path inexistente. En el Caddyfile eso falló ruidoso
(`not a directory`); en el `init-db.sh` falló **en silencio**, montando un
directorio vacío en `/docker-entrypoint-initdb.d`, y las bases adicionales
nunca se crearon. Por eso:

- el Caddyfile de cada SPA se hornea en la imagen vía `--build-arg CADDYFILE`
  (el default es el de producción, así que ese build no cambió);
- las bases las crea el servicio `db-init` con `createdb`.

**Tres servicios one-shot** (`db-init`, `api-migrate`, `api-seed`) en lugar de
comandos manuales: la API de Coolify **no tiene endpoint de ejecución**, no hay
forma de hacer `exec` en un contenedor desde afuera. Todo lo que en producción
se corre a mano, acá tiene que ser un servicio del compose. Los tres son
idempotentes.

**Bloques `handle` en los Caddyfile.** Caddy ejecuta las directivas en *su*
orden interno, donde `try_files` va **antes** que `reverse_proxy`. Con
directivas sueltas, `/api/v1/health` no existe como archivo, `try_files` lo
reescribe a `/index.html`, el matcher del proxy ya no coincide y **el API
devuelve el HTML del SPA**. Los `handle` son mutuamente excluyentes y lo evitan.
Si tocás esos archivos, mantené la estructura.

**El arranque del `api` tiene una red de contención** (ver el `command` en el
compose). Si `node dist/main` termina, se captura su salida y un servidor mínimo
la sirve en el puerto 4000 con código **503**. Así el error se lee con
`curl https://edatia.matriz.cloud/api/v1/health` y el healthcheck sigue fallando
como corresponde. Existe porque la API de Coolify solo devuelve los logs de un
contenedor del recurso: sin esto, un `api` que no levanta es completamente opaco
desde afuera. Si el `api` arranca bien, ese bloque no se ejecuta nunca.

### Por qué deploya desde un fork

El repo es de `diegortizfr-design` y acá se trabaja con rol `write`, no `admin`.
Las GitHub Apps se instalan **por cuenta** y solo ven los repos de esa cuenta, y
agregar una deploy key pide `admin`. Por eso staging deploya desde
`Juliandrp/edatia` (fork privado). Remotes:

```
origin  →  diegortizfr-design/edatia   (PRs y trabajo del día)
fork    →  Juliandrp/edatia            (lo que deploya Coolify)
```

**El fork no se sincroniza solo.** Pushear a `fork` sin pushear a `origin` deja
staging corriendo código que no está en el repo real.

---

## Bloque 2 — Baseline de migraciones ⚠️

El único cambio con impacto fuera de staging. **No se aplicó en producción.**

### El problema

`schema.prisma` declara **94 modelos**; las 14 migraciones que había creaban
**6 tablas**. La BD de producción se fue armando con `prisma db push`, así que
el historial quedó cubriendo una fracción del esquema real.

En producción no se nota porque la base ya tiene todo. Se nota en **cualquier
base que se cree de cero**: un restore sobre una base vacía, provisionar un
cliente nuevo (el multi-tenant de la hoja de ruta), o un ambiente nuevo.

El síntoma es desconcertante y cuesta diagnosticar: Nest arranca, mapea todas
las rutas y **se mata justo antes de `app.listen()`**, porque
`GeolocalizacionService` consulta la tabla `Pais` en `onApplicationBootstrap` y
lanza `P2021`. El contenedor queda `running` con el puerto cerrado y el proxy
devuelve 502 a todo.

### El cambio

- `backend/prisma/migrations/0_init/` — baseline de 2836 líneas con las 94
  tablas, generada con:
  ```bash
  prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
  ```
- Las 14 migraciones anteriores se movieron a `backend/prisma/migrations-legacy/`,
  fuera del alcance de Prisma. **Tenían que salir**: si se quedan, en una base
  fresca la baseline crea `User` y después `20260407000000_init` intenta crearla
  de nuevo.

### Qué se verificó, contra PostgreSQL 15.6 (misma versión que producción)

| Escenario | Resultado |
|---|---|
| Base vacía + `0_init` → `migrate deploy` | **94 tablas creadas** |
| Réplica de prod (94 tablas + 14 migraciones registradas) → `migrate deploy` **sin resolver** | **falla**: `P3018` / `42P07 relation "User" already exists` |
| Misma réplica → `migrate resolve --applied 0_init`, después `migrate deploy` | `marked as applied` → `No pending migrations to apply` |

Y de punta a punta en staging: se apuntó a una base nueva (`edatia_staging_v2`),
`migrate deploy` la construyó entera desde la baseline, los seeds corrieron y
los dos logins responden con token.

**La fila del medio es el motivo de que `PRODUCCION-BASELINE.md` exista.** Si se
deploya a producción sin marcar la baseline primero, el deploy falla y deja una
migración en estado fallido que **bloquea todas las migraciones futuras** hasta
resolverla a mano.

Las 14 filas viejas de `_prisma_migrations` son inofensivas: se comprobó que
Prisma no reclama por migraciones registradas en la BD que no están en el disco.

**Antes de aplicarlo en producción**, el paso 2 del runbook (chequeo de deriva
con `migrate diff --from-url`) no es opcional: la baseline refleja
`schema.prisma`, no lo que *realmente* hay en prod. Si la BD derivó, marcarla
como aplicada esconde esa diferencia.

---

## Bloque 3 — Responsive

El contenido era inusable en celular mientras los menús se veían bien. **La
causa estaba en el contenedor, no en las páginas:**

```jsx
<div className="h-screen flex overflow-hidden">
  <aside className="... w-64">        // siempre en la fila flex
  <div className="flex-1 min-w-0 overflow-hidden">
```

En 390px el sidebar se comía 256 y dejaba 134 al contenido; con `p-6` quedaban
~86 útiles. Y `min-w-0` hacía que los hijos se **aplastaran** en lugar de
permitir scroll. Los menús se veían bien porque eran lo único con espacio.

### Layout (`frontend/src/components/Layout.tsx`, `manager/src/components/layout/`)

- Sidebar → **drawer deslizante** bajo `lg`, columna fija desde `lg`. Fondo
  oscuro, cierre al navegar / con Escape / al tocar un enlace, y bloqueo del
  scroll de fondo mientras está abierto.
- **Barra superior con botón de menú** solo en móvil: sin eso no había forma de
  abrir el drawer.
- Hook `useIsDesktop` (matchMedia). Hace falta **en JS y no solo en CSS** porque
  las etiquetas del menú se renderizan condicionalmente
  (`{!isCollapsed && <span>}`): sin él, quien dejó el sidebar colapsado en el
  escritorio abría el drawer del celular y veía solo iconos.
- Padding `p-4 sm:p-6 lg:p-10`, y `h-screen supports-[height:100dvh]:h-[100dvh]`
  para que la barra de direcciones del navegador no corte el contenido.

### Contenido

- **34 grids de formulario** pasan a apilarse (`grid-cols-1 sm:grid-cols-N`) en
  18 archivos. El criterio fue verificable, no a ojo: solo se apilan los grids
  que **contienen controles de formulario**.
- **14 tablas** con `overflow-x-auto` + `min-w` (7 en el ERP, 7 en el Manager).
  En el ERP sus contenedores tenían `overflow-hidden` y **recortaban** la tabla;
  en el Manager ya tenían scroll pero sin `min-w`, así que apretaban las
  columnas en vez de desplazarse.
- **21 modales** reciben `overflow-y-auto` + `items-start sm:items-center`. El
  par importa: con `items-center` y overflow, el recorte se va al borde de
  **arriba**.

### Lo que se dejó igual a propósito

- **8 grids dentro de zonas imprimibles** (planilla de conteo físico,
  comprobantes, bloques de firma). Apilarlos rompe el papel. Si tocás
  `ControlExistencias`, `Movimientos`, `Traslados` o `ConfigProductoDetalle`,
  fijate si estás dentro del bloque `printable-*` antes de cambiar un grid.
- **27 grids de fichas compactas**, chips y selectores de pestañas: dos columnas
  en un celular está bien para eso, y apilarlos empeora la pantalla.
- El contenedor del POS a pantalla completa, cuyo `overflow-hidden` es
  intencional.

### Verificación

Con Playwright a 390×844, logueado contra staging, midiendo desborde horizontal
(`scrollWidth` vs `innerWidth`) y revisando capturas:

```
ERP      10/10 pantallas sin desborde   drawer abre (left:0, w:288) y cierra (left:-288)
Manager   6/6  pantallas sin desborde   drawer abre (left:0, w:256)
```

---

## URLs y acceso (staging)

| | |
|---|---|
| ERP | https://edatia.matriz.cloud |
| Manager | https://manager.edatia.matriz.cloud |
| Panel | panel.oportunidaddevida.com → proyecto `Matriz` / entorno `staging` |

El ERP pide **NIT + usuario + contraseña**. Hay dos empresas sembradas:

| NIT | Usuario | Empresa |
|---|---|---|
| `900000000-0` | `admin` | Edatia Demo SAS |
| `1143875756-0` | `admin_diego` | Diego Ortiz - Pruebas ERP |

El Manager entra con el email `admin@edatia.com`.

**Las contraseñas no se escriben acá.** Están en las variables de entorno del
recurso en Coolify (`SEED_ADMIN_PASSWORD` y `MANAGER_ADMIN_PASSWORD`), que es
de donde las leen los seeds. `.env.staging.example` es solo la lista de qué
variables hacen falta, sin valores.

Una excepción que conviene conocer: la contraseña de `admin_diego` está
**hardcodeada** en `backend/prisma/seed.ts` y ninguna variable la cambia. Si
hace falta rotarla, hay que tocar ese archivo.

Son credenciales de staging, distintas de las de producción a propósito.

---

## Deuda detectada y NO resuelta

Cosas que se encontraron en el camino, se dejaron anotadas y **no** se tocaron
porque estaban fuera del alcance:

1. **La baseline no está aplicada en producción.** Ver `PRODUCCION-BASELINE.md`.
   Mientras no se aplique, el problema sigue abierto para restores y para
   provisionar clientes nuevos.
2. **116 errores de `tsc --noEmit`** en 19 archivos, todos previos a esta rama.
   No frenan nada hoy porque `npm run build` es `vite build`, que **no
   typechequea** — pero eso significa que el tipado no está protegiendo nada en
   el pipeline.
3. **`frontend/src/pages/inventario/OrdenCompraForm.tsx:286`** combina
   `overflow-y-auto` con `overflow-hidden` en un dropdown. Previo a esta rama.
4. **`herramientas.prisma` no tiene migraciones** y se sincroniza con `db push`.
   Si ese schema va a crecer, merece su propia baseline con el mismo
   procedimiento.
5. **El backend no tiene colas ni cache** (no hay Redis). Hoy no hay forma
   limpia de correr trabajo en background — facturación masiva, correos,
   sincronizaciones — y se va a sentir cuando el módulo contable crezca.
6. **La contraseña hardcodeada** en `seed.ts` mencionada arriba.
7. **Credenciales de PRODUCCIÓN en texto plano** en archivos versionados:
   `CLAUDE.md:78`, `docs/03-portal-manager.md:352` y `SESION.md:34`. Son
   previas a esta rama y no se tocaron, pero cualquiera con acceso al repo las
   tiene. Vale rotarlas y sacarlas de git.

---

## Reproducir las verificaciones

```bash
# builds (lo que realmente corre en el deploy)
cd frontend && npm run build
cd ../manager && npm run build

# staging vivo
curl -s https://edatia.matriz.cloud/api/v1/health            # {"status":"ok"}
curl -sI https://edatia.matriz.cloud | grep -i x-edatia-env  # staging
```

El header `X-Edatia-Env: staging` está puesto a propósito para que no quede duda
de en qué ambiente estás mirando.
