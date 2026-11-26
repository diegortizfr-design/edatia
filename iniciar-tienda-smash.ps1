Write-Host "==============================================================" -ForegroundColor Green
Write-Host "  Iniciando Tienda Virtual: Smash Tenis y Padel" -ForegroundColor Cyan
Write-Host "  Puerto: http://localhost:3006" -ForegroundColor Yellow
Write-Host "==============================================================" -ForegroundColor Green
Write-Host ""

$targetDir = if (Test-Path ".\tiendas-virtuales\smash") {
    ".\tiendas-virtuales\smash"
} elseif (Test-Path ".\edatia\tiendas-virtuales\smash") {
    ".\edatia\tiendas-virtuales\smash"
} elseif (Test-Path "..\tiendas-virtuales\smash") {
    "..\tiendas-virtuales\smash"
} else {
    $null
}

if (-not $targetDir) {
    Write-Error "[ERROR] No se encontro el directorio de la tienda smash."
    Read-Host "Presiona Enter para continuar..."
    exit 1
}

Set-Location $targetDir

if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Instalando dependencias de la tienda Smash..." -ForegroundColor Yellow
    npm install
}

Write-Host "Abriendo servidor con Hot-Reload y navegador en puerto 3006..." -ForegroundColor Green
npm run dev -- --host --open
