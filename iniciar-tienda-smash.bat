@echo off
chcp 65001 >nul
title Entorno de Pruebas - Smash Tenis y Pádel
echo ==============================================================
echo   Iniciando Tienda Virtual: Smash Tenis y Pádel
echo   Puerto: http://localhost:3006
echo ==============================================================
echo.

if exist ".\tiendas-virtuales\smash" (
    cd ".\tiendas-virtuales\smash"
) else if exist ".\edatia\tiendas-virtuales\smash" (
    cd ".\edatia\tiendas-virtuales\smash"
) else (
    echo [ERROR] No se encontró el directorio de la tienda smash.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] Instalando dependencias de la tienda Smash por primera vez...
    call npm install
)

echo Abriendo servidor con Hot-Reload y navegador en puerto 3006...
npm run dev -- --host --open
pause
