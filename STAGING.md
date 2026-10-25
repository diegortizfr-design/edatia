# Ambiente de pruebas — `edatia.matriz.cloud` (Coolify)

Stack de staging aislado de producción. Nada acá toca `edatia.com`, el VPS de
producción ni sus volúmenes.

| | |
|---|---|
| **Panel** | `https://panel.oportunidaddevida.com` |
| **Proyecto / Entorno** | `matriz` / `staging` |
| **Repo que deploya** | `Juliandrp/edatia` (fork privado) |
| **Rama que se deploya** | `julian` |
| **Compose** | `docker-compose.staging.yml` |
| **URL pública** | `https://edatia.matriz.cloud` |
| **Manager (opcional)** | `https://manager.edatia.matriz.cloud` |

## Cómo está armado

Un solo hostname sirve todo, con Caddy reenviando el API por ruta:

```
https://edatia.matriz.cloud
  ├── /            → web      (SPA del ERP, build de Vite servido por Caddy)
  ├── /api/v1/*    → api:4000 (NestJS)
  └── /uploads/*   → api:4000
```

Como el SPA y el API quedan en el **mismo origen**, no hay CORS ni cookies
cross-site que configurar — que es justo lo que más se rompe al clonar el
ambiente. El bundle se construye con `VITE_API_URL=https://edatia.matriz.cloud`
(es build-time en Vite, no runtime: cambiar el host obliga a rebuild).

Servicios del compose:

| Servicio | Qué es | Dominio |
|---|---|---|
| `db` | PostgreSQL 15.6-alpine, volumen `db-data-staging` | — (solo red interna) |
| `api` | NestJS; corre `prisma migrate deploy` en cada arranque | — (vía proxy de `web`) |
| `web` | SPA del ERP + proxy del API | **`edatia.matriz.cloud`** |
| `manager` | Portal interno; queda corriendo sin dominio | opcional |

El `db` **no publica el 5432 al host** (producción sí lo hace). Para entrar:
`docker exec -it <contenedor-db> psql -U edatia -d edatia_staging`.

**El compose de staging no usa ningún bind mount**, a diferencia del de
producción. Coolify no deja el repo clonado en el host: solo baja el archivo
de compose. Un `- ./archivo:/ruta` hace que Docker cree un *directorio* vacío
en el path inexistente y falle al montarlo sobre un archivo — o peor, que
monte un directorio vacío sin quejarse. Por eso:

- el Caddyfile de cada SPA se hornea en la imagen vía `--build-arg CADDYFILE`
  (el default es el de producción, así que el build de prod no cambia);
- la BD `herramientas_edatia` que el backend necesita por su segundo cliente
  Prisma la crea `prisma db push`, que crea la base si no existe. Así no hace
  falta el `init-db.sh` que monta el compose de producción.

## Pasos en Coolify

**1. DNS** — ya está listo: `edatia.matriz.cloud` resuelve a `168.231.70.175`,
la misma IP que `panel.oportunidaddevida.com`. Si algún día sumás
`manager.edatia.matriz.cloud`, necesita su propio registro `A` a esa IP; sin eso
Let's Encrypt no emite el certificado.

**2. Proyecto y entorno** — Coolify → *Projects* → `matriz`; dentro, entorno
`staging` (crealos si no existen).

**3. Recurso** — *+ New* → *Docker Compose* (no "Application"), y configurá:

- **Source**: repo `Juliandrp/edatia` — el fork, **no** el de Diego. Ver
  *¿Por qué un fork?* más abajo.
- **Branch**: `julian`
- **Compose file**: `docker-compose.staging.yml`
- **Base directory**: `/`

**4. Variables de entorno** — pegá el contenido de `.env.staging.example`.
Los secretos de esa plantilla se generaron aleatorios para este ambiente;
**no reutilices los de producción**.

**5. Dominio** — en el servicio `web`, campo *Domains*: `https://edatia.matriz.cloud`.
Dejá `api`, `db` y `manager` sin dominio: el API entra por el proxy de `web`.

**6. Deploy.** El primer build compila 3 imágenes (backend, frontend, manager),
así que tarda.

**7. Seeds** — una sola vez, en la terminal del contenedor `api`:

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/manager-seed.ts
```

Las credenciales salen de `SEED_ADMIN_PASSWORD` y `MANAGER_ADMIN_PASSWORD`.

## Verificación

```bash
curl -s https://edatia.matriz.cloud/api/v1/health      # API por el proxy
curl -sI https://edatia.matriz.cloud | grep -i x-edatia-env   # debe decir: staging
```

El header `X-Edatia-Env: staging` está puesto a propósito para que no quede
duda de en qué ambiente estás mirando.

## Diferencias contra producción

| | Producción | Staging |
|---|---|---|
| Proxy | Traefik propio + labels en el compose | el de Coolify |
| Red | externa `n8n_default` | la del proyecto en Coolify |
| `container_name` | fijos (`edatia-db`, …) | los asigna Coolify |
| Puerto 5432 | publicado al host | cerrado |
| Migraciones | manuales (`migrate deploy`) | automáticas al arrancar |
| HSTS | activo | desactivado |
| Volúmenes | `db-data`, `uploads-data` | `*-staging` (separados) |

## ¿Por qué un fork?

El repo original es de `diegortizfr-design` y acá se trabaja con rol
`write`, no `admin`. Eso tiene dos consecuencias para Coolify:

- Las **GitHub Apps se instalan por cuenta** y solo ven los repos de esa
  cuenta. Ser colaborador deja clonar y pushear por git, pero no hace visible
  el repo del dueño a una app instalada en otra cuenta: `diegortizfr-design/edatia`
  simplemente no aparece en el selector de Coolify.
- Agregar una **deploy key** pide rol `admin`, que tampoco hay.

Por eso staging deploya desde `Juliandrp/edatia`, un fork privado donde sí hay
`admin`. La alternativa de fondo es que Diego instale la GitHub App de este
Coolify en su cuenta con acceso a `edatia`; ese día se cambia el *Source* del
recurso al repo original y el fork deja de hacer falta.

### Remotes

```
origin  →  diegortizfr-design/edatia   (el repo real: PRs y trabajo del día)
fork    →  Juliandrp/edatia            (solo lo que deploya Coolify)
```

### Mantener el fork al día

El fork no se actualiza solo. Antes de cada deploy de staging:

```bash
git fetch origin
git checkout julian
git rebase origin/main      # o merge, según cómo venga la rama
git push origin julian      # el repo real
git push fork julian        # dispara el deploy en Coolify
```

Si Coolify tiene el webhook del fork activado, ese último push arranca el
build solo. Cuidado con el orden: **pushear a `fork` sin haber pusheado a
`origin`** deja staging corriendo código que no está en el repo real.
