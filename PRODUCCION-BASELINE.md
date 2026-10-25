# Baseline de migraciones — procedimiento para producción

**No ejecutado todavía.** Este documento es el procedimiento; los pasos contra
la base de producción los corre una persona, con backup previo.

## El problema

`schema.prisma` declara **94 modelos**. Las 14 migraciones que había en
`prisma/migrations/` creaban **6 tablas**. La BD de producción se fue armando
con `prisma db push`, así que el historial de migraciones quedó cubriendo una
fracción del esquema real.

En producción no se nota, porque la base ya tiene todo. Se nota en cualquier
base que se cree de cero:

- un **restore** desde backup sobre una base vacía,
- **provisionar un cliente nuevo** (el multi-tenant de la hoja de ruta),
- un **ambiente nuevo** — fue exactamente lo que pasó al montar staging.

El síntoma es desconcertante: Nest arranca, mapea todas las rutas y se mata
justo antes de `app.listen()`, porque `GeolocalizacionService` consulta la
tabla `Pais` en `onApplicationBootstrap` y lanza `P2021`. El contenedor queda
`running` con el puerto cerrado y el proxy devuelve 502 a todo.

## El cambio ya hecho en el repo

- `prisma/migrations/0_init/migration.sql` — baseline de 2836 líneas que crea
  las 94 tablas. Generada con:
  ```bash
  prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
  ```
- Las 14 migraciones anteriores se movieron a `prisma/migrations-legacy/`,
  fuera del alcance de Prisma. **Tenían que salir**: si se quedan, en una base
  fresca la baseline crea `User` y después `20260407000000_init` intenta
  crearla de nuevo.

## Qué se verificó, y cómo

Contra un PostgreSQL 15.6 local (misma versión que producción):

| Escenario | Resultado |
|---|---|
| Base vacía + solo `0_init` → `migrate deploy` | **94 tablas creadas** |
| Réplica de prod (94 tablas + 14 migraciones registradas) → `migrate deploy` **sin resolver** | **falla**: `P3018`, `42P07 relation "User" already exists` |
| Misma réplica → `migrate resolve --applied 0_init` y después `migrate deploy` | `marked as applied` → `No pending migrations to apply` |

La fila del medio es el motivo de que este documento exista: **si se deploya a
producción sin marcar la baseline primero, el deploy falla y deja una migración
en estado fallido**, que bloquea todas las migraciones futuras hasta resolverla
a mano.

Las 14 filas viejas de `_prisma_migrations` son inofensivas: se comprobó que
Prisma no reclama por migraciones registradas en la BD que no están en el
disco. No hay que borrarlas, y conviene no hacerlo: son el único registro de
qué se aplicó y cuándo.

## Procedimiento

### 1. Backup

```bash
./backup.sh
./restore.sh list      # confirmar que quedó el archivo
```

No sigas sin esto.

### 2. Comprobar que no hay deriva

El paso que importa: la baseline refleja `schema.prisma`, no lo que realmente
hay en producción. Si la BD derivó del schema, marcarla como aplicada esconde
esa diferencia.

```bash
docker compose exec api npx prisma migrate diff \
  --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma \
  --script
```

- **Sin salida** (o solo comentarios): producción coincide con el schema, seguí.
- **Con sentencias**: hay deriva. **Pará.** Ese SQL es la diferencia real y hay
  que revisarla a mano antes de continuar: puede ser una columna que falta en
  prod, o una que sobra y el schema no declara.

### 3. Traer el código y marcar la baseline

```bash
git pull
docker compose exec api npx prisma migrate resolve --applied 0_init
```

Esto solo inserta una fila en `_prisma_migrations`. **No ejecuta la baseline**
y no toca ninguna tabla.

### 4. Confirmar

```bash
docker compose exec api npx prisma migrate deploy
# esperado: "No pending migrations to apply."
```

Si dice que va a aplicar `0_init`, el paso 3 no quedó: **no sigas**, porque eso
es el escenario que falla con `42P07`.

### 5. Deploy normal

```bash
./deploy.sh
```

## Después

Las migraciones nuevas se generan como siempre (`prisma migrate dev` en
desarrollo) y se apilan sobre `0_init`. A partir de acá una base vacía se
reconstruye con un solo `migrate deploy`, que es lo que necesita el
multi-tenant para provisionar clientes.

**Queda fuera:** `herramientas.prisma` nunca tuvo migraciones y sigue
sincronizándose con `db push`. Si ese schema va a crecer, merece su propia
baseline con este mismo procedimiento.
