#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# EDATIA ERP SaaS - Script de Restauración de Backups
# ============================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error(){ echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_BASE_DIR="$SCRIPT_DIR/backups"
DB_CONTAINER="edatia-db"
DB_USER="admin"

usage() {
  echo "Uso: $0 [OPCIÓN]"
  echo ""
  echo "Opciones:"
  echo "  list                     Lista todos los backups disponibles"
  echo "  latest                   Restaura el backup más reciente"
  echo "  <ruta_al_directorio>     Restaura un backup específico (ej: backups/backup_20261019_235349)"
  echo ""
  exit 1
}

if [ $# -eq 0 ]; then
  usage
fi

ACTION="$1"

if [ "$ACTION" = "list" ]; then
  log "Directorios de backup disponibles:"
  find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "backup_*" | sort -r
  exit 0
fi

if [ "$ACTION" = "latest" ]; then
  TARGET_BACKUP=$(find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "backup_*" | sort -r | head -n 1)
  if [ -z "$TARGET_BACKUP" ]; then
    error "No se encontraron backups en $BACKUP_BASE_DIR."
  fi
else
  TARGET_BACKUP="$ACTION"
fi

if [ ! -d "$TARGET_BACKUP" ]; then
  error "El directorio de backup especificado no existe: $TARGET_BACKUP"
fi

log "============================================================"
warn "⚠️  ATENCIÓN: Se iniciará la restauración del sistema desde:"
log "  $TARGET_BACKUP"
warn "  Esto SOBREESCRIBIRÁ los datos actuales de la base de datos."
log "============================================================"

if [ -f "$TARGET_BACKUP/manifest.txt" ]; then
  echo ""
  log "Detalles del backup según manifest.txt:"
  cat "$TARGET_BACKUP/manifest.txt" | head -n 16
  echo ""
fi

read -rp "¿Estás COMPLETAMENTE SEGURO de restaurar este backup? (escribe 'RESTAURAR' para confirmar): " CONFIRM
if [ "$CONFIRM" != "RESTAURAR" ]; then
  log "Operación cancelada por el usuario."
  exit 0
fi

# 1. Verificar contenedor PostgreSQL
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  error "El contenedor '${DB_CONTAINER}' no está en ejecución. Inicia Docker Compose primero."
fi

# 2. Restaurar cluster o bases individuales
CLUSTER_FILE=$(find "$TARGET_BACKUP" -name "cluster_all_*.sql.gz" | head -n 1)
if [ -n "$CLUSTER_FILE" ]; then
  log "🔄 Restaurando cluster completo desde $CLUSTER_FILE..."
  gunzip -c "$CLUSTER_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d postgres
  log "✅ Cluster restaurado exitosamente."
else
  warn "No se encontró cluster_all_*.sql.gz. Buscando bases individuales..."
  for DB in "edatia_erp" "prestamos_edatia" "herramientas_edatia"; do
    DB_FILE=$(find "$TARGET_BACKUP" -name "${DB}_*.sql.gz" | head -n 1)
    if [ -n "$DB_FILE" ]; then
      log "🔄 Restaurando $DB desde $DB_FILE..."
      gunzip -c "$DB_FILE" | docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB"
      log "✅ $DB restaurada exitosamente."
    fi
  done
fi

# 3. Restaurar Uploads
UPLOADS_FILE=$(find "$TARGET_BACKUP" -name "uploads_*.tar.gz" | head -n 1)
UPLOADS_DEST="/var/lib/docker/volumes/edatia_uploads-data/_data"
if [ -n "$UPLOADS_FILE" ] && [ -d "$UPLOADS_DEST" ]; then
  log "🔄 Restaurando archivos de uploads..."
  tar -xzf "$UPLOADS_FILE" -C "$UPLOADS_DEST"
  log "✅ Uploads restaurados."
fi

log "============================================================"
log " 🎉 Restauración finalizada correctamente."
log " Se recomienda reiniciar los servicios con: docker compose restart api"
log "============================================================"
