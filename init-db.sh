#!/bin/bash
set -e

# Este script crea las bases de datos adicionales necesarias
# La base de datos principal se crea con POSTGRES_DB (edatia_erp)
# Aquí creamos la base de datos para el ecosistema de herramientas

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE herramientas_edatia'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'herramientas_edatia')\gexec
EOSQL
