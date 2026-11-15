@echo off
chcp 65001 >nul
title Entorno de Pruebas - Distribuidora BabyWorld
echo ==============================================================
echo   Iniciando Tienda Virtual: Distribuidora BabyWorld
echo   Puerto: http://localhost:5176
echo ==============================================================
echo.

if exist ".\tiendas-virtuales\distribuidorababyworld" (
    cd ".\tiendas-virtuales\distribuidorababyworld"
) else if exist ".\edatia\tiendas-virtuales\distribuidorababyworld" (
    cd ".\edatia\tiendas-virtuales\distribuidorababyworld"
) else (
    echo [ERROR] No se encontró el directorio de la tienda distribuidorababyworld.
    pause
    exit /b 1
)

echo Abriendo servidor con Hot-Reload y navegador...
npm run dev -- --host --open
pause

