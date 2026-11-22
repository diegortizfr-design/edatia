@echo off
chcp 65001 >nul
title Distribuidora BabyWorld - Tienda Virtual

echo ==============================================================
echo   Distribuidora BabyWorld - Tienda Virtual
echo ==============================================================
echo.

:: 1. Si la tienda está corriendo en Docker (puerto oficial local: 3005)
where docker >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    docker ps | findstr /i "edatia-glowxir" >nul
    if %ERRORLEVEL% EQU 0 (
        echo [OK] La tienda está activa en Docker en el puerto 3005.
        echo Abriendo en tu navegador: http://localhost:3005 ...
        start http://localhost:3005
        exit /b 0
    )
)

:: 2. Si no corre en Docker, intentar con Node.js / Vite nativo
where npm >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [AVISO] Node.js / npm no está en el PATH y el contenedor Docker no está activo.
    echo Si tienes Docker Desktop, inicia los contenedores con:
    echo   docker compose up -d glowxir
    echo Y abre: http://localhost:3005
    echo.
    pause
    exit /b 1
)

if exist ".\tiendas-virtuales\distribuidorababyworld" (
    cd ".\tiendas-virtuales\distribuidorababyworld"
) else if exist ".\edatia\tiendas-virtuales\distribuidorababyworld" (
    cd ".\edatia\tiendas-virtuales\distribuidorababyworld"
)

if not exist "node_modules" (
    echo [INFO] Instalando dependencias de la tienda por primera vez...
    call npm install
)

echo Abriendo servidor con Hot-Reload...
npm run dev -- --host --open
pause

