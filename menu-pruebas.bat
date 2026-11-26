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
echo  [1] Gabo Cocina (gabococina.com) (http://localhost:3008)
echo  [2] Tienda Smash Tenis y Padel   (http://localhost:3006)
echo  [3] Tienda BabyWorld             (http://localhost:5176)
echo  [4] ERP Frontend                 (http://localhost:5173)
echo  [5] Edatia Manager               (http://localhost:5174)
echo  [6] Salir
echo.
echo ==============================================================
set /p OPCION="Elige una opcion (1-6): "

if "%OPCION%"=="1" goto GABO
if "%OPCION%"=="2" goto SMASH
if "%OPCION%"=="3" goto BABYWORLD
if "%OPCION%"=="4" goto ERP
if "%OPCION%"=="5" goto MANAGER
if "%OPCION%"=="6" goto SALIR

echo Opcion no valida. Por favor selecciona del 1 al 6.
ping 127.0.0.1 -n 2 >nul
goto MENU

:GABO
if exist ".\iniciar-gabococina.bat" (
    call ".\iniciar-gabococina.bat"
) else (
    call "..\iniciar-gabococina.bat"
)
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

:SALIR
exit /b 0
