# Script para instalar Vercel CLI
Write-Host "Instalando Vercel CLI..." -ForegroundColor Cyan
Write-Host ""

# Verificar si Node.js está instalado
$nodeVersion = node --version 2>$null
if ($null -eq $nodeVersion) {
    Write-Host "Node.js no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Descarga Node.js desde: https://nodejs.org/" -ForegroundColor Yellow
    Write-Host "Después ejecuta este script nuevamente" -ForegroundColor Yellow
    exit 1
}

Write-Host "Node.js instalado: $nodeVersion" -ForegroundColor Green
Write-Host ""
Write-Host "Instalando Vercel CLI globalmente..." -ForegroundColor Cyan

npm install -g vercel

Write-Host ""
Write-Host "Vercel CLI instalado" -ForegroundColor Green
Write-Host ""
Write-Host "Comandos disponibles:" -ForegroundColor Yellow
Write-Host "  vercel login          - Iniciar sesión" -ForegroundColor White
Write-Host "  vercel --prod         - Deploy a producción" -ForegroundColor White
Write-Host "  vercel logs --follow  - Ver logs en tiempo real" -ForegroundColor White