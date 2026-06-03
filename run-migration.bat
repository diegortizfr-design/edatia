@echo off
echo === Ejecutando Prisma Migrate ===
cd /d "c:\Users\diego\Desktop\edatia\backend"
call npx prisma migrate dev --name add_localstorage_migration_models --skip-seed
echo === Generando Prisma Client ===
call npx prisma generate
echo === LISTO ===
pause
