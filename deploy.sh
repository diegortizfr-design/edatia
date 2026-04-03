#!/bin/bash

# --- EDATIA ERP SaaS: SCRIPT DE DESPLIEGUE INTEGRADO (n8n/Traefik) ---
# Este script automatiza la puesta en marcha de Edatia ERP integrándose a tu Traefik existente.

echo "🚀 Iniciando despliegue de Edatia ERP SaaS en edatia.com..."

# 1. Configurar variables de entorno si no existen
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Archivo backend/.env no encontrado. Creando desde plantilla..."
    cp backend/.env.example backend/.env
    echo "❗ RECUERDA: Edita backend/.env con tus credenciales reales antes de continuar."
fi

# 2. Levantar infraestructura con Docker Compose (V2)
echo "⚙️  Construyendo y levantando contenedores (API, Web, DB)..."
docker compose up -d --build

# 3. Mensaje final e instrucciones
echo "✅ Despliegue completado satisfactoriamente."
echo "🔗 ERP: https://erp.edatia.com"
echo "🔗 API: https://api.edatia.com/api/v1/health"
echo "🔍 Monitorea logs con: docker compose logs -f"
