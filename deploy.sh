#!/bin/bash

# --- EDATIA ERP SaaS: SCRIPT DE DESPLIEGUE FINAL ---
# Este script automatiza la puesta en marcha de la infraestructura Docker y Traefik.

echo "🚀 Iniciando despliegue de Edatia ERP SaaS en edatia.com..."

# 1. Crear directorios necesarios para Traefik y persistencia de datos
echo "📁 Creando directorios operativos..."
mkdir -p traefik/letsencrypt
touch traefik/letsencrypt/acme.json
chmod 600 traefik/letsencrypt/acme.json

# 2. Configurar variables de entorno si no existen
if [ ! -f "backend/.env" ]; then
    echo "⚠️  Archivo backend/.env no encontrado. Creando desde plantilla..."
    cp backend/.env.example backend/.env
    echo "❗ RECUERDA: Edita backend/.env con tus credenciales reales antes de continuar."
fi

# 3. Levantar infraestructura con Docker Compose
echo "⚙️  Construyendo y levantando contenedores (Traefik, API, Web, DB)..."
docker-compose up -d --build

# 4. Mensaje final e instrucciones
echo "✅ Despliegue completado satisfactoriamente."
echo "🔗 ERP: https://erp.edatia.com"
echo "🔗 API: https://api.edatia.com/api/v1/health"
echo "🔍 Monitorea logs con: docker-compose logs -f"
