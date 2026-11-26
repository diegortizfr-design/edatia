@echo off
title Entorno de Pruebas - Smash Tenis y Padel
echo ==============================================================
echo   Iniciando Tienda Virtual: Smash Tenis y Padel
echo   Puerto: http://localhost:3006
echo ==============================================================
echo.

if exist ".\tiendas-virtuales\smash" (
    cd ".\tiendas-virtuales\smash"
) else if exist "..\tiendas-virtuales\smash" (
    cd "..\tiendas-virtuales\smash"
) else (
    echo [ERROR] No se encontro el directorio de la tienda smash.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] Instalando dependencias de la tienda Smash por primera vez...
    call npm install
)

echo Abriendo servidor con Hot-Reload y navegador en puerto 3006...
call npm run dev -- --host --open
pause
