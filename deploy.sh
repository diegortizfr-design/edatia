#!/bin/bash
set -euo pipefail

# ============================================================
# EDATIA ERP SaaS - Script de Despliegue
# Requiere: Docker, Docker Compose V2, red n8n_default, Traefik
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

log "=========================================="
log " Iniciando despliegue de Edatia ERP SaaS"
log "=========================================="

# 1. Verificar prerrequisitos
command -v docker >/dev/null 2>&1 || error "Docker no está instalado."
docker compose version >/dev/null 2>&1 || error "Docker Compose V2 no encontrado."

# 2. Verificar red Docker
if ! docker network ls --format '{{.Name}}' | grep -q '^n8n_default$'; then
  warn "Red Docker 'n8n_default' no encontrada."
  read -rp "¿Deseas crearla ahora? [s/N] " yn
  case $yn in
    [Ss]*) docker network create n8n_default && log "Red 'n8n_default' creada." ;;
    *) error "La red 'n8n_default' es necesaria. Abortando." ;;
  esac
fi

# 3. Verificar archivo .env
if [ ! -f "backend/.env" ]; then
  warn "Archivo backend/.env no encontrado. Copiando desde plantilla..."
  cp backend/.env.example backend/.env
  error "Edita backend/.env con tus credenciales REALES antes de continuar. Abortando."
fi

# 4. Validar variables críticas en .env
ENV_FILE="backend/.env"
for VAR in DATABASE_URL JWT_SECRET MANAGER_JWT_SECRET DB_USER DB_PASSWORD; do
  if ! grep -q "^${VAR}=" "$ENV_FILE" 2>/dev/null; then
    warn "Variable ${VAR} no encontrada en backend/.env"
  fi
done

# 5. Verificar que JWT_SECRET no sea el valor de ejemplo
if grep -q 'CAMBIAR_POR_SECRET' "$ENV_FILE"; then
  error "JWT_SECRET aún tiene el valor de ejemplo. Genera uno real con: openssl rand -base64 64"
fi

# 6. Construir y levantar contenedores
log "Construyendo imágenes y levantando contenedores..."
docker compose up -d --build

# 7. Esperar a que el API esté saludable
log "Esperando que los servicios estén listos..."
MAX_WAIT=60
COUNT=0
while [ $COUNT -lt $MAX_WAIT ]; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' edatia-backend 2>/dev/null || echo "starting")
  if [ "$STATUS" = "healthy" ]; then
    break
  fi
  COUNT=$((COUNT + 5))
  sleep 5
  log "  Esperando API... (${COUNT}s / ${MAX_WAIT}s) - Estado: ${STATUS}"
done

if [ "$STATUS" != "healthy" ]; then
  warn "El API no reportó 'healthy' en ${MAX_WAIT}s. Verifica los logs:"
  warn "  docker compose logs api"
else
  log "API lista y saludable."
fi

# 8. Ejecutar migraciones de base de datos
log "Ejecutando migraciones de Prisma..."
docker compose exec api npx prisma migrate deploy || warn "Fallo en migraciones. Revisa: docker compose logs api"

# 9. Resultado final
echo ""
log "=========================================="
log " Despliegue completado exitosamente"
log "=========================================="
echo ""
log "Landing:       https://edatia.com"
log "ERP Frontend:  https://erp.edatia.com"
log "Manager:       https://manager.edatia.com"
log "API REST:      https://api.edatia.com/api/v1"
log "Swagger Docs:  https://api.edatia.com/api/docs"
log "Health Check:  https://api.edatia.com/api/v1/health"
echo ""
log "Comandos útiles:"
log "  Ver logs:       docker compose logs -f"
log "  Reiniciar API:  docker compose restart api"
log "  Estado:         docker compose ps"
