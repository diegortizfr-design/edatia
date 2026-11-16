#!/bin/bash
set -euo pipefail

# ============================================================
# EDATIA - Despliegue del Entorno de Staging (Pruebas)
# Servidor VPS Hostinger (187.127.10.22)
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()   { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

log "=========================================================="
log "   Iniciando Despliegue de STAGING (Edatia / BabyWorld)   "
log "=========================================================="

# 1. Verificar Docker
command -v docker >/dev/null 2>&1 || error "Docker no está instalado en este sistema."
docker compose version >/dev/null 2>&1 || error "Docker Compose V2 no encontrado."

# 2. Verificar red Docker n8n_default
if ! docker network ls --format '{{.Name}}' | grep -q '^n8n_default$'; then
  warn "Red 'n8n_default' no encontrada. Creándola..."
  docker network create n8n_default
fi

# 3. Construir y levantar servicios de staging
log "Construyendo imágenes y levantando contenedores de STAGING..."
docker compose -f docker-compose.staging.yml up -d --build

log "=========================================================="
log " ✅ Staging desplegado exitosamente!"
log "=========================================================="
log " URLs disponibles (con SSL automático Traefik):"
log " - Tienda BabyWorld:  https://staging.distribuidorababyworld.com"
log "                      https://staging-babyworld.edatia.com"
log " - ERP Frontend:      https://staging-erp.edatia.com"
log " - Edatia Manager:    https://staging-manager.edatia.com"
log "=========================================================="
log "Nota: Asegúrate de que los registros DNS (tipo A) para estos subdominios"
log "apunten a la IP del VPS: 187.127.10.22"

