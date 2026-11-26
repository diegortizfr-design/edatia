Write-Host "==============================================================" -ForegroundColor Green
Write-Host "  Iniciando Proyecto: Gabo Cocina (gabococina.com)            " -ForegroundColor Yellow
Write-Host "  Puerto: http://localhost:3008                               " -ForegroundColor Cyan
Write-Host "==============================================================" -ForegroundColor Green
Write-Host ""

$targetDir = if (Test-Path ".\gabococina.com") {
    ".\gabococina.com"
} elseif (Test-Path "..\gabococina.com") {
    "..\gabococina.com"
} elseif (Test-Path ".\edatia\gabococina.com") {
    ".\edatia\gabococina.com"
} else {
    $null
}

if (-not $targetDir) {
    Write-Error "[ERROR] No se encontro el directorio de gabococina.com."
    Read-Host "Presiona Enter para continuar..."
    exit 1
}

Set-Location $targetDir

if (-not (Test-Path "node_modules")) {
    Write-Host "[INFO] Instalando dependencias de Gabo Cocina..." -ForegroundColor Yellow
    npm install
}

Write-Host "Abriendo servidor en puerto 3008..." -ForegroundColor Green
npm run dev -- --host --open
