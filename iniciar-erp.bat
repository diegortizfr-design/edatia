@echo off
chcp 65001 >nul
title Entorno de Pruebas - ERP Edatia Frontend
echo ==============================================================
echo   Iniciando ERP Edatia Frontend
echo   Puerto: http://localhost:5173
echo ==============================================================
echo.

if exist ".\frontend" (
    cd ".\frontend"
) else if exist ".\edatia\frontend" (
    cd ".\edatia\frontend"
) else (
    echo [ERROR] No se encontró el directorio frontend.
    pause
    exit /b 1
)

echo Abriendo servidor con Hot-Reload y navegador...
npm run dev -- --host --open
pause

