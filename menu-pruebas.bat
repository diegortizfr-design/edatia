@echo off
chcp 65001 >nul
title Entorno de Pruebas - Edatia Suite

:MENU
cls
echo ==============================================================
echo              EDATIA - ENTORNO DE PRUEBAS LOCAL
echo ==============================================================
echo.
echo  Selecciona qué aplicación deseas iniciar en modo desarrollo:
echo.
echo  [1] Tienda BabyWorld  (http://localhost:5176)
echo  [2] ERP Frontend      (http://localhost:5173)
echo  [3] Edatia Manager    (http://localhost:5174)
echo  [4] Tienda BabyWorld + ERP Frontend (Ambos)
echo  [5] Salir
echo.
echo ==============================================================
set /p OPCION="Elige una opción (1-5): "

if "%OPCION%"=="1" goto BABYWORLD
if "%OPCION%"=="2" goto ERP
if "%OPCION%"=="3" goto MANAGER
if "%OPCION%"=="4" goto AMBOS
if "%OPCION%"=="5" goto SALIR

echo Opción no válida. Por favor selecciona del 1 al 5.
timeout /t 2 >nul
goto MENU

:BABYWORLD
call ".\iniciar-tienda-babyworld.bat"
goto MENU

:ERP
call ".\iniciar-erp.bat"
goto MENU

:MANAGER
call ".\iniciar-manager.bat"
goto MENU

:AMBOS
echo Iniciando Tienda BabyWorld y ERP Frontend en ventanas separadas...
start cmd /k ".\iniciar-tienda-babyworld.bat"
start cmd /k ".\iniciar-erp.bat"
goto SALIR

:SALIR
exit /b 0

