@echo off
title Entorno de Pruebas - Edatia Suite

:MENU
cls
echo ==============================================================
echo              EDATIA - ENTORNO DE PRUEBAS LOCAL
echo ==============================================================
echo.
echo  Selecciona la aplicacion que deseas iniciar en desarrollo:
echo.
echo  [1] Tienda Smash Tenis y Padel (http://localhost:3006)
echo  [2] Tienda BabyWorld           (http://localhost:5176)
echo  [3] ERP Frontend               (http://localhost:5173)
echo  [4] Edatia Manager             (http://localhost:5174)
echo  [5] Tienda Smash + ERP Frontend
echo  [6] Salir
echo.
echo ==============================================================
set /p OPCION="Elige una opcion (1-6): "

if "%OPCION%"=="1" goto SMASH
if "%OPCION%"=="2" goto BABYWORLD
if "%OPCION%"=="3" goto ERP
if "%OPCION%"=="4" goto MANAGER
if "%OPCION%"=="5" goto AMBOS_SMASH
if "%OPCION%"=="6" goto SALIR

echo Opcion no valida. Por favor selecciona del 1 al 6.
timeout /t 2 >nul
goto MENU

:SMASH
if exist ".\iniciar-tienda-smash.bat" (
    call ".\iniciar-tienda-smash.bat"
) else (
    call "..\iniciar-tienda-smash.bat"
)
goto MENU

:BABYWORLD
if exist ".\iniciar-tienda-babyworld.bat" (
    call ".\iniciar-tienda-babyworld.bat"
) else (
    call "..\iniciar-tienda-babyworld.bat"
)
goto MENU

:ERP
if exist ".\iniciar-erp.bat" (
    call ".\iniciar-erp.bat"
) else (
    call "..\iniciar-erp.bat"
)
goto MENU

:MANAGER
if exist ".\iniciar-manager.bat" (
    call ".\iniciar-manager.bat"
) else (
    call "..\iniciar-manager.bat"
)
goto MENU

:AMBOS_SMASH
echo Iniciando Tienda Smash y ERP Frontend en ventanas separadas...
if exist ".\iniciar-tienda-smash.bat" (
    start cmd /k ".\iniciar-tienda-smash.bat"
    start cmd /k ".\iniciar-erp.bat"
) else (
    start cmd /k "..\iniciar-tienda-smash.bat"
    start cmd /k "..\iniciar-erp.bat"
)
goto SALIR

:SALIR
exit /b 0
