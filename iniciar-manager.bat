@echo off
chcp 65001 >nul
title Entorno de Pruebas - Edatia Manager
echo ==============================================================
echo   Iniciando Edatia Manager
echo   Puerto: http://localhost:5174
echo ==============================================================
echo.

if exist ".\manager" (
    cd ".\manager"
) else if exist ".\edatia\manager" (
    cd ".\edatia\manager"
) else (
    echo [ERROR] No se encontr? el directorio manager.
    pause
    exit /b 1
)

echo Abriendo servidor con Hot-Reload y navegador...
npm run dev -- --host --open
pause

