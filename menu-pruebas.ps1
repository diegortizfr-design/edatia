function Show-Menu {
    Clear-Host
    Write-Host "==============================================================" -ForegroundColor Green
    Write-Host "              EDATIA - ENTORNO DE PRUEBAS LOCAL               " -ForegroundColor Cyan
    Write-Host "==============================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Selecciona la aplicacion que deseas iniciar en desarrollo:"
    Write-Host ""
    Write-Host "  [1] Tienda Smash Tenis y Padel (http://localhost:3006)" -ForegroundColor Yellow
    Write-Host "  [2] Tienda BabyWorld           (http://localhost:5176)"
    Write-Host "  [3] ERP Frontend               (http://localhost:5173)"
    Write-Host "  [4] Edatia Manager             (http://localhost:5174)"
    Write-Host "  [5] Tienda Smash + ERP Frontend"
    Write-Host "  [6] Salir"
    Write-Host ""
    Write-Host "==============================================================" -ForegroundColor Green
}

do {
    Show-Menu
    $opcion = Read-Host "Elige una opcion (1-6)"

    switch ($opcion) {
        "1" {
            if (Test-Path ".\iniciar-tienda-smash.ps1") {
                & ".\iniciar-tienda-smash.ps1"
            } elseif (Test-Path "..\iniciar-tienda-smash.ps1") {
                & "..\iniciar-tienda-smash.ps1"
            }
            break
        }
        "2" {
            if (Test-Path ".\tiendas-virtuales\distribuidorababyworld") {
                Set-Location ".\tiendas-virtuales\distribuidorababyworld"
            } elseif (Test-Path "..\tiendas-virtuales\distribuidorababyworld") {
                Set-Location "..\tiendas-virtuales\distribuidorababyworld"
            }
            npm run dev -- --host --open
            break
        }
        "3" {
            if (Test-Path ".\frontend") {
                Set-Location ".\frontend"
            } elseif (Test-Path "..\frontend") {
                Set-Location "..\frontend"
            }
            npm run dev -- --host --open
            break
        }
        "4" {
            if (Test-Path ".\manager-saas") {
                Set-Location ".\manager-saas"
            } elseif (Test-Path "..\manager-saas") {
                Set-Location "..\manager-saas"
            }
            npm run dev -- --host --open
            break
        }
        "5" {
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd tiendas-virtuales\smash; npm run dev -- --host --open"
            Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev -- --host --open"
            return
        }
        "6" {
            return
        }
        default {
            Write-Host "Opcion no valida. Selecciona del 1 al 6." -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
} while ($true)
