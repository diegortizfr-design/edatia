@echo off
if exist "%SystemRoot%\System32\chcp.com" (
    %SystemRoot%\System32\chcp.com 65001 >nul 2>&1
) else (
    chcp 65001 >nul 2>&1
)
title Entorno de Pruebas - Gabo Cocina
echo ==============================================================
echo   Iniciando Proyecto: Gabo Cocina (gabococina.com)
echo   Puerto: http://localhost:3008
echo ==============================================================
echo.

if exist ".\gabococina.com" (
    cd ".\gabococina.com"
) else if exist "..\gabococina.com" (
    cd "..\gabococina.com"
) else if exist ".\edatia\gabococina.com" (
    cd ".\edatia\gabococina.com"
) else (
    echo [ERROR] No se encontro el directorio de gabococina.com.
    pause
    exit /b 1
)

if not exist "node_modules" (
    echo [INFO] Instalando dependencias de Gabo Cocina por primera vez...
    call npm install
)

echo Abriendo servidor en puerto 3008...
call npm run dev -- --host --open
pause
