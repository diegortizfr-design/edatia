@echo off
chcp 65001 >nul
title Smash - Tienda de Tenis y Pádel

echo ==============================================================
echo   Smash - Tienda de Tenis y Pádel
echo ==============================================================
echo.
echo Abriendo la tienda virtual Smash en tu navegador...

if exist ".\tiendas-virtuales\smash\index.html" (
    start "" ".\tiendas-virtuales\smash\index.html"
) else if exist ".\edatia\tiendas-virtuales\smash\index.html" (
    start "" ".\edatia\tiendas-virtuales\smash\index.html"
) else (
    echo [ERROR] No se encontró el archivo index.html de la tienda Smash.
    pause
    exit /b 1
)
exit /b 0
