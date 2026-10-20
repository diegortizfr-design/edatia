#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# EDATIA ERP SaaS - Script de Respaldo Completo del Sistema
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
cd "$SCRIPT_DIR"

TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_BASE_DIR="$SCRIPT_DIR/backups"
TARGET_DIR="$BACKUP_BASE_DIR/backup_$TIMESTAMP"

mkdir -p "$TARGET_DIR"

log "============================================================"
log " Iniciando backup de Edatia - $TIMESTAMP"
log " Destino: $TARGET_DIR"
log "============================================================"

# 1. Verificar contenedor de PostgreSQL
DB_CONTAINER="edatia-db"
if ! docker ps --format '{{.Names}}' | grep -q "^${DB_CONTAINER}$"; then
  error "El contenedor '${DB_CONTAINER}' no está en ejecución. Abortando backup."
fi

DB_USER="admin"
MAIN_DB="edatia_erp"

# 2. Respaldo completo del cluster (Roles, Schemas, Todas las bases)
log "📦 1/5 Respaldando cluster completo de PostgreSQL (pg_dumpall)..."
CLUSTER_DUMP="$TARGET_DIR/cluster_all_${TIMESTAMP}.sql.gz"
if docker exec "$DB_CONTAINER" pg_dumpall -U "$DB_USER" -l "$MAIN_DB" | gzip > "$CLUSTER_DUMP"; then
  SIZE=$(du -h "$CLUSTER_DUMP" | cut -f1)
  log "  ✅ Cluster respaldado: $CLUSTER_DUMP ($SIZE)"
else
  error "Fallo al respaldar el cluster de base de datos."
fi

# 3. Respaldos individuales por base de datos
DBS=("edatia_erp" "prestamos_edatia" "herramientas_edatia")
for DB in "${DBS[@]}"; do
  log "📦 2/5 Respaldando base de datos: $DB..."
  DB_DUMP="$TARGET_DIR/${DB}_${TIMESTAMP}.sql.gz"
  if docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB" | gzip > "$DB_DUMP"; then
    SIZE=$(du -h "$DB_DUMP" | cut -f1)
    log "  ✅ $DB respaldada: $DB_DUMP ($SIZE)"
  else
    warn "No se pudo respaldar individualmente $DB (verificar existencia)."
  fi
done

# 4. Respaldo de archivos subidos (Uploads)
log "📦 3/5 Respaldando volumen de uploads de clientes..."
UPLOADS_SRC="/var/lib/docker/volumes/edatia_uploads-data/_data"
UPLOADS_DUMP="$TARGET_DIR/uploads_${TIMESTAMP}.tar.gz"
if [ -d "$UPLOADS_SRC" ]; then
  tar -czf "$UPLOADS_DUMP" -C "$UPLOADS_SRC" .
  SIZE=$(du -h "$UPLOADS_DUMP" | cut -f1)
  log "  ✅ Uploads respaldados: $UPLOADS_DUMP ($SIZE)"
else
  warn "Directorio de uploads no encontrado en $UPLOADS_SRC."
fi

# 5. Respaldo de configuraciones sensibles (.env)
log "📦 4/5 Respaldando archivos de configuración y variables de entorno..."
CONFIG_DUMP="$TARGET_DIR/configs_${TIMESTAMP}.tar.gz"
tar -czf "$CONFIG_DUMP" \
  --exclude="node_modules" \
  --exclude=".git" \
  $(find . -maxdepth 2 -name ".env*" -not -path "*/node_modules/*") 2>/dev/null || true
chmod 600 "$CONFIG_DUMP"
SIZE=$(du -h "$CONFIG_DUMP" | cut -f1)
log "  ✅ Configuraciones respaldadas: $CONFIG_DUMP ($SIZE)"

# 6. Generar manifiesto de verificación e integridad
log "📦 5/5 Generando manifiesto y sumas de verificación SHA-256..."
MANIFEST="$TARGET_DIR/manifest.txt"
{
  echo "============================================================"
  echo "EDATIA ERP SAAS - MANIFEST DE BACKUP"
  echo "Fecha y hora: $(date -u +'%Y-%m-%d %H:%M:%S UTC')"
  echo "Host: $(hostname)"
  echo "Git Commit: $(git rev-parse HEAD 2>/dev/null || echo 'N/A')"
  echo "Git Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'N/A')"
  echo "============================================================"
  echo ""
  echo "--- CONTEO DE REGISTROS CLAVE ---"
  echo "Usuarios ERP:       $(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d edatia_erp -t -c 'SELECT count(*) FROM "User";' 2>/dev/null | xargs || echo 'N/A')"
  echo "Empresas ERP:       $(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d edatia_erp -t -c 'SELECT count(*) FROM "Empresa";' 2>/dev/null | xargs || echo 'N/A')"
  echo "Productos ERP:      $(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d edatia_erp -t -c 'SELECT count(*) FROM "Producto";' 2>/dev/null | xargs || echo 'N/A')"
  echo "Terceros ERP:       $(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d edatia_erp -t -c 'SELECT count(*) FROM "Tercero";' 2>/dev/null | xargs || echo 'N/A')"
  echo "Préstamos Totales:  $(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d prestamos_edatia -t -c 'SELECT count(*) FROM "Loan";' 2>/dev/null | xargs || echo 'N/A')"
  echo "Clientes Préstamos: $(docker exec "$DB_CONTAINER" psql -U "$DB_USER" -d prestamos_edatia -t -c 'SELECT count(*) FROM "Customer";' 2>/dev/null | xargs || echo 'N/A')"
  echo ""
  echo "--- ARCHIVOS Y SUMAS SHA256 ---"
  cd "$TARGET_DIR"
  sha256sum *.gz
  echo ""
  echo "--- TAMAÑOS ---"
  ls -lh *.gz
} > "$MANIFEST"

# 7. Política de retención: conservar backups de los últimos 14 días
log "🧹 Verificando política de retención (conservando 14 días)..."
find "$BACKUP_BASE_DIR" -maxdepth 1 -type d -name "backup_*" -mtime +14 -exec rm -rf {} + 2>/dev/null || true

log "============================================================"
log " 🎉 Backup completado con éxito."
log " Directorio final: $TARGET_DIR"
cat "$MANIFEST" | grep -A 8 "CONTEO DE REGISTROS CLAVE"
log "============================================================"
