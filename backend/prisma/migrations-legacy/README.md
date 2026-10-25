# Migraciones anteriores a la baseline

Estas 14 migraciones quedaron acá **solo como referencia histórica**. Prisma no
las ve: viven fuera de `prisma/migrations/`.

Se archivaron porque no podían reconstruir la base. Entre todas creaban 6
tablas, mientras `schema.prisma` declara 94: la BD de producción se fue armando
con `prisma db push`, así que el historial quedó cubriendo una fracción. Una
base nueva recibía 6 tablas de 94 y el API moría al arrancar
(`GeolocalizacionService` consulta la tabla `Pais` en `onApplicationBootstrap`
y lanza `P2021` antes de `app.listen()`).

Las reemplaza `prisma/migrations/0_init`, generada con:

```bash
prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script
```

No las borres sin necesidad: los nombres siguen registrados en la tabla
`_prisma_migrations` de producción. Se comprobó que esas filas son inofensivas
—Prisma no reclama por migraciones que están en la BD y no en el disco— pero
son el único rastro de qué se aplicó y cuándo.

El procedimiento para producción está en `PRODUCCION-BASELINE.md`.
